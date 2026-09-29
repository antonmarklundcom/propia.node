# Reaching German buyers — domain and architecture review

Written 2026-09-29. A review and recommendation only: no code, no purchases, no PR.

**How to read the evidence.**

- *Code facts* come from this repo (`propia.node`) and the residency repo (`paraguayresidency`, read at `6092ce1`).
- *Legal facts* marked "secondary" come from web searches this session (IHK pages, law-firm blogs, expat-guide sites). They are not primary sources. A German lawyer and the primary Paraguayan texts still have to confirm them.
- *Unknown* means I could not establish it. I have not filled any gap with a guess.

---

## 0. Summary

- **Recommendation: Option A.** Add a German door to this app on a new `.de` domain, and cross-link it with the residency brand. That is A plus the linking half of C.
- **Domain: `immoparaguay.de`.** Its runner-up is `paraguayimmo.de`. Ask Sedo for a quote on `paraguayimmobilien.de`, but do not pay a premium for it (§1).
- **Demand is small.** The real-estate terms total roughly 1,200 monthly searches if none overlap, and Google says two of the six are one cluster. That is about the size of the residency cluster (390 + 390 + 110 + 110). It is a niche worth a cheap test, not a big build. That is why the recommendation is the option that reuses the most.
- **This site already serves foreign buyers in English.** `realestateinparaguay.com` has an EUR switch, foreign-buyer copy, EN listing translation and derived hreflang. A German door is a third locale on that machinery.
- **The biggest legal trap is the Investor Pass link.** The route in your other repo's sourced facts *excludes* property bought for personal or family use. A page saying "buy a house, get residency" would be false for most German buyers. See §3.
- **Smallest first step:** buy the domain, then ship a German home page, two or three German guide pages, and Impressum and Datenschutz, with no schema change. Listings stay English and are not indexed on the German host yet (§5).

---

## 1. Domain ranking (real estate)

The scores weigh five things: keyword match, length, memorability, brandability, and fit with how this site names its doors. The existing doors are `Inmobiliaria Paraguay` and `Real Estate in Paraguay`, so the domain is the brand (CLAUDE.md, "Brand name").

Exact-match domains carry little ranking weight on their own. I have not measured that here. It is background knowledge, so I weighted memorability and trust above the exact keyword string.

| # | Domain | Score | One-line reason |
|---|---|---|---|
| 1 | **immoparaguay.de** | **8.5** | Keyword order matches the head term "immobilien paraguay" (480). It is short, and "Immo" is normal German for real estate. It parallels the existing `Inmobiliaria Paraguay` brand, and it does not limit the inventory to houses or land. |
| 2 | **paraguayimmo.de** | **8.0** | It covers the same cluster with the reverse order ("paraguay immobilien"). It is equally short and reads a little more like a place name. It is a coin-flip with #1, and I would buy both to stop a squatter (≈ US$ 18 at the quoted price). |
| 3 | paraguaykaufen.de | 6.5 | The verb "kaufen" matches buyer intent ("haus/land/farm kaufen paraguay"), and it covers houses and land. It is generic and weak as a brand, and it reads more like a slogan than a marketplace. |
| 4 | paraguayhaus.de | 6.0 | It matches "paraguay haus" (90) and is short and pronounceable. It signals houses only, so land, farms and apartments feel off-brand. |
| 5 | hauskaufenparaguay.de | 5.0 | It is the exact string of the second-biggest term (480), but it is 19 characters, three words and hard to say. A German user is likely to read it as a spammy keyword domain. |

**Not in the top 5, and why:**

- `paraguayimmobilien.de` (Sedo, price unknown) is the best keyword match for the biggest cluster. I would score it 9 only if the price is close to a normal registration. The value the exact match adds over #1 is small, so ask for a quote and set a low ceiling. I cannot set that ceiling for you.
- `paraguayportal.de` (Sedo) has "portal" in the name, which suits a marketplace. It says nothing about property, and its price is unknown.
- `paraguayland.de`: "Land" in German means country or state, so it reads as "Paraguay country". `paraguaygrundstuecke.de` and `…grundstueck.de` are land-only and use an ASCII "ue" for "ü". `paraguayfarm.de` and `farmparaguay.de` target a term with 10 searches a month.
- `meinparaguay.de` and `paraguayheimat.de` are emotional and not property-specific. They fit the residency or lifestyle brand better.
- `paraguaystart.de` and `paraguaywegweiser.de` are guide-like and belong with the residency brand.

