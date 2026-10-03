/**
 * A place's zone map: a pre-rendered WebP from `public/img/maps/` (built by
 * `npm run maps:render`, docs/plan-category-pages-build.md phase 7), never
 * drawn at request time. Server component; renders nothing when the manifest
 * has no image for the place, so a page can include it unconditionally.
 *
 * Not used by any page yet — a later PR wires it in once the place pages
 * exist. The credit under the image is the ODbL attribution: it must stay
 * visible wherever this renders.
 */
import manifestJson from "@/content/places/geo/maps-manifest.json";
import { dict, currentLocale } from "@/i18n/server";
import type { Operation, PropertyType } from "@/lib/import/types";
import {
  MAP_SIZES,
  OSM_COPYRIGHT_URL,
  lookupZoneMap,
  parseManifest,
  type ZoneMapManifest,
} from "@/lib/zone-map/manifest";

const MANIFEST = parseManifest(manifestJson);

export interface ZoneMapProps {
  citySlug: string;
  barrioSlug?: string | null;
  operation?: Operation | null;
  type?: PropertyType | null;
  /** Tests only: a manifest other than the committed one. */
  manifest?: ZoneMapManifest;
}

export default async function ZoneMap(props: ZoneMapProps) {
  const locale = await currentLocale();
  const hit = lookupZoneMap(props.manifest ?? MANIFEST, {
    citySlug: props.citySlug,
    barrioSlug: props.barrioSlug ?? null,
    operation: props.operation ?? null,
    type: props.type ?? null,
    locale,
  });
  if (!hit) return null;

  const d = await dict();
  const { entry, overlay } = hit;
  const typeLabel = props.type ? (d.category.typeLabel[props.type] ?? null) : null;
  const opLabel = props.operation ? (d.category.operationLabel[props.operation] ?? null) : null;
  const alt = d.zoneMap.alt(
    entry.name,
    entry.barrioSlug ? entry.cityName : null,
    typeLabel,
    opLabel,
  );
  const { width, height } = MAP_SIZES.w640;

  return (
    <figure className="zone-map">
      <div className="zone-map__frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP with its own srcset; next/image would re-encode it */}
        <img
          src={entry.src640}
          srcSet={`${entry.src640} 640w, ${entry.src1280} 1280w`}
          sizes="(max-width: 768px) 100vw, 640px"
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          alt={alt}
        />
        {overlay && typeLabel && opLabel ? (
          <span className="zone-map__badge">{d.zoneMap.badge(typeLabel, opLabel)}</span>
        ) : null}
      </div>
      <figcaption className="zone-map__credit">
        <a href={OSM_COPYRIGHT_URL} rel="noopener" target="_blank" title={d.zoneMap.creditTitle}>
          {d.zoneMap.credit}
        </a>
      </figcaption>
    </figure>
  );
}
