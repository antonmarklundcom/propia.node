/**
 * Which button a lead came through (plan-admin-next O9). Today one value:
 * `whatsapp`, a lead saved by the contact form when "Pedir datos antes de
 * WhatsApp" is on (/admin/ajustes) and the visitor is then sent to WhatsApp.
 *
 * Stored as `leads.utm.channel` — no column, same as `contact_role`
 * (src/lib/contact-role.ts) — and stamped by /api/leads from the validated
 * enum only: a client-sent `channel` utm key is dropped, so the count in
 * /admin/analitica means what it says. Pure: shared by the route and the
 * panel readers.
 */
export const LEAD_CHANNELS = ["whatsapp"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];
export const LEAD_CHANNEL_UTM_KEY = "channel";

export function withLeadChannel(
  utm: Record<string, string> | undefined,
  channel: LeadChannel | undefined,
): Record<string, string> | undefined {
  const rest = Object.fromEntries(Object.entries(utm ?? {}).filter(([k]) => k !== LEAD_CHANNEL_UTM_KEY));
  if (channel) rest[LEAD_CHANNEL_UTM_KEY] = channel;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

/** The stamped channel of a stored `leads.utm` (a string on MariaDB), or null. */
export function leadChannelOf(utm: unknown): LeadChannel | null {
  let v = utm;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  const c = v && typeof v === "object" ? (v as Record<string, unknown>)[LEAD_CHANNEL_UTM_KEY] : null;
  return (LEAD_CHANNELS as readonly unknown[]).includes(c) ? (c as LeadChannel) : null;
}
