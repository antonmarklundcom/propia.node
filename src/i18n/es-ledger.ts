/**
 * Partner lead ledger + commission suggestion (plan-admin-next O2) —
 * /admin/negocios/socios. Panel copy, Spanish only like the rest of /admin.
 */
import type { LedgerSource } from "@/lib/partner-ledger";

export const esLedger = {
  metaTitle: "Socios — consultas y negocios",
  link: "Consultas por socio",
  title: "Consultas y negocios por socio",
  hint:
    "Todo lo que cada socio recibió del sitio: las consultas que les compartiste (a mano o por las reglas de reparto) y las que llegaron directo a sus propios avisos, con su respuesta y el negocio. Las sumas son de lo que escribiste en cada negocio.",
  attributionNote:
    "Una consulta de un aviso se atribuye al socio dueño del aviso hoy: si el aviso cambió de inmobiliaria, sus consultas viejas se mueven con él.",
  empty:
    "Todavía no tenés socios. Marcá una inmobiliaria con el plan Socio en Inmobiliarias, o un agente independiente como socio en Agentes.",
  head: [
    "Socio",
    "Compartidas",
    "De sus avisos",
    "Compradores / inquilinos",
    "Vendedores / dueños",
    "Sin responder",
    "Tomadas",
    "Rechazadas",
    "Negocios",
    "Ganados",
    "Perdidos",
    "Tu parte ganada (US$)",
    "Reparto habitual",
  ],
  agency: "Inmobiliaria",
  agent: "Agente",
  unverified: "sin verificar",
  splitNone: "—",
  split: (commission: string, mine: string) => `${commission} % · tu parte ${mine} %`,

  termsTitle: "Reparto habitual (sugerencia)",
  termsHint:
    "Se propone en el bloque «Negocio» de cada consulta de este socio, solo en los campos vacíos. No se guarda en ningún negocio hasta que lo guardes vos, y lo podés cambiar en cada uno: tu contrato con cada socio es el que vale.",
  commissionPct: "Comisión total (%)",
  mySharePct: "Tu parte de la comisión (%)",
  note: "Nota (contrato, excepciones)",
  save: "Guardar reparto",
  saved: "Reparto guardado.",
  invalid: "Revisá los porcentajes: entre 0 y 100, hasta 2 decimales.",
  updated: (when: string) => `Última edición: ${when}.`,

  detailTitle: (name: string) => `Consultas de ${name}`,
  back: "← Todos los socios",
  detailEmpty: "Este socio todavía no recibió consultas.",
  detailHead: ["Fecha", "Origen", "Consulta", "Aviso", "Respuesta", "Estado", "Negocio", "Tu parte (US$)"],
  source: {
    share: "Compartida",
    listing: "Su aviso",
  } satisfies Record<LedgerSource, string>,
  revoked: "(acceso quitado)",
  limitNote: (n: number) => `Se muestran las ${n} más recientes.`,
  leadStatus: { new: "Nueva", contacted: "Contactada", closed: "Cerrada", spam: "Spam" } as Record<string, string>,
  shareState: {
    pending: "Sin responder",
    accepted: "La tomó",
    declined: "No puede",
    contacted: "Ya lo contactó",
    closed: "Cerrada",
  } as Record<string, string>,
  leadType: {
    buyer: "Compra",
    renter: "Alquiler",
    seller: "Vende",
    valuation: "Tasación",
    developer: "Desarrolladora",
    agent_signup: "Alta de agente",
    landlord: "Dueño que alquila",
    question: "Pregunta",
  } as Record<string, string>,

  suggestionFor: (name: string) => `Sugerido del reparto habitual con ${name}: revisalo antes de guardar.`,
};
