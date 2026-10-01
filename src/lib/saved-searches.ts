/**
 * Saved searches (email alerts for new matching listings) — the only module on
 * `saved_searches`, plus the two emails it sends.
 *
 * No account, so the trust model is the email itself: a row is inert until the
 * address's owner opens the confirmation link (`confirmed_at`), and every
 * message carries the row's random `token` link to leave. Sending is
 * `sendEmail()`: a silent no-op without Cloudflare Email Sending, never throws.
 * Callers gate the form on `isEmailConfigured()` so nobody is offered an alert
 * that could never arrive.
 *
 * The alert job is `src/lib/ops/saved-searches.ts`; the search vocabulary is
 * `facets.ts` (see `saved-search-criteria.ts`).
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { locations, savedSearches } from "@/db/schema";
import { getDictionary, type Locale } from "@/i18n";
import { renderEmail, sendEmail, type EmailResult } from "@/lib/email";
import {
  criteriaKey,
  criteriaPath,
  type SavedSearchCriteria,
} from "@/lib/saved-search-criteria";
import { OPERATIONS, PROPERTY_TYPES } from "@/lib/import/types";

export type SavedSearchRow = typeof savedSearches.$inferSelect;

/** The criteria a stored row describes (columns back to the pure shape). */
export function rowCriteria(r: SavedSearchRow): SavedSearchCriteria | null {
  const operation = OPERATIONS.find((o) => o === r.operation);
  if (!operation) return null;
  return {
    operation,
    propertyType: PROPERTY_TYPES.find((t) => t === r.propertyType),
    citySlug: r.citySlug ?? undefined,
    barrioSlug: r.barrioSlug ?? undefined,
    priceMin: r.priceMin ?? undefined,
    priceMax: r.priceMax ?? undefined,
    minBedrooms: r.minBedrooms ?? undefined,
  };
}

function hashFor(email: string, c: SavedSearchCriteria): string {
  return createHash("sha256").update(`${email}\n${criteriaKey(c)}`).digest("hex");
}

export type SaveOutcome =
  | { status: "created" | "pending"; token: string }
  | { status: "exists" };

/**
 * Store a search. The same email + door + criteria is one row: repeating it
 * while unconfirmed hands back the existing token (so the confirmation can be
 * re-sent), and once confirmed it is `exists` — no second mail is sent to an
 * address that is already subscribed.
 */
export async function saveSearch(p: {
  email: string;
  vertical: string;
  locale: Locale;
  criteria: SavedSearchCriteria;
}): Promise<SaveOutcome> {
  const email = p.email.trim().toLowerCase();
  const criteriaHash = hashFor(email, p.criteria);
  const find = () =>
    db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.email, email),
          eq(savedSearches.vertical, p.vertical),
          eq(savedSearches.criteriaHash, criteriaHash),
        ),
      )
      .limit(1);

  const [existing] = await find();
  if (existing) {
    return existing.confirmedAt ? { status: "exists" } : { status: "pending", token: existing.token };
  }
  const token = randomBytes(24).toString("hex");
  try {
    await db.insert(savedSearches).values({
      email,
      vertical: p.vertical,
      locale: p.locale,
      operation: p.criteria.operation,
      propertyType: p.criteria.propertyType ?? null,
      citySlug: p.criteria.citySlug ?? null,
      barrioSlug: p.criteria.barrioSlug ?? null,
      priceMin: p.criteria.priceMin ?? null,
      priceMax: p.criteria.priceMax ?? null,
      minBedrooms: p.criteria.minBedrooms ?? null,
      criteriaHash,
      token,
    });
    return { status: "created", token };
  } catch {
    // A concurrent identical request won the unique index: use its row.
    const [row] = await find();
    if (!row) throw new Error("saved search not stored");
    return row.confirmedAt ? { status: "exists" } : { status: "pending", token: row.token };
  }
}

const TOKEN = /^[a-f0-9]{48}$/;

export async function getSavedSearchByToken(token: string): Promise<SavedSearchRow | null> {
  if (!TOKEN.test(token)) return null;
  const [row] = await db.select().from(savedSearches).where(eq(savedSearches.token, token)).limit(1);
  return row ?? null;
}

