/**
 * HTML of a received email, made safe to show inside /admin and the panels.
 *
 * Two passes, one allowlist:
 *
 * - **At storage** (`sanitizeEmailHtml(html)`): scripts, event handlers,
 *   forms, iframes, objects, `javascript:` URLs and `<style>` blocks are gone
 *   for good; the raw HTML is never written to the database. Remote images
 *   survive this pass (https only) so the reader can still choose to load
 *   them later.
 * - **At render** (`emailHtmlForView(stored, { remoteImages })`): the same
 *   sanitizer again, and every remote image dropped unless the reader asked
 *   for them. A remote image is a read receipt (a tracking pixel tells the
 *   sender who opened it, when, and from which IP), so it is off by default.
 *
 * And the page never trusts either pass alone: `EmailHtmlFrame` renders the
 * result in a `sandbox` iframe (no scripts, opaque origin) under its own CSP.
 *
 * Pure — `npm run verify:inbox` imports it.
 */
import sanitizeHtml from "sanitize-html";

/** Stored HTML is capped; beyond this the text part is what the reader gets. */
export const HTML_MAX_CHARS = 1_000_000;

const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "center", "code", "col",
  "colgroup", "dd", "del", "div", "dl", "dt", "em", "font", "h1", "h2", "h3",
  "h4", "h5", "h6", "hr", "i", "img", "ins", "li", "ol", "p", "pre", "q", "s",
  "small", "span", "strike", "strong", "sub", "sup", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "tt", "u", "ul",
];

/** Inline style properties a mail layout needs; nothing that positions or loads. */
const STYLE_OK = /^[#(),.%\-\w\s'"]*$/;
const STYLE_PROPS = [
  "color", "background-color", "font-size", "font-weight", "font-style",
  "font-family", "text-align", "text-decoration", "line-height", "padding",
  "padding-top", "padding-bottom", "padding-left", "padding-right", "margin",
  "margin-top", "margin-bottom", "margin-left", "margin-right", "border",
  "border-top", "border-bottom", "border-left", "border-right",
  "border-collapse", "width", "max-width", "height", "vertical-align",
  "white-space", "display",
];

function options(remoteImages: boolean): sanitizeHtml.IOptions {
  return {
    allowedTags: ALLOWED_TAGS,
    // `style`/`script`/`textarea`… are dropped *with their contents*.
    nonTextTags: ["style", "script", "textarea", "option", "noscript", "title", "head"],
    disallowedTagsMode: "discard",
    allowedAttributes: {
      "*": ["style", "align", "valign", "width", "height", "dir", "title"],
      a: ["href", "name"],
      img: ["src", "alt", "width", "height"],
      font: ["color", "size", "face"],
      td: ["colspan", "rowspan", "bgcolor"],
      th: ["colspan", "rowspan", "bgcolor"],
      table: ["border", "cellpadding", "cellspacing", "bgcolor"],
    },
    allowedStyles: {
      "*": Object.fromEntries(STYLE_PROPS.map((p) => [p, [STYLE_OK]])),
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: remoteImages ? ["https", "data"] : ["data"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      // Every link leaves the frame in a new tab, and tells the destination nothing.
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" },
      }),
    },
    exclusiveFilter: (frame) =>
      // An <img> whose src was stripped (remote while blocked, cid:, http:) is
      // noise — and a data: image is only kept when it is an actual image.
      frame.tag === "img" &&
      (!frame.attribs.src ||
        (frame.attribs.src.startsWith("data:") &&
          !/^data:image\/(png|gif|jpe?g|webp);base64,/i.test(frame.attribs.src))),
  };
}

// The allowlist above adds target/rel after filtering; allow them on output.
function withLinkAttrs(o: sanitizeHtml.IOptions): sanitizeHtml.IOptions {
  return {
    ...o,
    allowedAttributes: {
      ...(o.allowedAttributes as Record<string, string[]>),
      a: ["href", "name", "target", "rel"],
    },
  };
}

/** The storage pass. Returns null for empty or over-long input. */
export function sanitizeEmailHtml(html: string | null | undefined): string | null {
  if (!html || !html.trim()) return null;
  const clean = sanitizeHtml(html.slice(0, HTML_MAX_CHARS * 2), withLinkAttrs(options(true))).trim();
  return clean && clean.length <= HTML_MAX_CHARS ? clean : null;
}

/** Does the stored HTML reference any remote image? Drives the "Mostrar imágenes" link. */
export function hasRemoteImages(stored: string | null | undefined): boolean {
  return !!stored && /<img[^>]+src="https:/i.test(stored);
}

/** The render pass: sanitized again, remote images removed unless asked for. */
export function emailHtmlForView(stored: string, opts: { remoteImages: boolean }): string {
  return sanitizeHtml(stored, withLinkAttrs(options(opts.remoteImages)));
}

/**
 * The complete `srcdoc` of the sandboxed frame: a CSP that forbids scripts
 * outright and loads images only when the reader allowed them.
 */
export function emailFrameDocument(body: string, opts: { remoteImages: boolean }): string {
  const img = opts.remoteImages ? "img-src data: https:" : "img-src data:";
  return [
    "<!doctype html><html><head><meta charset=\"utf-8\">",
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${img}; style-src 'unsafe-inline'">`,
    "<base target=\"_blank\">",
    "<style>body{margin:0;padding:12px;font:14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style>",
    "</head><body>",
    body,
    "</body></html>",
  ].join("");
}
