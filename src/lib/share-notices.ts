/**
 * "A lead was shared with you" — the email (wave E1) and the Telegram message
 * (plan-agency batch 4) to the people behind a share target. One function, so
 * a share made by hand on /admin/leads and one made by the routing rules
 * (src/lib/lead-routing.ts) tell the partner exactly the same thing.
 *
 * Call it inside `after()`, once the share rows exist. Never throws: the share
 * row is the record, and an unsent notice is not an incident.
 * BRAND_NAME, not brandName(): the link points at /agencia, a panel on one host.
 */
import "server-only";
import { BRAND_NAME } from "@/lib/brand";
import { shareRecipients, type ShareTarget } from "@/lib/lead-assignments";
import { emailShareNotice } from "@/lib/lead-emails";
import { telegramShareNotice } from "@/lib/partner-alerts";

export async function sendShareNotices(p: {
  target: ShareTarget;
  leadIds: number[];
  /** Absolute URL of `/agencia/leads`, read inside the request. */
  inboxUrl: string;
}): Promise<void> {
  if (p.leadIds.length === 0) return;
  try {
    const recipients = await shareRecipients(p.target);
    await Promise.allSettled([
      ...recipients.map((r) =>
        r.email
          ? emailShareNotice({
              to: r.email,
              locale: r.locale,
              brand: BRAND_NAME,
              count: p.leadIds.length,
              url: p.inboxUrl,
            })
          : null,
      ),
      // No buyer data on Telegram — see src/lib/partner-alerts.ts.
      telegramShareNotice({ target: p.target, leadIds: p.leadIds, inboxUrl: p.inboxUrl }),
    ]);
  } catch {
    /* the share row is the record; an unsent notice is not an incident */
  }
}
