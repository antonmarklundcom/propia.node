# rentparaguay.com — extraction summary

Scraped with Playwright (rendered JS, not a plain fetch) on 2026-09-09.
Source: old WordPress site (Brickon real-estate theme), to be rebuilt as a
new vertical/door inside `propia.node` (`src/config/verticals.ts`), the way
`inmobiliaria.com.py` / `realestateinparaguay.com` / `terreno.com.py` are
wired today.

## What's in this folder

```
rentparaguay-extraction/
├── SITE-SUMMARY.md          <- this file
├── image-manifest.json      <- every downloaded image: source URL, alt text, which page(s) used it
├── site-content.json        <- structured JSON of all 13 pages (headings, paragraphs, lists, images, forms)
├── pages/*.json              <- raw per-page extraction (one JS evaluate() dump per page)
├── content/*.md              <- one clean Markdown file per page (heading outline + body copy + image list)
└── images/                   <- all 50 downloaded content images, original filenames
```

**Why this format:** `site-content.json` is the one to feed into a script or
an LLM prompt when writing the actual Next.js page components — it's
already deduped and structured per page. The `content/*.md` files are for a
human (or an editor pass) to read straight through and lift copy from. The
raw `pages/*.json` files are kept only as a paper trail back to the exact
DOM state that was scraped, in case something needs re-checking.

## Page count & crawl method

- **13 real pages** found via `/wp-sitemap-posts-page-1.xml` (WordPress's
  native sitemap; `/sitemap.xml` itself 403'd behind a bot-check, but the
  native `wp-sitemap.xml` index loaded fine once Playwright had a session).
- **0 real blog posts** — `/wp-sitemap-posts-post-1.xml` only ever contained
  the default "Hello World!" post. `/blog/` renders but lists nothing else.
- Did **not** crawl `/wp-sitemap-taxonomies-category-1.xml` or
  `/wp-sitemap-users-1.xml` — with zero real posts, categories and the
  single WP user account carry nothing worth extracting.

All 13 pages loaded successfully. No 404s, no dead links, no broken images
found among the real site pages.

### Pages crawled

| Page | URL | Notes |
|---|---|---|
| Home | `/` | Hero, about/vision/mission, services teaser, **fake property listings**, "why us", process, testimonials, blog teaser |
| Services (hub) | `/services/` | Lists all 7 services, testimonials, FAQ |
| Rent Apartment / House | `/rent-apartment-house/` | Real, detailed Paraguay-specific copy |
| Airbnb Management | `/airbnb-management/` | Real, detailed |
| Apartment Management | `/apartment-management/` | Real, detailed |
| Realtor Asunción | `/realtor-asuncion/` | Real, detailed |
| Residency Paraguay | `/residency-paraguay/` | Real, detailed |
| Invest in Paraguay | `/invest-in-paraguay/` | Real, detailed |
| Virtual Address | `/virtual-adress/` (typo in slug, kept as-is) | Real, detailed |
| For Rent (listings) | `/asuncion/` | **100% Brickon theme demo data — see below** |
| About Us | `/about-us/` | Real founder bio (Anton Marklund), fake "team" + fake stats |
| Blog | `/blog/` | Empty — only default WP post |
| Contact | `/contact/` | Contact info only, **no actual `<form>` on the page** |

## Nav structure

**Header:** Home · Services (dropdown: Rent Apartment/House, Airbnb
Management, Apartment Management, Residency Paraguay, Invest in Paraguay,
Virtual Address, Realtor Asuncion) · For Rent · Blog · About Us · Contact ·
"Contact Us" CTA button (links to the current page — theme default, not a
real destination)

**Footer:** No footer links were found in the DOM (`footerLinks: []` on
every page) — footer content on this theme renders as design elements
(logo, copyright line) with no linked navigation. Only "All rights
reserved" text was present.

## Real business content worth carrying forward

The 7 service pages, the About Us founder story, and the home page's
overview/mission copy are **genuinely written for this business** (not
generic theme filler) — specific to Paraguay, Asunción neighborhoods
(Villa Morra, Santa Teresa, Carmelitas), residency law, tax rates (10-10-10
system, Law 7548/2025), and the founder's own story (Anton Marklund, Swedish
entrepreneur, relocated ~3 years ago). This is real copy to translate/adapt,
not to discard.

**Contact info found:** Edificio Skytower, Asunción · +595 995 628 862 ·
hello@rentparaguay.com

## What NOT to carry forward (fabricated / theme placeholder content)