/** Confirm once; the alert cursor starts now, so nothing older is mailed. */
export async function confirmSavedSearch(token: string): Promise<boolean> {
  if (!TOKEN.test(token)) return false;
  const [res] = await db
    .update(savedSearches)
    .set({ confirmedAt: new Date() })
    .where(and(eq(savedSearches.token, token), isNull(savedSearches.confirmedAt)));
  return res.affectedRows > 0;
}

export async function deleteSavedSearch(token: string): Promise<boolean> {
  if (!TOKEN.test(token)) return false;
  const [res] = await db.delete(savedSearches).where(eq(savedSearches.token, token));
  return res.affectedRows > 0;
}

/** City and barrio display names for a search's slugs (a slug is the fallback). */
export async function placeNames(c: SavedSearchCriteria): Promise<{ city?: string; barrio?: string }> {
  if (!c.citySlug) return {};
  const [city] = await db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(and(eq(locations.slug, c.citySlug), eq(locations.level, "ciudad")))
    .limit(1);
  if (!city) return { city: c.citySlug };
  if (!c.barrioSlug) return { city: city.name };
  const [barrio] = await db
    .select({ name: locations.name })
    .from(locations)
    .where(and(eq(locations.slug, c.barrioSlug), eq(locations.level, "barrio"), eq(locations.parentId, city.id)))
    .limit(1);
  return { city: city.name, barrio: barrio?.name ?? c.barrioSlug };
}

/** "Venta · Casas · Luque · desde 1 dormitorio" — the search in one line, in the reader's language. */
export function describeSearch(
  c: SavedSearchCriteria,
  locale: Locale,
  names: { city?: string; barrio?: string } = {},
): string {
  const d = getDictionary(locale);
  const parts: string[] = [d.publicUi.operations[c.operation] ?? c.operation];
  if (c.propertyType) parts.push(d.category.typeLabel[c.propertyType] ?? c.propertyType);
  if (names.barrio && names.city) parts.push(`${names.barrio}, ${names.city}`);
  else if (names.city) parts.push(names.city);
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "es-PY");
  if (c.priceMin && c.priceMax) parts.push(`US$ ${nf.format(c.priceMin)}–${nf.format(c.priceMax)}`);
  else if (c.priceMin) parts.push(`≥ US$ ${nf.format(c.priceMin)}`);
  else if (c.priceMax) parts.push(`≤ US$ ${nf.format(c.priceMax)}`);
  if (c.minBedrooms) parts.push(locale === "en" ? `${c.minBedrooms}+ bedrooms` : `${c.minBedrooms}+ dormitorios`);
  return parts.join(" · ");
}

/** Where the confirm / unsubscribe page for a token lives on a given origin. */
export function alertsPageUrl(origin: string, token: string): string {
  return `${origin}/alertas?token=${token}`;
}

export function searchUrl(origin: string, c: SavedSearchCriteria): string {
  return `${origin}${criteriaPath(c)}`;
}

export async function emailSearchConfirmation(p: {
  to: string;
  locale: Locale;
  brand: string;
  summary: string;
  confirmUrl: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale).savedSearch;
  const { html, text } = renderEmail({
    heading: t.confirmHeading,
    paragraphs: [t.confirmIntro(p.summary)],
    cta: { label: t.confirmCta, url: p.confirmUrl },
    footer: getDictionary(p.locale).email.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: t.confirmSubject(p.brand), html, text, fromName: p.brand });
}

export interface AlertListing {
  title: string;
  price: string;
  url: string;
}

export async function emailSearchAlert(p: {
  to: string;
  locale: Locale;
  brand: string;
  summary: string;
  total: number;
  listings: AlertListing[];
  searchUrl: string;
  unsubscribeUrl: string;
}): Promise<EmailResult> {
  const d = getDictionary(p.locale);
  const t = d.savedSearch;
  const lines = p.listings.map((l) => `${l.title} — ${l.price}\n${l.url}`);
  const extra = p.total - p.listings.length;
  const { html, text } = renderEmail({
    heading: t.alertHeading(p.total),
    paragraphs: [t.alertIntro(p.summary), ...lines, ...(extra > 0 ? [t.alertMore(extra)] : []), t.unsubscribeLine(p.unsubscribeUrl)],
    cta: { label: t.alertCta, url: p.searchUrl },
    footer: d.email.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: t.alertSubject(p.total, p.brand), html, text, fromName: p.brand });
}
