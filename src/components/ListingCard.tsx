import Link from "next/link";
import { formatPrice, formatCuota, imageUrl } from "@/lib/format";
import { listingUrl } from "@/lib/urls";
import type { Operation, PropertyType } from "@/lib/import/types";
import type { ListingCard as Card } from "@/lib/queries";

/** Short badge label per operation. Alquiler variants share the amber badge. */
const OPERATION_BADGE: Record<Operation, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

/** Icon shown on the "photo coming soon" placeholder, per property type. */
const TYPE_ICON: Record<PropertyType, string> = {
  casa: "🏠",
  departamento: "🏢",
  terreno: "🌳",
  duplex: "🏘",
  comercial: "🏬",
  oficina: "🏢",
  deposito: "🏭",
  quinta: "🌳",
};

/**
 * INTERIM: the demo dataset seeds random picsum.photos covers that have
 * nothing to do with the property (vans, bridges, fruit). Treat those as
 * "no real photo" and fall through to the branded placeholder instead of
 * showing misleading stock. Real R2 covers (any non-picsum key) render
 * normally. Remove this guard once real photos are imported.
 */
function realCover(coverKey: string | null): string | null {
  if (!coverKey) return null;
  if (/picsum\.photos/i.test(coverKey)) return null;
  return imageUrl(coverKey);
}

/**
 * Category-grid / homepage card. The whole card is a single <Link> to the
 * listing detail page. Visual hierarchy: photo → price (loudest) → cuota
 * accent → title → a specs row separated by a hairline rule. Cuota is the
 * differentiator, so it gets the amber chip when we have it cached.
 */
export function ListingCard({ card }: { card: Card }) {
  const cover = realCover(card.coverKey);
  const cuota = formatCuota(card.cuotaGs);
  const area = card.areaM2 ?? card.landM2;
  const isAlquiler = card.operation !== "venta";

  const specs = [
    card.bedrooms != null
      ? { icon: "🛏", label: `${card.bedrooms} dorm` }
      : null,
    card.bathrooms != null
      ? { icon: "🚿", label: `${card.bathrooms} ${card.bathrooms === 1 ? "baño" : "baños"}` }
      : null,
    area ? { icon: "📐", label: `${Math.round(Number(area))} m²` } : null,
  ].filter((s): s is { icon: string; label: string } => s !== null);

  return (
    <Link className="listing-card" href={listingUrl(card)}>
      <div
        className={`listing-card__media ${cover ? "listing-card__media--photo" : "listing-card__media--empty"}`}
        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
        role="img"
        aria-label={card.title}
      >
        <span
          className={`listing-card__badge${isAlquiler ? " listing-card__badge--alquiler" : ""}`}
        >
          {OPERATION_BADGE[card.operation]}
        </span>
        {!cover && (
          <>
            <span className="listing-card__placeholder-icon" aria-hidden>
              {TYPE_ICON[card.propertyType]}
            </span>
            <span className="listing-card__placeholder-label">
              Foto próximamente
            </span>
          </>
        )}
      </div>

      <div className="listing-card__body">
        <div className="listing-card__price">{formatPrice(card)}</div>
        {cuota && <div className="listing-card__cuota">💳 {cuota}</div>}
        <div className="listing-card__title">{card.title}</div>

        {specs.length > 0 && (
          <div className="listing-card__specs">
            {specs.map((s) => (
              <span className="listing-card__spec" key={s.label}>
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
