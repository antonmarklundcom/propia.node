/**
 * Copy for plan-build A4: the agent profile editor (/agencia/perfil), the
 * installable panel (app/manifest.ts) and the listing quality check.
 *
 * Its own file so five parallel build sessions do not collide in `es.ts`.
 * The panel is a Spanish staff surface and reads `esA4` directly, the way it
 * reads `esPanel`; the manifest is served on every door and reads it through
 * `dict()`, which is why `en-a4.ts` is a real peer and not a stub.
 */
export const esA4 = {
  manifest: {
    name: (brand: string) => `${brand} — Panel`,
    shortName: "Panel",
    description:
      "Tus avisos, tus consultas y tu perfil, a un toque desde el celular.",
  },

  profile: {
    teamPickerLabel: "Perfil a editar",
    teamPickerOwn: (name: string) => `${name} (vos)`,
    teamPickerGo: "Abrir",
    editingColleague: (name: string) =>
      `Estás editando el perfil público de ${name}.`,
    bioLabel: "Presentación",
    bioHint: (max: number) =>
      `Contá a quién ayudás y cómo trabajás. Hasta ${max} caracteres.`,
    zonesLabel: "Zonas donde trabajás",
    zonesHint: (max: number) =>
      `Elegí hasta ${max} ciudades. Nos ayuda a pasarte consultas de vendedores de esa zona.`,
    licenseLabel: "Matrícula o registro profesional",
    yearsLabel: "Años de experiencia",
    savedColleague: "Perfil del agente actualizado.",
    photoRejected:
      "La foto tiene que ser un enlace https a una imagen pública.",
    yearsRejected: "Los años de experiencia tienen que ser un número entre 0 y 70.",
    notFound: "Ese perfil no existe o no es de tu inmobiliaria.",
  },

  quality: {
    title: "Antes de enviar a revisión",
    intro:
      "Un aviso completo recibe más consultas. Lo marcado como obligatorio lo revisamos siempre; lo demás son recomendaciones.",
    required: "Obligatorio",
    recommended: "Recomendado",
    ok: "Listo",
    photos: (n: number, min: number) =>
      `Al menos ${min} fotos (ahora: ${n}).`,
    mapExact: "Ubicación exacta en el mapa.",
    mapApprox:
      "Ubicación exacta en el mapa: hoy el aviso se muestra en el centro del barrio o ciudad.",
    mapNone: "El aviso no tiene ubicación en el mapa.",
    price: "Precio y moneda.",
    area: "Superficie en m².",
    titleRequired: (min: number) => `Título de al menos ${min} caracteres.`,
    titleLength: (min: number, max: number) =>
      `Título claro, de ${min} a ${max} caracteres.`,
    description: (min: number, n: number) =>
      `Descripción de al menos ${min} caracteres (ahora: ${n}).`,
    summaryBlocked:
      "Falta algo obligatorio: así el aviso no se puede guardar.",
    summary: (warnings: number) =>
      warnings === 0
        ? "Todo en orden."
        : warnings === 1
          ? "1 recomendación pendiente. Podés enviarlo igual."
          : `${warnings} recomendaciones pendientes. Podés enviarlo igual.`,
  },
} as const;
