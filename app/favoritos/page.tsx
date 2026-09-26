import type { Metadata } from "next";
import Link from "next/link";
import { dict } from "@/i18n/server";
import { getListingCardsByPublicIds } from "@/lib/queries";
import { parseIdsParam } from "@/lib/saved-listings";
import { ListingCard } from "@/components/ListingCard";
import { PageHero } from "@/components/MarketingUI";
import { ClearSavedButton, SavedIdsSync } from "@/components/SavedListings";

/**
 * Favourites without an account (plan-build-2026-09-26 A3, Seeker 2).
 *
 * The list lives in the visitor's browser (`propia:favorites`); the page
 * renders whatever `?ids=` carries and <SavedIdsSync> keeps that URL equal to
 * the stored list. Published listings only — see getListingCardsByPublicIds.
 *
 * `noindex` and never in a sitemap: every visitor's page is different, and a
 * URL full of ids is nothing a search engine should hold.
 */
type Props = { searchParams: Promise<{ ids?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).a3.favorites;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: true },
  };
}

export default async function FavoritosPage({ searchParams }: Props) {
  const [{ ids: rawIds }, d] = await Promise.all([searchParams, dict()]);
  const t = d.a3.favorites;
  const ids = parseIdsParam(rawIds, "favorites");
  const cards = await getListingCardsByPublicIds(ids);
  const gone = ids.length - cards.length;

  return (
    <main className="saved-page">
      <SavedIdsSync list="favorites" path="/favoritos" urlIds={ids} />
      <PageHero kicker={t.kicker} title={t.title} subtitle={t.intro} />
      <section className="saved-page__body">
        {gone > 0 && <p className="saved-page__note">{t.unavailable(gone)}</p>}
        {cards.length === 0 ? (
          <div className="saved-page__empty">
            <p>{t.empty}</p>
            <Link className="ds-btn ds-btn--primary" href="/">
              {t.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="category-results listing-results-grid">
              {cards.map((card) => (
                <ListingCard key={card.id} card={card} />
              ))}
            </div>
            <div className="saved-page__foot">
              <ClearSavedButton list="favorites" label={t.clearAll} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
