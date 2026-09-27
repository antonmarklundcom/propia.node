/**
 * The body of an evergreen category page (ARCHITECTURE.md §4.3, the
 * evergreen exception; content in `src/content/evergreen/`).
 *
 * Mobile first, and no wall of text above the fold. In order:
 *   1. H1 (the main keyword) and one line of lede;
 *   2. intent chips with live counts from this door's rows — types in the
 *      city, the page's price bands, the top barrios. A chip at 0 still
 *      shows, greyed, and links to the brief;
 *   3. one primary button: "Ver N propiedades" (scrolls to the grid), or
 *      "Avisame cuando haya" at 0 stock (the brief);
 *   4. the lead block — the buyer brief prefilled with operation + city +
 *      type, never a popup, and a WhatsApp link when the portal has a number.
 * Below the fold: the grid (or nearby listings at 0 stock, labelled as
 * such), then the page's own content with H2s, the FAQ (+ FAQPage JSON-LD)
 * and the related searches the category page already builds.
 *
 * Every number on this page is counted from the door's rows; the content
 * file carries none.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { currentLocale, dict } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import type { VerticalConfig } from "@/config/verticals";
import { CONTACT_WHATSAPP } from "@/config/contact";
import type { EvergreenPage } from "@/content/evergreen";
import {
  categoryFacts,
  cityIdOf,
  nearbyStockedCities,
  type CategoryPageRef,
  type InventoryLocation,
  type InventoryRow,
} from "@/lib/category-context";
import {
  citySubtreeIds,
  getFilteredCategoryListings,
  getPriceBandCounts,
  type LocationRow,
} from "@/lib/queries";
import { orDegraded } from "@/lib/degrade";
import { categoryUrl } from "@/lib/urls";
import { formatUsd } from "@/lib/format";
import { waLink } from "@/lib/wa";
import { faqJsonLd } from "@/lib/jsonld";
import { briefChoices } from "@/lib/buyer-brief";
import type { Operation, PropertyType } from "@/lib/import/types";
import { BuyerBrief } from "@/components/BuyerBrief";
import { JsonLd } from "@/components/JsonLd";
import { ListingBrowser } from "@/components/ListingBrowser";
import { ListingCard } from "@/components/ListingCard";

/** Grammatical gender of a type's plural noun (casas → publicadas). */
const FEMININE: ReadonlySet<PropertyType | "any"> = new Set(["casa", "oficina", "quinta", "any"]);

interface Chip {
  key: string;
  label: string;
  count: number | null;
  href: string;
  current?: boolean;
}

