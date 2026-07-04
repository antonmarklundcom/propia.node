import Link from "next/link";
import { tokens } from "@/design/tokens";
import { formatPrice, formatCuota, imageUrl } from "@/lib/format";
import { listingUrl } from "@/lib/urls";
import type { ListingCard as Card } from "@/lib/queries";

/** Category-grid card. Cuota line is the differentiator — show it when cached. */
export function ListingCard({ card }: { card: Card }) {
  const cover = imageUrl(card.coverKey);
  const cuota = formatCuota(card.cuotaGs);
  const area = card.areaM2 ?? card.landM2;

  return (
    <Link
      href={listingUrl(card)}
      style={{
        display: "block",
        background: tokens.color.surface,
        borderRadius: tokens.radius.card,
        overflow: "hidden",
        textDecoration: "none",
        color: tokens.color.ink,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 3",
          background: cover ? `#eee url(${cover}) center/cover` : "#e3e6e2",
        }}
      />
      <div style={{ padding: "0.75rem" }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{formatPrice(card)}</div>
        {cuota && (
          <div style={{ color: tokens.color.accent, fontWeight: 600, fontSize: 13 }}>
            {cuota}
          </div>
        )}
        <div
          style={{
            fontSize: 14,
            color: tokens.color.ink,
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {card.title}
        </div>
        <div style={{ fontSize: 13, color: tokens.color.inkSecondary, marginTop: 4 }}>
          {[
            card.bedrooms != null ? `${card.bedrooms} dorm` : null,
            card.bathrooms != null ? `${card.bathrooms} baño` : null,
            area ? `${Math.round(Number(area))} m²` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </Link>
  );
}
