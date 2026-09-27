import { Glyph } from "@/components/Glyph";
import Link from "next/link";
import { tokens } from "@/design/tokens";
import { headers } from "next/headers";
import { listCities, listNavigationInventory, resolveBarrio, stockedNavigationPaths } from "@/lib/queries";
import { currentVertical } from "@/lib/vertical-context";
import { SearchBar } from "@/components/SearchBar";
import { BuyerBrief } from "@/components/BuyerBrief";
import { currentLocale, dict } from "@/i18n/server";
import { POPULAR_SEARCHES } from "@/config/popular-searches";
import { briefChoices, briefFromPath, type BriefPrefill } from "@/lib/buyer-brief";

// Renders per-request rather than at build time — the root layout reads the
// Host header for the per-host brand, so nothing in this app prerenders
// (PLAN.md F17). The city list below is cached, so a 404 no longer costs a
// query; this stays force-dynamic because the shell around it is.
export const dynamic = "force-dynamic";

/**
 * Branded 404. Also what renders for category URLs with zero matching
 * listings (getIndexability() → "gone" with no parent to redirect to,
 * ARCHITECTURE.md §4.3) — that's an intentional SEO signal, but a visitor
 * who just searched should get somewhere to go next, not a dead end.
 */
export default async function NotFound() {
  // A 404 must never become a 500. This page is also the error surface for
  // "category URL with zero matches", so it renders during exactly the kind
  // of incident where MySQL may be the thing that is unwell — a dead search
  // bar is a worse-but-usable page, a stack trace is not.
  const doorPromise = currentVertical();
  const [cities, locale, d, inventory, door, pathname] = await Promise.all([
    listCities().catch(() => []),
    currentLocale(),
    dict(),
    doorPromise.then(listNavigationInventory).catch(() => []),
    doorPromise,
    headers().then((h) => h.get("x-pathname")),
  ]);

  // Buyer brief (src/lib/buyer-brief.ts): the category URL that matched
  // nothing still spells what the visitor wanted, so the form starts from it.
  // Every lookup here degrades to "no prefill" — the form itself needs no
  // database to render, and a failed submit says so and keeps its answers.
  const fromPath = briefFromPath(pathname);
  const briefCity = fromPath.citySlug ? cities.find((c) => c.slug === fromPath.citySlug) : undefined;
  const briefBarrio = briefCity && fromPath.barrioSlug
    ? await resolveBarrio(briefCity.id, fromPath.barrioSlug).catch(() => null)
    : null;
  const briefPrefill: BriefPrefill = {
    operation: fromPath.operation,
    propertyType: fromPath.propertyType,
    where: briefCity ? (briefBarrio ? `${briefBarrio.name}, ${briefCity.name}` : briefCity.name) : undefined,
  };
  // The directory door is seller-first (it has its own lead form); a buyer
  // brief there would be off-message.
  const showBrief = door.family !== "directory";
  const stockedPaths = stockedNavigationPaths(inventory);
  // Attach localized labels before filtering so dictionary indexes stay aligned.
  const suggestions = POPULAR_SEARCHES.map((s, index) => ({
    ...s, label: d.notFound.suggestions[index],
  })).filter((s) => stockedPaths.has(s.href));

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "4rem 1rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        <Glyph name="home" size={40} />
      </div>
      <h1 style={{ fontSize: 26, margin: "16px 0 8px", color: tokens.color.primary }}>
        {d.notFound.title}
      </h1>
      <p style={{ fontSize: 16, color: tokens.color.inkSecondary, lineHeight: 1.6 }}>
        {d.notFound.explanation}
      </p>

      <div style={{ textAlign: "left" }}>
        <SearchBar cities={cities} locale={locale} />
      </div>

      {suggestions.length > 0 && (
        <>
          <p
            style={{
              marginTop: 28,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: tokens.color.inkSecondary,
            }}
          >
            {d.notFound.popularSearches}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {suggestions.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: tokens.radius.chip,
                  background: tokens.color.surface,
                  border: "1px solid #E1E5E0",
                  color: tokens.color.ink,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </>
      )}

      {showBrief && (
        <div style={{ textAlign: "left", marginTop: 32 }}>
          <BuyerBrief
            locale={locale}
            surface="not_found"
            prefill={briefPrefill}
            choices={briefChoices(door.filters)}
            idPrefix="brief-404"
          />
        </div>
      )}

      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 24,
          fontSize: 14,
          fontWeight: 700,
          color: tokens.color.primary,
        }}
      >
        {d.notFound.home}
      </Link>
    </main>
  );
}
