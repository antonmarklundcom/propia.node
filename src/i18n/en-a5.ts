/** English peer of `es-a5.ts` — see that file. */
import type { esA5 } from "./es-a5";

type Widened<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widened<R>
    : { [K in keyof T]: Widened<T[K]> };

export const enA5 = {
  joinNoticeTitle: "Listings added to this panel",
  joinNoticeBody: (agent: string, count: number) =>
    count === 1
      ? `${agent} joined the agency and their earlier listing moved to this panel:`
      : `${agent} joined the agency and their ${count} earlier listings moved to this panel:`,
  joinNoticeAgentFallback: "An agent",
  joinNoticeLeads:
    "Enquiries those listings already had stay with each listing and appear under “Consultas recibidas” (enquiries received).",
  joinNoticeMore: (count: number) => `and ${count} more`,
  joinNoticeDismiss: "Got it",
  historyAction: {
    "agent.join_agency": "Joined an agency",
  } as Record<string, string>,
  historyTargetLabel: { agency: "Agency" } as Record<string, string>,
} satisfies Widened<typeof esA5>;
