# Competitive Analysis: inmobiliarios.com.py
*Scanned 2026-09-09 with Playwright. Research only — no copy/images extracted or reused, nothing of theirs saved locally.*

## 1. Site map

| Path | Status | Notes |
|---|---|---|
| `/` | Live | Full landing page: hero + lead form, 3-step explainer, value prop list, "agents with happy clients" showcase |
| `/buscar-agente` (Buscar Agente / agent directory) | **Stub** — "Página en construcción" | No directory exists at all |
| `/unirse-como-agente` (Registrarse / Para Agentes) | **Stub** — "Página en construcción" | No agent signup/monetization page exists |
| `/contacto` | **Stub** — "Página en construcción" | |
| `/blog` (linked as "Valores de mercado") | **Stub** — "Página en construcción" | No content |
| `/servicios` | **404** | Footer link ("Nuestros servicios") is broken |
| `/login` | **404** | Nav link ("Iniciar Sesión") is broken |
| `/nosotros`, `/empleos`, `/cookies`, `/gestionar-cookies`, `/privacidad`, `/terminos` | Present in footer, not individually deep-checked | Given the pattern above, likely stubs or 404s too |
| Agent profile pages | **Do not exist** | The agent cards on the homepage are plain `<div>`s with zero `<a>` links — not clickable, nothing to land on |

**Bottom line: only the homepage is a real page.** Every other nav/footer link (directory, agent signup, contact, blog, login, services) is either a placeholder "under construction" screen or a hard 404. This is essentially a **single-page marketing mock**, not a functioning marketplace.

