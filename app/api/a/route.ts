/**
 * The analytics beacon (docs/plan-agency-2026-09-26.md batch 5): a handful of
 * page views and WhatsApp clicks from one visit, sent by
 * `src/components/AnalyticsBeacon.tsx` when the tab is hidden or ten events
 * have queued — about one request per visit, not one per page.
 *
 * Nothing here touches the database: events go into the in-memory buffer in
 * `src/lib/analytics.ts`, which writes them in batches. Always 204, so a
 * malformed or rate-limited beacon costs the visitor nothing either.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import { currentVertical } from "@/lib/vertical-context";

const beaconSchema = z.object({
  events: z
    .array(
      z.object({
        e: z.enum(["pv", "wa"]),
        p: z.string().max(2000),
        r: z.string().max(2000).optional(),
        us: z.string().max(200).optional(),
        um: z.string().max(200).optional(),
        uc: z.string().max(200).optional(),
      }),
    )
    .max(20),
});

/**
 * Per IP, counted in EVENTS, not requests: a request carries up to 20, so a
 * request budget let one address write 1 200 rows a minute — and fake
 * `wa_click`s on a /propiedad path land in the partners' WhatsApp-click
 * column. A real visit is about one request of ten events; 120 leaves room
 * for several visitors behind one carrier NAT.
 */
const BEACON_MAX_EVENTS = 120;
/** And in requests, checked before the body is read, so a flood costs no parsing. */
const BEACON_MAX_REQUESTS = 60;
const BEACON_WINDOW_MS = 60_000;

const noContent = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (!allowRequest(`beacon|${ip}`, BEACON_MAX_REQUESTS, BEACON_WINDOW_MS)) return noContent();

  let parsed: z.infer<typeof beaconSchema>;
  try {
    const text = await req.text();
    if (text.length > 64_000) return noContent();
    parsed = beaconSchema.parse(JSON.parse(text));
  } catch {
    return noContent();
  }

  const vertical = (await currentVertical()).key;
  const userAgent = req.headers.get("user-agent");
  const ownHost = req.headers.get("host");
  for (const ev of parsed.events) {
    if (!allowRequest(`beacon-ev|${ip}`, BEACON_MAX_EVENTS, BEACON_WINDOW_MS)) break;
    recordAnalyticsEvent({
      event: ev.e === "wa" ? "wa_click" : "page_view",
      path: ev.p,
      vertical,
      ip,
      userAgent,
      referrer: ev.r ?? null,
      ownHost,
      utm: { source: ev.us, medium: ev.um, campaign: ev.uc },
    });
  }
  return noContent();
}
