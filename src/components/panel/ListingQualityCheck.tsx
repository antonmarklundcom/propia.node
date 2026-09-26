"use client";

import { useEffect, useRef, useState } from "react";
import { esA4 } from "@/i18n/es-a4";
import {
  QUALITY_RULES,
  countWarnings,
  listingQualityChecks,
  type MapPosition,
  type QualityInput,
  type QualityItem,
} from "@/lib/listing-quality";
import styles from "./a4.module.css";

type FormFields = Pick<
  QualityInput,
  "title" | "description" | "priceAmount" | "propertyType" | "areaM2" | "landM2"
>;

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Read the fields the check needs from the enclosing ListingForm. */
function readForm(form: HTMLFormElement): FormFields {
  const data = new FormData(form);
  return {
    title: String(data.get("title") ?? ""),
    description: String(data.get("descriptionEs") ?? ""),
    priceAmount: numberOrNull(data.get("priceAmount")) ?? 0,
    propertyType: String(data.get("propertyType") ?? ""),
    areaM2: numberOrNull(data.get("areaM2")),
    landM2: numberOrNull(data.get("landM2")),
  };
}

function itemText(item: QualityItem, photoCount: number, map: MapPosition, description: string): string {
  const t = esA4.quality;
  const r = QUALITY_RULES;
  switch (item.key) {
    case "title":
      return item.level === "block"
        ? t.titleRequired(r.titleHardMin)
        : t.titleLength(r.titleMin, r.titleMax);
    case "price":
      return t.price;
    case "photos":
      return t.photos(photoCount, r.minPhotos);
    case "map":
      return map === "exact" ? t.mapExact : map === "approx" ? t.mapApprox : t.mapNone;
    case "area":
      return t.area;
    case "description":
      return t.description(r.descriptionMin, description.trim().length);
  }
}

const MARK = { pass: "✓", warn: "!", block: "✕" } as const;

/**
 * The pre-submit checklist (plan-build A4, Agency 10), rendered inside
 * ListingForm right above the save button. It re-reads the enclosing form on
 * every input, so it tracks what the agent is typing rather than what was
 * saved. Photo count and map position come from the server — neither is a
 * field of this form.
 *
 * Advisory: it never disables the button. The two `block` items are the ones
 * the save refuses anyway (see src/lib/listing-quality.ts).
 */
export function ListingQualityCheck({
  photoCount,
  map,
  initial,
}: {
  photoCount: number;
  map: MapPosition;
  initial: FormFields;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<FormFields>(initial);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const update = () => setFields(readForm(form));
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  const items = listingQualityChecks({ ...fields, photoCount, map });
  const warnings = countWarnings(items);
  const t = esA4.quality;

  return (
    <div ref={ref} className={styles.quality} aria-live="polite">
      <h3 className={styles.qualityTitle}>{t.title}</h3>
      <p className="panel-card__meta">{t.intro}</p>
      <ul className={styles.qualityList}>
        {items.map((item) => (
          <li key={item.key} className={`${styles.qualityItem} ${styles[item.level]}`}>
            <span className={styles.qualityMark} aria-hidden="true">
              {MARK[item.level]}
            </span>
            <span>
              {itemText(item, photoCount, map, fields.description)}
              <span className={styles.qualityTag}>
                {item.level === "pass" ? t.ok : item.level === "block" ? t.required : t.recommended}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.qualitySummary}>
        {items.some((i) => i.level === "block") ? t.summaryBlocked : t.summary(warnings)}
      </p>
    </div>
  );
}
