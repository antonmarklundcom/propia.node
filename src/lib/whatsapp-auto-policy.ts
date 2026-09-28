/**
 * The WhatsApp auto-responder's rules, pure — every decision it makes is a
 * function of the state passed in, so `npm run verify:whatsapp` can walk each
 * rule without a database, a clock or a model. `src/lib/whatsapp-auto.ts`
 * gathers that state and carries the decision out.
 *
 * Conservative by construction (founder policy questions in
 * docs/decisions-needed.md):
 *
 * - Both switches ship **off**.
 * - The AI never speaks after a person has replied to that customer, never
 *   more than once per contact per `cooldownHours`, and never twice after a
 *   hand-off.
 * - Price negotiation, legal/document matters and complaints never reach the
 *   model: a keyword check hands them to a person first, and the model's own
 *   "not confident" flag hands off everything else it cannot answer.
 * - The greeting goes once per contact per 12 hours at most — on the first
 *   message ever, or when the office is closed.
 */

export const ASUNCION_TZ = "America/Asuncion";
/** A greeting is not repeated to the same contact within this many hours. */
export const GREETING_COOLDOWN_HOURS = 12;
export const AI_COOLDOWN_DEFAULT_HOURS = 12;
export const AI_COOLDOWN_MIN_HOURS = 1;
export const AI_COOLDOWN_MAX_HOURS = 168;

/* -------------------------------------------------------------------------- */
/* Office hours                                                                */
/* -------------------------------------------------------------------------- */

/** `[open, close]` as "HH:MM" local Asunción time, or null = closed that day. */
export type DayHours = [string, string] | null;

export interface OfficeHours {
  weekdays: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export const OFFICE_HOURS_DEFAULT: OfficeHours = {
  weekdays: ["08:00", "18:00"],
  saturday: ["08:00", "12:00"],
  sunday: null,
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validDay(v: unknown): DayHours | undefined {
  if (v === null) return null;
  if (Array.isArray(v) && v.length === 2 && HHMM.test(String(v[0])) && HHMM.test(String(v[1])) && String(v[0]) < String(v[1])) {
    return [String(v[0]), String(v[1])];
  }
  return undefined;
}

/** The stored JSON, or the default for anything malformed. */
export function parseOfficeHours(raw: string | undefined | null): OfficeHours {
  if (!raw) return OFFICE_HOURS_DEFAULT;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const weekdays = validDay(o.weekdays);
    const saturday = validDay(o.saturday);
    const sunday = validDay(o.sunday);
    if (weekdays === undefined || saturday === undefined || sunday === undefined) return OFFICE_HOURS_DEFAULT;
    return { weekdays, saturday, sunday };
  } catch {
    return OFFICE_HOURS_DEFAULT;
  }
}

/** From the /admin/ajustes form: both times or neither per day; null = invalid. */
export function officeHoursFromForm(f: {
  weekdaysOpen: string;
  weekdaysClose: string;
  saturdayOpen: string;
  saturdayClose: string;
  sundayOpen: string;
  sundayClose: string;
}): OfficeHours | null {
  const day = (open: string, close: string): DayHours | undefined => {
    const o = open.trim();
    const c = close.trim();
    if (!o && !c) return null;
    return validDay([o, c]);
  };
  const weekdays = day(f.weekdaysOpen, f.weekdaysClose);
  const saturday = day(f.saturdayOpen, f.saturdayClose);
  const sunday = day(f.sundayOpen, f.sundayClose);
  if (weekdays === undefined || saturday === undefined || sunday === undefined) return null;
  return { weekdays, saturday, sunday };
}

/** Weekday (0 = Sunday) and "HH:MM" of an instant, in Asunción. */
export function asuncionClock(at: Date): { weekday: number; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ASUNCION_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, hhmm: `${get("hour")}:${get("minute")}` };
}

export function isOfficeOpen(hours: OfficeHours, at: Date): boolean {
  const { weekday, hhmm } = asuncionClock(at);
  const day = weekday === 0 ? hours.sunday : weekday === 6 ? hours.saturday : hours.weekdays;
  return !!day && hhmm >= day[0] && hhmm < day[1];
}

/** "lunes a viernes 08:00–18:00, sábados 08:00–12:00" — for the greeting. */
export function describeOfficeHours(
  hours: OfficeHours,
  words: { weekdays: string; saturday: string; sunday: string; separator: string },
): string {
  const parts: string[] = [];
  if (hours.weekdays) parts.push(`${words.weekdays} ${hours.weekdays[0]}–${hours.weekdays[1]}`);
  if (hours.saturday) parts.push(`${words.saturday} ${hours.saturday[0]}–${hours.saturday[1]}`);
  if (hours.sunday) parts.push(`${words.sunday} ${hours.sunday[0]}–${hours.sunday[1]}`);
  return parts.join(words.separator);
}

