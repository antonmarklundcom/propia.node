/**
 * Branded link-preview images (og:image) — the renderer behind
 * `app/api/og/listing/[publicId]/route.tsx` and `app/api/og/door/route.tsx`.
 *
 * Links here are shared mostly on WhatsApp, which shows og:image as the
 * preview. A photo, the price and the door's own brand get a link tapped; a
 * bare URL does not.
 *
 * **Route handlers, not `opengraph-image.tsx` files.** A file-based image is a
 * route Next may prerender once per build — no Host header at build time — and
 * it would then carry one door's brand to every domain. A route handler that
 * reads the Host header (through `currentVertical()` / `siteOrigin()`, the same
 * helpers every page uses) renders the brand the crawler actually asked for.
 *
 * **Built for Hostinger shared hosting**, where every thread counts against
 * the account's 200-process cap:
 *  - one render at a time per process (`renderSerially`), and a small cap on
 *    requests in flight (`MAX_IN_FLIGHT`) — past it the answer is a 503 with
 *    Retry-After, not a queue that grows under a crawler storm;
 *  - a per-IP allowance through the shared `allowRequest()` limiter;
 *  - one font file, already installed (`@fontsource/ibm-plex-sans`, the only
 *    font package that ships `.woff` — the renderer cannot read woff2);
 *  - Sharp pinned to one thread, as `src/lib/images.ts` does;
 *  - a day-long public Cache-Control, so a crawler or CDN asks once.
 *
 * **Text is filtered to what the font can draw** (`ogText`). The renderer
 * fetches a fallback font from a third-party font service for any glyph the
 * loaded font lacks, and emoji from a CDN; a listing title with an emoji or a
 * Guaraní nasal (ỹ, g̃) would otherwise make this server call out to one on
 * the request path.
 */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { fetchUserBuffer } from "./safe-fetch";
import { isPlaceholderPhoto } from "./photos";
import { imageUrl } from "./format";
import { allowRequest } from "./rate-limit";
import { clientIpFrom } from "./client-ip";
import { OG_IMAGE_SIZE } from "./og-urls";
import { themeFor } from "@/design/themes";
import type { VerticalKey } from "@/config/verticals";

// Same pin as src/lib/images.ts: Hostinger counts every libvips thread.
sharp.concurrency(1);

const { width: W, height: H } = OG_IMAGE_SIZE;

/* ------------------------------------------------------------------ text */

/**
 * Characters the bundled Latin subset is known to carry: printable ASCII,
 * Latin-1 (minus the soft hyphen) and a handful of typographic marks.
 */
const DRAWABLE = /^[\x20-\x7E¡-¬®-ÿ–—‘’“”•…€]$/;

/**
 * Reduce a string to characters the font draws: accented letters outside
 * Latin-1 lose their accent (ỹ → y), everything else undrawable (emoji,
 * combining marks with no precomposed form, other scripts) is dropped, and
 * whitespace collapses. Never returns a character that would send the
 * renderer to fetch a font.
 */
