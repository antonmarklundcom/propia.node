import Link from "next/link";
import { formatPrice, formatCuota, formatUsd, formatSqft, imageThumbUrl } from "@/lib/format";
import { listingUrl } from "@/lib/urls";
import { isPlaceholderPhoto } from "@/lib/photos";
import type { ListingCard as Card } from "@/lib/queries";
import { dict, currentLocale } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { showCuota, cardVariant, secondaryAreaUnit } from "@/design/sections";

/**
 * Category-grid / homepage card, in the editorial system: **the photo is the
 * card**. No white frame, no soft shadow, no body panel — the image fills the
 * tile and the text sits on it over a bottom-up gradient. Hover pushes the
 * photo to 1.06 over 1.1s; nothing else moves.
 *
 * A listing with no usable photo gets the house image rather than an icon on a
 * grey rectangle: in a grid where every neighbour is a photograph, an empty
 * tile reads as broken. `listing-fallback.webp` is deliberately abstract (a
 * wall and a palm shadow) so it can't be mistaken for the property itself, and
 * "Foto próximamente" stays on top of it.
 */
export async function ListingCard({ card }: { card: Card }) {
  const [t, locale, vertical] = await Promise.all([
    dict().then((d) => d.card),
    currentLocale(),
    currentVertical(),
  ]);
  // English requests fall back to the Spanish title when cron:translate
  // hasn't produced titleEn yet — never render blank.
  const title = locale === "en" ? (card.titleEn ?? card.title) : card.title;
  // Thumb, not the full 1600px original: a category page renders ~20 of these
  // on Paraguayan mobile data. Falls back to the stored key for imported rows
  // that have no derivative yet (see imageThumbUrl).
  const cover = isPlaceholderPhoto(card.coverKey)
    ? null
    : imageThumbUrl(card.coverKey);
  const cuota = showCuota(vertical.key) ? formatCuota(card.cuotaGs) : null;
  const area = card.areaM2 ?? card.landM2;
  // new Date() re-wrap: cards that crossed an unstable_cache boundary carry
  // featuredUntil as an ISO string, and string > Date is silently false.
  const isFeatured =
    card.featuredUntil != null && new Date(card.featuredUntil) > new Date();

  const specs = [
    card.bedrooms != null ? t.bedroomsShort(card.bedrooms) : null,
    card.bathrooms != null ? t.bathrooms(card.bathrooms) : null,
    area ? t.area(Math.round(Number(area))) : null,
  ].filter((s): s is string => s !== null);

  if (cardVariant(vertical.key) === "framed-pill") {
    return (
      <FramedPillCard
        card={card}
        title={title}
        cover={cover}
        cuota={cuota}
        isFeatured={isFeatured}
        specs={specs}
        t={t}
      />
    );
  }

  if (cardVariant(vertical.key) === "framed-fact") {
    return (
      <FramedFactCard
        card={card}
        title={title}
        cover={cover}
        specs={specs}
        area={area}
        t={t}
      />
    );
  }

  return (
    <Link className="ds-photo-card listing-card" href={listingUrl(card)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized R2
          thumb derivative (imageThumbUrl); next/image would only add a proxy hop. */}
      <img
        className="ds-photo-card__img"
        src={cover ?? "/img/listing-fallback.webp"}
        alt={title}
        loading="lazy"
        decoding="async"
      />
      <div className="ds-photo-card__scrim" />

      <span className="ds-photo-card__chip">
        {t.operationBadge[card.operation]}
      </span>
      {/* card.isVerified is the agent/agency's admin-granted flag (attachVerified()
          in queries.ts) — never listings.is_verified, which means "publisher's
          WhatsApp passed the (currently disabled) OTP" and would be a different,
          misleading claim here (audit F57). */}
      {(card.isVerified || isFeatured) && (
        <span className="listing-card__flags">
          {card.isVerified && (
            <span className="listing-card__flag listing-card__flag--verified">
              {t.verified}
            </span>
          )}
          {isFeatured && <span className="listing-card__flag">{t.featured}</span>}
        </span>
      )}
      {!cover && (
        <span className="listing-card__nophoto">{t.noPhoto}</span>
      )}

      <div className="ds-photo-card__body">
        {/* No location line: ListingCard carries locationId, not a name, and
            resolving it here would add a query per grid. The title already
            names the barrio in practice. */}
        <div className="listing-card__title">{title}</div>
        <div className="ds-photo-card__price">{formatPrice(card)}</div>
        {(specs.length > 0 || cuota) && (
          <div className="listing-card__specs">
            {specs.map((s) => (
              <span className="listing-card__spec" key={s}>
                <span className="listing-card__tick" aria-hidden />
                {s}
              </span>
            ))}
            {cuota && (
              <span className="listing-card__spec listing-card__spec--cuota">
                {cuota}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * Nórdico card variant (guide §5 "Listing card"): a white framed card rather
 * than the photo-as-card default — hairline border, 10px radius, price/title
 * /specs block below the photo, and a pill row (green "Publicado en inglés"
 * when the listing opted into foreign exposure, "Destacada" second when
 * featured). Selected by `cardVariant()`, never by a vertical-key check.
 */
function FramedPillCard({
  card,
  title,
  cover,
  cuota,
  isFeatured,
  specs,
  t,
}: {
  card: Card;
  title: string;
  cover: string | null;
  cuota: string | null;
  isFeatured: boolean;
  specs: string[];
  t: Awaited<ReturnType<typeof dict>>["card"];
}) {
  return (
    <Link className="listing-card listing-card--framed" href={listingUrl(card)}>
      <div className="listing-card__photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized R2
            thumb derivative (imageThumbUrl); next/image would only add a proxy hop. */}
        <img
          className="listing-card__photo-img"
          src={cover ?? "/img/listing-fallback.webp"}
          alt={title}
          loading="lazy"
          decoding="async"
        />
        <span className="listing-card__badge">
          {t.operationBadge[card.operation]}
        </span>
        {!cover && (
          <span className="listing-card__nophoto listing-card__nophoto--framed">
            {t.noPhoto}
          </span>
        )}
      </div>
      <div className="listing-card__framed-body">
        <div className="ds-photo-card__price listing-card__framed-price">
          {formatPrice(card)}
        </div>
        <div className="listing-card__title listing-card__framed-title">
          {title}
        </div>
        {specs.length > 0 && (
          <div className="listing-card__specs">
            {specs.map((s) => (
              <span className="listing-card__spec" key={s}>
                <span className="listing-card__tick" aria-hidden />
                {s}
              </span>
            ))}
          </div>
        )}
        {cuota && (
          <div className="listing-card__cuota-line">{t.cuotaLine(cuota)}</div>
        )}
        {(card.isVerified || card.foreignExposure || isFeatured) && (
          <div className="listing-card__pill-row">
            {card.isVerified && (
              <span className="listing-card__pill listing-card__pill--verified">
                {t.verified}
              </span>
            )}
            {card.foreignExposure && (
              <span className="listing-card__pill listing-card__pill--foreign">
                {t.foreignPill}
              </span>
            )}
            {isFeatured && (
              <span className="listing-card__pill listing-card__pill--featured">
                {t.featuredPill}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * "Variant A, guide-first" card variant (realestateinparaguay.com guide §4
 * "Shape and surfaces" / §5 "Listing card"): a hairline-framed card, the
 * photo inset 12px inside the frame rather than flush like Nórdico's, price
 * and specs below the photo on paper (never on the scrim) with `US$/m²` and
 * `sq ft` alongside the native price and area, and never a cuota line — the
 * caller only reaches this branch when `showCuota()` is already false for
 * this vertical. No location line on the scrim (there never was one for any
 * card variant — `ListingCard`'s query type carries `locationId`, not a
 * resolved name, so there is nothing to show below the photo either; see the
 * PR description for this gap between the guide and the current query).
 */
function FramedFactCard({
  card,
  title,
  cover,
  specs,
  area,
  t,
}: {
  card: Card;
  title: string;
  cover: string | null;
  specs: string[];
  area: string | number | null;
  t: Awaited<ReturnType<typeof dict>>["card"];
}) {
  const areaNum = area != null ? Number(area) : null;
  // US$/m² is a purchase-price figure — dividing a monthly rent by area
  // would print a meaningless "rate", so this only ever shows for venta.
  const perM2 =
    card.operation === "venta" && areaNum && areaNum > 0
      ? formatUsd(Number(card.priceUsd) / areaNum, "en-US")
      : null;
  const sqft = areaNum ? formatSqft(areaNum) : null;

  return (
    <Link className="listing-card listing-card--framed-fact" href={listingUrl(card)}>
      <div className="listing-card__photo listing-card__photo--inset">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized R2
            thumb derivative (imageThumbUrl); next/image would only add a proxy hop. */}
        <img
          className="listing-card__photo-img"
          src={cover ?? "/img/listing-fallback.webp"}
          alt={title}
          loading="lazy"
          decoding="async"
        />
        <span className="listing-card__badge listing-card__badge--fact">
          {t.operationBadge[card.operation]}
        </span>
        {card.isVerified && (
          <span className="listing-card__badge listing-card__badge--fact listing-card__badge--verified">
            {t.verified}
          </span>
        )}
        {!cover && (
          <span className="listing-card__nophoto listing-card__nophoto--framed">
            {t.noPhoto}
          </span>
        )}
      </div>
      <div className="listing-card__framed-body">
        <div className="listing-card__fact-price-row">
          <span className="ds-photo-card__price listing-card__framed-price">
            {formatPrice(card, "en-US")}
          </span>
          {perM2 && (
            <span className="listing-card__fact-perm2">{t.cardPerM2(perM2)}</span>
          )}
        </div>
        <div className="listing-card__title listing-card__framed-title">
          {title}
        </div>
        {(specs.length > 0 || sqft) && (
          <div className="listing-card__specs">
            {specs.map((s) => (
              <span className="listing-card__spec" key={s}>
                <span className="listing-card__tick" aria-hidden />
                {s}
              </span>
            ))}
            {sqft && (
              <span className="listing-card__spec">
                <span className="listing-card__tick" aria-hidden />
                {sqft}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
