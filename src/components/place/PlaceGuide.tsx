/**
 * The place page (`/zonas/<ciudad>[/<barrio>]`, plan phase 4): one guide per
 * city or barrio, written once (`src/content/places/`) and borrowed by every
 * category page of that place as an excerpt.
 *
 * - **Content** comes from the file for this door, else the file another door
 *   of the same language owns (rendered here, canonical to its owner). No file
 *   → 404.
 * - **Indexable** only on the file's own door and only once the founder has
 *   verified its claims (`placeIndexable()`, decision P-6). A draft is live,
 *   `noindex,follow` and out of the sitemap.
 * - **Live data** is counted from this door's rows at request time: one link
 *   per type and operation that has stock here, plus this door's evergreen
 *   pages for the place. No number is ever written in the content file.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentLocale, dict } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import { currentVertical } from "@/lib/vertical-context";
import { VERTICALS, type VerticalConfig } from "@/config/verticals";
import { marketplacePagesEnabled } from "@/design/sections";
import { doorOgImages } from "@/lib/og-urls";
import { siteOrigin } from "@/lib/origin";
import { placePagesAt, placeIndexable, PLACE_PAGES, type PlacePage } from "@/content/places";
import { placePath } from "@/lib/place-path";
import { hostForDoor, placeAlternates } from "@/lib/place-alternates";
import { treePlace } from "@/lib/ops/location-tree";
import { getCategoryInventory, locationIndex, resolveBarrio, resolveCity } from "@/lib/queries";
import { cityIdOf } from "@/lib/category-context";
import { orDegraded } from "@/lib/degrade";
import { categoryUrl, parseOperation, parseTypePlural } from "@/lib/urls";
import { evergreenPathsFor } from "@/content/evergreen";
import { otherOperationsFor } from "@/lib/empty-state";
import { listPublishedPosts } from "@/lib/post-queries";
import { guidesForPage } from "@/lib/guide-links";
import { breadcrumbJsonLd, faqJsonLd, placeJsonLd } from "@/lib/jsonld";
import { briefChoices } from "@/lib/buyer-brief";
import type { Operation, PropertyType } from "@/lib/import/types";
import { JsonLd } from "@/components/JsonLd";
import { BuyerBrief } from "@/components/BuyerBrief";

interface ResolvedPlace {
  file: PlacePage;
  vertical: VerticalConfig;
  cityName: string;
  barrioName: string | null;
  lat?: number;
  lng?: number;
  path: string;
  /** Where the canonical points: this host for its own file, else the owner's. */
  canonical: string;
  indexable: boolean;
}

/** The file for this place this door should render, or null (a 404). */
async function resolvePlace(citySlug: string, barrioSlug?: string): Promise<ResolvedPlace | null> {
  const vertical = await currentVertical();
  if (!marketplacePagesEnabled(vertical.key)) return null;
  const tree = treePlace(citySlug, barrioSlug);
  if (!tree) return null;
  const files = placePagesAt(citySlug, barrioSlug);
  const file =
    files.find((f) => f.door === vertical.key) ??
    files.find((f) => {
      const host = hostForDoor(VERTICALS, f.door);
      return host != null && VERTICALS[host].locale === vertical.locale;
    });
  if (!file) return null;
  const path = placePath(citySlug, barrioSlug);
  const own = file.door === vertical.key;
  const ownerHost = hostForDoor(VERTICALS, file.door);
  const canonical = own || !ownerHost ? `${await siteOrigin()}${path}` : `https://${ownerHost}${path}`;
  const node = tree.barrio ?? tree.city;
  return {
    file,
    vertical,
    cityName: tree.city.name,
    barrioName: tree.barrio?.name ?? null,
    lat: node.lat,
    lng: node.lng,
    path,
    canonical,
    indexable: placeIndexable(file, vertical.key),
  };
}

