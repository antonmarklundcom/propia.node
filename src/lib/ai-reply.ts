/**
 * AI reply suggestions (the "Sugerir respuesta" button). **The only module
 * that calls a language model for replies** — `src/lib/translate.ts` is the
 * listing translator and stays separate.
 *
 * What it does and does not do:
 *
 * - It drafts. The draft fills a reply textarea; a person reads it and presses
 *   Send through the existing reply path (`sendLeadReply()` /
 *   `sendInboxReply()`). Nothing here sends a message.
 * - **No new visibility rule.** A lead is loaded only after `userMaySeeLead()`
 *   said yes; an inbox thread only through `getInboxThread(viewer)`, whose
 *   query carries the shared-mailbox rule. A forged id reads as "not found".
 * - Provider-agnostic like translate.ts: Gemini or Claude, chosen by
 *   `AI_REPLY_PROVIDER`, with the keys translate.ts already uses. No key →
 *   `isAiReplyEnabled()` is false and every panel hides the button. Never an
 *   error page.
 * - Bounded: 30 s per call, no retries, a per-user rate limit, and every call
 *   that reached a provider is written to `admin_events` (`ai.reply`) with its
 *   token counts, which is what /admin/ajustes adds up into a monthly cost.
 *
 * The prompt and its rules live in `ai-reply-prompt.ts` (pure, verified by
 * `npm run verify:ai-reply`).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { adminEvents, leads, listings, locations } from "@/db/schema";
import { DEFAULT_VERTICAL_KEY, VERTICALS, type VerticalConfig } from "@/config/verticals";
import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";
import { recordAdminEvent } from "@/lib/admin-events";
import { allowRequest } from "@/lib/rate-limit";
import { formatPrice } from "@/lib/format";
import { detailOwnerForLocale } from "@/lib/origin";
import { listingUrl } from "@/lib/urls";
import { getInboxThread, listLeadThreads, type InboxMessage } from "@/lib/inbox";
import { rootDomain } from "@/lib/inbox-address";
import { userMaySeeLead } from "@/lib/inbox-access";
import { getWhatsAppChat, getWhatsAppContact, listLeadWhatsApp, whatsappToAiMessages } from "@/lib/whatsapp-inbox";
import {
  AI_REPLY_GEMINI_SCHEMA,
  AI_REPLY_SCHEMA,
  AI_REPLY_SYSTEM,
  buildAiReplyPrompt,
  cleanDraft,
  estimateCostUsd,
  inventedContacts,
  resolveAiReplyConfig,
  type AiReplyChannel,
  type AiReplyContext,
  type AiReplyListing,
  type AiReplyMessage,
  type AiReplyProvider,
  type SuggestOutcome,
} from "@/lib/ai-reply-prompt";

export type { SuggestOutcome };

/** One provider call, whole. The button's spinner is honest about it. */
export const AI_REPLY_TIMEOUT_MS = 30_000;
/** Per user: generous for a person answering a queue, useless for a script. */
export const AI_REPLY_RATE_MAX = 30;
export const AI_REPLY_RATE_WINDOW_MS = 60 * 60 * 1000;
/** Automatic WhatsApp replies across all contacts, per process per hour. */
export const AI_AUTO_RATE_MAX = 60;

export function isAiReplyEnabled(): boolean {
  return resolveAiReplyConfig(process.env) !== null;
}

/** Which provider/model is live, for the /admin/ajustes line. Null = off. */
export function aiReplyConfig(): { provider: AiReplyProvider; model: string } | null {
  return resolveAiReplyConfig(process.env);
}


interface ProviderResult {
  reply: string;
  confident: boolean;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/* -------------------------------------------------------------------------- */
/* Providers                                                                   */
/* -------------------------------------------------------------------------- */

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

async function draftWithGemini(model: string, prompt: string): Promise<ProviderResult> {
  const key = process.env.GEMINI_API_KEY!.trim();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      signal: AbortSignal.timeout(AI_REPLY_TIMEOUT_MS),
      // The key in a header, not the query string: a URL ends up in logs.
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: AI_REPLY_SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: AI_REPLY_GEMINI_SCHEMA,
          maxOutputTokens: 2048,
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) throw new Error(`Gemini blocked (${data.promptFeedback.blockReason})`);
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") throw new Error("Gemini refused (safety)");
  const raw = candidate?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini returned no content");
  const parsed = JSON.parse(raw) as { reply?: unknown; confident?: unknown };
  const u = data.usageMetadata ?? {};
  return {
    reply: typeof parsed.reply === "string" ? parsed.reply : "",
    confident: parsed.confident === true,
    inputTokens: u.promptTokenCount ?? 0,
    // Hidden "thinking" tokens bill at the output rate (translate.ts's note).
    outputTokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    model,
  };
}