### Reproducible bug worth flagging
Multiple times during this scan, navigating the site (via `/nosotros`, `/login`, and after a viewport resize) silently redirected the browser to `rentparaguay.com` — a completely unrelated WordPress real-estate site running the default "Brickon" demo theme with lorem-ipsum content and a single "Hello world!" post. This happened intermittently, not on every load, suggesting a shared-hosting/CDN misconfiguration or a stray redirect script rather than a one-off fluke. For a live commercial site this is a serious, embarrassing defect (a visitor can get bounced to a stranger's WordPress placeholder mid-session).

## 2. Core flow: property owner / seller ("get quotes from agents")

This is the one flow that's actually built, and it's the entire site. On the homepage:

1. **Single-step form**, no multi-page wizard — all fields on one screen: Dirección* (address), Tipo de propiedad (dropdown), Habitaciones (dropdown), Superficie m² (number), Nombre*, Correo electrónico*, Teléfono*, Comentarios (free text). Required fields marked with `*`.
2. **CTA**: "Solicitar valoraciones gratuitas" (Request free valuations).
3. **Promise stated in copy** (not shown post-submit, just marketing text): "hasta tres agentes" (up to three agents) will respond, selection "based on previous agent sales and verified recommendations." No visible countdown, live-matching animation, or urgency mechanic — it's a static promise, not a dynamic experience.
4. **No visible confirmation/next-step screen was reachable** — the destination directory (`/buscar-agente`) doesn't exist, and there's no agent-comparison step to land on after submission, so the promised "compare 3 agents" moment (step 2 in their own "1-2-3" explainer) has nowhere to actually happen.
5. I did not submit the form (would create a live fake lead in their system), but structurally the flow is a **single opt-in, no live status indicator, no agent count shown before submitting**.

## 3. Core flow: browsing agents

Doesn't exist as a real flow. On the homepage there's a static "Agentes con clientes satisfechos" (Agents with happy clients) showcase of 4 hard-coded agent cards:

- Photo, name, star rating + review count (e.g. "4.9 / 5 (429 opiniones)"), a "last semester" stat line (sales count / in-progress count / total Gs volume), one pull-quote testimonial, and "Seller in [neighborhood], X hours ago."
- **These cards are not links** — no directory, no filter/search, no individual agent profile page to click into. It's decorative social proof, not a real directory.
- One card (Carlos Duarte) shows "1 venta | 2 en curso | 0 Gs" with only 2 reviews — thin/padded inventory dressed up in the same UI as agents with hundreds of reviews, which undercuts the credibility of the showcase.

## 4. Monetization signal for agents

"Para Agentes" / "Registrarse" / "Activar cuenta" all point to the same `/unirse-como-agente` URL, which is a construction stub. **No pricing, no tiers, no value proposition for agents exists anywhere on the live site.** For a lead-gen marketplace, the supply side (getting agents to pay for leads) is the other half of the business model, and it's entirely absent.

## 5. Quality assessment

- **Feel/speed**: Homepage loads fast, clean minimal layout, Tailwind-ish utility styling. No perceptible jank on the one real page.
- **Design maturity**: Reads like a well-executed template/starter (the `<meta name="author" content="Vibe">` and `twitter:site: @Vibe` tags in the source point to it being built with a "Vibe"-branded site generator/template, never customized). Visual language is generic-modern rather than distinctively branded — no unique iconography, illustration style, or brand voice beyond a stock-photo hero image.
- **Mobile**: Responsive and legible at 390px width; hero, checklist, and form all reflow cleanly. No mobile-specific issues found on the one real page.
- **Inventory**: Effectively zero real agents — 4 static, non-clickable cards is the entire "network" shown to visitors. No count of active agents/agencies, no coverage-area map, nothing indicating real supply.
- **Trust signals**: Star ratings and review counts are shown on the homepage cards, but since there's no agent profile or directory, there's no way to verify these are real reviews vs. placeholder data. No verification badges, no license/credential info, no "as seen in" or partner logos beyond a vague "CAPADEI & Familiar" mention with no explanation of what either is.
- **SEO basics**: Title tag is literally truncated mid-word in the raw `<title>` source ("...tu Ven" — should presumably end in "Venta"), meaning whoever set it never checked the rendered `<title>`. Meta description is present and reasonable. `og:image` and `twitter:image` are empty strings. No canonical tag, no robots meta tag found. Combined with 3+ dead/stub routes reachable from primary nav, this is a site that would confuse crawlers and hurt its own indexing — classic signs of an unfinished/rushed launch.
- **Broken/confusing**: Primary nav items ("Buscar Agente", "Registrarse", "Iniciar Sesión") and footer items ("Nuestros servicios") lead to stubs or 404s. The random redirect to a stranger's WordPress site is the most damaging issue found — it actively breaks trust mid-session.

## 6. What's genuinely worth learning from

- **The 3-step mental model on the homepage** ("Completa tus datos → Compara Agentes → Contrata al Mejor") is a clean, easy-to-grasp explanation of a hittamäklare-style flow — worth keeping conceptually even though they never built steps 2–3.
- **Single unified form with clear required-field marking** keeps friction low for a first-touch lead — no unnecessary multi-page wizard before the user has committed.
- **Pairing the CTA with concrete stats** (sales count, in-progress count, Gs volume) on agent cards is a good instinct for building trust through numbers, even though execution here is fake/thin — a real version of this (backed by actual data) would be a strong differentiator.

## 7. Concrete opportunities for a better version

- **Actually build the marketplace loop end-to-end.** Their single biggest weakness is that only the acquisition step (lead form) exists — directory, agent profiles, and agent-side signup are all missing. Shipping a real, even minimal, version of all three would immediately put us ahead.
- **Show live matching status after submit** — e.g. "3 agentes cerca de tu zona están revisando tu solicitud" with a light progress/pending state, instead of a static promise with no visible next step. Creates urgency and reduces the "did this even work?" doubt their flow leaves you with.
- **Make agent cards real, clickable profiles** with a proper directory: filter by zona/comuna, property type specialty, verified review count, and a real profile page (bio, listing history, service area map, contact). Their cards are dead-ends.
- **Guard against thin-inventory embarrassment** — don't show a "trusted agent" card with 2 reviews and 0 Gs in sales next to one with 429 reviews; either set a minimum threshold to appear, or design a distinct "new agent" treatment.
- **Real trust/verification layer**: license number or professional registration display, a verified-review system (e.g. review only unlockable after a confirmed transaction), and visible moderation — none of which is present or even fakeable here since there's no review surface at all yet.
- **A real agent-facing monetization page** with pricing/tiers and a clear value prop ("get first access to N leads/month in your zona") — this is completely absent on their site and is core to a two-sided marketplace's revenue.
- **Fix the basics before launch**: full `<title>`, canonical tags, OG/Twitter image, no dead nav links, no cross-domain redirect bugs. These are cheap wins that a competitor visibly missed, and doing them right helps both indexing and first-impression trust.
- **A comparison view for the seller**, showing 2–3 competing agent proposals side by side (photo, stats, a short pitch, price estimate) — the thing their own "Compara Agentes" step promises but never delivers. This is the actual differentiating value of a hittamäklare-style product and is the single most obvious gap to fill first.