export function ogText(input: string): string {
  let out = "";
  for (const ch of input.normalize("NFC")) {
    if (DRAWABLE.test(ch)) {
      out += ch;
    } else if (/\s/u.test(ch)) {
      out += " ";
    } else {
      const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
      if (base && [...base].every((c) => DRAWABLE.test(c))) out += base;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Hard cap before layout: the renderer clamps lines, this bounds the work. */
export function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------------ font */

const FONT_NAME = "OgSans";
const FONT_FILE = join(
  process.cwd(),
  "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff",
);

let fontOnce: Promise<Buffer | null> | null = null;

/**
 * Read once per process. A missing file degrades to the renderer's own
 * bundled default (Latin, regular weight) rather than failing the image — the
 * `ogText` filter keeps that default inside its coverage too.
 */
function loadFont(): Promise<Buffer | null> {
  fontOnce ??= readFile(FONT_FILE).catch(() => null);
  return fontOnce;
}

/* ---------------------------------------------------------------- photos */

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TIMEOUT_MS = 4_000;
/** The ten demo photos `seed:sample-photos` points listings at (#186). */
const SAMPLE_PATH = /^\/img\/sample\/listings\/[a-z0-9-]+\.webp$/;

/**
 * The cover photo's bytes, or null for "use the branded background". Never
 * throws: no photo, a placeholder, an unreachable host, a timeout and an
 * oversized file all end in the same fallback.
 *
 * A demo photo is read from this app's own `public/` rather than fetched: the
 * listing stores an absolute URL on one of our own domains, and a request from
 * this server to itself would cost a second worker for a file on local disk.
 * Everything else goes through `safe-fetch` (public addresses only, pinned
 * DNS, streaming byte cap), with a deadline short enough for a crawler.
 */
export async function loadCoverPhoto(coverKey: string | null): Promise<Buffer | null> {
  if (isPlaceholderPhoto(coverKey)) return null;
  const url = imageUrl(coverKey);
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const path = new URL(url).pathname;
    if (SAMPLE_PATH.test(path)) {
      const local = await readFile(join(process.cwd(), "public", path)).catch(() => null);
      if (local) return local;
    }
  } catch {
    return null;
  }
  try {
    return await fetchUserBuffer(url, MAX_PHOTO_BYTES, { timeoutMs: PHOTO_TIMEOUT_MS });
  } catch {
    return null;
  }
}

interface RawImage {
  data: Buffer;
  info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
}

/**
 * Photo → 1200×630 raw pixels, cropped to fill. Sharp reads whatever the
 * source was (WebP, AVIF, HEIC, a 4000-px phone JPEG), and anything that is
 * not really an image fails here and falls back to the branded background
 * instead of breaking the card.
 *
 * The photo never goes through the SVG renderer: it is composited under the
 * rendered text layer by Sharp (`renderOgImage`). Embedding it in the SVG
 * made resvg decode and paint a full-size photo on every render — measured
 * at roughly two thirds of a listing card's CPU time.
 */
async function decodeCover(bytes: Buffer | null): Promise<RawImage | null> {
  if (!bytes) return null;
  try {
    const { data, info } = await sharp(bytes, { failOn: "error", limitInputPixels: 50_000_000 })
      .rotate()
      .resize(W, H, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, info: { width: info.width, height: info.height, channels: info.channels } };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------ load shedding */

/** Requests past the rate limit / capacity checks, including photo fetches. */
const MAX_IN_FLIGHT = 4;
let inFlight = 0;
/** The tail of the one-at-a-time render chain. */
let renderTail: Promise<unknown> = Promise.resolve();

const PER_IP_MAX = 40;
const PER_IP_WINDOW_MS = 5 * 60_000;

function refusal(status: 429 | 503, retryAfter: number): Response {
  return new Response(null, {
    status,
    headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" },
  });
}

/**
 * Admit a request or answer it: 429 past the per-IP allowance, 503 when
 * `MAX_IN_FLIGHT` requests are already being served. On admission `release`
 * must be called exactly once, in a `finally`.
 */
export function admitOgRequest(
  headers: { get(name: string): string | null },
): { refused: Response } | { release: () => void } {
  if (!allowRequest(`og|${clientIpFrom(headers)}`, PER_IP_MAX, PER_IP_WINDOW_MS)) {
    return { refused: refusal(429, 60) };
  }
  if (inFlight >= MAX_IN_FLIGHT) return { refused: refusal(503, 10) };
  inFlight += 1;
  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      inFlight -= 1;
    },
  };
}

/** Run `job` after every render queued before it: one image at a time. */
function renderSerially<T>(job: () => Promise<T>): Promise<T> {
  const run = renderTail.then(job, job);
  renderTail = run.catch(() => undefined);
  return run;
}

/* ------------------------------------------------------------ responses */

/**
 * What a crawler and a CDN may keep: a day in the browser/crawler, a week at
 * a shared cache, and a stale copy served for another week while it refreshes.
 * The listing URL carries its `updatedAt`, so an edit is a new URL, not a wait.
 */
export const OG_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800";

export function ogNotFound(): Response {
  // Short-lived: a draft that gets published should not stay a 404 for a week.
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

/**
 * Render a card to a JPEG, serially, and answer with the cache headers above.
 * Everything CPU-bound happens inside the serial section: decoding the photo,
 * the text layer (`ImageResponse` would otherwise render lazily while the body
 * streams, letting renders overlap), and the final composite.
 *
 * `build(hasPhoto)` returns the card; with a photo it must leave its own
 * background transparent, because the photo is composited *under* it here.
 * It is told after decoding, so a photo that turns out not to be an image
 * gets the branded-background layout rather than a hole.
 *
 * **JPEG, not the renderer's PNG.** A photo card as PNG is ~1.4 MB and even the
 * flat door card ~200 KB; WhatsApp drops a preview image much past 300 KB and
 * shows the bare link. Chroma is kept at full resolution (4:4:4) so the
 * coloured text on the card keeps clean edges.
 */
export async function renderOgImage(
  build: (hasPhoto: boolean) => ReactElement,
  photoBytes: Buffer | null = null,
): Promise<Response> {
  try {
    const jpeg = await renderSerially(async () => {
      const [photo, font] = await Promise.all([decodeCover(photoBytes), loadFont()]);
      const image = new ImageResponse(build(photo !== null), {
        ...OG_IMAGE_SIZE,
        fonts: font
          ? [{ name: FONT_NAME, data: font, weight: 600, style: "normal" }]
          : undefined,
      });
      const layer = Buffer.from(await image.arrayBuffer());
      const base = photo
        ? sharp(photo.data, { raw: photo.info }).composite([{ input: layer }])
        : sharp(layer);
      return base
        .jpeg({ quality: 82, chromaSubsampling: "4:4:4", mozjpeg: true })
        .toBuffer();
    });
    return new Response(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.byteLength),
        "Cache-Control": OG_CACHE_CONTROL,
      },
    });
  } catch (err) {
    console.error("[og] render failed", err);
    return new Response(null, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

/* --------------------------------------------------------------- colours */

interface OgPalette {
  /** The door's dark ground (header/footer colour). */
  ground: string;
  /** The accent as it reads on that ground. */
  accent: string;
  /** Badge fill and its text colour. */
  fill: string;
  onFill: string;
}

/** The door's own tokens (`src/design/themes.ts`) — nothing restated here. */
export function paletteFor(key: VerticalKey): OgPalette {
  const t = themeFor(key);
  return {
    ground: t["--color-primary"],
    accent: t["--color-accent-on-dark"],
    fill: t["--color-accent"],
    onFill: t["--color-on-accent"],
  };
}

/** `#RRGGBB` at an alpha; anything else falls back to black at that alpha. */
function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return `rgba(0,0,0,${a})`;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => Number.parseInt(h, 16));
  return `rgba(${r},${g},${b},${a})`;
}

/* --------------------------------------------------------------- layouts */

export interface ListingOgProps {
  brand: string;
  domain: string;
  title: string;
  price: string;
  place: string;
  facts: string;
  badge: string;
  palette: OgPalette;
}

/**
 * The listing card: the cover photo full-bleed under a scrim in the door's
 * own dark colour, the brand and domain top-left, and the operation, facts,
 * title, place and price along the bottom where a preview crop keeps them.
 * Without a photo, the same layout on the door's ground colour.
 *
 * With a photo this layer's own background is transparent: `renderOgImage`
 * composites the photo underneath it.
 */
export function listingOgElement(props: ListingOgProps, hasPhoto: boolean): ReactElement {
  const { ground, accent, fill, onFill } = props.palette;
  const scrim = hasPhoto
    ? `linear-gradient(to top, ${alpha(ground, 0.96)} 0%, ${alpha(ground, 0.82)} 30%, ${alpha(ground, 0.2)} 62%, ${alpha(ground, 0)} 100%)`
    : `linear-gradient(160deg, ${alpha(ground, 0.55)} 0%, ${alpha(ground, 1)} 70%)`;
  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        position: "relative",
        ...(hasPhoto
          ? {}
          : { background: `linear-gradient(135deg, ${accent} 0%, ${ground} 45%)` }),
        fontFamily: FONT_NAME,
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: H,
          display: "flex",
          backgroundImage: scrim,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 48,
          display: "flex",
          flexDirection: "column",
          padding: "14px 22px 14px 20px",
          background: alpha(ground, 0.92),
          borderLeft: `5px solid ${accent}`,
        }}
      >
        <div style={{ fontSize: 28, lineHeight: 1.15, color: "#FFFFFF" }}>{props.brand}</div>
        <div style={{ fontSize: 19, lineHeight: 1.3, color: accent, letterSpacing: 0.5 }}>
          {props.domain}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 42,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              background: fill,
              color: onFill,
              fontSize: 19,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "6px 14px",
              marginRight: 18,
            }}
          >
            {props.badge}
          </div>
          {props.facts ? (
            <div style={{ fontSize: 23, color: "rgba(255,255,255,0.88)" }}>{props.facts}</div>
          ) : null}
        </div>
        <div
          style={{
            display: "block",
            fontSize: 54,
            lineHeight: 1.12,
            lineClamp: 2,
            overflow: "hidden",
            maxHeight: 122,
          }}
        >
          {props.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              marginRight: 28,
              fontSize: 27,
              color: "rgba(255,255,255,0.88)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              paddingBottom: 6,
            }}
          >
            {props.place}
          </div>
          <div style={{ flexShrink: 0, fontSize: 56, lineHeight: 1, color: accent }}>
            {props.price}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface DoorOgProps {
  brand: string;
  domain: string;
  tagline: string;
  palette: OgPalette;
}