**Terms and what they imply.** I have not summed the numbers, because Keyword Planner overlaps clusters.

| Term | Monthly searches (DE) | What the visitor wants |
|---|---|---|
| immobilien paraguay (same cluster as paraguay immobilien) | 480 | Browse listings |
| haus kaufen paraguay | 480 | Buy a house |
| paraguay haus, grundstück paraguay | 90 each | House and land research |
| land kaufen paraguay | 40 | Land research |
| farm paraguay kaufen | 10 | Niche |

These numbers are Germany only. Austria and Switzerland are not counted, and a `.de` domain is fine for both. How many searches turn into clicks, or clicks into enquiries, is **unknown**. Please do not put a revenue forecast on this page until a first month of Search Console data exists.

---

## 2. Architecture — recommendation: A

### 2.1 What exists today

**Hosts and locales**

- `src/config/verticals.ts` declares each door as data: `key`, `locale: "es" | "en"`, `family`, `brand`, `filters`, `ownsListingDetail`, `ownsDirectory`, `ownsCategories`.
- `middleware.ts` resolves the `Host` header with `resolveVertical()` and sets `x-vertical` and `x-locale`. Everything downstream reads those two headers. The middleware itself never names a locale, so it needs no change for a new one.
- `src/i18n/index.ts` has `type Locale = "es" | "en"`, `DICTIONARIES`, `parseLocale()` and `numberLocaleFor()`.
- Server code reads copy through `dict()` from `@/i18n/server`. Client components use `getDictionary(locale)`.
- The dictionaries are large: `es.ts` is 3,989 lines and `en.ts` is 2,861, plus about 13 `es-*.ts` / `en-*.ts` side files.

**hreflang and canonical**

- Both are derived, not hand-written. `alternatesFor()` in `src/lib/alternates.ts` picks one door per locale in the same `family`, and only doors that own the page type appear.
- `x-default` is the family primary.
- Canonical owners per locale come from `detailOwnerForLocale()` and `categoryOwnerForLocale()` in `src/lib/origin.ts`.
- **Consequence:** a new locale in a family with two others automatically gets `es` / `en` / `de` / `x-default` sets, provided its door owns the pages. There is no hreflang code to write, only a locale to add.
- I confirmed the pairing logic in `alternates.ts` and the detail-owner lookup in `origin.ts` by reading them. I did not trace every call site.

**EUR**

- The English doors already have a currency switch. `USD_EUR_RATE` is an env var (EUR per USD), read per request. `format.ts` has `roundEur()` and `formatEur()`. `DoorPrice` takes `usdFirst`, and `ListingCard`, `SiteHeader` and `app/propiedad/[slug]/page.tsx` read the rate. The rate is set by hand, so every EUR figure is shown as approximate.
- The switch is a client toggle: the server always renders US$, and `data-currency="eur"` swaps it with CSS after mount. That is fine for the English door. **For German SEO it is the wrong default**, because Google and a German visitor's first paint would see US$.
- Guaraní listings go PYG → USD (`price_usd`, from `cron:fx`) → EUR. Two conversions stack their errors, so the original listed price must always stay visible.

**Listing translation**

- `listings.title_en`, `description_en` and `translation_hash` are written only by `npm run cron:translate` (`src/lib/translate.ts`).
- The provider order is Gemini, then Claude. A `SYSTEM` glossary keeps place names Spanish, and the job is also run by the hourly tick at 15 rows an hour.
- The page reads `title_en ?? title`. That fallback is why an untranslated listing does not render blank.

**Legal and cookies**

- There is a Spanish-only `/privacidad` and `/terminos`, and no Impressum or Datenschutz page.
- There are no cookies for visitors, no third-party scripts and no analytics vendor. `AnalyticsBeacon` is first-party and stores nothing. Fonts are self-hosted. The map loads OpenStreetMap tiles, which is a third-party request (§3).

**Guides**

- `posts.locale` exists (migration 0014), so guide posts can already be per-language.
- Evergreen category pages are bound to category paths such as `/venta/<ciudad>/<tipo>`, and they are Spanish content files plus `en-*.ts` for English.

