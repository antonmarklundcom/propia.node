/**
 * The empty category page (founder decisions E-1..E-4, 2026-10-03; plan
 * phase 3). A valid `/venta|alquiler/<ciudad>[/<barrio>]/<tipo>` with no
 * listing on this door today renders this instead of a 404 or a redirect:
 *
 * 1. an honest line — nothing invented, no fake cards;
 * 2. the CTAs in the E-4 order (`emptyStateCtas()`): the buyer brief, then
 *    WhatsApp when the number is configured, then the email alert when email
 *    can be sent;
 * 3. the nearest real stock: the same type in sibling barrios or the city,
 *    a few cards from the nearest cities that have it, the same place in the
 *    other operation, other types here (`emptyStateLinks()`);
 * 4. related guides.
 *
 * The page stays `noindex,follow` and out of the sitemap (E-2) — the caller
 * decides that through `getIndexability({ emptyRenders: true })`. Every read
 * here is an aside: under pool pressure it renders without that block.
 */
import Link from "next/link";
import { currentLocale, dict } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import type { VerticalConfig } from "@/config/verticals";
import { CONTACT_WHATSAPP } from "@/config/contact";
import {
  emptyStateLinks,
  nearbyStockedCities,
  type CategoryPageRef,
  type InventoryLocation,
  type InventoryRow,
  type RelatedLink,
} from "@/lib/category-context";
import { emptyStateCtas, otherOperationsFor } from "@/lib/empty-state";
import { citySubtreeIds, getCategoryInventory, getFilteredCategoryListings, type LocationRow } from "@/lib/queries";
import { orDegraded } from "@/lib/degrade";
import { waLink } from "@/lib/wa";
import { isEmailConfigured } from "@/lib/email";
import { briefChoices } from "@/lib/buyer-brief";
import { listPublishedPosts } from "@/lib/post-queries";
import { guidesForPage } from "@/lib/guide-links";
import type { Operation, PropertyType } from "@/lib/import/types";
import { BuyerBrief } from "@/components/BuyerBrief";
import { SaveSearch } from "@/components/SaveSearch";
import { ListingCard } from "@/components/ListingCard";

