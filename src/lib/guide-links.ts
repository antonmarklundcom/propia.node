/**
 * Internal links between the guides (`posts`, written in /admin) and the
 * evergreen category pages (`src/content/evergreen/`), both ways.
 *
 * Guides carry no city or topic tags, so relatedness is read from the words:
 * a guide that names the page's city, its property type or its operation is
 * related to it. Only a positive score links — a page with no related guide
 * shows no block rather than a list of unrelated ones, and a guide links only
 * to evergreen pages of the door serving it (the ones indexable there).
 *
 * Pure: no `next/*`, no drizzle, so `verify:seo` drives it.
 */
import type { EvergreenPage } from "../content/evergreen/types";
import { flatten, TREE } from "./ops/location-tree";

/** Lower case, accents and punctuation out: "Asunción," → "asuncion". */
export function normText(s: string): string {
  return ` ${s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

const TYPE_WORDS: Record<string, readonly string[]> = {
  casas: ["casa", "casas", "house", "houses", "home", "homes", "chalet"],
  departamentos: ["departamento", "departamentos", "depto", "dpto", "monoambiente", "apartment", "apartments", "condo", "flat"],
  terrenos: ["terreno", "terrenos", "lote", "lotes", "loteamiento", "loteamientos", "land", "lot", "lots", "plot"],
  duplex: ["duplex"],
};

const OPERATION_WORDS: Record<string, readonly string[]> = {
  venta: ["comprar", "compra", "compras", "venta", "vender", "escritura", "hipoteca", "credito", "buy", "buying", "purchase", "mortgage", "deed", "sale"],
  alquiler: ["alquiler", "alquilar", "alquileres", "inquilino", "garante", "garantia", "contrato", "rent", "renting", "rental", "lease", "tenant", "landlord"],
  "alquiler-temporal": ["temporal", "temporario", "estadia", "short", "stay", "furnished", "amoblado", "amueblado"],
};

const has = (text: string, words: readonly string[]) => words.some((w) => text.includes(` ${w} `));

/** City (or barrio) display names by slug, from the location tree. */
const PLACE_NAME = new Map(flatten(TREE, "").map((n) => [n.slug, n.name] as const));

interface PageTerms {
  places: string[];
  type: string | null;
  operation: string;
}

/** What an evergreen path is about, from its segments. */
export function pageTerms(path: string): PageTerms {
  const [operation, ...rest] = path.split("/").filter(Boolean);
  const type = rest.length > 1 && TYPE_WORDS[rest[rest.length - 1]] ? rest[rest.length - 1] : null;
  const placeSlugs = type ? rest.slice(0, -1) : rest;
  const places = placeSlugs.map((slug) => PLACE_NAME.get(slug) ?? slug.replace(/-/g, " "));
  return { places, type, operation };
}

/**
 * How related a text is to a page: its place (barrio first, then city)
 * weighs most, then the type, then the operation. 0 = unrelated.
 */
export function relatedness(text: string, path: string): number {
  const t = normText(text);
  const { places, type, operation } = pageTerms(path);
  let score = 0;
  // Asunción's name is everywhere in guides about Paraguay; it counts, but
  // less than a smaller place named on purpose.
  for (const place of places) {
    if (t.includes(normText(place))) score += normText(place) === " asuncion " ? 2 : 4;
  }
  if (type && has(t, TYPE_WORDS[type])) score += 2;
  if (has(t, OPERATION_WORDS[operation] ?? [])) score += 1;
  return score;
}

export interface GuideCard {
  slug: string;
  title: string;
  excerpt: string;
}

/** Guides for an evergreen page: best first, at most `limit`, score > 1. */
export function guidesForPage<G extends GuideCard>(path: string, guides: readonly G[], limit = 3): G[] {
  return guides
    .map((g, i) => ({ g, i, s: relatedness(`${g.title} ${g.excerpt}`, path) }))
    // A bare operation word ("comprar") alone relates every guide to every
    // venta page; ask for more than that.
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.g);
}

/** Evergreen pages for a guide's text, among the serving door's pages. */
export function pagesForGuide(text: string, pages: readonly EvergreenPage[], limit = 4): EvergreenPage[] {
  return pages
    .map((p, i) => ({ p, i, s: relatedness(text, p.path) }))
    .filter((x) => x.s > 2)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}
