/**
 * Duplicate listings (plan-admin-next O5) — /admin copy, Spanish only like the
 * rest of the panels. The visitor-facing lines are `listing.alsoListed*` in
 * es.ts / en.ts.
 */
export const esDuplicates = {
  title: "Duplicados",
  hint: "Si otro anunciante publicó la misma propiedad, uní los avisos. El primero que la publicó conserva el lugar en los listados; los demás siguen online, apuntan a ese aviso (canonical) y todos muestran «También publicado por». Si el primero se da de baja, el siguiente toma su lugar solo.",
  refLabel: "Es la misma propiedad que (código o enlace del otro aviso)",
  refPlaceholder: "AB12CD34EF o https://…/propiedad/…",
  mark: "Unir como duplicado",
  groupTitle: "Mismo inmueble",
  primary: "Ocupa el lugar",
  hidden: "Oculto en listados",
  notPublished: "No publicado",
  thisOne: "este aviso",
  remove: "Quitar del grupo",
  saved: "Duplicados actualizados.",
  removed: "Aviso quitado del grupo.",
  badRef: "No encontramos ese aviso. Pegá su código (10 letras y números) o su enlace.",
  same: "Ese es este mismo aviso.",
  owner: "Particular",
  none: "Sin anunciante",
};
