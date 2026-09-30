"use client";

/**
 * "Select all" for the review queue's bulk bar. The per-listing boxes are plain
 * HTML tied to the bulk form by its id (`form=` attribute, because each card
 * holds its own approve/reject forms and forms cannot nest), so this only reads
 * and writes those DOM checkboxes; with JS off the operator ticks rows by hand.
 */
export function ReviewSelectAll({ label }: { label: string }) {
  return (
    <label>
      <input
        type="checkbox"
        onChange={(e) => {
          const on = e.currentTarget.checked;
          document
            .querySelectorAll<HTMLInputElement>('input[name="listingIds"]')
            .forEach((box) => {
              box.checked = on;
            });
        }}
      />{" "}
      {label}
    </label>
  );
}