1. **The "For Rent" listings page (`/asuncion/`) and the home page's
   "Featured Properties" section are 100% unedited Brickon theme demo
   data** — prices in USD millions ($890K–$5.5M, way above any Paraguay
   rental), addresses in Bali/Jakarta/Bandung/Surabaya ("Jalan Legian Kuta,
   Bali", "Jalan Kemang Raya, Jakarta"), and stock photos of houses that are
   not in Paraguay. **The old site never had its own real rental listings** —
   there is no real listings dataset to migrate.
2. **The About Us "team" (Teddy Lamb, Errol Schultz, Vera Blair) and their
   photos (`Team-1.jpg`, `Team-3.jpg`, `Team-5.jpg`) are theme placeholder
   people**, not real staff — generic stock/AI headshots with theme-default
   names. Only the founder bio paragraph (Anton Marklund) is real.
3. **Every testimonial on Home and Services is theme placeholder content**
   with stock portrait photos (`portrait-of-businessman.jpg`,
   `shot-of-a-confident-young-businesswoman...jpg`, etc.) and generic
   attributions ("— Michael T", "Green Building Advocate", "Homeowner").
   None of it should be presented as real client feedback.
4. **The "400+ agents", "Over 400+ agents by your side, altora provides
   professional guidance" line on Home is leftover theme copy** — "altora"
   is the Brickon demo's placeholder brand name, never replaced. The
   trust-stat counters ("0 +", "0 %") on Home/About Us never got real
   numbers wired in either (JS counter widget rendered its zero-state).
5. **Homepage top nav briefly linked to `wordpress-dev.codeinsolution.com/brickon/`** —
   the theme vendor's own demo site — via an empty-text logo/icon link.
   Cosmetic leftover, not a security issue, but don't carry the link.

## Forms

**There is no lead-capture form anywhere on the old site** — not on
`/contact/`, not on any service page. Every "Get In Touch" / "Get Started" /
"Contact Us" button found in the DOM links back to the current page's own
URL (a theme placeholder href, never wired to a real form or a mailto/WhatsApp
link). Building the actual contact/quote form is new work for the
`propia.node` rebuild — pair with the `vendercrm-lead-capture` skill, since
this looks like the kind of lead this founder's other sites route into
VenderCRM.

## Something to flag, not act on

While crawling `/wp-sitemap.xml` and its child sitemap files, the page
**client-side redirected to `inmobiliarios.com.py`** (a different, unrelated,
**not-owned** domain per `propia.node`'s own `CLAUDE.md`) a few seconds after
load — consistently, on every direct sitemap-XML navigation, but never on
the 13 real content pages. This reads like either a stray/leftover script
in the WordPress theme or plugin stack, or some redirect rule scoped to XML
sitemap requests specifically. It did not affect content extraction (the
sitemap data was captured before the redirect fired), and no data was sent
anywhere as a result of it — but it's worth a human eyeballing
`rentparaguay.com`'s WP admin (Redirection plugin, `.htaccess`, or a
compromised plugin) before decommissioning the old install, since an
unexplained redirect firing on a live WP site is worth ruling out as a
compromise rather than assuming it's benign.

## Images

**50 unique content images downloaded**, 16 MB total, zero failures, zero
0-byte files. Breakdown:
- 2 logo files (light/dark variants)
- 3 "team" headshots (placeholder — see above)
- 8 testimonial headshots (placeholder — see above)
- ~34 real content/hero photos: Asunción-relevant stock photography plus at
  least 3 files (`hf_20260223_*`) that look Higgsfield-generated (matches
  this founder's own image pipeline elsewhere), used on the Airbnb
  Management page
- 3 generic decorative flag emoji SVGs (French/German/US flags next to
  testimonial quotes) were **excluded** from the download — they're
  `s.w.org` WordPress core emoji assets, not site content

Every image kept is real content-sized artwork (smallest is `Logo-Light-1.png`
at 11 KB / 731×270 — no icon-scale chrome got swept in).

## Suggested next steps

1. Human review of which "real" service-page copy needs a light edit vs.
   reuse as-is when adapting into the new vertical's `copy` strings.
2. Decide replacement imagery — several of the "content" photos are generic
   stock (not Paraguay-specific); the Higgsfield-generated ones are
   candidates to keep or regenerate via the `higgsfield-web-imagery` /
   `webimg-pipeline` skills already used on this founder's other sites.
3. Build a real lead form (none existed) — likely via
   `vendercrm-lead-capture`, matching the pattern used on other `.com.py`
   sites in this founder's portfolio.
4. No listings dataset exists to migrate — the rental listings feature
   starts from zero real inventory, not from an old dataset.
