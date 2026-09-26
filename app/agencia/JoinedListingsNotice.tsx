import { cookies } from "next/headers";
import { dict } from "@/i18n/server";
import { listAgencyJoinEvents } from "@/lib/admin-events";
import { listAgencyListingTitles } from "@/lib/team-queries";
import { dismissJoinNoticeAction } from "./actions";
import { JOIN_NOTICE_COOKIE, parseSeenId } from "./join-notice";

/** How many titles per join before "and N more". */
const MAX_TITLES = 8;

/**
 * Bug 6: when an independent agent joins this agency, their earlier listings
 * move in with them (team-queries.ts, moveIndependentListingsToAgency). This
 * says so once, to everyone in the agency panel, read from admin_events.
 */
export async function JoinedListingsNotice({ agencyId }: { agencyId: number }) {
  const jar = await cookies();
  const seen = parseSeenId(jar.get(JOIN_NOTICE_COOKIE)?.value);
  const events = await listAgencyJoinEvents({ agencyId, afterId: seen });
  if (events.length === 0) return null;

  const withTitles = await Promise.all(
    events.map(async (e) => ({
      ...e,
      titles: await listAgencyListingTitles(agencyId, e.listingIds),
    })),
  );
  const visible = withTitles.filter((e) => e.titles.length > 0);
  if (visible.length === 0) return null;

  const t = (await dict()).agentJoin;
  return (
    <section className="panel-flash" aria-labelledby="join-notice-title">
      <strong id="join-notice-title">{t.joinNoticeTitle}</strong>
      {visible.map((e) => (
        <div key={e.id}>
          <p>{t.joinNoticeBody(e.agentName ?? t.joinNoticeAgentFallback, e.titles.length)}</p>
          <ul>
            {e.titles.slice(0, MAX_TITLES).map((l) => (
              <li key={l.id}>{l.title}</li>
            ))}
            {e.titles.length > MAX_TITLES ? (
              <li>{t.joinNoticeMore(e.titles.length - MAX_TITLES)}</li>
            ) : null}
          </ul>
        </div>
      ))}
      <p>{t.joinNoticeLeads}</p>
      <form action={dismissJoinNoticeAction}>
        <input type="hidden" name="seen" value={events[0].id} />
        <button className="panel-btn" type="submit">
          {t.joinNoticeDismiss}
        </button>
      </form>
    </section>
  );
}
