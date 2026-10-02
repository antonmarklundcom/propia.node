"use client";

import { useEffect, useState } from "react";
import { esTriage } from "@/i18n/es-triage";

const BOXES = 'input[name="listingIds"]';

/**
 * "Select all" for the review queue's bulk bar. The per-listing boxes are plain
 * HTML tied to the bulk form by its id (`form=` attribute, because each row
 * holds its own approve/reject forms and forms cannot nest), so this only reads
 * and writes those DOM checkboxes; with JS off the operator ticks rows by hand.
 * `hideLabel` is the table-header variant: same box, label for screen readers.
 */
export function ReviewSelectAll({ label, hideLabel = false }: { label: string; hideLabel?: boolean }) {
  return (
    <label>
      <input
        type="checkbox"
        aria-label={hideLabel ? label : undefined}
        onChange={(e) => {
          const on = e.currentTarget.checked;
          document.querySelectorAll<HTMLInputElement>(BOXES).forEach((box) => {
            box.checked = on;
            // Notify the counter: .checked set from script fires no event.
            box.dispatchEvent(new Event("change", { bubbles: true }));
          });
        }}
      />
      {hideLabel ? null : <> {label}</>}
    </label>
  );
}

/**
 * How many rows are ticked. The boxes sit outside the bulk <form> (see above),
 * so their change events never reach it: this listens on the document. The
 * copy is read here, not passed in: a server page cannot hand a client
 * component a function (`selectedMany`).
 */
export function ReviewSelectedCount() {
  const { selectedNone: none, selectedOne: one, selectedMany: many } = esTriage.review;
  const [n, setN] = useState(0);
  useEffect(() => {
    const recount = () => setN(document.querySelectorAll(`${BOXES}:checked`).length);
    document.addEventListener("change", recount);
    recount();
    return () => document.removeEventListener("change", recount);
  }, []);
  return <span className="panel-bulk__count">{n === 0 ? none : n === 1 ? one : many(n)}</span>;
}