export async function placeMetadata(citySlug: string, barrioSlug?: string): Promise<Metadata> {
  const r = await resolvePlace(citySlug, barrioSlug);
  if (!r) return { title: (await dict()).place.metaNotFound };
  const brand = await brandName();
  const languages = r.indexable ? placeAlternates(VERTICALS, placePagesAt(citySlug, barrioSlug)) : undefined;
  return {
    title: r.file.h1,
    description: r.file.metaDescription,
    alternates: { canonical: r.canonical, languages },
    openGraph: { title: `${r.file.h1} — ${brand}`, description: r.file.metaDescription, images: doorOgImages(brand) },
    robots: r.indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

/** Live links: every type and operation with stock in this place on this door. */
async function liveLinks(r: ResolvedPlace, citySlug: string, barrioSlug?: string) {
  const v = r.vertical;
  const ops = (["venta", ...otherOperationsFor("venta", v.filters)] as Operation[]).filter(
    (op) => !v.filters?.operation || v.filters.operation.includes(op),
  );
  const [byId, city] = await Promise.all([
    orDegraded("place-locations", locationIndex(), new Map()),
    orDegraded("place-city", resolveCity(citySlug), null),
  ]);
  const barrio = city && barrioSlug ? await orDegraded("place-barrio", resolveBarrio(city.id, barrioSlug), null) : null;
  const links: { href: string; type: PropertyType; operation: Operation; count: number }[] = [];
  if (city && (!barrioSlug || barrio)) {
    for (const op of ops) {
      const rows = await orDegraded(`place-inventory[${op}]`, getCategoryInventory(v, op), []);
      const byType = new Map<PropertyType, number>();
      for (const row of rows) {
        const inPlace = barrio ? row.locationId === barrio.id : cityIdOf(row.locationId, byId) === city.id;
        if (inPlace && row.count > 0) byType.set(row.propertyType, (byType.get(row.propertyType) ?? 0) + row.count);
      }
      for (const [type, count] of byType) {
        links.push({ href: categoryUrl({ operation: op, citySlug, barrioSlug, type }), type, operation: op, count });
      }
    }
  }
  // This door's evergreen pages for the place, even with no stock today.
  const prefix = barrioSlug ? `/${citySlug}/${barrioSlug}/` : `/${citySlug}/`;
  for (const path of evergreenPathsFor(v.key)) {
    const [opSeg, ...rest] = path.split("/").filter(Boolean);
    if (!`/${rest.join("/")}/`.startsWith(prefix) || rest.length !== (barrioSlug ? 3 : 2)) continue;
    if (links.some((l) => l.href === path)) continue;
    const type = parseTypePlural(rest[rest.length - 1]);
    const operation = parseOperation(opSeg);
    if (type && operation) links.push({ href: path, type, operation, count: 0 });
  }
  return links.sort((a, b) => b.count - a.count || a.href.localeCompare(b.href));
}


export async function PlaceGuide({ citySlug, barrioSlug }: { citySlug: string; barrioSlug?: string }) {
  const r = await resolvePlace(citySlug, barrioSlug);
  if (!r) notFound();
  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const t = d.place;
  const tc = d.category;
  const numberLocale = numberLocaleFor(r.vertical.locale);
  const { file } = r;
  const placeName = r.barrioName ?? r.cityName;
  const origin = await siteOrigin();
  const links = await liveLinks(r, citySlug, barrioSlug);
  const guides = guidesForPage(
    categoryUrl({ operation: "venta", citySlug }),
    await orDegraded(`place-guides[${r.path}]`, listPublishedPosts(r.vertical.locale), []),
  );
  // Barrio guides under this city (city page), or the city guide (barrio page).
  const barrioGuides = barrioSlug
    ? []
    : PLACE_PAGES.filter((p) => p.city === citySlug && p.barrio && p.door === file.door);
  const crumbs = [
    { name: t.breadcrumbHome, url: "/" },
    { name: r.cityName, url: placePath(citySlug) },
    ...(barrioSlug && r.barrioName ? [{ name: r.barrioName, url: r.path }] : []),
  ];
  const photoBase = `/img/places/${barrioSlug ? `${citySlug}--${barrioSlug}` : citySlug}`;
  const sections = [file.overview, file.whoItSuits, file.access, file.services, file.buying, file.renting];

  return (
    <main className="place-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, crumbs),
          placeJsonLd({
            name: placeName,
            url: r.canonical,
            lat: r.lat,
            lng: r.lng,
            containedIn: barrioSlug ? { name: r.cityName, url: `${origin}${placePath(citySlug)}` } : undefined,
          }),
          faqJsonLd([...file.faq]),
        ]}
      />
      <nav className="breadcrumb-nav category-breadcrumb" aria-label={tc.breadcrumbLabel}>
        {crumbs.map((c, i) => (
          <span key={c.url} className="category-breadcrumb__item">
            {i > 0 && <span aria-hidden>›</span>}
            {i === crumbs.length - 1 ? (
              <span className="breadcrumb-nav__current" aria-current="page">{c.name}</span>
            ) : (
              <Link className="breadcrumb-nav__link" href={c.url}>{c.name}</Link>
            )}
          </span>
        ))}
      </nav>

      <header className="place-page__head">
        <h1 className="category-title">{file.h1}</h1>
        <p className="place-page__lede">{file.lede}</p>
      </header>

      {file.photos.length > 0 && (
        <figure className="place-page__hero">
          <img
            src={`${photoBase}/${file.photos[0].file}-1280.webp`}
            srcSet={`${photoBase}/${file.photos[0].file}-640.webp 640w, ${photoBase}/${file.photos[0].file}-1280.webp 1280w`}
            sizes="(max-width: 768px) 100vw, 1100px"
            width={1280}
            height={720}
            alt={file.photos[0].alt}
            fetchPriority="high"
          />
          <figcaption>
            {file.photos[0].caption} · {t.photoCredit(file.photos[0].credit)}
          </figcaption>
        </figure>
      )}

      <section className="place-page__live" aria-labelledby="place-live">
        <h2 id="place-live" className="evg-h2">{t.listingsTitle(placeName)}</h2>
        {links.length > 0 ? (
          <ul className="category-related__list">
            {links.map((l) => (
              <li key={l.href}>
                <Link className="category-related__link" href={l.href}>
                  {t.listingsLink(tc.typeLabel[l.type], tc.operationLabel[l.operation])}
                </Link>{" "}
                {l.count > 0 && <span className="category-related__count">{l.count.toLocaleString(numberLocale)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="evg-note">{t.listingsNone(placeName)}</p>
        )}
      </section>

      <article className="place-page__body">
        <section className="evg-section">
          <h2 className="evg-h2">{file.overview.title}</h2>
          {file.overview.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </section>
        <section className="evg-section">
          <h2 className="evg-h2">{file.zones.title}</h2>
          <p>{file.zones.intro}</p>
          <dl className="place-page__zones">
            {file.zones.items.map((z) => (
              <div key={z.name}>
                <dt>{z.name}</dt>
                <dd>{z.text}</dd>
              </div>
            ))}
          </dl>
        </section>
        {sections.slice(1).map((s) => (
          <section key={s.title} className="evg-section">
            <h2 className="evg-h2">{s.title}</h2>
            {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}

        {file.photos.length > 1 && (
          <section className="evg-section">
            <h2 className="evg-h2">{t.photosTitle}</h2>
            <div className="place-page__gallery">
              {file.photos.slice(1).map((ph) => (
                <figure key={ph.file}>
                  <img
                    src={`${photoBase}/${ph.file}-640.webp`}
                    srcSet={`${photoBase}/${ph.file}-640.webp 640w, ${photoBase}/${ph.file}-1280.webp 1280w`}
                    sizes="(max-width: 768px) 100vw, 360px"
                    width={640}
                    height={427}
                    alt={ph.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>{ph.caption} · {t.photoCredit(ph.credit)}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="evg-section">
          <h2 className="evg-h2">{t.faqTitle}</h2>
          {file.faq.map((f) => (
            <details key={f.q} className="place-page__faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </article>

      <aside className="evg-lead place-page__brief" id="brief">
        <BuyerBrief
          locale={locale}
          surface="place"
          prefill={{ where: barrioSlug && r.barrioName ? `${r.barrioName}, ${r.cityName}` : r.cityName }}
          choices={briefChoices(r.vertical.filters)}
          idPrefix="brief-place"
          title={t.briefTitle(placeName)}
          intro={t.briefIntro}
        />
      </aside>

      {(barrioGuides.length > 0 || barrioSlug) && (
        <nav className="category-related" aria-label={t.barriosTitle(r.cityName)}>
          <section className="category-related__group">
            <h2 className="category-related__title">{t.barriosTitle(r.cityName)}</h2>
            <ul className="category-related__list">
              {barrioSlug && (
                <li>
                  <Link className="category-related__link" href={placePath(citySlug)}>{t.cityGuideLink(r.cityName)}</Link>
                </li>
              )}
              {barrioGuides.map((b) => {
                const name = treePlace(b.city, b.barrio)?.barrio?.name ?? b.barrio!;
                return (
                  <li key={b.barrio}>
                    <Link className="category-related__link" href={placePath(b.city, b.barrio)}>{name}</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </nav>
      )}

      {guides.length > 0 && (
        <section className="evg-section">
          <h2 className="evg-h2">{d.evergreen.guidesTitle}</h2>
          <ul className="evg-guides">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guias/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
