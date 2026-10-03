/**
 * WhatsApp taps and "Pedir datos antes de WhatsApp" (plan-admin-next O9) —
 * panel copy, Spanish only like the rest of the panels. The public form's copy
 * is `contactForm.waGate*` in es.ts / en.ts.
 */
export const esWaGate = {
  settingsTitle: "WhatsApp en los avisos",
  settingsHint:
    "Encendido, los botones de WhatsApp de cada aviso llevan primero al formulario: el visitante deja nombre y teléfono, la consulta se guarda (con el aviso y el anunciante) y recién ahí se abre WhatsApp con el mensaje listo. Apagado, el botón abre WhatsApp directo y solo se cuenta el toque.",
  settingsLabel: "Pedir datos antes de abrir WhatsApp",
  settingsTradeoff:
    "Pedir datos hace que algunos visitantes no sigan. Probalo unas semanas y compará consultas y toques en Analítica.",
  current: (on: boolean) => (on ? "Ahora: encendido." : "Ahora: apagado (WhatsApp directo)."),
  save: "Guardar",
  saved: "Guardado.",

  /** /agencia dashboard: taps on the agency's and the member's own profile. */
  profileTaps: (agency: number | null, own: number | null) =>
    [
      agency != null ? `${agency.toLocaleString("es-PY")} en el perfil de la inmobiliaria` : null,
      own != null ? `${own.toLocaleString("es-PY")} en tu perfil de agente` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  profileTapsLabel: "Toques de WhatsApp en perfiles (30 días)",

  /** /admin/analitica table. */
  publisherTitle: "WhatsApp por anunciante",
  publisherHint:
    "Toques del botón de WhatsApp en los avisos de cada anunciante y en su perfil, y consultas que llegaron por el formulario de WhatsApp (cuando «Pedir datos» está encendido). Un toque es intención, no prueba de que escribió.",
  publisherHead: ["Anunciante", "Tipo", "Toques en avisos", "Toques en el perfil", "Consultas vía WhatsApp"],
  kind: { agency: "Inmobiliaria", agent: "Agente", owner: "Particular", none: "Sin anunciante" } as Record<string, string>,
  publisherEmpty: "Sin toques de WhatsApp en el período.",
  leadChannel: "Llegó por el botón de WhatsApp",
};