### 2.2 The three options

| | **A. German door on this app** | **B. Separate small German site** | **C. Property section inside the German residency brand** |
|---|---|---|---|
| Reuses | Listings, DB, filters, lead pipeline, CRM copy, EUR code, translate job, hreflang, sitemap | Nothing but design | Residency repo's multi-brand pattern |
| New | `de` locale, one vertical, DE copy, legal pages, EUR-first display | A second database or API client, second import path, second admin, second lead flow | A listing feed into another app, plus its own search and detail pages |
| Search fit | A dedicated site whose whole topic is "Immobilien Paraguay" | Same, but with less data | The brand is about *auswandern*. "Haus kaufen" visitors are not emigrating, and a section under an emigration brand ranks and reads poorly for them |
| Risk | Touches ~17 signatures and ~47 `locale === "en"` branches (§2.3) | Stale listings, drift, double the maintenance | Blurs "property" with "residency", which is exactly the claim we must avoid (§3) |
| Brand and data owner | One CRM story, one `foreign_exposure` opt-in | Two | Two apps, two DBs |

**Why A.**

- B rebuilds what A gets for free. It also creates a second copy of the listings, which this repo's rules ("the database is the only copy of every listing and every lead") argue against.
- C answers a different intent. Someone searching "haus kaufen paraguay" wants listings, and someone searching "paraguay auswandern" wants a path. Merging them makes both pages worse. C is still useful as a *link*: the residency brand points to the German door for buyers, and the door points back for people asking about residency.
- The repo's own architecture is a set of doors on one engine. A German door is the same move that made `realestateinparaguay.com` in 2026-09.

**What I would not do:** a `/de` folder on `realestateinparaguay.com`. The whole system assumes one locale per host, and that assumption is what makes canonical, hreflang, sitemap and brand correct without special cases.

### 2.3 What adding `de` takes — files

I grepped rather than opened every file, so treat the counts as a starting checklist, not an audit.

**Locale plumbing**

1. `src/i18n/index.ts`: extend `Locale`, `DICTIONARIES`, `parseLocale()` and `numberLocaleFor()` (`de-DE`).
2. `src/config/verticals.ts`: add `"de"` to `VerticalKey` and widen `locale`. Add one entry, with `family: "marketplace"`, `locale: "de"`, `filters: { foreign_exposure: true }`, `ownsListingDetail` per §2.5, and `copy: "foreign"`. Declaration order only matters for two same-locale doors, and German is alone in its locale.
3. Roughly 17 literal `"es" | "en"` signatures need widening. They are in `brand.ts`, `brand-server.ts`, `lead-intake.ts`, `lead-emails.ts`, `lead-assignments.ts`, `panel-queries.ts`, `ai-reply-prompt.ts`, `telegram-accounts.ts`, `CategoryFilterBar.tsx`, `app/admin/usuarios/actions.ts`, `site-nav.ts` and `rental-services.ts`. The rental ones can stay `es | en` because no German rental door exists.
4. **The risky part is the ~47 `locale === "en"` / `!== "en"` branches in ~23 files.** Any `!== "en"` currently means "Spanish". With a third locale it silently shows Spanish to Germans. Run `grep -rnE 'locale (===|!==) "en"' src app` and review every hit.
5. `src/lib/origin.ts`: `detailOwnerForLocale()` and `categoryOwnerForLocale()` already loop over the table, so they may need no change. Confirm that `verify:seo` block (n) ("one owner per (locale, listing set)") passes with the new door.
6. `src/lib/sitemap.ts`: driven by the host's owned page types. Check that the German door lists only what it owns.
7. `verify:seo` also re-derives a "post-flip spec" independently. Add the German door to that table, or the check will not cover it.
8. `next.config.ts`: check how `www.` and hosts are handled for existing doors and repeat that for the new host. I did not open this file.

**Copy**

9. New `src/i18n/de*.ts`. The `Dictionary` type is the whole Spanish shape, including admin and panel namespaces German visitors never see. Three ways to handle it:
   - (a) Translate everything (slow, and wasted on staff-only screens).
   - (b) Define `de` as `en` plus German overrides for public namespaces, so an admin string falls back to English.
   - (c) Loosen the type for staff-only namespaces.
   I recommend (b). `verify:i18n` then needs a list of public namespaces that must be fully German, so a German page can never silently show English or Spanish. Without that list the fallback becomes exactly the silent-fallback bug the other repo's rules forbid.
