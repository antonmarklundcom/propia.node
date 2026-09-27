/**
 * Lead capture (ARCHITECTURE.md §5). Order matters: record in MySQL first
 * (source of truth for the money report), THEN push to the provider through
 * the crm.ts boundary. A failed push never loses the lead — it's already
 * stored, which is also why the push does not run inside the request.
 */
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents } from "@/db/schema";
import { alertOperator } from "@/lib/crm";
import { siteOrigin } from "@/lib/origin";
import {
  findLeadListing,
  leadLaneFor,
  leadOwnerContact,
  recordLead,
  sendLeadCopies,
  type LeadListing,
} from "@/lib/lead-intake";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import { rawHostFrom } from "@/lib/host";
import { DEFAULT_VERTICAL_KEY } from "@/config/verticals";
import { currentVertical } from "@/lib/vertical-context";
import { emailSeekerConfirmation } from "@/lib/lead-emails";
import { isAgencyMode } from "@/lib/site-settings";
import { esA3, REPORT_REASONS, type ReportReason } from "@/i18n/es-a3";
import { esBrief } from "@/i18n/es-brief";
import { OPERATIONS, PROPERTY_TYPES, type Operation, type PropertyType } from "@/lib/import/types";
import {
  BRIEF_CURRENCIES,
  BRIEF_SOURCE,
  BRIEF_SURFACES,
  BRIEF_TIMELINES,
  briefLeadType,
  formatBriefMessage,
} from "@/lib/buyer-brief";