async function draftWithClaude(model: string, prompt: string): Promise<ProviderResult> {
  // One attempt inside the 30 s budget: a retry would double the wait on the
  // exact failure (a slow provider) the person is already watching.
  const client = new Anthropic({ timeout: AI_REPLY_TIMEOUT_MS, maxRetries: 0 });
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    system: AI_REPLY_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    // A short, well-specified draft: low effort holds quality and keeps the
    // wait inside the button's timeout.
    output_config: { effort: "low", format: betaJSONSchemaOutputFormat(AI_REPLY_SCHEMA) },
    // A safety decline is re-run on a fallback model inside the same call
    // rather than leaving the operator with an empty box.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (response.stop_reason === "refusal") throw new Error("Claude refused");
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Claude reply did not parse");
  return {
    reply: parsed.reply,
    confident: parsed.confident,
    inputTokens: response.usage.input_tokens ?? 0,
    outputTokens: response.usage.output_tokens ?? 0,
    model: response.model ?? model,
  };
}

/* -------------------------------------------------------------------------- */
/* The one entry point every channel goes through                              */
/* -------------------------------------------------------------------------- */

/** Where the usage line points in /admin/historial. */
export interface SuggestTarget {
  type: "lead" | "email" | "whatsapp";
  id: number;
}

/**
 * Draft one reply for `ctx` on behalf of `user`: rate limit, prompt, one
 * provider call, the invented-contact check, the usage record. Callers have
 * already applied the visibility rule for whatever `ctx` was built from.
 */
