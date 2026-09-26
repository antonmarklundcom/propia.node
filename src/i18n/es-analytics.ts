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

  opsLabel: "Estadísticas: resumir y limpiar",
  opsDescription:
    "Resume los días completos en totales diarios y borra los eventos detallados más viejos que la retención configurada en Ajustes.",
  opsWrites: "Escribe analytics_daily y borra filas viejas de analytics_events.",
} as const;