10. I have not counted how many of the ~6,850 dictionary lines are public. **Do that count first in phase 1**, because it sets the translation cost.

**Data**

11. German listing text needs somewhere to live. The existing pattern is `title_en` / `description_en` columns, but adding `title_de` etc. gives one more column per language. A `listing_translations(listing_id, locale, title, description, hash)` table would be cleaner. Both are **schema changes**: the PR title must start `MIGRATION REQUIRED —`, an agent must not merge it, and you apply the migration yourself (AGENTS.md §2).
12. `src/lib/translate.ts` and `scripts/translate-listings.ts`: add a target locale and a German glossary. The tick's budget of 15 rows an hour would need raising or a separate cadence for the German backlog.

### 2.4 hreflang and canonical

- Emit `de` (not `de-DE`), because the door also serves Austria and Switzerland. The language key comes from the locale string, so it needs no code beyond adding the locale.
- Result once live: es, en and de alternates plus `x-default` on any page every door owns.
- A German page must be **self-canonical only when it has German content.** An untranslated `/propiedad` page would duplicate the English one, so until `title_de` (or the translation row) exists it should canonicalise to the English owner and stay out of the German sitemap. This is the same rule the code applies to a thin category page. It is new code, and I would build it in phase 2.
- hreflang on a page is emitted only where the German version is a real translation, so a German home page pairs with the Spanish and English homes.
- Directory pages (`/agentes`, `/inmobiliarias`, …): there is no German owner today. Decide before launch whether the German door hides them, or canonicalises to the English owner. I have not designed this.

### 2.5 Ownership decisions to make

- `ownsListingDetail` for the German door: **true**, once German text exists (a translation is its own content, like the English door). Before that, false.
- `ownsCategories`: leave unset (owns). A German category page is a distinct language version.
- The founder rule "never introduce a domain not already a key in `verticals.ts`" is satisfied by adding the door there in the same commit. That entry is also the decision that makes it real, so it needs your explicit yes.

### 2.6 EUR next to USD and PYG

- For the German door the headline should be **EUR, rendered on the server**, with USD or PYG as the listed price on a second line. The existing `usdFirst` flag and `DoorPrice` shape extend naturally to an EUR-first mode.
- Always show the listed currency, and always mark EUR as an approximation ("ca."). Show a rate date next to it. There is no stored rate date today, since the rate is one env var, so this needs a small design.
- The rate is set **by hand**. A stale rate misprices every listing at once, so the German door needs an owner for updating it. The founder's manual 6,000 PYG/USD rate (CLAUDE.md, "Launch track") compounds this.
- Keep the *cuota* line off the German door. It is computed from Paraguayan programme rates and is already hidden on the English door (`showCuota()`). Nothing in it applies to a buyer resident in Germany.

### 2.7 Listing translation: machine plus review, or curated?

| Content | Approach | Why |
|---|---|---|
| Listing titles and descriptions | Machine (the existing Gemini → Claude job), not reviewed one by one | Volume. The stated Gemini rate is $0.30 / $2.50 per million input / output tokens; at roughly 300 tokens each way per listing that is well under a cent per listing (my arithmetic, not a measurement). Listing count is unknown to me. |
| Home page, hub, filters, cards | Curated, reviewed by a native German speaker | They are the shop window, and the Spanish/English prompt already says "translate intent, not sentences". |
| Guide and landing pages (the pages that carry the keywords) | Curated by a person, drafted by machine | They are what ranks, and a stilted page loses trust. |
| Legal pages | Written or approved by a German lawyer (§3) | Not a translation job. |

- Machine translation of **legal terms is a risk**, not just a style issue. "Escritura" is not the same thing as a German "notarielle Urkunde" or "Grundbuchauszug", and the Paraguayan system differs from the German. The glossary should keep the Spanish term and add a short gloss, never substitute a German legal equivalent.
- Place names stay Spanish (existing rule).
- Do not index a listing page in German until its translation exists (§2.4).

