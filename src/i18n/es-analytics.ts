/**
 * First-party analytics (docs/plan-agency-2026-09-26.md batch 5): the
 * /admin/analitica page and its operations job. Admin copy, Spanish only like
 * the rest of the panel. Its own file so parallel builds don't collide in es.ts.
 */
export const esAnalytics = {
  tab: "Estadísticas",
  title: "Estadísticas del sitio",
  intro:
    "Propias, sin Google ni cookies. Visitantes = personas distintas por día (se suman los días). Los robots no cuentan. Los números de hoy se actualizan cada minuto.",
  rangeLabel: "Período",
  ranges: { "7": "7 días", "30": "30 días", "90": "90 días" } as Record<string, string>,
  siteLabel: "Sitio",
  allSites: "Todos",
  apply: "Ver",
  empty: "Todavía no hay visitas registradas en este período.",

  summaryTitle: "Resumen por sitio",
  summaryHead: ["Sitio", "Visitantes", "Páginas vistas", "Vistas de avisos", "Clics en WhatsApp", "Consultas por formulario", "WhatsApp / visitantes"],
  totalRow: "Total",

  funnelTitle: "Del visitante al contacto",
  funnelSteps: ["Visitantes", "Vieron un aviso", "Clic en WhatsApp", "Consulta por formulario"],
  funnelNote:
    "Un clic en WhatsApp no garantiza que la conversación ocurrió; la consulta por formulario sí quedó guardada.",

  dailyTitle: "Por día",
  dailyHead: ["Día", "Visitantes", "Páginas vistas", "WhatsApp", "Formulario"],

  pagesTitle: "Páginas más vistas",
  pagesHead: ["Página", "Vistas"],
  listingsTitle: "Avisos con más interés",
  listingsHead: ["Aviso", "Vistas", "WhatsApp", "Formulario"],
  listingRemoved: (id: string) => `Aviso #${id} (ya no existe)`,
  sourcesTitle: "De dónde llegan",
  sourcesHead: ["Origen", "Visitantes"],
  direct: "Directo / sin origen",
  utmSourcesTitle: "Fuente de campaña (utm_source)",
  campaignsTitle: "Campaña (utm_campaign)",
  campaignsHead: ["Valor", "Visitantes", "WhatsApp", "Formulario"],
  devicesTitle: "Dispositivos",
  devicesHead: ["Dispositivo", "Visitantes"],
  devices: { mobile: "Celular", tablet: "Tablet", desktop: "Computadora" } as Record<string, string>,

  vitalsTitle: "Velocidad (visitantes reales)",
  vitalsIntro:
    "Lo que tardaron las páginas en los celulares y computadoras de los visitantes, últimos 7 días. Se muestra el percentil 75: tres de cada cuatro visitas fueron así de rápidas o más. Verde, ámbar y rojo son los límites que usa Google.",
  vitalsDevices: { mobile: "Celular", desktop: "Computadora" } as Record<string, string>,
  vitalsPageHead: "Tipo de página",
  vitalsSamplesHead: "Mediciones",
  vitalsMetrics: {
    LCP: "Carga del contenido principal (LCP)",
    INP: "Respuesta al tocar (INP)",
    CLS: "Saltos de la página (CLS)",
    FCP: "Primer contenido (FCP)",
    TTFB: "Respuesta del servidor (TTFB)",
  } as Record<string, string>,
  vitalsPageTypes: {
    home: "Inicio",
    listing: "Aviso (/propiedad)",
    category: "Categoría",
    hub: "Venta / alquiler (portada)",
    guide: "Guía",
    other: "Otras",
  } as Record<string, string>,
  vitalsRatings: { good: "Bien", "needs-improvement": "Mejorable", poor: "Lento" } as Record<string, string>,
  vitalsEmpty: "Todavía no hay mediciones de velocidad en los últimos 7 días.",
  vitalsMissing:
    "Migración 0020 pendiente: la tabla web_vitals todavía no existe en esta base de datos. Correr npm run db:migrate para empezar a medir.",

  opsLabel: "Estadísticas: resumir y limpiar",
  opsDescription:
    "Resume los días completos en totales diarios y borra los eventos detallados y las mediciones de velocidad más viejos que la retención configurada en Ajustes.",
  opsWrites: "Escribe analytics_daily y borra filas viejas de analytics_events y web_vitals.",
} as const;
