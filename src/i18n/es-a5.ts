/**
 * Build A5 (bug 6): an independent agent's listings move into the agency they
 * join. The one-time /agencia notice that says what moved, and the /admin
 * history labels for the event. Its own file so parallel builds don't collide
 * in es.ts; `en-a5.ts` is its peer.
 */
export const esA5 = {
  joinNoticeTitle: "Avisos que se sumaron al panel",
  joinNoticeBody: (agent: string, count: number) =>
    count === 1
      ? `${agent} se unió a la inmobiliaria y su aviso anterior pasó a este panel:`
      : `${agent} se unió a la inmobiliaria y sus ${count} avisos anteriores pasaron a este panel:`,
  joinNoticeAgentFallback: "Un agente",
  joinNoticeLeads:
    "Las consultas que ya tenían esos avisos siguen con cada aviso y aparecen en «Consultas recibidas».",
  joinNoticeMore: (count: number) => `y ${count} más`,
  joinNoticeDismiss: "Entendido",
  historyAction: {
    "agent.join_agency": "Se unió a una inmobiliaria",
  } as Record<string, string>,
  historyTargetLabel: { agency: "Inmobiliaria" } as Record<string, string>,
} as const;