/**
 * Keep the brand on one line: "Real Estate in Paraguay" at 96 px already
 * spans the full 1032-px measure, and the longer door names would wrap.
 */
function brandSize(brand: string): number {
  if (brand.length <= 18) return 96;
  if (brand.length <= 24) return 84;
  return 70;
}

/** The door card: domain as a kicker, then the brand and its tagline. */
export function doorOgElement(props: DoorOgProps): ReactElement {
  const { ground, accent } = props.palette;
  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "76px 84px 80px",
        background: `linear-gradient(150deg, ${alpha(ground, 1)} 0%, ${alpha(ground, 1)} 55%, ${alpha(accent, 0.28)} 140%)`,
        backgroundColor: ground,
        fontFamily: FONT_NAME,
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 64, height: 4, background: accent, marginRight: 22 }} />
        <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: accent }}>
          {props.domain}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: brandSize(props.brand), lineHeight: 1.04, letterSpacing: -1 }}>
          {props.brand}
        </div>
        <div
          style={{
            display: "block",
            marginTop: 26,
            maxWidth: 960,
            fontSize: 40,
            lineHeight: 1.28,
            color: "rgba(255,255,255,0.84)",
            lineClamp: 2,
            overflow: "hidden",
          }}
        >
          {props.tagline}
        </div>
        <div style={{ width: 120, height: 4, background: accent, marginTop: 40 }} />
      </div>
    </div>
  );
}
