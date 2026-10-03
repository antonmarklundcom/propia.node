/**
 * Approved reviews on an agency or agent profile (plan-admin-next O7).
 * Founder decision: the full reviews on the directory door, the stars and the
 * count only on the marketplace doors. Nothing renders without an approved
 * review. Server component; the data comes from `publicReviews()`.
 */
import type { Dictionary } from "@/i18n";
import type { PublicReviews } from "@/lib/reviews";
import { formatRating } from "@/lib/review-token";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="reviews__stars" aria-hidden>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export function ProfileReviews({
  data,
  full,
  t,
  numberLocale,
}: {
  data: PublicReviews | null;
  full: boolean;
  t: Dictionary["review"];
  numberLocale: string;
}) {
  if (!data) return null;
  const avg = formatRating(data.average, numberLocale);
  const summary = (
    <p className="reviews__summary" data-reviews-summary="">
      <Stars value={data.average} />
      <span aria-label={t.starsAria(avg)}>{t.summary(avg, data.count)}</span>
    </p>
  );
  if (!full) return <div className="reviews reviews--compact">{summary}</div>;
  return (
    <section className="reviews" id="resenas" data-reviews-full="">
      <h2 className="similar-listings__title">{t.sectionTitle}</h2>
      {summary}
      <ul className="reviews__list">
        {data.items.map((r) => (
          <li key={r.id} className="reviews__item">
            <p className="reviews__meta">
              <Stars value={r.rating} /> <strong>{r.authorName}</strong> ·{" "}
              {new Date(r.createdAt).toLocaleDateString(numberLocale, { month: "long", year: "numeric" })}
            </p>
            {r.body ? <p>{r.body}</p> : null}
          </li>
        ))}
      </ul>
      <p className="reviews__note">{t.verifiedNote}</p>
    </section>
  );
}
