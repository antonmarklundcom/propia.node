import Link from "next/link";
import { formatPrice, formatCuota, imageThumbUrl } from "@/lib/format";
import { listingUrl } from "@/lib/urls";
import { isPlaceholderPhoto } from "@/lib/photos";
import type { Operation } from "@/lib/import/types";
import type { ListingCard as Card } from "@/lib/queries";

/** Short badge label per operation. Alquiler variants share one label. */
const OPERATION_BADGE: Record<Operation, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

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
export function ListingCard({ card }: { card: Card }) {
  // Thumb, not the full 1600px original: a category page renders ~20 of these
  // on Paraguayan mobile data. Falls back to the stored key for imported rows
  // that have no derivative yet (see imageThumbUrl).
  const cover = isPlaceholderPhoto(card.coverKey)
    ? null
    : imageThumbUrl(card.coverKey);
  const cuota = formatCuota(card.cuotaGs);
  const area = card.areaM2 ?? card.landM2;
  const isFeatured =
    card.featuredUntil != null && card.featuredUntil > new Date();

  const specs = [
    card.bedrooms != null ? `${card.bedrooms} dorm.` : null,
    card.bathrooms != null
      ? `${card.bathrooms} ${card.bathrooms === 1 ? "baño" : "baños"}`
      : null,
    area ? `${Math.round(Number(area))} m²` : null,
  ].filter((s): s is string => s !== null);

  return (
    <Link className="ds-photo-card listing-card" href={listingUrl(card)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized R2
          thumb derivative (imageThumbUrl); next/image would only add a proxy hop. */}
      <img
        className="ds-photo-card__img"
        src={cover ?? "/img/listing-fallback.webp"}
        alt={card.title}
        loading="lazy"
        decoding="async"
      />
      <div className="ds-photo-card__scrim" />

      <span className="ds-photo-card__chip">
        {OPERATION_BADGE[card.operation]}
      </span>
      {/* No "Verificado" here: listings.is_verified means "publisher's
          WhatsApp passed the (currently disabled) OTP", which is not the
          admin-granted verified badge the profile pages show (audit F57).
          The card stays silent rather than showing a flag with two meanings. */}
      {isFeatured && (
        <span className="listing-card__flags">
          <span className="listing-card__flag">Destacado</span>
        </span>
      )}
      {!cover && (
        <span className="listing-card__nophoto">Foto próximamente</span>
      )}

      <div className="ds-photo-card__body">
        {/* No location line: ListingCard carries locationId, not a name, and
            resolving it here would add a query per grid. The title already
            names the barrio in practice. */}
        <div className="listing-card__title">{card.title}</div>
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
