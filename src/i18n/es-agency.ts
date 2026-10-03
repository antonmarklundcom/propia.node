/**
 * Agency mode (docs/plan-agency-2026-09-26.md batch 3): the /admin/ajustes
 * page and its history labels. Admin copy, Spanish only like the rest of the
 * panel (`fable/KNOWN-ISSUES.md`, "Panel and owner copy is Spanish-only"). Its
 * own file so parallel builds don't collide in es.ts.
 */
export const esAgency = {
  tab: "Ajustes",
  title: "Ajustes del sitio",
  saved: "Guardado. El sitio ya usa el ajuste nuevo.",
  invalid: "Revisá los valores e intentá de nuevo.",

  modeTitle: "Modelo de negocio",
  modeHint:
    "Cambia lo que ve el público en todas las puertas. Se puede volver atrás en cualquier momento, pero conviene no alternar seguido: Google ve páginas que aparecen y desaparecen.",
  modeMarketplace: "Portal abierto",
  modeMarketplaceBody:
    "Cualquiera publica en /publicar. La consulta de un aviso va directo a quien lo publicó (agente, inmobiliaria o dueño).",
  modeAgency: "Inmobiliaria (vos + socios)",
  modeAgencyBody:
    "Toda consulta te llega a vos y la compartís con un socio desde Consultas. Los avisos no muestran el nombre ni el número de quien los publicó. /publicar queda solo para socios y el equipo; el público va a /vender. Se ocultan /para-inmobiliarias, /planes y el enlace «Crear cuenta».",
  modeCurrent: (label: string) => `Ahora: ${label}`,

  checksTitle: "Antes de activar el modo inmobiliaria",
  checkWhatsappMissing:
    "NEXT_PUBLIC_CONTACT_WHATSAPP no está configurado en hPanel: los avisos no mostrarán botón de WhatsApp, solo el formulario (que igual te llega).",
  checkWhatsappOk: (n: string) => `Los botones de WhatsApp van a tu número: ${n}.`,
  checkLegal:
    "Confirmá con un asesor local si cobrar comisión requiere licencia o empresa registrada (decisión D1).",
  checkCopy:
    "Algunos textos públicos siguen diciendo «No somos una inmobiliaria» y «contacto directo, sin intermediarios». Su redacción nueva es tuya: ver docs/decisions-needed.md.",
  checkPrivacy:
    "Firmá la frase de privacidad para compartir consultas con socios (pendiente desde el 25-09).",

  analyticsTitle: "Estadísticas propias",
  analyticsDaysLabel: "Días que se guardan los eventos detallados",
  analyticsDaysHint:
    "Entre 30 y 3650. Los totales por día se guardan siempre. 365 ocupa unos 90 MB por año con 1 000 visitas diarias.",

  save: "Guardar",

  install: {
    metaTitle: "Instalá la app",
    title: "El panel como app en tu teléfono",
    intro:
      "Consultas, consultas compartidas, correo de cada consulta, tus avisos y tu perfil — en un ícono de tu pantalla de inicio. No hace falta Play Store ni App Store.",
    installed: "Ya estás usando la app instalada.",
    installButton: "Instalar la app",
    androidTitle: "Android (Chrome)",
    androidSteps: [
      "Abrí este enlace en Chrome.",
      "Tocá «Instalar la app» arriba, o el menú ⋮ → «Instalar app» / «Agregar a la pantalla principal».",
      "Abrila desde el ícono nuevo en tu pantalla.",
    ],
    iosTitle: "iPhone (Safari)",
    iosSteps: [
      "Abrí este enlace en Safari (en otro navegador no aparece la opción).",
      "Tocá Compartir (el cuadrado con la flecha hacia arriba).",
      "Elegí «Agregar a inicio» y confirmá con «Agregar».",
    ],
    alerts:
      "Los avisos de consultas nuevas te llegan por WhatsApp o correo cuando el portal te comparte una; las alertas por Telegram se activan en tu perfil cuando estén disponibles.",
    profileLink: "Instalá el panel como app en tu teléfono →",
  },

  historyAction: {
    "setting.change": "Cambió un ajuste",
    "agency.invite": "Invitó a un socio",
    "agency.invite_revoke": "Anuló una invitación de socio",
    "listing.exclusive": "Cambió la exclusiva de un aviso",
  } as Record<string, string>,
  historyTargetLabel: { setting: "Ajuste" } as Record<string, string>,
} as const;
