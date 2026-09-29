/**
 * Featured-placement expiry reminders: a published listing whose
 * `featured_until` falls inside the next `FEATURED_REMIND_DAYS` gets one email
 * to whoever runs it — the private owner, else the listing agent, else the
 * agency's own address (`featuredRecipient()`).
 *
 * One pass, the same in both modes (AGENTS.md §4): select the due listings,
 * drop those already reminded for this end date, resolve each recipient. A
 * real run then sends and records; a dry run stops before the send and says
 * how many it would. "Already reminded" is an `admin_events` row
 * (`listing.featured_reminder`, detail `{ until }`) written **only after
 * Cloudflare accepted the email** — a failed send is retried on the next run,
 * at the price that a crash between the send and the record could repeat one
 * email. No new table, no migration.
 *
 * Scheduled once a day from the hourly tick (`src/lib/cron-tick.ts`); also
 * `npm run cron:featured-reminders` and a card on /admin/operaciones. Nothing
 * a visitor reads changes, so there is no cache tag.
 */
import "server-only";
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { CANONICAL_HOST } from "@/config/verticals";
import { db } from "@/db";
import { adminEvents, agencies, agents, listings, users } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { BRAND_NAME } from "@/lib/brand";
import { isEmailConfigured } from "@/lib/email";
import {
  FEATURED_REMIND_DAYS,
  featuredDaysLeft,
  featuredRecipient,
  featuredReminderDue,
  featuredReminderKey,
} from "@/lib/featured-reminders";
import { emailFeaturedEnding } from "@/lib/listing-emails";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

const DEFAULT_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function runFeaturedReminders(opts: OpsOptions): Promise<OpsResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid limit '${opts.limit}'`);

  return opsRun("cron:featured-reminders", opts.dry, async (out) => {
    out.track("por_terminar", opts.dry ? "por_avisar" : "avisados", "ya_avisados", "sin_email", "fallidos");
    out.note(`window ${FEATURED_REMIND_DAYS} days`);

    const now = new Date();
    const horizon = new Date(now.getTime() + FEATURED_REMIND_DAYS * DAY_MS);
    const ownerUser = alias(users, "owner_user");
    const agentUser = alias(users, "agent_user");

    const due = await db
      .select({
        id: listings.id,
        title: listings.title,
        titleEn: listings.titleEn,
        featuredUntil: listings.featuredUntil,
        ownerEmail: ownerUser.email,
        ownerLocale: ownerUser.locale,
        agentEmail: agentUser.email,
        agentLocale: agentUser.locale,
        agencyEmail: agencies.email,
      })
      .from(listings)
      .leftJoin(ownerUser, eq(ownerUser.id, listings.ownerUserId))
      .leftJoin(agents, eq(agents.id, listings.agentId))
      .leftJoin(agentUser, eq(agentUser.id, agents.userId))
      .leftJoin(agencies, eq(agencies.id, listings.agencyId))
      .where(
        and(
          eq(listings.status, "published"),
          gt(listings.featuredUntil, now),
          lte(listings.featuredUntil, horizon),
        ),
      )
      .limit(limit);

    const rows = due.filter((r) => featuredReminderDue(r.featuredUntil, now));
    out.count("por_terminar", rows.length);
    if (rows.length === 0) return;

    if (!opts.dry && !isEmailConfigured()) {
      out.note("email is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN): nothing sent.");
      return;
    }

    // Already reminded for this end date? The ledger is admin_events.
    const ids = rows.map((r) => r.id);
    const past = await db
      .select({ targetId: adminEvents.targetId, detail: adminEvents.detailJson })
      .from(adminEvents)
      .where(
        and(
          eq(adminEvents.action, "listing.featured_reminder"),
          eq(adminEvents.targetType, "listing"),
          inArray(adminEvents.targetId, ids),
        ),
      );
    const reminded = new Set<string>();
    for (const e of past) {
      // JSON columns come back as strings on MariaDB.
      let detail: unknown = e.detail;
      if (typeof detail === "string") {
        try {
          detail = JSON.parse(detail);
        } catch {
          detail = null;
        }
      }
      const until = (detail as { until?: unknown } | null)?.until;
      if (typeof until === "string") reminded.add(`${e.targetId}|${until}`);
    }

    const origin = `https://${CANONICAL_HOST}`;
    for (const r of rows) {
      const until = r.featuredUntil as Date;
      const key = featuredReminderKey(until);
      if (reminded.has(`${r.id}|${key}`)) {
        out.count("ya_avisados");
        continue;
      }
      const to = featuredRecipient({
        ownerEmail: r.ownerEmail,
        agentEmail: r.agentEmail,
        agencyEmail: r.agencyEmail,
      });
      if (!to) {
        out.count("sin_email");
        continue;
      }
      if (opts.dry) {
        out.count("por_avisar"); // exactly what a real run would send
        continue;
      }

      const locale = (to.kind === "owner" ? r.ownerLocale : to.kind === "agent" ? r.agentLocale : null) ?? "es";
      const result = await emailFeaturedEnding({
        to: to.email,
        locale,
        brand: BRAND_NAME,
        listingTitle: locale === "en" ? (r.titleEn ?? r.title) : r.title,
        daysLeft: featuredDaysLeft(until, now),
        url: `${origin}${to.kind === "owner" ? "/mis-avisos" : "/agencia"}`,
      });
      if (result.sent) {
        await recordAdminEvent(0, "listing.featured_reminder", "listing", r.id, { until: key, to: to.kind });
        out.count("avisados");
      } else {
        out.count("fallidos");
        out.note(`listing #${r.id}: not sent (${result.error ?? "unknown"})`);
      }
    }
    if (opts.dry) out.note("--dry: nothing sent, nothing recorded.");
  });
}