export async function draftReplyFor(
  /** The person asking — or `{ id: 0 }` for the WhatsApp auto-responder. */
  user: Pick<SessionUser, "id">,
  target: SuggestTarget,
  ctx: AiReplyContext,
): Promise<SuggestOutcome> {
  const config = resolveAiReplyConfig(process.env);
  if (!config) return { ok: false, error: "disabled" };
  const prompt = buildAiReplyPrompt(ctx);
  if (!prompt) return { ok: false, error: "nothing_to_answer" };
  // The auto-responder (id 0) has its own, larger, process-wide cap: a spend
  // guard on top of its per-contact cooldown.
  const max = user.id === 0 ? AI_AUTO_RATE_MAX : AI_REPLY_RATE_MAX;
  if (!allowRequest(`ai-reply:${user.id}`, max, AI_REPLY_RATE_WINDOW_MS)) {
    return { ok: false, error: "rate_limited" };
  }

  let result: ProviderResult;
  try {
    result =
      config.provider === "claude"
        ? await draftWithClaude(config.model, prompt)
        : await draftWithGemini(config.model, prompt);
  } catch (e) {
    // The reason goes to the server log only — never the key, never the prompt.
    console.warn(`[ai-reply] ${config.provider} failed: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, error: "failed" };
  }

  const text = cleanDraft(result.reply);
  const invented = text ? inventedContacts(text, prompt) : [];
  const costUsd = estimateCostUsd(result.model, result.inputTokens, result.outputTokens);
  await recordAdminEvent(user.id, "ai.reply", target.type, target.id, {
    provider: config.provider,
    model: result.model,
    channel: ctx.channel,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    // Micro-dollars: an integer the monthly sum can add without float drift.
    costMicroUsd: Math.round(costUsd * 1_000_000),
    outcome: !text ? "empty" : invented.length ? "unsafe" : "ok",
    auto: ctx.mode === "auto" ? 1 : 0,
  });

  if (!text) return { ok: false, error: "failed" };
  if (invented.length) {
    console.warn(`[ai-reply] draft dropped: contact detail not in the context (${invented.length})`);
    return { ok: false, error: "unsafe" };
  }
  return { ok: true, text, confident: result.confident };
}

/* -------------------------------------------------------------------------- */
/* Context loaders                                                             */
/* -------------------------------------------------------------------------- */

function doorByKey(key: string | null | undefined): VerticalConfig {
  const all = Object.values(VERTICALS);
  return (
    all.find((v) => v.key === key) ??
    all.find((v) => v.key === DEFAULT_VERTICAL_KEY) ??
    all[0]
  );
}

/** An email as the model should read it: its text part, else nothing. */
function emailToMessage(m: InboxMessage): AiReplyMessage {
  return { direction: m.direction, body: m.textBody ?? "", at: m.createdAt.toISOString() };
}

export interface LeadReplyContext {
  leadId: number;
  door: VerticalConfig;
  lead: { type: string; name: string | null; message: string | null; whatsapp: string; email: string | null };
  listing: AiReplyListing | null;
}

/**
 * A lead with its listing, as the prompt needs it — or null when this user may
 * not see it. The visibility check is here, not in the callers, so no panel
 * can load a lead's context without asking `userMaySeeLead()` first.
 */
export async function loadLeadReplyContext(user: SessionUser, leadId: number): Promise<LeadReplyContext | null> {
  if (!(await userMaySeeLead(user, leadId))) return null;
  return loadLeadContextUnchecked(leadId);
}

/**
 * The same, with no viewer: for the WhatsApp auto-responder, which answers as
 * the business about a lead the business already holds. Never call it on a
 * panel user's behalf — that is `loadLeadReplyContext()`.
 */
export async function loadLeadContextUnchecked(leadId: number): Promise<LeadReplyContext | null> {
  const barrio = alias(locations, "ai_reply_place");
  const city = alias(locations, "ai_reply_city");
  const [row] = await db
    .select({
      leadType: leads.leadType,
      vertical: leads.vertical,
      name: leads.name,
      message: leads.message,
      whatsapp: leads.whatsapp,
      email: leads.email,
      title: listings.title,
      titleEn: listings.titleEn,
      operation: listings.operation,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      slug: listings.slug,
      publicId: listings.publicId,
      status: listings.status,
      place: barrio.name,
      placeLevel: barrio.level,
      city: city.name,
    })
    .from(leads)
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .leftJoin(barrio, eq(barrio.id, listings.locationId))
    .leftJoin(city, eq(city.id, barrio.parentId))
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!row) return null;

  const door = doorByKey(row.vertical);
  const numberLocale = door.locale === "en" ? "en-US" : "es-PY";
  let listing: AiReplyListing | null = null;
  if (row.title && row.operation) {
    const place = row.place
      ? row.placeLevel === "barrio" && row.city
        ? `${row.place}, ${row.city}`
        : row.place
      : null;
    listing = {
      title: door.locale === "en" ? (row.titleEn ?? row.title) : row.title,
      operation: row.operation,
      price: row.priceAmount != null && row.priceCurrency ? formatPrice({ priceAmount: row.priceAmount, priceCurrency: row.priceCurrency }, numberLocale) : null,
      place,
      // Only a published listing has a page to send someone to.
      url:
        row.status === "published" && row.slug && row.publicId
          ? `https://${detailOwnerForLocale(door.locale)}${listingUrl({ slug: row.slug, publicId: row.publicId })}`
          : null,
    };
  }
  return {
    leadId,
    door,
    lead: { type: row.leadType, name: row.name, message: row.message, whatsapp: row.whatsapp, email: row.email },
    listing,
  };
}

/** Assemble the prompt context for a lead plus whatever conversation the caller has. */
export function leadContext(
  base: LeadReplyContext,
  channel: AiReplyChannel,
  messages: AiReplyMessage[],
  agentName: string | null,
): AiReplyContext {
  return {
    channel,
    brand: base.door.brand,
    locale: base.door.locale,
    lead: { type: base.lead.type, name: base.lead.name, message: base.lead.message },
    listing: base.listing,
    messages,
    agentName,
  };
}

/** "Sugerir respuesta" on a lead's email thread (/admin/leads, /agencia/leads). */
export async function suggestLeadEmailReply(user: SessionUser, leadId: number): Promise<SuggestOutcome> {
  if (!isAiReplyEnabled()) return { ok: false, error: "disabled" };
  const base = await loadLeadReplyContext(user, leadId);
  if (!base) return { ok: false, error: "not_found" };
  const thread = (await listLeadThreads([leadId])).get(leadId) ?? [];
  return draftReplyFor(
    user,
    { type: "lead", id: leadId },
    leadContext(base, "email", thread.map(emailToMessage), user.name?.trim() || null),
  );
}

