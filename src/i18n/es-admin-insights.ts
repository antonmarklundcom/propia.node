/**
 * /admin copy for two insight blocks: the database-connection and process
 * lines of "Salud del sitio" (`src/lib/runtime-health.ts`) and the evergreen
 * promotion candidates on /admin/google (`src/lib/gsc-candidates.ts`).
 * Panel copy, Spanish only like the rest of the panel (`esTriage`'s header).
 * Its own file so parallel builds don't collide in es.ts.
 */
export const esAdminInsights = {
  runtime: {
    title: "Conexiones y procesos",
    unavailable: "no disponible",
    threadsConnected: "Conexiones abiertas en el servidor MySQL",
    maxConnections: "máximo del servidor",
    userConnections: "Conexiones de este usuario de la base",
    userIdle: (n: number) => `${n} inactivas`,
    maxUserConnections: "límite por usuario",
    noUserLimit: "sin límite por usuario",
    thisProcess: "Este proceso",
    pid: "pid",
    uptime: "en marcha hace",
    pool: (limit: number, queue: number | null) =>
      queue === null ? `pool de ${limit} conexiones` : `pool de ${limit} conexiones + ${queue} en cola`,
    copies: "Copias de esta app en el servidor",
    copiesValue: (copies: number, orphaned: number, threads: number) =>
      `${copies} (${orphaned} huérfanas, PPID 1) · ${threads} hilos`,
    otherServers: (n: number) => `${n} otro(s) servidor(es) Next de esta cuenta`,
    verdict: {
      unknown: "No se pudieron leer los límites de conexión de la base.",
      ok: "Las conexiones están por debajo del 80 % de los límites.",
      userNearLimit: (used: number, max: number) =>
        `Este usuario de la base usa ${used} de ${max} conexiones permitidas: los errores "Failed query" probablemente son conexiones agotadas.`,
      serverNearLimit: (used: number, max: number) =>
        `El servidor MySQL tiene ${used} de ${max} conexiones ocupadas: los errores "Failed query" probablemente son conexiones agotadas.`,
    },
    orphans: (n: number) =>
      `${n} copia(s) huérfana(s) de la app siguen vivas; cada una mantiene su propio pool de conexiones (docs/hosting-process-cap.md).`,
  },

  candidates: {
    title: "Candidatas a página evergreen",
    intro:
      "Páginas de categoría de este dominio que Google ya muestra y que todavía no son evergreen. Las de más impresiones son las primeras candidatas a recibir contenido propio.",
    colPage: "Página",
    colQueries: "Búsquedas principales",
    none: "Ninguna: todas las páginas de categoría con impresiones ya son evergreen, o todavía no hay datos.",
    queriesUnavailable: (error: string) =>
      `No se pudieron leer las búsquedas por página (${error}); la tabla muestra solo las cifras de cada página.`,
  },
} as const;

/** "3 h 12 min", "4 min", "2 d 5 h" — for an uptime in seconds. */
export function formatUptime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
