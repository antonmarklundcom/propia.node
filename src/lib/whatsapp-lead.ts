/**
 * Shared, pure half of "Registrar consulta de WhatsApp" (/admin/leads): the
 * `utm.source` marker and the form state the server action and the client
 * form agree on. No `next/*`, no drizzle — the form is a client component.
 */

/**
 * `utm.source` on a lead the operator logged by hand from a WhatsApp chat,
 * with `utm.medium = "manual"`. There is no `leads.source` column, on purpose
 * (CLAUDE.md): the marker is the marker, like `vender` or `email:inbox`.
 */
export const WHATSAPP_MANUAL_SOURCE = "whatsapp";

export interface WhatsappLeadState {
  ok: boolean;
  /** The confirmation or error line, already in the panel's language. */
  message: string | null;
  /** Changes on every submit, so the form remounts with `values`. */
  nonce: number;
  /** What was typed, returned on an error so a typo does not wipe the form. */
  values?: {
    whatsapp: string;
    name: string;
    ref: string;
    message: string;
    leadType: string;
    vertical: string;
  };
}

export const WHATSAPP_LEAD_INITIAL: WhatsappLeadState = {
  ok: false,
  message: null,
  nonce: 0,
};
