import Link from "next/link";
import { Glyph } from "@/components/Glyph";
import { formatUsd } from "@/lib/format";
import type { ProjectCard as Card } from "@/lib/queries";
import { numberLocaleFor, type Dictionary } from "@/i18n";
import { dict, currentLocale } from "@/i18n/server";

/** Compact delivery chip alongside the stage badge. */
function deliveryLabel(
  d: string | Date | null,
  numberLocale: string,
  label: Dictionary["projectsPage"]["card"]["delivery"],
): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.toLocaleDateString(numberLocale, { month: "short" });
  return label(
    month.charAt(0).toUpperCase() + month.slice(1),
    date.getFullYear().toLocaleString(numberLocale, { useGrouping: false }),
  );
}

/** Homepage carousel / project-row card. Whole card links to /proyecto/{slug}. */
export async function ProjectCard({ card }: { card: Card }) {
  const [dictionary, locale] = await Promise.all([dict(), currentLocale()]);
  const t = dictionary.projectsPage.card;
  const numberLocale = numberLocaleFor(locale);
  const stageLabels: Record<string, string> = t.stages;
  const delivery = deliveryLabel(card.deliveryDate, numberLocale, t.delivery);
  return (
    <Link className="project-card" href={`/proyecto/${card.slug}`}>
      <div
        className={`project-card__media${card.heroImageUrl ? "" : " project-card__media--empty"}`}
      >
        {card.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="media-cover-img" src={card.heroImageUrl} alt={card.name} loading="lazy" decoding="async" />
        )}
        {card.stage && (
          <span className="project-card__badge">{stageLabels[card.stage] ?? card.stage}</span>
        )}
        {delivery && <span className="project-card__delivery">{delivery}</span>}
        {!card.heroImageUrl && (
          <span className="project-card__placeholder" aria-hidden>
            <Glyph name="building" />
          </span>
        )}
      </div>
      <div className="project-card__body">
        <div className="project-card__kicker">
          {t.project}{card.developerName ? ` · ${card.developerName}` : ""}
        </div>
        <div className="project-card__name">{card.name}</div>
        {card.minPriceUsd != null && (
          <div className="project-card__price">{t.fromPrice(formatUsd(card.minPriceUsd, numberLocale))}</div>
        )}
        <div className="project-card__meta">
          {card.availableUnits > 0 && (
            <span>{t.available(card.availableUnits.toLocaleString(numberLocale, { useGrouping: false }))}</span>
          )}
          {card.cityName && <span>{card.cityName}</span>}
        </div>
      </div>
    </Link>
  );
}
