import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { loadInvite } from "@/lib/reviews";
import { submitReviewAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).review;
  // A personal link: never indexed, never in a sitemap.
  return { title: t.metaTitle, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

/**
 * A buyer's review of the agency or agent that handled their enquiry
 * (plan-admin-next O7). Reached only through the signed link the operator
 * sends from /admin/leads; the review is stored as pending and shows on the
 * profile once the operator approves it.
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; enviada?: string; error?: string }>;
}) {
  const t = (await dict()).review;
  const { t: token = "", enviada, error } = await searchParams;
  const invite = await loadInvite(token);

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card review-card">
          {invite.state === "used" ? (
            <p className="panel-flash" role="status" data-review-state={enviada ? "thanks" : "used"}>
              {enviada ? t.thanks : t.used(invite.target.name)}
            </p>
          ) : invite.state === "expired" ? (
            <p className="auth-error" data-review-state="expired">{t.expired}</p>
          ) : invite.state === "invalid" ? (
            <p className="auth-error" data-review-state="invalid">{t.invalid}</p>
          ) : (
            <>
              <h1 className="auth-card__title">{t.title(invite.target.name)}</h1>
              <p className="auth-card__subtitle">{t.intro}</p>
              {error === "form" ? (
                <p className="auth-error">{t.invalidForm}</p>
              ) : error === "limit" ? (
                <p className="auth-error">{t.rateLimited}</p>
              ) : null}
              <form action={submitReviewAction} data-review-form="">
                <input type="hidden" name="t" value={token} />
                <fieldset className="review-stars">
                  <legend className="auth-field__label">{t.ratingLabel}</legend>
                  {/* Highest first in the markup; CSS shows them left to right as 1…5. */}
                  {[5, 4, 3, 2, 1].map((n) => (
                    <label key={n} className="review-stars__star" title={t.starLabel(n)}>
                      <input type="radio" name="rating" value={n} required aria-label={t.starLabel(n)} />
                      <span aria-hidden>★</span>
                    </label>
                  ))}
                </fieldset>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="authorName">
                    {t.nameLabel}
                  </label>
                  <input
                    className="auth-field__input"
                    id="authorName"
                    name="authorName"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder={t.namePlaceholder}
                    defaultValue={invite.buyerName?.trim().split(/\s+/)[0] ?? ""}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="body">
                    {t.bodyLabel}
                  </label>
                  <textarea
                    className="auth-field__input"
                    id="body"
                    name="body"
                    rows={5}
                    maxLength={2000}
                    placeholder={t.bodyPlaceholder}
                  />
                </div>
                <button className="auth-submit" type="submit">
                  {t.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