export async function EvergreenCategory({
  page,
  operation,
  city,
  barrio,
  type,
  canonicalPath,
  locationIds,
  vertical,
  count,
  searchParams,
  inventory,
  breadcrumbs,
  related,
  pricesAside,
}: {
  page: EvergreenPage;
  operation: Operation;
  city: LocationRow;
  barrio: LocationRow | null;
  type: PropertyType | null;
  canonicalPath: string;
  locationIds: number[];
  vertical: VerticalConfig;
  /** The canonical (unfiltered) count on this door. */
  count: number;
  searchParams: Record<string, string | string[] | undefined>;
  /** This door's inventory for the operation, or null if the read failed. */
  inventory: { rows: InventoryRow[]; byId: Map<number, InventoryLocation> } | null;
  breadcrumbs: ReactNode;
  related: ReactNode;
  pricesAside: ReactNode;
}) {
  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const t = d.evergreen;
  const tc = d.category;
  const numberLocale = numberLocaleFor(vertical.locale);
  const usd = (n: number) => formatUsd(n, numberLocale);
  const where = barrio ? `${barrio.name}, ${city.name}` : city.name;
  const typeWord = type ? tc.typeLabel[type] : tc.typeLabelAny;
  const what = typeWord.toLowerCase();
  const fem = FEMININE.has(type ?? "any");
  const ref: CategoryPageRef = {
    operation,
    cityId: city.id,
    barrioId: barrio?.id ?? null,
    type,
  };
  const BRIEF = "#brief";
  const GRID = "#listado";

  // 2a. Types in this city, the page's own type always first.
  const typeCounts = new Map<PropertyType, number>();
  const barrioCounts = new Map<number, number>();
  if (inventory) {
    for (const r of inventory.rows) {
      if (cityIdOf(r.locationId, inventory.byId) !== city.id) continue;
      typeCounts.set(r.propertyType, (typeCounts.get(r.propertyType) ?? 0) + r.count);
      if ((type == null || r.propertyType === type) && inventory.byId.get(r.locationId)?.level === "barrio") {
        barrioCounts.set(r.locationId, (barrioCounts.get(r.locationId) ?? 0) + r.count);
      }
    }
  }
  const typeChips: Chip[] = [];
  if (type) {
    typeChips.push({ key: type, label: tc.typeLabel[type], count, href: count > 0 ? GRID : BRIEF, current: true });
  }
  for (const [ty, n] of [...typeCounts].sort((a, b) => b[1] - a[1])) {
    if (ty === type || n <= 0) continue;
    typeChips.push({
      key: ty,
      label: tc.typeLabel[ty],
      count: n,
      href: categoryUrl({ operation, citySlug: city.slug, type: ty }),
    });
  }

  // 2b. Price bands — the same predicate the ?precio_min/max link applies.
  const bandCounts = await orDegraded(
    `evergreen-bands[${canonicalPath}]`,
    getPriceBandCounts(vertical, { operation, locationIds, type }, page.priceBands),
    null,
  );
  const priceChips: Chip[] = page.priceBands.map((b, i) => {
    const label =
      b.min != null && b.max != null
        ? t.bandRange(usd(b.min), usd(b.max))
        : b.max != null
          ? t.bandUpTo(usd(b.max))
          : t.bandFrom(usd((b.min ?? 1) - 1));
    // `count` is live; the band counts are cached (ten-minute backstop). At
    // a live 0 every band is 0, whatever a stale entry still says.
    const n = count === 0 ? 0 : bandCounts ? bandCounts[i] : null;
    const qs = new URLSearchParams();
    if (b.min != null) qs.set("precio_min", String(b.min));
    if (b.max != null) qs.set("precio_max", String(b.max));
    return { key: `band-${i}`, label, count: n, href: n === 0 ? BRIEF : `${canonicalPath}?${qs}${GRID}` };
  });

  // 2c. Top barrios with stock (only where the location tree has barrios).
  const barrioChips: Chip[] = barrio
    ? []
    : [...barrioCounts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .flatMap(([id, n]) => {
          const loc = inventory?.byId.get(id);
          if (!loc) return [];
          const href =
            type && n >= 3
              ? categoryUrl({ operation, citySlug: city.slug, barrioSlug: loc.slug, type })
              : `${canonicalPath}?barrio=${encodeURIComponent(loc.slug)}${GRID}`;
          return [{ key: loc.slug, label: loc.name, count: n, href }];
        });

  // 4. Lead block.
  const wa = waLink(CONTACT_WHATSAPP, t.whatsappText(page.h1.toLowerCase()));

  // Below the fold at 0 stock: the nearest cities that have this type.
  let nearby: { cards: Awaited<ReturnType<typeof getFilteredCategoryListings>>["listings"]; places: string[] } | null = null;
  if (count === 0 && inventory) {
    const cities = nearbyStockedCities(inventory.rows, inventory.byId, ref);
    const places = cities.map((c) => inventory.byId.get(c.id)?.name).filter((n): n is string => !!n);
    const ids = (await Promise.all(cities.map((c) => citySubtreeIds(c.id)))).flat();
    const cards = ids.length
      ? (
          await orDegraded(
            `evergreen-nearby[${canonicalPath}]`,
            getFilteredCategoryListings({ operation, locationIds: ids, type: type ?? undefined, vertical, limit: 6 }),
            { listings: [], filteredCount: 0 },
          )
        ).listings
      : [];
    nearby = { cards, places };
  }

  const facts = inventory ? categoryFacts(inventory.rows, inventory.byId, ref) : null;
  const factLine =
    count > 0 && facts
      ? [
          t.factsCount(tc.countNoun(count, type), where, fem),
          facts.minUsd != null && facts.maxUsd != null && operation !== "alquiler_temporal"
            ? t.factsRange(usd(facts.minUsd), usd(facts.maxUsd))
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : count === 0
        ? t.factsEmpty(what, where, fem)
        : null;

  const chipRow = (label: string, chips: Chip[]) =>
    chips.length > 0 && (
      <div className="evg-chips__row">
        <span className="evg-chips__label">{label}</span>
        <ul className="evg-chips__list">
          {chips.map((c) => {
            const zero = c.count === 0;
            return (
              <li key={c.key}>
                <a
                  className={`evg-chip${zero ? " evg-chip--zero" : ""}${c.current ? " evg-chip--current" : ""}`}
                  href={c.href}
                  aria-current={c.current ? "page" : undefined}
                  title={zero ? t.chipZeroHint : undefined}
                >
                  <span>{c.label}</span>
                  {c.count != null && (
                    <span className="evg-chip__count">{c.count.toLocaleString(numberLocale)}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <>
      <JsonLd data={[faqJsonLd([...page.faq])]} />
      {breadcrumbs}

      <section className="evg-hero">
        <div className="evg-hero__main">
          <h1 className="category-title evg-title">{page.h1}</h1>
          <p className="evg-lede">{page.lede}</p>
          <nav className="evg-chips" aria-label={t.chipsAria}>
            {chipRow(t.typesLabel, typeChips)}
            {chipRow(t.pricesLabel, priceChips)}
            {chipRow(t.barriosLabel, barrioChips)}
          </nav>
          <a className="ds-btn ds-btn--primary evg-primary" href={count > 0 ? GRID : BRIEF}>
            {count > 0 ? t.seeAll(count) : t.notifyMe}
          </a>
        </div>
        <aside className="evg-lead" id="brief">
          <BuyerBrief
            locale={locale}
            surface="evergreen"
            prefill={{ operation, propertyType: type ?? undefined, where }}
            choices={briefChoices(vertical.filters)}
            idPrefix="brief-evergreen"
            collapsible={count > 0}
            title={count > 0 ? t.briefTitle(where) : t.briefTitleEmpty(what, where, fem)}
            intro={t.briefIntro}
          />
          {wa && (
            <a className="evg-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
              {t.whatsappCta}
            </a>
          )}
        </aside>
      </section>

      <section className="evg-listings" id="listado">
        {count > 0 ? (
          <>
            <h2 className="evg-h2">{t.listingsTitle(typeWord, fem)}</h2>
            <ListingBrowser
              basePath={canonicalPath}
              query={{ operation, locationIds, type: type ?? undefined, vertical }}
              searchParams={searchParams}
              city={city}
              barrio={barrio}
              hideBrief
            />
          </>
        ) : (
          <>
            <h2 className="evg-h2">{t.nearbyTitle(typeWord, where)}</h2>
            {nearby && nearby.cards.length > 0 ? (
              <>
                <p className="evg-note">{t.nearbyNote(where, nearby.places.join(", "))}</p>
                <div className="category-results evg-nearby-grid">
                  {nearby.cards.map((card) => (
                    <ListingCard key={card.id} card={card} />
                  ))}
                </div>
              </>
            ) : (
              <p className="evg-note">{t.nearbyNone(where)}</p>
            )}
          </>
        )}
      </section>

      <article className="evg-content">
        <section className="evg-section">
          <h2 className="evg-h2">{page.barrios.title}</h2>
          <p>{page.barrios.intro}</p>
          <dl className="evg-barrios">
            {page.barrios.items.map((b) => (
              <div key={b.name} className="evg-barrios__item">
                <dt>{b.name}</dt>
                <dd>{b.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="evg-section">
          <h2 className="evg-h2">{page.prices.title}</h2>
          {factLine && <p className="evg-facts">{factLine}</p>}
          {page.prices.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {pricesAside}
        </section>

        <section className="evg-section">
          <h2 className="evg-h2">{page.checklist.title}</h2>
          <p>{page.checklist.intro}</p>
          <ul className="evg-checklist">
            {page.checklist.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="evg-section">
          <h2 className="evg-h2">{page.financing.title}</h2>
          {page.financing.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {/* A rental page's section is about the cost of moving in; the
              mortgage programmes only apply to a purchase. */}
          {operation === "venta" && (
            <Link className="panel-btn" href="/financiamiento">
              {t.financingCta}
            </Link>
          )}
        </section>

        <section className="evg-section">
          <h2 className="evg-h2">{t.faqTitle}</h2>
          <div className="evg-faq">
            {page.faq.map((f) => (
              <div key={f.q} className="evg-faq__item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {related}
    </>
  );
}
