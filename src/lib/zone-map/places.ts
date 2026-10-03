/**
 * The places zone maps are made for: every ciudad in `location-tree.ts` with
 * its barrios, plus the departamento it sits in (the area its boundary is
 * searched inside). Pure.
 */
import { TREE, flatten, type FlatNode } from "../ops/location-tree";
import type { TreePlace } from "./overpass";

export interface CityPlace extends TreePlace {
  /** The departamento's name, or null for a ciudad at the top of the tree (Asunción). */
  parentName: string | null;
  barrios: TreePlace[];
}

function toPlace(n: FlatNode): TreePlace {
  return { name: n.name, slug: n.slug, lat: n.lat, lng: n.lng };
}

export function zoneMapCities(nodes: FlatNode[] = flatten(TREE, "")): CityPlace[] {
  const byFull = new Map(nodes.map((n) => [n.fullSlug, n] as const));
  return nodes
    .filter((n) => n.level === "ciudad")
    .map((c) => {
      const parent = c.parentFullSlug ? byFull.get(c.parentFullSlug) : undefined;
      return {
        ...toPlace(c),
        parentName: parent && parent.level === "departamento" ? parent.name : null,
        barrios: nodes.filter((b) => b.level === "barrio" && b.parentFullSlug === c.fullSlug).map(toPlace),
      };
    });
}
