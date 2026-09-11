/**
 * The responsive `<picture>` for the hand-curated photography in
 * `public/img/premium/` (docs/imagery-prompts.md).
 *
 * Those files are produced by `webimg`, which emits exactly this markup: one
 * AVIF `srcset` and one WebP `srcset` at 640/1280/1920, with the 1280 WebP as
 * the `<img src>` fallback. Every consumer names a *slug*, never a path, so
 * regenerating an image is `webimg convert --name <slug>` overwriting the six
 * files in place — no code change, which is why the slugs were fixed before
 * the real photographs existed.
 *
 * Not `next/image`: these are static assets already emitted at three widths in
 * two modern formats, so the optimizer would only re-encode what webimg has
 * already done — and every route here is dynamic, so there is no build-time
 * pass to amortise it against.
 *
 * Server component, no client code. Deliberately no `width`/`height`: every
 * slot is sized by CSS with a fixed height (the hero, the about photo, the
 * zone tiles), so there is no layout shift for the attributes to prevent, and
 * an intrinsic size on an `object-fit: cover` element only invites a wrong
 * aspect ratio.
 */
const PREMIUM_IMG = "/img/premium";

const WIDTHS = [640, 1280, 1920] as const;

function srcSet(slug: string, ext: "avif" | "webp"): string {
  return WIDTHS.map((w) => `${PREMIUM_IMG}/${slug}-${w}.${ext} ${w}w`).join(
    ", ",
  );
}

export function Picture({
  slug,
  alt,
  className,
  priority,
  sizes = "100vw",
}: {
  slug: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(slug, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(slug, "webp")} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${PREMIUM_IMG}/${slug}-1280.webp`}
        alt={alt}
        className={className}
        decoding="async"
        {...(priority
          ? { fetchPriority: "high" as const }
          : { loading: "lazy" as const })}
      />
    </picture>
  );
}
