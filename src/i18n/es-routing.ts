/**
 * Lead routing rules (plan-admin-next O3) — /admin/ajustes copy. Panel copy,
 * Spanish only like the rest of the panel. `shareNote` is the operator's note
 * on an automatic share: the partner reads it on the card in /agencia/leads.
 */
import type { ManualReason, RoutingOperation, RoutingPropertyType } from "@/lib/lead-routing-rules";

export const esRouting = {
  shareNote: "Asignada automáticamente por las reglas de reparto.",

  title: "Reparto automático de consultas",
  hint:
    "Apagado, cada consulta queda con vos y la compartís a mano desde Consultas. Encendido, una consulta nueva sobre un aviso que llega a tu bandeja se comparte sola con un socio, siguiendo estas reglas en orden. Siempre podés quitarle el acceso y compartirla con otro.",
  order: [
    "Si el aviso es de un socio, va a ese socio (si tiene consultas sin responder hace más de 24 h, queda con vos).",
    "Zona: el socio cubre el barrio o la ciudad del aviso (sin zonas = todo el país).",
    "Operación: venta, alquiler o alquiler temporal (ninguna marcada = todas).",
    "Tipo de propiedad (ninguno marcado = todos).",
    "Rango de precio en US$ (vacío = sin límite).",
    "Se salta al socio que tiene una consulta compartida sin responder hace más de 24 h.",
    "Entre los que quedan: primero el que cubre el barrio, después la ciudad, después todo el país; a igualdad, el que recibió una consulta hace más tiempo.",
  ],
  scope:
    "Solo consultas de compra, alquiler o preguntas sobre un aviso. Los reportes, tasaciones, vendedores y consultas sin aviso siguen siempre a mano.",
  enabledLabel: "Reparto automático",
  enabledBody: "Comparte solo las consultas nuevas. Las que ya están en tu bandeja no se tocan.",
  current: (on: boolean) => (on ? "Ahora: encendido." : "Ahora: apagado (todo a mano)."),

  sociosTitle: "Cobertura de cada socio",
  noSocios:
    "Todavía no tenés socios. Marcá una inmobiliaria con el plan Socio en Inmobiliarias, o un agente independiente como socio en Agentes.",
  agency: "Inmobiliaria",
  agent: "Agente independiente",
  notVerified: "Sin verificar: no puede recibir consultas hasta que lo verifiques.",
  activeLabel: "Recibe consultas automáticas",
  zonesLabel: "Zonas (ciudades y barrios)",
  zonesHint: "Ctrl/Cmd + clic para marcar varias. Sin ninguna = todo el país.",
  opsLabel: "Operaciones",
  typesLabel: "Tipos de propiedad",
  priceLabel: "Precio en US$",
  priceMin: "Desde",
  priceMax: "Hasta",
  priceInverted: "El mínimo es mayor que el máximo: esta regla nunca coincide.",
  busy: (n: number) => `${n} consulta(s) sin responder hace más de 24 h: ahora se lo saltea.`,
  lastShared: (when: string) => `Última consulta compartida: ${when}.`,
  neverShared: "Todavía no recibió consultas.",
  save: "Guardar reglas de reparto",
  saved: "Reglas de reparto guardadas.",
  invalid: "Revisá las reglas: algún valor no es válido.",

  operation: {
    venta: "Venta",
    alquiler: "Alquiler",
    alquiler_temporal: "Alquiler temporal",
  } satisfies Record<RoutingOperation, string>,
  propertyType: {
    casa: "Casa",
    departamento: "Departamento",
    terreno: "Terreno",
    duplex: "Dúplex",
    comercial: "Local comercial",
    oficina: "Oficina",
    deposito: "Depósito",
    quinta: "Quinta",
  } satisfies Record<RoutingPropertyType, string>,

  previewTitle: "Prueba con tus últimas consultas",
  previewHint:
    "Qué harían las reglas guardadas con las últimas consultas de tu bandeja, como si el reparto estuviera encendido. No comparte nada.",
  previewEmpty: "No hay consultas en tu bandeja todavía.",
  previewLead: "Consulta",
  previewListing: "Aviso",
  previewResult: "Resultado",
  previewShare: (name: string, via: string) => `Se compartiría con ${name} (${via})`,
  via: {
    owner: "es su aviso",
    barrio: "cubre el barrio",
    city: "cubre la ciudad",
    anywhere: "cubre todo el país",
  } as Record<"owner" | "barrio" | "city" | "anywhere", string>,
  manual: {
    off: "Queda con vos: reparto apagado",
    not_internal: "Ya va directo al anunciante",
    report: "Queda con vos: es un reporte",
    already_shared: "Ya está compartida",
    lead_type: "Queda con vos: no es una consulta sobre un aviso",
    no_listing: "Queda con vos: no tiene aviso",
    owner_busy: "Queda con vos: el aviso es de un socio con consultas sin responder",
    no_rules: "Queda con vos: ningún socio activo y verificado",
    no_zone: "Queda con vos: ningún socio cubre esa zona",
    no_operation: "Queda con vos: ningún socio cubre esa operación",
    no_type: "Queda con vos: ningún socio cubre ese tipo",
    no_price: "Queda con vos: ningún socio cubre ese precio",
    all_busy: "Queda con vos: los socios que coinciden tienen consultas sin responder",
    no_actor: "Queda con vos: guardá las reglas primero",
  } satisfies Record<ManualReason, string>,
};