const bodySchema = z.object({
  leadType: z.enum([
    "buyer",
    "renter",
    "seller",
    "valuation",
    "developer",
    "agent_signup",
    "landlord",
    "question",
  ]),
  listingPublicId: z.string().length(10).optional(),
  /**
   * A profile-originated lead: the visitor asked for THIS agent from
   * `/agente/{slug}` on the directory door, with no listing in hand
   * (fable-plan-realtor-terreno-rental.md Stage 1 D item 3).
   *
   * Bounded and shaped here rather than trusted: it is a slug, so it is
   * lowercase letters, digits and hyphens, and it is only ever used as a
   * parameterised lookup. An unknown slug is NOT a 400 — see `routedTo` below.
   */
  agentSlug: z
    .string()
    .max(190)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  /**
   * The same lane for an agency profile (`/inmobiliaria/{slug}` on the
   * directory door). Exact mirror of `agentSlug` above, including the "an
   * unknown slug is never a 400" rule. If both arrive, the agent wins: a
   * person the visitor picked outranks the office they belong to.
   */
  agencySlug: z
    .string()
    .max(190)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name: z.string().max(140).optional(),
  whatsapp: z.string().min(6).max(30),
  email: z.string().email().max(190).optional(),
  message: z.string().max(2000).optional(),
  utm: z.record(z.string()).optional(),
  /**
   * "Reportar este aviso" (plan-build-2026-09-26 A3, Seeker 7). Not a new
   * table and not a new lane: a `question` lead on the listing, routed to
   * `internal` whoever owns the listing, marked `utm.source: "report:listing"`.
   * The server sets all three — the client only says which reason.
   */
  report: z
    .object({ reason: z.enum(REPORT_REASONS as [ReportReason, ...ReportReason[]]) })
    .optional(),
  /**
   * The buyer brief ("contanos qué buscás", `src/lib/buyer-brief.ts`) from an
   * empty or thin search. Not a new lane and not a column: the server folds it
   * into `message` as readable text, stamps `utm.source: "brief"`, and picks
   * `buyer` / `renter` from the operation — the client says none of the three.
   * Every field is bounded here; none is ever used in a query.
   */
  brief: z
    .object({
      surface: z.enum(BRIEF_SURFACES),
      operation: z.enum(OPERATIONS as [Operation, ...Operation[]]).optional(),
      propertyType: z.enum(PROPERTY_TYPES as [PropertyType, ...PropertyType[]]).optional(),
      where: z.string().trim().max(140).optional(),
      budgetMax: z.number().positive().max(1e13).optional(),
      currency: z.enum(BRIEF_CURRENCIES).optional(),
      bedrooms: z.number().int().min(1).max(10).optional(),
      timeline: z.enum(BRIEF_TIMELINES).optional(),
      note: z.string().trim().max(500).optional(),
      path: z.string().max(300).regex(/^\//).optional(),
    })
    .optional(),
});

/** 10 leads per IP per 10 minutes — far above a real buyer, far below a bot. */
const LEAD_MAX = 10;
const LEAD_WINDOW_MS = 10 * 60_000;

/**
 * Seeker confirmations per address per hour. The address is whatever the form
 * was given, so without a cap of its own the per-IP limit above would still
 * let a rotating-IP script aim our confirmation email at a stranger's inbox.
 * The lead itself is always saved; only the copy to that address stops.
 */
const CONFIRM_MAX = 3;
const CONFIRM_WINDOW_MS = 60 * 60_000;

/**
 * The endpoint is intentionally unauthenticated — it is the public capture
 * form, and requiring a session would defeat it. What it was missing is
 * everything *else* that keeps an open endpoint from being free infrastructure
 * (audit F28): each accepted row also fires an outbound GHL webhook, so an
 * unthrottled POST loop is both a junk-lead flood in the panel and an
 * amplifier pointed at our own CRM quota.
 *
 * The Origin check is a cheap same-origin filter, not a security boundary: a
 * browser sets Origin on every cross-site POST and cannot forge it, so it
 * stops the drive-by embedded form. A script that sends no Origin at all is
 * left to the rate limit, which is the control that actually bounds the harm.
 */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client; the rate limit is its bound
  try {
    return new URL(origin).host.replace(/^www\./, "") === rawHostFrom(req.headers);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // req.json() happily parses a body sent as text/plain, which is exactly the
  // content-type a cross-site form uses to dodge a CORS preflight.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 415 },
    );
  }

  const ip = clientIpFrom(req.headers);
  if (!allowRequest(`leads|${ip}`, LEAD_MAX, LEAD_WINDOW_MS)) {
    return NextResponse.json(
      { ok: false, error: "too many requests" },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    // No `detail`: the zod error echoes the submitted payload and the schema
    // back to an unauthenticated caller (audit F28).
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 400 },
    );
  }

  const vertical = req.headers.get("x-vertical") ?? DEFAULT_VERTICAL_KEY;

  // Resolve listing context (for routing + CRM payload) if one was given.
  const listing: LeadListing | null = parsed.listingPublicId
    ? await findLeadListing(parsed.listingPublicId)
    : null;

  // A report is about one listing; without it there is nothing to review.
  if (parsed.report && !listing) {
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 400 },
    );
  }
  const report = parsed.report && listing ? parsed.report : null;

  // A brief describes a search that found nothing: it is never about a
  // listing, and never a report.
  if (parsed.brief && (parsed.report || parsed.listingPublicId)) {
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 400 },
    );
  }
  const brief = parsed.brief ?? null;

  /**
   * A profile-originated lead names its agent explicitly, because there is no
   * listing to infer one from. The slug is resolved to a real row before it
   * routes anywhere — a lead addressed to an agent who does not exist would be
   * a lead nobody is watching.
   *
   * An unknown slug falls through to the normal chain and lands `internal`; it
   * is never a 400. A stale profile link — a renamed slug, an agent removed
   * between page render and submit — must not lose the lead: the operator sees
   * it in `/admin/leads` and forwards it by hand, which is the same manual lane
   * v1 matching already runs on (§1 item 4).
   */
  let explicitAgent: { id: number; name: string; slug: string } | null = null;
  if (parsed.agentSlug) {
    const [row] = await db
      .select({ id: agents.id, name: agents.name, slug: agents.slug })
      .from(agents)
      .where(eq(agents.slug, parsed.agentSlug))
      .limit(1);
    explicitAgent = row ?? null;
  }

  // Only when no agent was named or resolved: the agent is the more specific
  // answer, and a lead has one addressee.
  let explicitAgency: { id: number; name: string; slug: string } | null = null;
  if (!explicitAgent && parsed.agencySlug) {
    const [row] = await db
      .select({ id: agencies.id, name: agencies.name, slug: agencies.slug })
      .from(agencies)
      .where(eq(agencies.slug, parsed.agencySlug))
      .limit(1);
    explicitAgency = row ?? null;
  }

  /**
   * `leads` has no `agent_id` column and D1 adds no schema, so the resolved
   * agent rides in `utm` — the same json field `/vender` already marks itself
   * with, and the same reason there is no `leads.source` column. Written from
   * the resolved ROW, never from the submitted slug: what the operator reads in
   * `/admin/leads` is then a name that exists, not a string a client sent.
   *
   * This is the honest v1 (§1 item 4): the lane says "an agent owns this" and
   * the marker says which one, and the founder forwards by hand. The real
   * structure is `lead_matches` in D3, which is a migration and a founder
   * decision — do not add a column here to get ahead of it.
   */
  const utm = report && listing
    ? {
        // Server-stamped: a report is never re-labelled by what a client sent.
        source: "report:listing",
        report_reason: report.reason,
        listing_id: String(listing.id),
      }
    : explicitAgent
    ? {
        ...(parsed.utm ?? {}),
        agent_slug: explicitAgent.slug,
        agent_name: explicitAgent.name,
      }
    : explicitAgency
      ? {
          ...(parsed.utm ?? {}),
          agency_slug: explicitAgency.slug,
          agency_name: explicitAgency.name,
        }
      : brief
        ? {
            ...(parsed.utm ?? {}),
            // Server-stamped, like the report marker: the panel's chip and a
            // future filter read this, so a client cannot relabel it.
            source: BRIEF_SOURCE,
            brief_surface: brief.surface,
          }
        : parsed.utm;

  // Lane precedence lives in leadLaneFor() (src/lib/lead-intake.ts), shared
  // with the WhatsApp lead logged from /admin/leads. A report is the
  // operator's to review — never the publisher's inbox — and in agency mode
  // every enquiry comes to the operator; the utm markers above still say
  // which agent or agency it was addressed to.
  const agencyMode = await isAgencyMode();
  const routedTo = leadLaneFor({
    internal: Boolean(report) || agencyMode,
    explicitAgent: Boolean(explicitAgent),
    explicitAgency: Boolean(explicitAgency),
    listing,
  });

  // 1. Record in MySQL first; the payload is what the deferred push carries.
  const leadType = report
    ? "question"
    : brief
      ? briefLeadType(brief.operation)
      : parsed.leadType;
  // The brief's answers become the lead's message, in Spanish whatever the
  // door — the operator reads /admin/leads in Spanish (same rule as esPanel).
  const message = brief
    ? formatBriefMessage(
        brief,
        esBrief.lead,
        "es-PY",
      ).slice(0, 2000)
    : parsed.message;
  const { leadId, payload } = await recordLead({
    leadType,
    vertical,
    listing,
    name: parsed.name,
    whatsapp: parsed.whatsapp,
    email: parsed.email,
    message,
    utm,
    routedTo,
  });

  // The owner lane is the FSBO seller (D8): their go-look ping, delivered
  // only when a webhook (or, for the email copy, Cloudflare Email Sending) is
  // configured, same rule as alertOperator.
  const owner = await leadOwnerContact(routedTo, listing);

  /**
   * Everything outbound happens after the response, on purpose.
   *
   * The row above is the record; the webhook push is a copy of it, and the
   * operator ping is a "go look". Neither is worth a visitor's wait, and a
   * provider that accepts the connection and goes quiet would otherwise hold
   * this Node process open for as long as it stalls — the mechanism of the
   * 2026-07-26 503 spiral (PLAN.md), on a host whose process cap is shared
   * with ~90 other sites. `crm.ts` bounds each call at 5 s on top of this.
   * The response no longer reports whether the push landed — by the time it
   * is sent, nobody knows yet, and no client ever read the old `crm` flag.
   */
  const adminUrl = `${await siteOrigin()}/admin/leads`;
  const ownerUrl = `${await siteOrigin()}/mis-avisos/consultas`;
  // The lead's own door names the emails: brand and the seeker's language.
  // Read here, inside the request — after() runs once the headers are gone.
  const door = await currentVertical();
  const listingTitle = listing
    ? door.locale === "en"
      ? (listing.titleEn ?? listing.title)
      : listing.title
    : null;
  after(async () => {
    if (report) {
      // The report is the operator's alone: no owner ping, and no CRM copy —
      // it is not a sales lead, and VenderCRM would open a deal for it.
      await alertOperator({
        kind: "new_lead",
        title: esA3.admin.alertReportTitle,
        detail: esA3.admin.alertReportDetail(
          esA3.admin.reportReason[report.reason],
          listing?.title ?? "",
        ),
        url: `${adminUrl}?fuente=reportes`,
        site: new URL(adminUrl).host,
      });
      return;
    }
    await sendLeadCopies({
      payload,
      owner,
      adminUrl,
      ownerUrl,
      brand: door.brand,
      alertOperator: true,
      // The seeker's copy, capped per address (CONFIRM_MAX above).
      alsoEmail: () =>
        parsed.email &&
        allowRequest(`lead-confirm|${parsed.email.toLowerCase()}`, CONFIRM_MAX, CONFIRM_WINDOW_MS)
          ? emailSeekerConfirmation({
              to: parsed.email,
              locale: door.locale,
              brand: door.brand,
              listingTitle,
              listingUrl: payload.listing?.url ?? null,
              leadId,
            })
          : null,
    });
  });

  // `routedTo` lets the form say who received the enquiry (A3, Seeker 4);
  // the lane, never a name or a number.
  return NextResponse.json({ ok: true, leadId, routedTo });
}
