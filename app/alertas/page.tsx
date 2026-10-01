import type { Metadata } from "next";
import Link from "next/link";
import { currentLocale, dict } from "@/i18n/server";
import { getSavedSearchByToken, describeSearch, placeNames, rowCriteria } from "@/lib/saved-searches";
import { criteriaPath } from "@/lib/saved-search-criteria";
import { confirmAlertAction, unsubscribeAlertAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).savedSearch;
  // A private, tokenised page: out of the index and the sitemap.
  return { title: t.pageTitle, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

/**
 * Confirm or leave a saved search. Confirming and leaving are buttons (POST),
 * not link clicks, so a mail scanner that opens the link cannot subscribe or
 * unsubscribe anyone.
 */
export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; baja?: string }>;
}) {
  const [{ token, baja }, t, locale] = await Promise.all([
    searchParams,
    dict().then((d) => d.savedSearch),
    currentLocale(),
  ]);

  const row = token ? await getSavedSearchByToken(token) : null;
  const criteria = row ? rowCriteria(row) : null;

  let body: React.ReactNode;
  if (baja) {
    body = (
      <>
        <h1 className="auth-card__title">{t.removedTitle}</h1>
        <p className="auth-note">{t.removedBody}</p>
      </>
    );
  } else if (!row || !criteria) {
    body = (
      <>
        <h1 className="auth-card__title">{t.notFoundTitle}</h1>
        <p className="auth-note">{t.notFoundBody}</p>
      </>
    );
  } else {
    const summary = describeSearch(criteria, locale, await placeNames(criteria));
    body = (
      <>
        <h1 className="auth-card__title">{row.confirmedAt ? t.confirmedTitle : t.confirmTitle}</h1>
        <p className="auth-note">{row.confirmedAt ? t.confirmedBody : t.confirmBody(summary)}</p>
        {!row.confirmedAt && (
          <form action={confirmAlertAction}>
            <input type="hidden" name="token" value={row.token} />
            <button className="auth-submit" type="submit">{t.confirmButton}</button>
          </form>
        )}
        <p>
          <Link href={criteriaPath(criteria)}>{t.seeSearch}</Link>
        </p>
        <form action={unsubscribeAlertAction}>
          <input type="hidden" name="token" value={row.token} />
          <button className="panel-btn" type="submit">{t.unsubscribeButton}</button>
        </form>
      </>
    );
  }

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">{body}</div>
      </div>
    </main>
  );
}
