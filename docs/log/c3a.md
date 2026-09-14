# C3-a — Listing detail and ContactForm editorial restyle

2026-09-13. Local working-tree changes only; no staging, commit, push, PR,
deployment, database access, or credential changes.

## What landed

1. Empty galleries use the same `/img/listing-fallback.webp`, `--overlay-card`
   scrim, and `listing-card__nophoto` label treatment as editorial cards.
   The existing localized `galleryEmpty` text stays; no icon is rendered.
   Aspect ratio is 16:9 desktop and 4:3 at the existing 640px phone breakpoint.
2. Facts use 16px line glyphs, 12px uppercase Jost, 0.08em tracking, 20px
   horizontal gaps, and one bottom hairline. Freshness stays muted.
3. Price uses Cormorant 36px/1.1 and the existing gold token. The existing
   cuota displays below it use 13px Jost and secondary ink; financing data and
   calculations stay intact. PriceAlert has an outlined square trigger.
4. Section headings use Cormorant 24px and line glyphs. Existing section
   hairlines remain; detail rows have solid hairlines, uppercase 12px labels,
   and Jost 15px values.
5. Seller card uses cream, a hairline border, zero radius, and no shadow.
   Initials are derived only from an actual agency name. Without an agency,
   the fallback is the home glyph in a 44px square; agency logos remain.
6. Exactly one ContactForm JSX mount remains. Its actual form receives
   `id="contacto"` and a 96px scroll margin. The lower band reuses the existing
   heading, subtitle, and submit label and links to `#contacto`; CSS hides it
   at widths <=900px. Removed the obsolete mobile rule hiding the aside form.
7. Shared ContactForm uses white square inputs, 15px Jost, a 1px gold focus
   ring, outlined uppercase chips, uppercase labels, a full-width gold submit,
   and outlined WhatsApp continuation with a glyph. Submission logic is unchanged.
8. Both similar/from-agency grids use `ph-grid-4` and its 4/2/2 rhythm, with
   Cormorant 28px headings. No `.ph-*` CSS rules were changed.

`Glyph.tsx` provides all 20 requested names, each in a 24-unit viewBox with
1.2 stroke, currentColor, and aria-hidden. The home's existing `LineIcon` and
`WhatsappGlyph` renderers were moved verbatim into that module and imported
back; their existing paths, sizing, fill, and CSS-controlled strokes remain.
Dictionary changes only remove decorative prefixes from existing Listing and
ContactForm strings in both languages; there are no new keys or copy changes.
Existing CSS edits are limited to the permitted selector families; new rules
are collected in one `/* == C3-a == */` block.

## Verification

- PASS — `npm run typecheck`: `tsc --noEmit`, exit 0.
- FAIL — `npm run verify:i18n`: exit 1 before the dictionary checks execute.
  The actual failure was:

  ```text
  > propia@0.1.0 verify:i18n
  > tsx --tsconfig scripts/tsconfig.json scripts/verify-i18n.ts

  node:os:306
      throw new ERR_SYSTEM_ERROR(ctx);
            ^

  SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory)
      at Object.userInfo (node:os:306:11)
      at file:///C:/Users/anton/propia.node/node_modules/tsx/dist/temporary-directory-BDDVQOvU.mjs:1:84
      at ModuleJob.run (node:internal/modules/esm/module_job:439:25)
      at async node:internal/modules/esm/loader:633:26
      at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
    code: 'ERR_SYSTEM_ERROR',
    info: {
      errno: -4057,
      code: 'ENOMEM',
      message: 'not enough memory',
      syscall: 'uv_os_get_passwd'
    },
    errno: [Getter/Setter],
    syscall: [Getter/Setter]
  }

  Node.js v24.16.0
  ```

  Both npm commands also emitted the existing warning about unknown project
  config `only-built-dependencies`. No runtime workaround or substitute i18n
  check was used.
- PASS — Node Unicode scan with `/\p{Extended_Pictographic}/u`: 0 matches in
  `app/propiedad`, ContactForm, PriceAlert, and both Listing/ContactForm
  dictionary namespaces. Also removed the regional-indicator flag, textual
  checkmarks and the list-heading prefix, which that regex does not cover.
- PASS — Node source inspection: 1 ContactForm JSX mount, 1 C3-a CSS block,
  and the referenced placeholder asset exists.
- PASS — PostCSS parse and comparison against HEAD: no existing CSS rules
  outside the permitted selector families changed. Home source comparison
  confirms only extraction/import of its two renderers.
- PASS — `git diff --check`: no whitespace errors.
- PASS — `git status --short`: task changes are limited to the nine allowed
  files. Two pre-existing untracked files remain untouched:
  `prompts-site-quality/codex-c3b-hubs-category.md` and
  `prompts-site-quality/codex-c3c-marketing-pages.md`.

## Not verified

No browser was used. Live server HTML (including the actual rendered form
count), visual matching, sticky/anchor interaction, and overflow at
390/768/1024/1440/1920 on both doors remain director checks. Source inspection
is not presented as a server-render verification. Mobile input focus/zoom
also remains a browser check; the spec's 15px size is applied on phones too.

Build/verify:local were not run, per the task's stated sandbox EPERM readlink
limitation and director-owned full verification. No attempt was made to
work around that limitation. The exact i18n command still needs to pass in
the director's environment before the definition of done is fully met.

## Spec reconciliations / deviations

- `t.interestedTitle` does not exist. Used `t.contactTitle`, the existing
  heading actually used by the deleted panel, with `t.contactSubtitle` and
  `d.contactForm.submitIdle`. Added no key.
- PriceAlert's class-only restriction conflicts with the explicit no-emoji
  requirement. The only non-class changes there import Glyph and replace
  the bell with the supported `clock` glyph; behavior is unchanged.
- The actual aside breakpoint was 860px, not the spec's stated 900px.
  Changed its two-column/sticky breakpoint to 901px so it stacks at <=900px,
  matching the reminder-band rule. The existing mobile CTA bar is retained.
- The home has two SVG renderer functions, rather than two fixed glyph paths.
  Moved those functions verbatim and retained their exports to satisfy the
  no-visual-change requirement; the new named Glyph API supplies the specified
  1.2-stroke family to the detail/form surfaces.
- The broader shared-rule inventory still finds 92 pictographic characters
  across 24 other files after excluding staff routes and panel namespaces.
  Those are outside this dispatch's allowed file list and were not edited.

Initial read/edit helpers found `rg` and `python` unavailable; PowerShell
Select-String and Node were used instead. One initial Node edit attempt
failed on a literal checkmark passed through PowerShell's pipe encoding,
before writing any file; the successful command used Unicode escapes.
