import { headers } from "next/headers";
import { UNDER_CONSTRUCTION, isInternalPath } from "@/config/site-status";
import { brandName } from "@/lib/brand-server";
import { dict } from "@/i18n/server";

/**
 * Standing pre-launch disclosure, above the header on every public page.
 *
 * Not dismissible on purpose: a visitor who dismisses it and then reads a
 * sample listing as a real offer is exactly the outcome the notice exists to
 * prevent. It costs one strip of vertical space until launch day. On a phone
 * that strip is `short` (one line, same two facts) instead of the label and the
 * full sentence, which took about 130 px above the header at 390 px.
 *
 * `role="status"` rather than `alert` — this is standing context, not a
 * response to something the visitor just did, so it should not interrupt a
 * screen reader mid-sentence.
 */
export async function SiteNotice() {
  if (!UNDER_CONSTRUCTION) return null;
  const pathname = (await headers()).get("x-pathname");
  if (isInternalPath(pathname)) return null;
  const [brand, d] = await Promise.all([brandName(), dict()]);
  const t = d.siteNotice;

  return (
    <div className="site-notice" role="status">
      <p className="site-notice__inner site-notice__inner--full">
        <strong className="site-notice__label">{t.label}</strong>
        <span>{t.body(brand)}</span>
      </p>
      <p className="site-notice__inner site-notice__inner--short">{t.short}</p>
    </div>
  );
}