export function parseCooldownHours(raw: string | undefined | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= AI_COOLDOWN_MIN_HOURS && n <= AI_COOLDOWN_MAX_HOURS ? n : AI_COOLDOWN_DEFAULT_HOURS;
}

/* -------------------------------------------------------------------------- */
/* Hand-off topics                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Words that mean a person must answer: negotiating the price, anything legal
 * or about documents and taxes, complaints. Accent- and case-insensitive,
 * whole words. Deliberately broad — a false hand-off costs a few minutes of
 * the operator's time; a false AI answer on a contract costs trust.
 */
const HANDOFF_PATTERNS: RegExp[] = [
  // price negotiation
  /\b(descuento|rebaja|rebajar|negociar|negociable|negociacion|ultimo precio|precio final|mejor precio|contraoferta|oferta|ofrezco|te doy|le doy|financiacion propia|en cuotas)\b/,
  /\b(discount|negotia\w*|best price|final price|counter ?offer|lowest price|offer)\b/,
  // legal, documents, taxes
  /\b(abogad\w*|escribano|escribania|escritura|titulo de propiedad|contrato|legal|juicio|demanda|denuncia|herencia|sucesion|impuesto\w*|catastro|hipoteca|embargo|garantia)\b/,
  /\b(lawyer|attorney|notary|deed|title deed|contract|lawsuit|sue|tax\w*|mortgage|lien|inheritance|legal)\b/,
  // complaints
  /\b(reclamo|reclamar|queja|quejarme|estafa|estafador\w*|fraude|enganado|enganaron|mentira|pesimo|verguenza|devolucion|reembolso)\b/,
  /\b(complain\w*|scam|fraud|refund|terrible|disgrace|cheated|lied)\b/,
];

/** Lower case, accents removed — "Escribanía" and "escribania" are one word. */
export function foldText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function needsHumanHandoff(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = foldText(text);
  return HANDOFF_PATTERNS.some((re) => re.test(t));
}

/* -------------------------------------------------------------------------- */
/* The decision                                                                */
/* -------------------------------------------------------------------------- */

export interface AutoState {
  now: Date;
  greetingEnabled: boolean;
  aiEnabled: boolean;
  /** An AI provider key is set (`isAiReplyEnabled()`). */
  aiConfigured: boolean;
  officeOpen: boolean;
  /** This contact had never written before. */
  firstContact: boolean;
  /** The latest inbound message's text, if any (a photo may have none). */
  text: string | null;
  /** A person ever replied to this contact (any outbound with a user). */
  humanReplied: boolean;
  lastAiAt: Date | null;
  lastGreetingAt: Date | null;
  /** A hand-off message was already sent to this contact. */
  handoffSent: boolean;
  cooldownHours: number;
}

export type AutoDecision =
  | { action: "ai" }
  | { action: "handoff"; reason: "topic" }
  | { action: "greeting"; kind: "first" | "closed" }
  | { action: "none"; reason: string };

function hoursSince(d: Date | null, now: Date): number {
  return d ? (now.getTime() - d.getTime()) / 3_600_000 : Infinity;
}

/**
 * What to send, if anything, after one inbound message. The AI path is tried
 * first when it is allowed; the static greeting is the fallback. A hand-off
 * decided here is the keyword path — the model's own low-confidence hand-off
 * is decided after its draft comes back (`whatsapp-auto.ts`).
 */
export function decideAutoAction(s: AutoState): AutoDecision {
  const aiAllowed =
    s.aiEnabled &&
    s.aiConfigured &&
    !!s.text?.trim() &&
    !s.humanReplied &&
    !s.handoffSent &&
    hoursSince(s.lastAiAt, s.now) >= s.cooldownHours;

  if (aiAllowed) {
    if (needsHumanHandoff(s.text)) return { action: "handoff", reason: "topic" };
    return { action: "ai" };
  }

  if (s.greetingEnabled && !s.humanReplied && hoursSince(s.lastGreetingAt, s.now) >= GREETING_COOLDOWN_HOURS) {
    if (s.firstContact) return { action: "greeting", kind: "first" };
    if (!s.officeOpen) return { action: "greeting", kind: "closed" };
  }

  if (!s.aiEnabled && !s.greetingEnabled) return { action: "none", reason: "off" };
  if (s.humanReplied) return { action: "none", reason: "human_replied" };
  return { action: "none", reason: "limits" };
}