### 2.8 SEO for the terms above

- **Home (`immobilien paraguay`, `paraguay immobilien`).** This is the door's home page plus a listing grid. The H1 should carry the term naturally, not stuffed.
- **`haus kaufen paraguay` (480).** One substantial German guide, about buying a house as a German, that links to house listings. Do **not** build it as a category page with a German slug. That would touch the URL localisation the rental family has and the marketplace does not (`/propiedad` stays Spanish-slugged on every door). Use a guide post (`posts.locale = "de"`, no schema change) with a German slug.
- **`grundstück paraguay` (90), `land kaufen paraguay` (40), `farm paraguay kaufen` (10).** One combined land guide. The volumes do not justify separate pages, and separate thin pages are the doorway pattern this repo already forbids.
- The evergreen-page rules in CLAUDE.md apply in spirit to German pages: no figures in prose, every factual claim recorded for verification, and no two pages sharing a paragraph. The current evergreen tooling is Spanish and English, so German pages are not covered by `verify:seo` until it is extended.
- Do not chase the `auswandern` terms here. Those belong to the residency brand, and duplicating them would put two of your own sites in competition.
- Search Console: add the new property from day one. The repo already has `/admin/google` per door.

---

## 3. Legal and trust

**Everything in this section is a list of questions for a German lawyer, not advice.** The sourcing status of each item is stated so you know what was checked.

### 3.1 What a German-facing site must have

| Item | Status |
|---|---|
| **Impressum** | The legal basis is § 5 DDG (Digitale-Dienste-Gesetz), which replaced § 5 TMG on 2024-05-14. Content requirements are described as the same in substance. **Never cite "§ 5 TMG"**, because a wrong legal basis is a known cause of warning letters. (Secondary: IHK Nord Westfalen, IT-Recht-Kanzlei, eRecht24.) Who is the legal provider (a Paraguayan company, you as a person, a German entity)? That decides what goes in it. |
| **Datenschutzerklärung** | Required under GDPR whenever personal data is processed. Here that is lead forms, the session cookie for logged-in users, server logs, and the OpenStreetMap tile requests. The existing Spanish `/privacidad` describes the app accurately and is a starting point, not a German policy. |
| **Cookie consent** | Consent is required for cookies and similar storage that are not strictly necessary. The current visitor side stores nothing (`AnalyticsBeacon`: no cookies, no storage), and the currency switch uses `localStorage`. A lawyer should say whether that preference counts as strictly necessary. If it does not, the German door needs either a consent banner or no such storage. **The simplest defence is to keep the visitor side free of non-essential storage and third-party requests**, which avoids a banner entirely. |
| **OpenStreetMap tiles** | Loading tiles sends the visitor's IP to a third party. Ask the lawyer whether this needs disclosure or consent, or whether the map should load on click only. |
| **Contact and lead forms** | Consent text and purpose for the data collected, and a note that leads go to a CRM (a named processor). |

I have not checked the GDPR/TDDDG cookie rules myself this session. The Impressum basis above I did check, in the sources named.

### 3.2 Brokerage — wording that implies it

The repo's own comment on the marketplace door says the founder's agency licence (EAS/SERPLAID) is expected around October 2026, and that until then he takes on other agents' listings case by case. That matters for wording:

- Do **not** describe the German site as a German real-estate agent ("Makler", "Maklerbüro", "wir vermitteln Ihnen…") unless a lawyer confirms it is right.
- The German broker licence is § 34c GewO. (Secondary sources: IHK München and Nord Westfalen, dejure.org.) Those sources say a cross-border activity from a lawful EU/EEA establishment may not need it, under conditions the excerpt cut off. Paraguay is not in the EU/EEA, so **do not assume that exemption applies.** Whether marketing Paraguayan property to Germans triggers § 34c is a **question for the lawyer**.
- Safe framing until then: "Portal / listings platform, listings from agents in Paraguay, we forward your enquiry", never "we sell you".
- Any statement about *who* the counterparty is (the Paraguayan agent, not us) should be plain on the listing and the form.

### 3.3 Foreign ownership in Paraguay

**Reported (secondary, from expat and law-firm marketing sites — these are not primary sources):**