/** "Sugerir respuesta" on an /admin/inbox thread. Staff: shared mailboxes only (the query's rule). */
export async function suggestInboxReply(user: SessionUser, threadKey: string): Promise<SuggestOutcome> {
  if (!isAiReplyEnabled()) return { ok: false, error: "disabled" };
  const messages = await getInboxThread({ userId: user.id, superAdmin: isSuperAdmin(user.role) }, threadKey);
  if (!messages) return { ok: false, error: "not_found" };
  const door = VERTICALS[rootDomain()] ?? doorByKey(DEFAULT_VERTICAL_KEY);
  const last = messages[messages.length - 1];
  return draftReplyFor(user, { type: "email", id: last.id }, {
    channel: "email",
    brand: door.brand,
    locale: door.locale,
    lead: null,
    listing: null,
    messages: messages.map(emailToMessage),
    agentName: user.name?.trim() || null,
  });
}

/** "Sugerir respuesta" on a lead's WhatsApp thread. */
export async function suggestLeadWhatsAppReply(user: SessionUser, leadId: number): Promise<SuggestOutcome> {
  if (!isAiReplyEnabled()) return { ok: false, error: "disabled" };
  const base = await loadLeadReplyContext(user, leadId);
  if (!base) return { ok: false, error: "not_found" };
  const thread = (await listLeadWhatsApp([leadId])).get(leadId) ?? [];
  return draftReplyFor(
    user,
    { type: "lead", id: leadId },
    leadContext(base, "whatsapp", whatsappToAiMessages(thread), user.name?.trim() || null),
  );
}

/**
 * "Sugerir respuesta" on an unattached WhatsApp chat in /admin/inbox. The
 * caller is staff or above (the business number's chats are theirs to read).
 */
export async function suggestWhatsAppChatReply(user: SessionUser, phone: string): Promise<SuggestOutcome> {
  if (!isAiReplyEnabled()) return { ok: false, error: "disabled" };
  const messages = await getWhatsAppChat(phone);
  if (!messages) return { ok: false, error: "not_found" };
  const contact = await getWhatsAppContact(messages[0].contactPhone);
  const door = VERTICALS[rootDomain()] ?? doorByKey(DEFAULT_VERTICAL_KEY);
  return draftReplyFor(user, { type: "whatsapp", id: messages[messages.length - 1].id }, {
    channel: "whatsapp",
    brand: door.brand,
    locale: door.locale,
    lead: contact?.name ? { type: "question", name: contact.name, message: null } : null,
    listing: null,
    messages: whatsappToAiMessages(messages),
    agentName: user.name?.trim() || null,
  });
}

/* -------------------------------------------------------------------------- */
/* The monthly figure for /admin/ajustes                                       */
/* -------------------------------------------------------------------------- */

export interface AiReplyUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/**
 * Suggestions since the first of this month (server time), summed from the
 * `ai.reply` history lines. JSON_EXTRACT works on MariaDB's longtext JSON too.
 */
export async function aiReplyUsageThisMonth(now = new Date()): Promise<AiReplyUsage> {
  const since = new Date(now.getFullYear(), now.getMonth(), 1);
  const num = (path: string) =>
    sql<string>`coalesce(sum(cast(json_unquote(json_extract(${adminEvents.detailJson}, ${path})) as unsigned)), 0)`;
  const [row] = await db
    .select({
      calls: sql<string>`count(*)`,
      inputTokens: num("$.inputTokens"),
      outputTokens: num("$.outputTokens"),
      costMicroUsd: num("$.costMicroUsd"),
    })
    .from(adminEvents)
    .where(and(eq(adminEvents.action, "ai.reply"), gte(adminEvents.createdAt, since)));
  return {
    calls: Number(row?.calls ?? 0),
    inputTokens: Number(row?.inputTokens ?? 0),
    outputTokens: Number(row?.outputTokens ?? 0),
    costUsd: Number(row?.costMicroUsd ?? 0) / 1_000_000,
  };
}
