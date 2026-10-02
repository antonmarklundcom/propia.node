/**
 * "¿Quién sos?" on the public lead forms: who is writing, in their own words.
 *
 * Pure (no `next/*`, no drizzle) because the forms are client components and
 * share it with `/api/leads`. Not a column: the answer rides in `leads.utm`
 * under `contact_role`, stamped by the server from this enum — the same
 * mechanism every other lead marker uses (`utm.source`, `utm.agent_slug`), and
 * the reason there is no `leads.source` column. The panel's classification of
 * a lead (src/lib/contact-kind.ts) reads it together with the lead type.
 */
export const CONTACT_ROLES = ["particular", "owner", "agent", "agency", "developer"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

/** The `leads.utm` key the answer is stored under. */
export const CONTACT_ROLE_UTM_KEY = "contact_role";

export function isContactRole(v: unknown): v is ContactRole {
  return typeof v === "string" && (CONTACT_ROLES as readonly string[]).includes(v);
}