- Foreigners can hold freehold title in their own name, on the same terms as citizens (cited as Law 117/91). No residency is needed to buy. Ownership is perfected only once the deed is inscribed in the Registro de Inmuebles.
- Sources: [Rio Times](https://www.riotimesonline.com/buying-property-paraguay-foreigners-2026/), [Clarity Paraguay](https://claritypy.com/blog/buying-property-paraguay-foreigner), [Investor Pass Paraguay](https://investorpassparaguay.com/insights/can-foreigners-buy-property-in-paraguay/).

**Sourced in your residency repo (`content/shared/facts.ts`, key `property.border_zone`, research 2026-09-28, "high confidence", verification state not signed off):**

- Law 2532/2005 sets a 50 km border strip in which nationals of neighbouring countries (Argentina, Brazil, Bolivia), and companies they mostly own, cannot own rural property without an executive decree.
- Urban property is not covered, and other nationalities, including Germans, are not covered by article 2.
- That fact's own note records that the official text could not be fetched (`bacn.gov.py` returned 403), so the wording comes from a search excerpt and a law-firm commentary.

**What this site should do:** state none of it as a legal fact until the primary texts are read. The residency repo already has the right mechanism: a `<Fact k>` with `verified` and `sourced` fields. This repo has no equivalent, and CLAUDE.md's English-door note says the "unsourced legal/tax/cost claims" were removed in #180 and the wording awaits the founder's signature. The German door should start from the same rule: **no legal, tax or cost claim in copy that is not backed by a verified fact.** Reusing the residency repo's facts mechanism is a cross-repo decision I have not designed (§6, question 7).

### 3.4 The Investor Pass real-estate route — what may and may not be said

The residency repo records, from MIC Resolution 0283/2026 (Annex I, arts. 1(e) and 6; checked 2026-09-28; `verified: false`):

- **Evidence:** a registered title deed, *or* a private purchase contract with signatures certified by a notary (escribano) showing **at least 30% of the declared investment paid**. Documents must be no older than 180 days at filing.
- **Minimum:** "from USD 200,000 in real estate used for an economic activity (not your own home)" (key `investorpass.route_real_estate_usd`, checked 2026-09-26, `verified: false`). Its own note says the older "from USD 70,000" figure on the site is wrong and must change.
- **Personal or family use does not qualify.**
- **The repo's own deep dive** says off-plan purchases generally do not work, and flags the 30%-paid contract as new relative to that. The source PDF and the MIC/REDIEX pages are the sources it lists.

Your description of the route (registered deed, or notarised contract showing at least 30% paid) matches this. **Both the USD 200,000 minimum and the evidence rule are unverified until you or a lawyer sign them off in that repo.**

**What that means for the German site:**

- **Must not say:** "buy a property, get residency", or anything implying that buying the house you live in leads to the Investor Pass. On the sourced text it does not.
- **Must not say:** an amount, a deadline, or "guaranteed" or "easy" residency.
- **May say, once verified:** that a residency route based on investment exists, with a link to the residency brand for the current conditions. It should not repeat the number, since a number written into the property door's copy will go stale separately from the source.
- Keep residency claims *only* on the residency brand, in `<Fact>` form. The property door points there and states nothing.

### 3.5 Other claims we must not make

- No returns, "Rendite", price-growth or "safe investment" promises. Ask the lawyer whether marketing property as an investment to German consumers raises questions under German advertising law (UWG) or financial-product rules. I do not know, so I am flagging it and not claiming it applies.
- No tax statements for German residents (German tax on foreign property, reporting duties, any treaty between the two countries). I could not establish those facts, and they need a German tax adviser.
- No financing claims. The AFD and Che Róga Porã programmes are for the Paraguayan market and stay off (§2.6).
- No "title is guaranteed / risk-free". Title risk is real, and the honest line is "get an independent Paraguayan lawyer and escribano".
- No "we are licensed" until the licence exists, and then only with its number and issuer.
- No unverifiable trust badges, reviews or testimonials.

### 3.6 What needs a German lawyer (checklist)

1. The Impressum: who is the provider, and what must it contain for that entity?
2. The Datenschutzerklärung, including the CRM (a named processor), the OSM tiles, and the lead forms.
3. The cookie-consent question: is the currency preference `localStorage` "strictly necessary"?
4. § 34c GewO: does marketing Paraguayan property to Germans need it, and what wording is safe?
5. Investment-style marketing: any UWG or financial-regulation issue?
6. Whether a German-language door creates any duty to have a German contact or entity.
7. Terms of use and a disclaimer for machine-translated listings ("the Spanish original controls").
8. Tax and treaty wording: probably "we give no tax advice", but confirm.

---

## 4. Lead flow

**Principles (same as both repos):** a lead is saved locally first, then sent to the CRM without blocking the visitor. An integration failure must never fail the form.

**Proposed flow on the German door**

1. **WhatsApp first.** German buyers do use WhatsApp, but I have no data on how much they prefer it for a €100k+ purchase. Treat it as a hypothesis to measure.
   - The button uses `NEXT_PUBLIC_CONTACT_WHATSAPP` (shared by all doors, per CLAUDE.md). That value is a Paraguayan number, so decide whether a German visitor can be served in German on it, or the button should be hidden until someone can.
   - Do **not** add a German-specific env var, following the existing rule for the rental doors.
2. **Form second.** The existing lead form, in German, with a consent line linking the Datenschutzerklärung. It writes the `leads` row and delivers through `deliverLead()`.
3. **CRM.** A door with a `VENDERCRM_KEY_<DOOR>` env var sends there. Otherwise the generic webhook is used. The German door needs its own key so its leads are attributable (`leads.vertical`).
4. **Reply.** The email reply (`src/lib/email.ts`) and the AI-reply drafting (`ai-reply-prompt.ts`) both take a `locale` typed `"es" | "en"`. Both need `de`, or the first German enquiry gets a Spanish or English answer. This is in the §2.3 checklist.
5. **Language of the person answering** is the real bottleneck. Who answers a German enquiry, in German? That is a staffing question, not a code one.

**Linking with the residency brand**

- **Residency → property:** a "Immobilie in Paraguay suchen" link from the German residency brand to the German door, in the buying-property and cost-of-living pages, phrased without implying a visa.
- **Property → residency:** one neutral footer link and one guide paragraph, "Aufenthalt in Paraguay", pointing to the residency brand. No figures.
- The two are separate brands and separate domains, so use `rel="noopener"` external links, as the residency registry's `external` nav items do.
- Attribution: pass a `utm` source in both directions (`leads.utm` already exists), so you can see whether the cross-links produce leads. That is the test that tells you whether option C's instinct had merit.

---

## 5. Phased plan

Estimates are my guesses of *agent-session effort*, not quotes. Money figures are only those you gave me or the published rate above; anything else is marked unknown.

| Phase | What | Effort (guess) | Cost |
|---|---|---|---|
| **0. Decide** | Answer the questions in §6. Buy `immoparaguay.de` and `paraguayimmo.de`. Ask Sedo for the `paraguayimmobilien.de` quote. Book the German lawyer. | 1 sitting | 2 × US$ 8.99 as quoted (renewal price unknown); Sedo unknown; lawyer unknown |
| **1. Smallest useful step** (no schema change) | The `de` locale (public namespaces only), the `de` vertical, German home page, 2–3 German guide posts (house buying, land, contact), German Impressum and Datenschutz, German lead form and replies, EUR-first server-rendered price. Listings show English text, their pages are **not** indexed on the German host and canonicalise to the English owner. | Several sessions. The 47-branch review in §2.3 is the bulk of it. | Unknown. Legal review of two pages is the only real cost. |
| **2. Translation** (`MIGRATION REQUIRED`) | The `listing_translations` table (or `_de` columns), the German target in `translate.ts` and `cron:translate`, per-listing self-canonical and hreflang once translated, German sitemap. You apply the migration. | 1–2 sessions | Machine translation at the published rate, small per listing (listing count unknown) |
| **3. Measure** | Search Console for the German host. Read four weeks of impressions before building anything else. Compare against the residency brand's German cluster. | Passive | None |
| **4. Only if it works** | More German guides, a curated set of hero listings, German directory pages, German evergreen support in `verify:seo`. | Depends on results | Unknown |

**Why this order:** phase 1 tests whether Germans respond at all, cheaply, and it is reversible: a door is one entry in `verticals.ts`. The schema change waits until there is a reason to spend it.

**Verification for phase 1 (per AGENTS.md):** `verify:local` green, `verify:i18n` extended for German public namespaces, `verify:seo` extended for the new door, and a plain statement of what was not tested. I would not merge any of it. The first PR touches `verticals.ts`, the lead pipeline and copy that tells visitors facts.

---

## 6. Questions I need answered before starting

1. **Approve Option A?** In particular, a German door on this app with the residency brand handled by links only.
2. **Which domain(s)?** My pick is `immoparaguay.de` plus `paraguayimmo.de` as a redirect, and a Sedo quote for `paraguayimmobilien.de` with your own price ceiling.
3. **Brand name** for the door ("Immo Paraguay"?). The domain is the brand here, so this follows question 2.
4. **Who is the legal provider** for the Impressum (person, Paraguayan company, agency)? And has the EAS/SERPLAID licence been issued yet?
5. **Who answers a German enquiry, in German**, and on which channel (WhatsApp number, email)? There is no portal email by design.
6. **Is a German lawyer available**, and may the German pages wait for their review before going live?
7. **Legal facts:** may I reuse the residency repo's verified-fact mechanism here (a cross-repo decision), or do you want the German door to carry no legal claims at all? Who signs off the `verified: false` facts (USD 200,000; 30% paid; the border zone)?
8. **EUR rate:** who owns updating `USD_EUR_RATE`, and how often? Are you comfortable showing EUR first?
9. **Translation:** are you happy with machine translation for listings, curated German for the pages that rank?
10. **Schema:** is a `listing_translations` table acceptable in principle (phase 2)? It is a founder-run migration.
11. **Consent:** do you want a cookie banner, or the stricter route of no non-essential storage and no third-party requests (including deferring the map) on the German door?
12. **Directory pages on the German door:** hide them, or canonicalise to the English owner?
13. **The Investor Pass link:** how do you want the residency brand to describe property buying? My recommendation is no route claims on the property door at all.

---

## 7. Known unknowns

- Real German search volumes beyond the six terms, Austrian and Swiss demand, and any conversion rate.
- The count of public dictionary lines a German translation needs (§2.3, item 10).
- How the localised paraguayresidency German brand (`paraguayauswandern.de`) is or will be built. The registry I read lists seven brands and my search found Dutch drafts but no German brand code, so I relied on your description.
- What `next.config.ts` does for `www.` variants and hosts (not opened).
- Every Paraguayan legal statement above beyond the two facts already sourced in the residency repo: those need the primary Paraguayan texts.
- All German legal points in §3, which rest on secondary sources and background knowledge.
- Domain renewal prices, Sedo prices, and lawyer costs.

## Sources

- German Impressum law: [IHK Nord Westfalen](https://www.ihk.de/nordwestfalen/recht/aktuelles/handlungsbedarf-f-6369838), [IT-Recht-Kanzlei](https://www.it-recht-kanzlei.de/tmg-ttdsg-ausser-kraft-impressum-datenschutz.html), [eRecht24](https://www.e-recht24.de/news/datenschutz/13296-webseitenbetreiber-aufgepasst-das-tmg-wird-zum-digitale-dienste-gesetz-aktualisieren-sie-jetzt-ihr-impressum.html)
- German broker licence: [IHK München](https://www.ihk-muenchen.de/berufszugang/gewerbeerlaubnisse/34c-erlaubnis/), [IHK Nord Westfalen](https://www.ihk.de/nordwestfalen/branchen/dienstleistung/immobilienmakler/merkblatt-3613330), [dejure.org § 34c GewO](https://dejure.org/gesetze/GewO/34c.html)
- Foreign ownership in Paraguay (secondary): [Rio Times](https://www.riotimesonline.com/buying-property-paraguay-foreigners-2026/), [Clarity Paraguay](https://claritypy.com/blog/buying-property-paraguay-foreigner), [Investor Pass Paraguay](https://investorpassparaguay.com/insights/can-foreigners-buy-property-in-paraguay/)
- Investor Pass real-estate route: MIC Res. 0283/2026, cited in `paraguayresidency/content/shared/facts.ts` — [PDF](https://www.mic.gov.py/wp-content/uploads/2026/04/Res.-N-0283.2026_Constancia-de-Inversionista.pdf). I did not open the PDF myself.
