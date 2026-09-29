/**
 * /admin/proyectos: which developments are approved for Che Róga Porã.
 * Panel copy, Spanish only like the rest of the panel, in its own file so
 * parallel builds don't collide in es.ts.
 *
 * Nothing here states a rate, a term or an eligibility rule: those live in
 * `financing_programs`, and whether a development is approved is the
 * operator's call, made from the programme's own paperwork.
 */
export const esProjects = {
  tab: "Proyectos",
  metaTitle: "Proyectos y Che Róga Porã",
  title: "Proyectos y Che Róga Porã",
  intro:
    "Che Róga Porã se aprueba por desarrollo, no por portal. Por eso está apagado en todo el sitio. Marcá acá un proyecto solo si tenés su aprobación: los avisos de venta de ESE proyecto pasan a cotizar la cuota con el programa; el resto no cambia.",
  empty: "Todavía no hay proyectos cargados.",
  programMissing:
    "El programa Che Róga Porã no está cargado en esta base: marcarlo no cambia nada hasta que corras «Cargar programas de financiación» en Operaciones.",
  head: ["Proyecto", "Desarrollador", "Tipo", "Avisos en venta", "Che Róga Porã", ""],
  approved: "Aprobado",
  notApproved: "No aprobado",
  approve: "Marcar como aprobado",
  revoke: "Quitar la aprobación",
  approveConfirmNote:
    "Al guardar, las cuotas de sus avisos se recalculan de inmediato. Marcalo solo con la aprobación del programa a la vista.",
  types: {
    edificio: "Edificio",
    loteamiento: "Loteamiento",
    condominio: "Condominio",
    barrio_cerrado: "Barrio cerrado",
  } as Record<string, string>,
  flash: {
    approved: (name: string, changed: number) =>
      `«${name}» quedó aprobado para Che Róga Porã. ${changed === 1 ? "1 aviso cambió" : `${changed} avisos cambiaron`} de cuota.`,
    revoked: (name: string, changed: number) =>
      `Se quitó la aprobación de «${name}». ${changed === 1 ? "1 aviso cambió" : `${changed} avisos cambiaron`} de cuota.`,
    notFound: "Ese proyecto no existe.",
    invalid: "Datos inválidos.",
  },
  targetLabel: { project: "Proyecto" } as Record<string, string>,
  historyAction: {
    "project.che_roga": "Cambió la aprobación de Che Róga Porã de un proyecto",
  } as Record<string, string>,
} as const;