export async function EmptyCategory({
  operation,
  city,
  barrio,
  type,
  canonicalPath,
  vertical,
  inventory,
}: {
  operation: Operation;
  city: LocationRow;
  barrio: LocationRow | null;
  type: PropertyType | null;
  canonicalPath: string;
  vertical: VerticalConfig;
  /** This operation's inventory on this door, already read by the page (null if that read degraded). */
  inventory: { rows: InventoryRow[]; byId: Map<number, InventoryLocation> } | null;
}) {
  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const t = d.category;
  const numberLocale = numberLocaleFor(vertical.locale);
  const where = barrio ? `${barrio.name}, ${city.name}` : city.name;
  const typeLabel = type ? t.typeLabel[type] : t.typeLabelAny;
  const what = typeLabel.toLowerCase();
  const opLabel = t.operationLabel[operation];
  const ref: CategoryPageRef = { operation, cityId: city.id, barrioId: barrio?.id ?? null, type };

  // The other operation's inventory comes from the same cached aggregate.
  const otherOps = await Promise.all(
    otherOperationsFor(operation, vertical.filters).map(async (op) => ({
      operation: op,
      rows: await orDegraded(`empty-other-op[${op}]`, getCategoryInventory(vertical, op), []),
    })),
  );
  // A place rendered from the location tree (not seeded yet, report §A) is not
  // in the table: add it so "nearest" is measured from its centroid.
  if (inventory && !inventory.byId.has(city.id)) {
    const byId = new Map(inventory.byId);
    for (const row of [city, barrio]) if (row) byId.set(row.id, row);
    inventory = { rows: inventory.rows, byId };
  }
  const links = inventory
    ? emptyStateLinks(inventory.rows, otherOps, inventory.byId, ref)
    : { sameTypeHere: [], otherOperation: [], otherTypes: [] };

  // A few real cards from the nearest cities that have this type.
  let nearby: { cards: Awaited<ReturnType<typeof getFilteredCategoryListings>>["listings"]; places: string[] } | null = null;
  if (inventory) {
    const cities = nearbyStockedCities(inventory.rows, inventory.byId, ref);
    const places = cities.map((c) => inventory.byId.get(c.id)?.name).filter((n): n is string => !!n);
    const ids = (await Promise.all(cities.map((c) => citySubtreeIds(c.id)))).flat();
    const cards = ids.length
      ? (
          await orDegraded(
            `empty-nearby[${canonicalPath}]`,
            getFilteredCategoryListings({ operation, locationIds: ids, type: type ?? undefined, vertical, limit: 6 }),
            { listings: [], filteredCount: 0 },
          )
        ).listings
      : [];
    nearby = { cards, places };
  }

  const guides = guidesForPage(
    canonicalPath,
    await orDegraded(`empty-guides[${canonicalPath}]`, listPublishedPosts(vertical.locale), []),
  );

  const wa = waLink(CONTACT_WHATSAPP, t.emptyWhatsappText(what, where));
  const ctas = emptyStateCtas({ whatsapp: !!wa, email: isEmailConfigured() });
  const ctaNodes = ctas.map((cta) => {
    if (cta === "brief") {
      return (
        <BuyerBrief
          key="brief"
          locale={locale}
          surface="empty"
          prefill={{ operation, propertyType: type ?? undefined, where }}
          choices={briefChoices(vertical.filters)}
          idPrefix="brief-empty"
        />
      );
    }
    if (cta === "whatsapp") {
      return (
        <a key="wa" className="evg-whatsapp empty-category__whatsapp" href={wa!} target="_blank" rel="noopener noreferrer">
          {t.emptyWhatsappCta}
        </a>
      );
    }
    return (
      <SaveSearch
        key="alert"
        locale={locale}
        criteria={{ operation, propertyType: type ?? undefined, citySlug: city.slug, barrioSlug: barrio?.slug }}
      />
    );
  });

  const group = (key: string, title: string, items: { href: string; label: string; count: number }[]) =>
    items.length > 0 && (
      <section key={key} className="category-related__group">
        <h2 className="category-related__title">{title}</h2>
        <ul className="category-related__list">
          {items.map((l) => (
            <li key={l.href}>
              <Link className="category-related__link" href={l.href}>
                {l.label}
              </Link>{" "}
              <span className="category-related__count">{l.count.toLocaleString(numberLocale)}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  const label = (l: RelatedLink) => (l.type ? `${t.typeLabel[l.type]} · ${l.place}` : l.place);

  return (
    <div className="empty-category">
      <p className="empty-category__now">{t.emptyNow(what, opLabel, where)}</p>
      <p className="empty-category__intro">{t.emptyIntro}</p>
      <div className="empty-category__ctas">{ctaNodes}</div>

      <nav className="category-related empty-category__links" aria-label={t.emptyLinksAria}>
        {group(
          "same",
          t.emptySameTypeTitle(what, opLabel),
          links.sameTypeHere.map((l) => ({ href: l.href, label: l.place, count: l.count })),
        )}
        {group(
          "other-op",
          t.emptyOtherOpTitle(where),
          links.otherOperation.map((l) => ({
            href: l.href,
            label: t.emptyOtherOpLink(l.type ? t.typeLabel[l.type] : t.typeLabelAny, t.operationLabel[l.operation]),
            count: l.count,
          })),
        )}
        {group(
          "types",
          t.emptyOtherTypesTitle(opLabel, where),
          links.otherTypes.map((l) => ({ href: l.href, label: label(l), count: l.count })),
        )}
      </nav>

      {nearby && nearby.cards.length > 0 && (
        <section className="empty-category__nearby">
          <h2 className="category-related__title">{t.emptyNearbyCitiesTitle(typeLabel, nearby.places.join(", "))}</h2>
          <div className="category-results listing-results-grid">
            {nearby.cards.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="empty-category__guides">
          <h2 className="category-related__title">{d.evergreen.guidesTitle}</h2>
          <ul className="category-related__list">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link className="category-related__link" href={`/guias/${g.slug}`}>
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
