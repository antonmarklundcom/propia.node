/**
 * English dictionary (Batch 3, layer 2).
 *
 * The audience is not "the Spanish site, in English". Per PLAN.md D6 the
 * English door is `realestateinparaguay.com`, pitched at **foreign buyers and
 * investors** — someone who has never been to Asunción, does not know what a
 * *quinta* or *entrega inmediata* is, and cannot be assumed to know that a
 * foreigner may own property in Paraguay outright. So this is a translation of
 * intent, not of sentences: the same key can carry different emphasis here.
 *
 * Three rules it follows:
 *
 * 1. **Nothing is invented.** Where the Spanish copy states a fact about the
 *    product (free to publish, no commission, medians computed from asking
 *    prices), the English says the same fact. Where it names a number, the
 *    number comes from the same place.
 * 2. **Local nouns are explained, not dropped.** *Barrio* stays as
 *    "neighbourhood", *cuota* becomes "estimated monthly payment", *en pozo*
 *    becomes "pre-construction" — the terms a foreign buyer's own market uses.
 * 3. **No brand is baked in.** Copy that names the site takes `brand` as an
 *    argument, exactly as the Spanish does, because the domain is the brand
 *    and each door carries its own name.
 *
 * This file is inert until a host declares `locale: "en"` in `verticals.ts` —
 * both live hosts are `"es"` today, and the flip is a whole checklist (D6),
 * never a one-line change. What it does buy immediately is that `Dictionary`
 * has two implementations, so a key added to one and forgotten in the other
 * is a type error rather than a blank string on a live page.
 */
// Pure (config + a lookup table, no `next/*`) — see the same import in es.ts.
import { rentalPath } from "@/design/sections";

/**
 * English peer of `esSiteNotice` (es.ts). Not part of the `Dictionary` shape
 * (same as `esSiteNotice` itself) — `SiteNotice` reads whichever one matches
 * the request locale directly, the same pattern `esPrecios`/`inquiryPrefillFor`
 * already use outside the dictionary.
 */
export const enSiteNotice = {
  label: "Site under construction",
  body: (brand: string) =>
    `We're preparing the launch of ${brand}. The properties you see are sample listings: they are not real properties for sale, and the data and photos may not correspond to any existing property.`,
} as const;

export const en = {
  searchPlaceholder: "Where do you want to live?",
  publishCta: "List for free",
  contactWhatsapp: "Contact on WhatsApp",
  priceAlert: "Alert me if the price drops",
  wizardNext: "Next →",
  wizardPrev: "Back",
  valuationMagnet: "What is your property worth? Find out free",
  emptyState:
    "No properties here yet — set up an alert and we will let you know",
  rentalsHero: "Your next place is waiting.",
  foreignToggle: "Show your property to the world",
  foreignToggleDetail:
    "🌎 Your property will also be shown to overseas buyers on our English site — at no extra cost.",
  inquiryPrefill: "Hi, I am interested in this property.",
  quickQuestions: ["Still available?", "Can I visit?", "What is required?"],
} as const;

/** Peer of esContactForm — see that namespace's comment. */
export const enContactForm = {
  nameLabel: "Name",
  namePlaceholder: "Enter your name",
  emailLabel: "Email",
  emailPlaceholder: "Enter your email",
  phoneLabel: "Phone",
  phonePlaceholder: "981 234 567",
  messageLabel: "Message",
  submitIdle: "Send Message",
  submitSending: "Sending…",
  submitSent: "Message sent!",
  waContinue: "💬 Continue on WhatsApp",
  errorText: "We couldn't send your inquiry. Please try again in a moment.",
  directNote: "✓ Your inquiry goes straight to the seller",
  waLinkLabel: "💬 WhatsApp",
  phoneLinkLabel: "📞 See phone number",
} as const;

export const enSearchBar = {
  operationLabel: "I want to",
  operationBuy: "Buy",
  operationRent: "Rent",
  cityLabel: "City",
  cityAny: "All cities",
  typeLabel: "Type",
  typeAny: "All types",
  budgetLabel: "Budget",
  budgetAny: "No limit",
  /** Locale-aware on purpose: the thousands separator is not universal. */
  budgetUpTo: (amount: number, locale: string) =>
    `Up to US$ ${amount.toLocaleString(locale)}`,
  submit: "Search",
} as const;

/** Category page filter bar — a plain GET form, no client JS. */
export const enFilters = {
  priceMinLabel: "Min. price (US$)",
  priceMinPlaceholder: "No minimum",
  priceMaxLabel: "Max. price (US$)",
  priceMaxPlaceholder: "No maximum",
  bedroomsLabel: "Bedrooms",
  bedroomsAny: "Any",
  sortLabel: "Sort by",
  sortRecent: "Most recent",
  sortPriceAsc: "Lowest price",
  sortPriceDesc: "Highest price",
  submit: "Filter",
  clear: "Clear filters",
} as const;

/** Listing card — the grid tile. */
export const enCard = {
  operationBadge: {
    venta: "For sale",
    alquiler: "For rent",
    alquiler_temporal: "Short-term rental",
  } as Record<string, string>,
  featured: "Featured",
  verified: "Verified",
  noPhoto: "Photo coming soon",
  bedroomsShort: (n: number) => `${n} bed`,
  bathrooms: (n: number) => `${n} ${n === 1 ? "bath" : "baths"}`,
  area: (m2: number) => `${m2} m²`,
  foreignPill: "Listed in English",
  featuredPill: "Featured",
  cuotaLine: (cuota: string) => `Est. payment ${cuota}`,
  // "Variant A, guide-first" card variant (realestateinparaguay.com guide §5
  // "Listing card"): `US$ 806/m²` next to the native price line.
  cardPerM2: (v: string) => `${v}/m²`,
} as const;

/**
 * English peer of esNordico. Not currently rendered anywhere —
 * realestateinparaguay.com keeps its own guide-first design (PR 3) and never
 * selects the Nórdico home/card components — but kept in the same shape so
 * `Dictionary` stays satisfiable and a future call site needs no new key.
 */
export const enNordico = {
  headerVender: "Sell",
  headerVenderCtaFull: "List your property",
  headerVenderCtaShort: "Sell",
  heroKicker: "Buying and renting in Paraguay",
  heroTitle: "The modern way to sell your property in Paraguay",
  heroSubtitle:
    "Professional photography, digital marketing and buyers from abroad. You bring the property, we bring the process.",
  heroSell: "List your property",
  heroSearch: "Search properties",
  proofRow: [
    {
      numeral: "Digital marketing",
      label: "Included with every property listed",
    },
    {
      numeral: "Professional photography",
      label: "Included with every listing",
    },
    { numeral: "2 languages", label: "Spanish and English, one listing" },
    { numeral: "3 sites", label: "Your property, across the network" },
  ],
  recentTitle: "Recently listed",
  recentMore: "See all",
  processTitle: "A selling process, not a listing.",
  processSteps: [
    {
      title: "Data-based valuation",
      text: "A price range based on real comparable sales, not a hunch.",
    },
    {
      title: "Photography and styling",
      text: "Professional photography and staging built to sell, not just to show.",
    },
    {
      title: "Published in Spanish and English",
      text: "The same listing reaches local buyers and buyers from abroad.",
    },
    {
      title: "Negotiation and closing",
      text: "We stay with you through signing, with the process documented at every step.",
    },
  ],
  processCta: "Start selling",
  citiesTitle: "Search by city",
  whySellTitle: "Why sell here",
  whySellCards: [
    {
      title: "Photography and styling",
      text: "Every property gets professional photography and staging that helps it sell faster.",
    },
    {
      title: "Digital marketing",
      text: "Your listing is promoted on social media and search, not just published and forgotten.",
    },
    {
      title: "Buyers from abroad",
      text: "The same listing is translated and published on realestateinparaguay.com, the door to foreign buyers.",
    },
  ],
  whySellCta: "I want to sell this way",
  partnersTitle: "For real estate agencies",
  partnersText:
    "Publish your whole portfolio, gain international exposure and get your own leads with no middleman.",
  partnersCta: "Learn more",
} as const;

/**
 * English peer of `esVender` (src/i18n/es.ts) — required for `Dictionary`'s
 * shape (`npm run verify:i18n` walks both dictionaries) even though this
 * copy is never rendered: `/vender` exists on the Spanish door only, and
 * `sellerLandingEnabled()` (src/design/sections.ts) redirects the English
 * door's `/vender` request to `/` before any page reads this namespace. Same
 * inverse situation as `esGuideEn` (Spanish copy that only exists for shape
 * parity), mirrored the other way around.
 */
export const enVender = {
  metaTitle: "Sell your property for the best price",
  metaDescription: (brand: string) =>
    `Sell with ${brand}: professional photography, digital marketing, data-based valuation and buyers from abroad. No cost, no exclusivity.`,
  heroKicker: "Sell with us",
  heroTitle: "Sell for the best price, with a process you can see.",
  heroSubtitleLines: [
    "Professional photography and home styling for your property.",
    "Digital marketing and listing in Spanish and English.",
    "A documented sales process, not just another listing.",
  ],
  formTitle: "I want a valuation",
  formNameLabel: "Name",
  formPhoneLabel: "Phone (WhatsApp)",
  formCityLabel: "City / neighborhood",
  formCityPlaceholder: "Choose your city",
  formTypeLabel: "Property type",
  formTypePlaceholder: "Choose the type",
  formMessageLabel: "Message (optional)",
  formMessagePlaceholder: "Tell us more about your property",
  formSubmit: "I want a valuation",
  formSending: "Sending…",
  formNote: "No cost. No commitment.",
  formSuccessTitle: "Done! We received your details.",
  formSuccessText: "We'll reach out on WhatsApp to schedule the valuation.",
  formError: "We couldn't send your message. Try again or write to us on WhatsApp.",
  formPhoneError: "Enter a valid WhatsApp number.",
  formFineprintPrefix: "By submitting you accept",
  formFineprintAnd: "and the",
  formTerms: "our terms",
  formPrivacy: "privacy policy",
  differentTitle: "What we do differently",
  differentCards: [
    {
      title: "Professional photography and video",
      text: "Professional photography and a short video for every property, included in the listing.",
    },
    {
      title: "Home styling",
      text: "Staging designed to show each room's potential, not just photograph it as-is.",
    },
    {
      title: "Data-based valuation",
      text: "A price range based on real comparable sales in the area, not a guess.",
    },
    {
      title: "Listed in Spanish and English",
      text: "The same listing reaches local buyers and buyers searching from abroad.",
    },
    {
      title: "Digital marketing",
      text: "Paid promotion on Meta, Google and portals — your listing is promoted, not just posted.",
    },
    {
      title: "A network of sites",
      text: "Your property visible on inmobiliaria.com.py and on realestateinparaguay.com, the door for buyers from abroad.",
    },
  ],
  foreignTitle: "Buyers from abroad",
  foreignText:
    "Every property is also published on realestateinparaguay.com, the portal's door for buyers searching from another country, with its listing on its way to being translated into English.",
  foreignPoints: [
    "Also published on realestateinparaguay.com",
    "Reference price in US dollars",
    "Direct WhatsApp contact, no middleman",
  ],
  foreignImageLabel: "Preview of realestateinparaguay.com",
  foreignImagePlaceholderNote: "Reference image — pending replacement",
  behindTitle: "Who's behind it",
  behindName: "Anton Marklund (name to confirm)",
  behindRole: "Founder of Inmobiliaria Paraguay and the portal's network of sites.",
  behindCompany: (brand: string) =>
    `${brand} is a service of EAS (legal entity name to confirm).`,
  behindLicense: "No professional license currently published.",
  behindPhotoLabel: "Founder's photo",
  behindPhotoPlaceholderNote: "Reference image — pending replacement",
  faqTitle: "Questions from sellers",
  faq: [
    {
      q: "Do you charge a commission to sell with you?",
      a: "We don't charge a commission on the sale. Listing is free; if your property is handled by an agency or agent from the network, their fees are agreed directly with them.",
    },
    {
      q: "How long does it take to sell my property?",
      a: "It depends on price, location and market conditions — we don't give a generic timeline. A data-based valuation avoids the most common mistake: listing above market price and going months with no inquiries.",
    },
    {
      q: "Do I have to give you exclusivity?",
      a: "No. Publishing grants us a non-exclusive, free license to show your property — you can keep selling it on your own or with another agency at the same time.",
    },
    {
      q: "What happens if it doesn't sell?",
      a: "There's no cost and no time commitment. You can adjust the price, update the photos or pause the listing whenever you want.",
    },
    {
      q: "Who handles the showings?",
      a: "Inquiries reach you directly on WhatsApp. If you're listing as a private seller, you coordinate showings yourself; if your property is handled by an agency or agent from the network, they handle contact and showings.",
    },
  ],
  closingTitle: "Ready to sell?",
  closingText: "Leave your details and we'll reach out to start the valuation.",
} as const;

/**
 * "Variant A, guide-first" strings (docs/style/realestateinparaguay.com.md),
 * the English door's own home page, header/footer chrome, card and detail
 * additions. Tone per guide §1: "plain declarative English, facts before
 * adjectives, numbers with sources... never stunning, exclusive, paradise."
 *
 * Every rate, fee, timeline and legal claim below is a placeholder pending a
 * real source — marked "(verify before launch)" rather than stated as fact,
 * per build-prompt.md's explicit instruction and the lesson CLAUDE.md
 * already records about a fabricated "48h" figure that shipped once. None of
 * these numbers should reach a visitor unverified; see the PR description.
 */
export const enGuideEn = {
  chromeNav: [
    { label: "Buy", href: "/venta" },
    { label: "Rent", href: "/alquiler" },
    { label: "Land", href: "/venta/asuncion/terrenos" },
    { label: "New developments", href: "/proyectos" },
    { label: "How it works", href: "/guias/buying-property-in-paraguay" },
    { label: "Guides", href: "/guias" },
  ],
  footerBuyTitle: "Buy",
  footerBuyLinks: [
    { label: "Property in Asunción", href: "/venta/asuncion" },
    { label: "Property in San Bernardino", href: "/venta/san-bernardino" },
    { label: "Property in Encarnación", href: "/venta/encarnacion" },
    { label: "Property in Ciudad del Este", href: "/venta/ciudad-del-este" },
    { label: "Land for sale", href: "/venta/asuncion/terrenos" },
    { label: "New developments", href: "/proyectos" },
  ],
  footerGuidesTitle: "Guides",
  footerGuidesLinks: [
    { label: "How buying works", href: "/guias/buying-property-in-paraguay" },
    { label: "Costs and taxes", href: "/guias/costs-and-taxes-buying-in-paraguay" },
    { label: "Residency", href: "/guias/residency-in-paraguay" },
    { label: "All guides", href: "/guias" },
  ],
  footerAreasTitle: "Areas",
  footerAreasLinks: [
    { label: "Asunción — Villa Morra", href: "/venta/asuncion" },
    { label: "San Bernardino", href: "/venta/san-bernardino" },
    { label: "Encarnación", href: "/venta/encarnacion" },
    { label: "Ciudad del Este", href: "/venta/ciudad-del-este" },
    { label: "Luque", href: "/venta/luque" },
  ],
  footerCompanyTitle: "Company",
  footerCompanyLinks: [
    { label: "About", href: "/nosotros" },
    { label: "Contact", href: "/contacto" },
  ],
  footerLegalTitle: "Legal",
  footerLegalLinks: [
    { label: "Terms", href: "/terminos" },
    { label: "Privacy policy", href: "/privacidad" },
  ],
  footerVersionEs: "Versión en español",
  footerTagline:
    "A guide-first portal for buying property in Paraguay from abroad — freehold ownership, USD pricing and the public-deed process, alongside real listings.",
  footerContactUs: "Contact us",
  footerAddress: "Asunción, Paraguay",
  footerLegalLine: (brand: string) =>
    `${brand} is a service of EAS. Published reference prices and cost estimates are indicative only and do not constitute legal, tax or financial advice.`,
  heroKicker: "Property in Paraguay · For international buyers",
  heroTitleLead: "Buy property in Paraguay. ",
  heroTitleAccent: "Freehold",
  heroTitleTail: ", in US dollars, from abroad.",
  heroStrap:
    "Foreigners can own land and homes outright; purchases are priced and paid in USD; title passes by public deed before a notary and is registered nationally.",
  heroGuideLink: "Or start with the guide: How buying works →",
  factsStrip: [
    { numeral: "Freehold", label: "Foreign ownership allowed (verify before launch)" },
    { numeral: "USD", label: "Priced and paid in US dollars" },
    { numeral: "≈ 3–5%", label: "Total purchase costs (verify before launch)" },
    { numeral: "Public deed", label: "Notarised and registered" },
  ],
  newWeekTitle: "New this week",
  newWeekMore: "See all →",
  whyTitle: "Why Paraguay",
  whyReadGuide: "Read the guide →",
  whyCards: [
    {
      title: "Ownership",
      text: "Freehold for foreigners in most cases — some rural and border-zone land carries restrictions (verify before launch).",
      href: "/guias/buying-property-in-paraguay",
    },
    {
      title: "Cost of living and taxes",
      text: "A territorial tax system, with a flat 10% rate (verify before launch).",
      href: "/guias/costs-and-taxes-buying-in-paraguay",
    },
    {
      title: "Residency",
      text: "Temporary through permanent — requirements and timelines (verify before launch).",
      href: "/guias/residency-in-paraguay",
    },
  ],
  whereTitle: "Where to buy",
  whereTiles: [
    { name: "Asunción — Villa Morra", slug: "asuncion", why: "The capital's most established business and lifestyle district." },
    { name: "San Bernardino", slug: "san-bernardino", why: "Weekend houses on Lake Ypacaraí." },
    { name: "Encarnación", slug: "encarnacion", why: "On the Paraná river, milder climate, high quality of life." },
    { name: "Ciudad del Este", slug: "ciudad-del-este", why: "Commercial border crossing with Brazil and Argentina." },
    { name: "Luque", slug: "luque", why: "Growing metro-area suburb, near the airport." },
  ],
  howTitle: "How buying works",
  howSteps: [
    { title: "Choose and verify", text: "Find the property and verify the basic facts of its title.", who: "Buyer", time: "Varies" },
    { title: "Offer and reservation", text: "A price is agreed and a reservation is signed.", who: "Buyer and seller", time: "1–2 weeks (verify before launch)" },
    { title: "Due diligence on title", text: "Verification with the Registro Público (Public Registry).", who: "Notary (escribano)", time: "2–4 weeks (verify before launch)" },
    { title: "Public deed before a notary", text: "Signing before an escribano.", who: "Notary (escribano)", time: "1 day (verify before launch)" },
    { title: "Registration and handover", text: "Registration and key handover.", who: "Notary (escribano)", time: "2–6 weeks (verify before launch)" },
  ],
  costsTableTitle: "Costs of buying",
  costsTableHead: ["Item", "Who pays", "Typical %"],
  costsRows: [
    { item: "Transfer tax", who: "Buyer", typical: "≈ 1.5–2% (verify before launch)" },
    { item: "Notary fees", who: "Buyer", typical: "≈ 1–3% (verify before launch)" },
    { item: "Registration", who: "Buyer", typical: "≈ 0.5–1% (verify before launch)" },
    { item: "Agent commission", who: "Seller (typically)", typical: "≈ 3–5% (verify before launch)" },
  ],
  relocationTitle: "Relocation",
  relocationCards: [
    { title: "Moving", text: "What to bring and how to enter the country (verify before launch).", href: "/guias/residency-in-paraguay" },
    { title: "Banking", text: "Opening an account as a foreigner (verify before launch).", href: "/guias/costs-and-taxes-buying-in-paraguay" },
    { title: "Schools", text: "Bilingual options in and around Asunción.", href: "/guias/residency-in-paraguay" },
    { title: "Healthcare", text: "Private and public coverage (verify before launch).", href: "/guias/residency-in-paraguay" },
  ],
  faqTitle: "Frequently asked questions",
  faqSubtitle: (brand: string) => `What you need to know before buying, from ${brand}.`,
  faq: [
    { q: "Can foreigners own land in Paraguay?", a: "Yes, freehold in most cases (verify before launch)." },
    { q: "Do I need to be there in person?", a: "Not always — a power of attorney can authorise someone to sign on your behalf (verify before launch)." },
    { q: "How do I send money?", a: "International bank transfer to a Paraguayan account or the notary's escrow (verify before launch)." },
    { q: "What is a cédula?", a: "The Paraguayan national ID document; not always required to buy (verify before launch)." },
  ],
  cardPerM2: (v: string) => `${v}/m²`,
  cardSqftArea: (sqft: string, m2: string) => `${sqft} sq ft (${m2} m²)`,
  foreignerBoxTitle: "Buying this property as a foreigner",
  foreignerBoxOwnershipLabel: "Ownership type",
  foreignerBoxOwnershipValue: "Freehold (verify before launch)",
  foreignerBoxTitleStatusLabel: "Title status",
  foreignerBoxTitleStatusValue: "Verify with the Registro Público",
  foreignerBoxCostsLabel: "Estimated closing costs",
  foreignerBoxCostsValue: (v: string) => `≈ ${v} (verify before launch)`,
  foreignerBoxNextStepLabel: "Next step",
  foreignerBoxNextStepValue: "Contact the seller and request a title verification.",
  replyInEnglish: "We reply in English",
} as const;

/** Home page. */
export const enHome = {
  metaDescription:
    "Houses, apartments and land for sale and rent across Paraguay, with estimated monthly payments and financing.",
  publishWaPrefill: (brand: string) =>
    `Hi, I would like to list a property on ${brand}.`,

  heroKicker: "Asunción · Paraguay",
  heroTitleLead: "Find your property in ",
  heroTitleHighlight: "Paraguay",
  heroSubtitle:
    "Houses, apartments and land for sale and rent — with estimated monthly payments and financing.",
  heroSeeListings: "Browse properties",
  heroSellCta: "Sell my property",
  heroStatCount: (total: string) => `${total} properties listed`,
  heroStatCountEmpty: "Properties across Paraguay",
  heroStatUpdated: "Updated daily",

  zonesKicker: "Areas",
  zonesTitle: "Where do you want to live",
  zonesAll: "See all areas →",
  /**
   * The one translatable half of a zone card. Name, slug and photograph are
   * structural and stay in `app/page.tsx`; the strapline is copy, so it lives
   * here keyed by slug. Written for someone who has never been: each line says
   * what the area *is*, not only what it is called.
   */
  zoneCardSub: {
    asuncion: "The capital — the widest choice",
    "san-bernardino": "Lake Ypacaraí, weekend houses",
    luque: "A growing area next to the capital",
    encarnacion: "On the Paraná river, high quality of life",
  } as Record<string, string>,

  howTitle: "How it works",
  howSubtitle: "Search, compare and contact. Free, no sign-up, no commission.",
  howMore: "Read the full guide →",
  howSteps: [
    {
      icon: "🔎",
      title: "Search by area and budget",
      text: "Filter by city, neighbourhood, property type and price range. See the results as a list or on the map.",
    },
    {
      icon: "📊",
      title: "Compare against the market",
      text: "Every property for sale shows its estimated monthly payment, and we publish the median price per m² for each city.",
    },
    {
      icon: "💬",
      title: "Contact directly",
      text: "Message whoever listed the property on WhatsApp, straight from the listing — no middleman, no fee.",
    },
  ],

  sellKicker: "Selling",
  sellTitle: "Sell with people who know the market",
  sellText:
    "List your property for free and reach buyers across Paraguay. We give you an estimated price range built from the listings published in your area, so you know where you stand before you decide.",
  sellImageAlt: "Interior of a house in Paraguay",
  sellValuationCta: "Request a valuation",
  sellPublishCta: "List a property →",

  investKicker: "Investing",
  investTitle: "Invest in Paraguay on data, not on hunches",
  investText:
    "We publish the median price per m² for each city, calculated from the listings on the portal, and the estimated monthly payment on every property for sale under the financing programmes currently available.",
  investImageAlt: "Asunción at sunset",
  investPricesCta: "See prices by area",
  investFinancingCta: "How financing works →",

  projectsTitle: "🏗 New developments in Paraguay",
  projectsSubtitle:
    "Verified new-build — apartments pre-construction, under construction and ready to move in.",

  citiesTitle: "Browse by city",

  rowMore: "See all →",
  rowRecommended: "Recommended properties",
  rowHousesForSale: "Houses for sale — Asunción and around",
  rowFlatsForSale: "Apartments for sale — Asunción",
  rowRentals: "Rentals in Asunción",
  rowLand: "Land",

  developersTitle: "Featured developers",
  developersSubtitle: "See who builds the country's developments.",
  developerProjectCount: (n: number) =>
    `${n} ${n === 1 ? "development" : "developments"}`,

  pricesTitle: "📊 Reference prices by city",
  pricesMore: "See all →",
  pricesSubtitle:
    "Median price per m², calculated from published listings. So you can tell whether a listing is in line with its area before you negotiate.",
  pricesSample: (n: string) => `${n} listings analysed`,

  values: [
    {
      icon: "✅",
      title: "Direct contact",
      text: "You speak to the seller or the agency directly, with no middleman.",
    },
    {
      icon: "💳",
      title: "Estimated monthly payment",
      text: "Every property for sale shows its monthly payment under current financing.",
    },
    {
      icon: "🇵🇾",
      title: "Built for Paraguay",
      text: "Prices in guaraníes and dollars, real neighbourhoods, and WhatsApp first.",
    },
  ],

  discoverTitle: (brand: string) => `Discover more on ${brand}`,
  discoverCards: [
    {
      icon: "🏡",
      title: "List your property for free",
      text: "Add photos, price and location in minutes. No commission, no listing fee.",
      cta: "List now",
      href: "/publicar",
    },
    {
      icon: "💰",
      title: en.valuationMagnet,
      text: "We give you an estimated range from the prices published in the area. Free, and no sign-up.",
      cta: "Calculate free",
      href: "/tasacion",
    },
    {
      icon: "📊",
      title: "Market prices",
      text: "Median price per m² in each city, calculated from the portal's published listings.",
      cta: "See prices",
      href: "/precios",
    },
    {
      icon: "🏦",
      title: "Financing and monthly payments",
      text: "Which programmes exist in Paraguay, what they ask for, and how we estimate each listing's monthly payment.",
      cta: "Read the guide",
      href: "/financiamiento",
    },
  ],

  proKicker: "For agencies and agents",
  proTitle: "Do you sell property every day?",
  proText:
    "List your whole portfolio, show your agency with a verified profile, and get enquiries straight to your WhatsApp. No fee per listing, no fee per lead, and no commission on your deals.",
  proBullets: [
    "✓ Unlimited listings on the free plan",
    "✓ A public profile for the agency and for each agent",
    "✓ Portfolio import from a spreadsheet or a link",
    "✓ A dashboard with the enquiries on every property",
  ],
  proMore: "Learn more",
  proPlans: "See plans →",
  proAgencyCardTitle: "Agency directory",
  proAgencyCardText: "See who already lists their portfolio on the portal.",
  proProjectsCardTitle: "Developers and developments",
  proProjectsCardText: "New-build, pre-construction and ready to move in.",

  ctaTitle: "List your property for free",
  ctaText:
    "Reach thousands of buyers and tenants across Paraguay. Simple, fast and free.",
  ctaButton: "List now",
  ctaWhatsapp: "or message us on WhatsApp",

  newsletterTitle: "Property opportunities, once a week",
  newsletterText:
    "Curated properties, market signals and news from the sector — in your inbox. No spam, unsubscribe whenever you like.",

  faqTitle: "Frequently asked questions",
  faqSubtitle: (brand: string) => `Everything you need to know about ${brand}.`,
  faqMore: "See all questions →",
} as const;

/** National operation hubs: /venta, /alquiler, /alquiler-temporal. */
export const enHub = {
  copy: {
    venta: {
      h1: "Property for sale in Paraguay",
      lead: "Houses, apartments, land and commercial units for sale across the country. Every listing shows its estimated monthly payment, so you know from the start whether the number works for you.",
      label: "For sale",
      cityLabel: "Buy in",
    },
    alquiler: {
      h1: "Property for rent in Paraguay",
      lead: "Apartments, houses, offices and commercial units for rent across the country. Contact the owner or the agency directly — the portal takes no commission.",
      label: "For rent",
      cityLabel: "Rent in",
    },
    alquiler_temporal: {
      h1: "Short-term rentals in Paraguay",
      lead: "Short stays and seasonal rentals across the country.",
      label: "Short-term rental",
      cityLabel: "Short-term rentals in",
    },
  } as Record<
    string,
    { h1: string; lead: string; label: string; cityLabel: string }
  >,
  breadcrumbHome: "Home",
  count: (total: string) => `${total} properties listed`,
  byTypeTitle: "By property type",
  byTypeSubtitle: (opLabel: string) =>
    `Choose what you are looking for. The totals are listings published today under ${opLabel}.`,
  byCityTitle: "By city",
  byCitySubtitle:
    "Every city with active inventory, ordered by number of listings.",
  latestTitle: "Latest listings",
  latestNoteLead: "Looking in one particular area? Go to",
  latestNoteTail: "and filter by neighbourhood, price and bedrooms.",
  emptyBody: (opLabel: string) =>
    `There are no properties listed under ${opLabel} yet.`,
  emptyCta: "List the first one",
  ctaTitleSale: "Selling a property?",
  ctaTitleRent: "Have a property to rent out?",
  ctaText: "List it free and reach the people searching in your area.",
  ctaPrimary: "List for free",
  ctaSecondary: "What is it worth?",
} as const;

/** Category grid: /[operacion]/[...segments]. */
export const enCategory = {
  operationLabel: {
    venta: "for sale",
    alquiler: "for rent",
    alquiler_temporal: "for short-term rent",
  } as Record<string, string>,
  typeLabel: {
    casa: "Houses",
    departamento: "Apartments",
    terreno: "Land",
    duplex: "Duplexes",
    comercial: "Commercial units",
    oficina: "Offices",
    deposito: "Warehouses",
    quinta: "Country houses",
  } as Record<string, string>,
  typeLabelAny: "Properties",
  /**
   * "Houses for sale in Villa Morra, Asunción".
   *
   * English puts the operation between the type and the place, where Spanish
   * repeats "en" — which is why this is a function per locale and not a
   * template assembled at the call site.
   */
  title: (typeLabel: string, opLabel: string, where: string) =>
    `${typeLabel} ${opLabel} in ${where}`,
  titlePaged: (title: string, page: number) => `${title} — page ${page}`,
  metaNotFound: "Not found",
  metaDescription: (count: number, title: string, brand: string) =>
    `${count} ${title.toLowerCase()} on ${brand}. Find your next property with estimated monthly payments and financing.`,
  breadcrumbHome: "Home",
  count: (n: number) =>
    `${n} ${n === 1 ? "property" : "properties"} available.`,
  emptyTypeNotice: (typeLabel: string, opLabel: string, city: string) =>
    `There are no ${typeLabel.toLowerCase()} ${opLabel} in ${city} right now. Here is everything available in ${city}.`,
  viewSwitchLabel: "View",
  viewList: "List",
  viewMap: "Map",
  filterEmpty: "No properties match these filters.",
  filterEmptyClear: "Clear filters",
  paginationLabel: "Pagination",
  paginationPrev: "← Previous",
  paginationNext: "Next →",
  paginationStatus: (page: number, total: number) => `Page ${page} of ${total}`,
} as const;

/** Property detail: /propiedad/[slug]. */
export const enListing = {
  metaNotFound: "Property not found",
  metaTitle: (title: string, price: string) => `${title} — ${price}`,
  ogTitle: (title: string, brand: string) => `${title} — ${brand}`,
  stateLabel: {
    entrega_inmediata: "Ready to move in",
    en_construccion: "Under construction",
    en_pozo: "Pre-construction",
    usado: "Resale",
  } as Record<string, string>,
  breadcrumbHome: "Home",
  breadcrumbLabel: "Breadcrumb",

  galleryEmpty: "Photos coming soon",
  galleryThumbAlt: (title: string, n: number) => `${title} — photo ${n}`,
  galleryMore: (n: number) => `+${n} photos`,

  factBedrooms: (n: number) => `${n} bed`,
  factBathrooms: (n: number) => `${n} ${n === 1 ? "bath" : "baths"}`,
  factParking: (n: number) => `${n} parking spaces`,
  factArea: (m2: number) => `${m2} m²`,

  priceRentLabel: "Rent",
  priceRentPeriod: "/month",

  financingHead: (program: string) => `💳 With ${program}`,
  financingStateProgram: " (government programme)",
  financingCuotaLabel: "Estimated monthly payment",
  financingTermsLabel: "Terms",
  financingTerms: (rate: string, years: number) =>
    `${rate}% rate · ${years} years`,
  financingFoot:
    "An indicative estimate for this property — approval depends on the bank and on the programme.",

  detailsTitle: "☰ Property details",
  detailBarrio: "Neighbourhood",
  detailCity: "City",
  detailType: "Type",
  detailState: "Condition",
  detailArea: "Built area",
  detailLand: "Land",
  detailParking: "Parking",

  amenitiesTitle: "✨ Property features",
  descriptionTitle: "📄 Description",
  locationTitle: "📍 Approximate location",

  sellerFallback: (brand: string) => `Listed on ${brand}`,
  sellerVerified: "Verified",
  sellerKindAgency: "Agency",
  sellerKindAgent: "Agent",
  /** FSBO: the listing was published by its owner, not by a professional. */
  sellerKindOwner: "Private seller",

  contactTitle: "Interested in this property?",
  contactSubtitle:
    "Get in touch today for more information or to arrange a viewing.",

  similarTitle: "Similar properties",
  fromAgencyTitleLead: "More from",
  fromAgencyFallback: "this agency",

  moreInBarrio: (barrio: string) => `📍 More properties in ${barrio}`,
  moreInCity: (city: string) => `🏙 All properties in ${city}`,

  ctaBarWhatsapp: "Contact on WhatsApp",
  ctaBarConsult: "Enquire",
  ctaBarCall: "Call",

  publishedToday: "Listed today",
  publishedYesterday: "Listed yesterday",
  publishedDaysAgo: (n: number) => `Listed ${n} days ago`,
  publishedWeeksAgo: (n: number) => `Listed ${n} weeks ago`,
  publishedMonthsAgo: (n: number) => `Listed ${n} months ago`,
} as const;

/**
 * Public agency and agent profile pages (/inmobiliaria/[slug], /agente/[slug]).
 * `breadcrumbHome` and `verified` are not repeated here — both pages already
 * read `listing.breadcrumbHome` and `listing.sellerVerified` for those.
 */
export const enProfile = {
  navAriaLabel: "Breadcrumb",
  emptyState: "No properties listed yet",
} as const;

/** Development project page (/proyecto/[slug]). */
export const enProject = {
  stageLabel: {
    en_pozo: "Pre-construction",
    en_construccion: "Under construction",
    entrega_inmediata: "Ready to move in",
  } as Record<string, string>,
  typeLabel: {
    edificio: "Building",
    loteamiento: "Land development",
    condominio: "Condominium",
    barrio_cerrado: "Gated community",
  } as Record<string, string>,
  stateLabel: {
    entrega_inmediata: "Ready to move in",
    en_construccion: "Under construction",
    en_pozo: "Pre-construction",
    usado: "Resale",
  } as Record<string, string>,
  available: "Available",
  developer: "Developer",
  /** Locale-aware on purpose: month names are not universal. */
  delivery: (date: Date, numberLocale: string) =>
    `Delivery ${date.toLocaleDateString(numberLocale, { month: "long", year: "numeric" })}`,
} as const;

/**
 * The rental family's English door, rentparaguay.com. This is the *source*
 * language for this namespace: the copy below is the old rentparaguay.com's
 * own words, cleaned — the theme vendor's fabrications removed (no "400+
 * agents", no demo listings, no testimonials, no invented team), the theme's
 * headline grammar straightened out, and every claim left as the service it
 * describes rather than a number nobody can check (plan §1 item 13).
 *
 * `faq` (S2) is the five real Q&As from the old services page — shown on
 * both the home page and the services hub, the one FAQ this family has.
 */
export const enRental = {
  // Hrefs through `rentalPath()` (R2): this door's own pages are English URLs
  // (`/services`, `/about`, `/contact`) and it 301s the Spanish ones, so a
  // literal here would be a nav full of redirects the day someone forgot.
  // `/alquiler` is not in that table — it is the marketplace's rental hub,
  // Spanish-slugged on every door.
  chromeNav: [
    { label: "Rentals", href: "/alquiler" },
    { label: "Services", href: rentalPath("en", "services") },
    { label: "About", href: rentalPath("en", "about") },
    { label: "Contact", href: rentalPath("en", "contact") },
  ],
  chromeCtaLabel: "Contact us",
  chromeCtaHref: rentalPath("en", "contact"),
  footerTagline:
    "A real estate and property management agency in Asunción for expats, digital nomads and investors. We find it, we rent it, we manage it — in your language.",
  footerServicesTitle: "Services",
  footerCompanyTitle: "Company",
  footerLegalTitle: "Legal",
  footerCompanyLinks: [
    { label: "About us", href: rentalPath("en", "about") },
    { label: "Contact", href: rentalPath("en", "contact") },
    { label: "Rentals", href: "/alquiler" },
  ],
  footerLegalLinks: [
    { label: "Terms", href: "/terminos" },
    { label: "Privacy policy", href: "/privacidad" },
  ],
  footerContactUs: "Write to us",
  footerAddress: "Skytower building, Asunción, Paraguay",
  footerLegalLine: (brand: string) =>
    `${brand} handles the search, the lease and the management. Everything published here is for guidance and is not legal, tax or financial advice.`,

  metaTagline: "Renting and property management in Asunción",
  metaDescription:
    "A real estate and property management agency in Asunción for expats, digital nomads and investors: finding a home, the lease, long-term and Airbnb management, residency and a virtual address.",

  heroKicker: "Renting and property management in Asunción",
  heroTitle: "Renting in Paraguay, made effortless",
  heroSubtitle:
    "We help expats, digital nomads and investors find, rent and manage properties in Asunción. No stress, no language barrier, and no costs that appear at the end.",
  heroPrimary: "Contact us",
  heroSecondary: "See our services",

  servicesTitle: "Services",
  servicesLead: "Everything it takes to move here, stay here, or put your property to work.",
  servicesMore: "See all services →",

  whyTitle: "Why us",
  whyLead:
    "Local expertise, straight answers, and a service built around people arriving from somewhere else.",
  whyCards: [
    {
      title: "We know this market from the inside",
      text: "We have navigated Asunción's property market both as locals and as foreigners, and that double view is what goes into every search.",
    },
    {
      title: "From the first viewing to move-in",
      text: "Property search, lease translation, utility setup and long-term management — we handle the details so you can get on with your life here.",
    },
    {
      title: "Vetted properties, clear numbers",
      text: "We visit every property before we offer it, and we tell you what is paid, when and why, with nothing added at signing.",
    },
    {
      title: "Bilingual by default",
      text: "We work in English and Spanish, so you understand every clause you sign and every conversation we have on your behalf.",
    },
  ],

  processTitle: "How it works",
  processLead: "Four steps, from the first conversation to the keys.",
  processSteps: [
    {
      step: "01",
      title: "First conversation",
      text: "Tell us what you are looking for: neighbourhood, budget, how long for, and who is moving in — or what you want your property to earn.",
    },
    {
      step: "02",
      title: "A shortlist for you",
      text: "We filter the best properties in neighbourhoods like Villa Morra and Carmelitas and send you a handpicked list that matches what you asked for.",
    },
    {
      step: "03",
      title: "Lease and paperwork",
      text: "We negotiate, translate the contract and walk you through signing, so you know exactly what you are committing to.",
    },
    {
      step: "04",
      title: "Keys, and after",
      text: "We help with utilities and getting to know the neighbourhood, and we stay reachable when something needs sorting out.",
    },
  ],

  recentTitle: "Available rentals",
  recentMore: "See all →",

  faqTitle: "Frequently asked questions",
  faqLead: "Short answers to what people ask us most.",
  faq: [
    {
      q: "Do I need to speak Spanish to rent, buy or manage a property here?",
      a: "No. Our team is fully bilingual and handles every negotiation, viewing and legal translation for you — from the first inquiry to signing at the notary (escribanía), you understand every detail in English.",
    },
    {
      q: "I don't have a Paraguayan guarantor — can I still rent?",
      a: "Yes. A local guarantor is one of the biggest hurdles for expats. Because we have relationships with landlords and developers in Asunción, we negotiate alternatives on your behalf — an adjusted deposit or an upfront payment — so you can sign a lease without local ties.",
    },
    {
      q: "Can I invest in property here without living in Paraguay?",
      a: "Yes — that is what our Invest in Paraguay and property management services are for. You provide the capital; we source the property, handle the purchase, style it if it's for Airbnb, place vetted tenants and send you monthly reports and payouts.",
    },
    {
      q: "How long does Paraguayan residency take?",
      a: "Timelines depend on government processing, but our Residency Paraguay service cuts down the friction: we prepare your file in advance, so you only need to be in Asunción for a few days to submit paperwork and biometrics, and we follow the process until your cédula is issued.",
    },
    {
      q: "How does Airbnb management work day to day?",
      a: "We treat your listing like our own: dynamic pricing based on local demand, professional styling and photography, and we handle guest communication, cleaning and maintenance so the reviews and the occupancy stay high.",
    },
  ],

  ctaTitle: "Your next chapter in Paraguay starts here",
  ctaText:
    "Whether you are looking for somewhere to live, want your property to earn, or are weighing up an investment, tell us what you need and we will come back with real options.",
  ctaButton: "Talk to us",

  services: {
    alquiler: {
      title: "Rent an apartment or house",
      tagline:
        "We find your place in Asunción's safest neighbourhoods and handle the negotiation and the lease.",
    },
    administracionAirbnb: {
      title: "Airbnb management",
      tagline:
        "Turn-key short-term management: styling, photography, pricing and all guest communication.",
    },
    administracionDepartamentos: {
      title: "Apartment management",
      tagline:
        "You live abroad and your property is here: tenant screening, rent collection, maintenance and legal compliance.",
    },
    inmobiliariaAsuncion: {
      title: "Realtor in Asunción",
      tagline:
        "Bilingual guidance for buying your first investment here or adding to a portfolio.",
    },
    residenciaParaguay: {
      title: "Residency in Paraguay",
      tagline:
        "We prepare your file and walk you through the whole process, up to your cédula.",
    },
    invertirEnParaguay: {
      title: "Invest in Paraguay",
      tagline:
        "Property and business opportunities for capital you want working in Paraguay.",
    },
    domicilioVirtual: {
      title: "Virtual address",
      tagline:
        "A professional address in Asunción for your legal and commercial needs, without renting an office.",
    },
  },
  hubMetaTitle: "Services",
  hubMetaDescription: (brand: string) =>
    `Renting, property and Airbnb management, residency, investment and a virtual address in Asunción with ${brand}.`,
  hubIntro:
    "Seven services that lean on each other: finding somewhere to live, putting a property to work, staying here legally, and deciding where to invest.",
  allServices: "All services",
  serviceFormTitle: "Get in touch",
  serviceFormLead: "Tell us what you need and we will reply on WhatsApp.",
  about: {
    metaTitle: "About us",
    metaDescription: (brand: string) =>
      `${brand} is a boutique firm in Asunción for expats, digital nomads and investors: renting, management, residency and investment.`,
    h1: "About us",
    lead: "The bridge between arriving here and the Paraguayan market.",
    intro:
      "We started from a gap we kept seeing: investors and expats were arriving in a growing Paraguay and running into local bureaucracy, inconsistent service standards and very little transparency in their own language. We built the firm to be the partner for that arrival.",
    founderTitle: "Who is behind it",
    founderText:
      "Founded by Anton Marklund, a Swedish entrepreneur based in Asunción, the firm combines a Scandinavian way of working — honesty, punctuality, high standards — with on-the-ground experience of the Paraguayan property and legal market.",
    visionTitle: "Vision",
    visionText:
      "To be the most trusted bridge for international capital and talent in Paraguay, and to set the standard for transparency, design and friction-free relocation.",
    missionTitle: "Mission",
    missionText:
      "To take the friction out of an international move with bilingual advice, impeccable property management and a strategic view of the investment.",
    valuesTitle: "How we work",
    values: [
      {
        title: "Transparency",
        text: "Honest, detailed reporting for owners; clear and fair terms for tenants.",
      },
      {
        title: "Respect for your time",
        text: "If it can be done in 24 hours, we will not take 48.",
      },
      {
        title: "We believe in Paraguay",
        text: "We believe in this country's growth, and we are here so you can be part of it safely.",
      },
    ],
  },
  contact: {
    metaTitle: "Contact",
    metaDescription: (brand: string) =>
      `Write to us: ${brand} answers questions about renting, management, residency and investing in Asunción, on WhatsApp.`,
    h1: "Contact",
    lead: "Whether you are moving to Asunción, applying for residency or weighing up an investment, our bilingual team is here to help.",
    formTitle: "Send us a message",
    channelsTitle: "Direct channels",
    officeTitle: "Where we are",
    officeText: "The Skytower building, in the heart of Asunción's financial district.",
    formNote: "Contact form (this is where we answer)",
    reasonRent: "I want to rent or relocate",
    reasonManage: "I have a property to manage",
    reasonInvest: "I want to buy or invest",
  },
} as const;

/** `LeadForm`'s literals in English — see `esLeadForm`. */
export const enLeadForm = {
  reasonLabel: "What is this about?",
  nameLabel: "Name",
  namePlaceholder: "Your name",
  whatsappLabel: "WhatsApp",
  whatsappPlaceholder: "+595 981 234 567",
  emailLabel: "Email (optional)",
  emailPlaceholder: "you@email.com",
  companyLabel: "Company",
  companyPlaceholder: "Company name",
  companyPrefix: "Company",
  messageLabel: "Message",
  messagePlaceholder: "Tell us what you need",
  submitLabel: "Send",
  sending: "Sending…",
  successTitle: "Thank you — we have your message.",
  successText: "We reply on WhatsApp within one business day.",
  invalidPhone: "Enter a valid WhatsApp number.",
  sendError: "We could not send your message. Try again, or write to us on WhatsApp.",
  finePrintLead: "By sending this you accept our ",
  finePrintTerms: "terms",
  finePrintMid: " and our ",
  finePrintPrivacy: "privacy policy",
  finePrintTail: ". We use your details only to reply to you.",
} as const;

/**
 * The seven rental service pages in English — the source language for this
 * namespace. See `esRentalServices` for the shape (plan Appendix C) and for
 * what O3 fills versus what S3 finishes.
 */
export const enRentalServices = {
  alquiler: {
    metaTitle: "Rent an apartment or house in Asunción",
    metaDescription: (brand: string) =>
      `${brand} finds, negotiates and closes your rental in Asunción: safe neighbourhoods, a translated lease and someone with you until you move in.`,
    h1: "Rent an apartment or house",
    tagline:
      "Rentals in Asunción's most sought-after neighbourhoods, for people arriving from abroad who want safety, quality and a move that goes smoothly.",
    intro:
      "Finding somewhere to live in a new country should not be the hardest part of moving there. We handle the search, the viewings, the negotiation and the lease, and we stay with you until you have the keys.",
    challengeTitle: "Why renting here is different",
    challengeText:
      "The Paraguayan rental market is built for people who already have roots here. Most landlords ask for a local guarantor who co-signs your lease: we negotiate alternatives, such as a different deposit, so you do not need to know someone with property. The contract is in legal Spanish, so we translate all of it and negotiate on your behalf. And many of the best properties are never listed at all — those come through a local network, not a search.",
    frameworkTitle: "How we run your search",
    framework: [
      {
        title: "What you need",
        text: "We start with how you live: near an international school, near the financial district, near where you train or where you work.",
      },
      {
        title: "Guided viewings",
        text: "We build a shortlist and take you to see it, with honest feedback on build quality and on the neighbourhood.",
      },
      {
        title: "Negotiation",
        text: "We do not just ask the price: we negotiate the terms, from break clauses to who is responsible for maintenance.",
      },
      {
        title: "Lease and signing",
        text: "We review the contract, handle the notary process and explain every clause before you sign anything.",
      },
    ],
    specialTitle: "For people who have just arrived",
    special: [
      {
        title: "Short-term landing rentals",
        text: "Need somewhere for one to three months while you look for the long-term place? We keep a portfolio of serviced apartments ready to move into.",
      },
      {
        title: "Corporate relocation",
        text: "We work with HR teams to relocate whole teams, from housing to school tours.",
      },
      {
        title: "Pet-friendly scouting",
        text: "We know which buildings genuinely welcome pets and which ones have good parks nearby.",
      },
    ],
    benefitsTitle: "What you get working with us",
    benefits: [
      {
        title: "Properties that were never listed",
        text: "Many of Asunción's best properties never reach a public portal; you see them through our network.",
      },
      {
        title: "A lease that protects you",
        text: "We check the lease follows Paraguayan law and that your rights as a foreign tenant are covered, with no hidden clauses.",
      },
      {
        title: "No local guarantor",
        text: "We negotiate around the guarantor requirement, which is what shuts out almost everyone who has just arrived.",
      },
      {
        title: "Bilingual support",
        text: "From the fine print to how the building's expensas get paid, we are your voice while you settle in.",
      },
    ],
    faq: [
      {
        q: "What deposit is normally asked for?",
        a: "Usually one month's deposit plus the first month in advance. For foreigners without a local guarantor we negotiate specific terms with the landlord.",
      },
      {
        q: "Are utilities included in the rent?",
        a: "In long-term leases, usually not. We help you transfer the accounts into your name or manage the payments for you.",
      },
      {
        q: "What documents do I need to sign?",
        a: "At first, your passport. Once your residency process starts we can update the lease with your Paraguayan ID.",
      },
    ],
    ctaTitle: "Don't navigate the market alone",
    ctaText:
      "Tell us what you are looking for and by when, and we will come back with real options.",
    ctaButton: "Start the search",
  },
  administracionAirbnb: {
    metaTitle: "Airbnb management in Asunción",
    metaDescription: (brand: string) =>
      `${brand} runs your short-term rental in Asunción end to end: styling, photography, dynamic pricing and guest communication.`,
    h1: "Airbnb management",
    tagline:
      "Full-service short-term rental management in Asunción: styling, pricing and hospitality, without you having to watch it.",
    intro:
      "Running a short-term rental that actually performs is a full-time job: photography that competes, pricing that moves with demand, and someone answering at any hour so a booking never goes unanswered. We handle all of it, end to end, so the property works for you rather than the other way around.",
    challengeTitle: "The passive income myth",
    challengeText:
      "A listing with average photos gets buried in the results. A static price loses money in high-demand weeks and scares people off in slow ones. Guest communication and key handovers around the clock wear an owner down fast. And keeping a unit at hotel standard takes a dedicated team, not an occasional cleaner.",
    frameworkTitle: "Our management, in three phases",
    framework: [
      {
        title: "Launch and aesthetics",
        text: "Professional interior styling and magazine-quality photography that capture the feel of the space, plus a listing written and translated into English, Portuguese and Spanish to reach a global audience.",
      },
      {
        title: "Daily operations",
        text: "Pricing adjusted to local demand and seasonality, bilingual guest support for bookings and recommendations, and smart locks for a secure, unattended check-in.",
      },
      {
        title: "Maintenance and housekeeping",
        text: "Hotel-standard cleaning between every stay, preventative inspections of the AC, Wi-Fi and appliances, and restocking of toiletries, coffee and linens.",
      },
    ],
    specialTitle: "Specialised services for owners abroad",
    special: [
      {
        title: "Fully hands-off",
        text: "Built for investors who live abroad and need a reliable team on the ground in Asunción, so you never have to manage a booking yourself.",
      },
      {
        title: "Transparent financial reporting",
        text: "A monthly statement shows what came in and what went out, with your net profit transferred straight to your bank account.",
      },
      {
        title: "Local tax and legal liaison",
        text: "We help keep your short-term rental compliant with Paraguayan regulations as they apply to your property.",
      },
      {
        title: "Turn-key furnishing",
        text: "For a brand-new unit, we can handle the complete furnishing and outfitting from scratch.",
      },
    ],
    benefitsTitle: "What changes for you",
    benefits: [
      {
        title: "One point of contact",
        text: "We talk to the guests, the cleaners and the contractors; you see the result.",
      },
      {
        title: "Wider exposure",
        text: "Your property is synced across Airbnb, Booking.com and VRBO, so it is visible everywhere a guest might be looking.",
      },
      {
        title: "Bilingual guest support",
        text: "Guests get support in English, Spanish and Portuguese, at any hour, so a language gap never costs you a booking.",
      },
      {
        title: "A property that stays protected",
        text: "Regular inspections and preventative maintenance keep the unit in the condition it was handed to us in.",
      },
    ],
    faq: [
      {
        q: "How do you set the nightly rate?",
        a: "We look at real-time pricing from local competitors and at seasonal demand in Asunción, and adjust your rate regularly to get the best return without pricing you out of bookings.",
      },
      {
        q: "What happens if a guest damages the property?",
        a: "We carry out a post-stay inspection and help manage any claim, whether through Airbnb's own protection programme or private insurance.",
      },
      {
        q: "How and when do I get paid?",
        a: "We send a transparent monthly statement and transfer your net profit directly to your bank account.",
      },
      {
        q: "Can I block dates for my own use?",
        a: "Yes. You can block dates through our system for personal stays, and we make sure the unit is ready when you arrive.",
      },
      {
        q: "Do you handle the legal and tax side?",
        a: "We help keep your listing compliant with Paraguayan short-term rental regulations, so that side does not fall on you.",
      },
    ],
    ctaTitle: "Put your property to work",
    ctaText: "Tell us where it is and what condition it is in, and we will tell you what to expect.",
    ctaButton: "Talk to us",
  },
  administracionDepartamentos: {
    metaTitle: "Apartment management in Asunción",
    metaDescription: (brand: string) =>
      `${brand} manages your Asunción apartment: tenant screening, rent collection, maintenance and clear reporting, wherever you live.`,
    h1: "Apartment management",
    tagline:
      "Your Asunción property managed as if you lived around the corner: vetted tenants, maintenance handled, numbers you can read.",
    intro:
      "A long-term rental in Asunción is a sound strategy, right up until the admin starts eating the return. For many owners living abroad, self-management ends in landlord burnout: chasing payments, learning the local legal system, fixing a problem from another continent. Our job is to turn your property into a genuinely passive income stream, preserving both the physical condition of the asset and the relationship with the tenant, so you can focus on your next investment while we handle the day-to-day.",
    challengeTitle: "What owning a rental actually involves",
    challengeText:
      "Chasing late payments, learning the local law, fixing a leak from another continent — these are costs that appear on no spreadsheet and that eventually exhaust the owner who self-manages, especially from overseas.",
    frameworkTitle: "How we manage",
    framework: [
      {
        title: "Marketing and tenant placement",
        text: "Professional photography and listings written to attract a strong pool of candidates, escorted viewings, and background, income and reference checks before anyone signs.",
      },
      {
        title: "Legal security and admin",
        text: "We coordinate the lease signing at a Notary Public for maximum legal weight, hold the deposit in a secure account, and produce a photo-documented inventory report to prevent future disputes.",
      },
      {
        title: "Operations and maintenance",
        text: "We are the tenant's only point of contact once they move in, and we resolve issues through trusted local contractors at fair market prices, with regular inspections to make sure the property is cared for to our standards.",
      },
      {
        title: "Reporting",
        text: "Every month you get a detailed statement with income, expenses and net result, in your language.",
      },
    ],
    specialTitle: "Specialised services",
    special: [
      {
        title: "Renewals and legal notifications",
        text: "We draft the lease and handle legal notifications in line with current regulations, so the contract stays enforceable through every renewal.",
      },
      {
        title: "Taxes and building expensas",
        text: "We help manage local property taxes and the building's expensas payments, so your investment stays compliant.",
      },
      {
        title: "Regular inspections",
        text: "We visit the property periodically to confirm the tenant is caring for it as agreed.",
      },
    ],
    benefitsTitle: "Why delegating pays",
    benefits: [
      {
        title: "Fewer vacant days",
        text: "A good tenant found quickly is worth more than a month of saved commission.",
      },
      {
        title: "Rigorous tenant vetting",
        text: "We verify income, employment history and past rental references, not just an ID check, to make sure it is the right fit.",
      },
      {
        title: "Your property's value protected",
        text: "Catching a small issue early, like a leak or an electrical fault, stops it becoming an expensive structural repair and preserves resale value.",
      },
      {
        title: "Total transparency",
        text: "A clear monthly statement in your language, plus tax and expensas management, so your investment stays compliant and profitable year-round.",
      },
    ],
    faq: [
      {
        q: "How do you screen tenants?",
        a: "We verify income, employment history and past rental references, beyond just an ID check, to ensure a good long-term fit.",
      },
      {
        q: "What happens if a tenant pays late?",
        a: "We have a strict protocol for late payments, with immediate follow-up and legal notifications if necessary.",
      },
      {
        q: "Am I responsible for maintenance costs?",
        a: "Yes, as the owner you are responsible for upkeep, but we coordinate the work and make sure you pay fair local prices.",
      },
      {
        q: "What language are the reports in?",
        a: "We send your monthly statement of income, expenses and net result in your language, so you can follow your property's performance without relying on anyone else.",
      },
    ],
    ctaTitle: "Hand over the management",
    ctaText:
      "Tell us about your property and we will explain how we would run it, so you can stop worrying about the details and start enjoying the returns.",
    ctaButton: "Talk to us",
  },
  inmobiliariaAsuncion: {
    metaTitle: "Realtor in Asunción for foreign buyers",
    metaDescription: (brand: string) =>
      `${brand} represents you when buying in Asunción: sourcing, title checks, negotiation and support through to the deed.`,
    h1: "Realtor in Asunción",
    tagline:
      "Bilingual representation for buying in Asunción, from the search to the deed.",
    intro:
      "Buying in a city that is not yours takes more than access to listings: it takes knowing the neighbourhoods, knowing what is being built, and having someone to negotiate with. We represent you, not the seller.",
    challengeTitle: "A market in the middle of a transformation",
    challengeText:
      "Asunción has changed a great deal in a few years, with the rise of the New Financial Center and corridors like Santa Teresa and Villa Morra drawing more international capital each year. With that came new districts, new developers and prices that move differently block by block. Without that local reading it is easy to overpay for something hard to resell.",
    frameworkTitle: "How we work with you",
    framework: [
      {
        title: "Exclusive property sourcing",
        text: "We go beyond the public portals, drawing on a private network of developers and local owners to find off-market and pre-construction opportunities, filtered by build quality, developer reputation and resale potential.",
      },
      {
        title: "Due diligence and legal oversight",
        text: "We coordinate with top-tier notaries and legal experts to run a full title search for liens or legal encumbrances, and translate every legal document into English so you move forward with clarity.",
      },
      {
        title: "Negotiation and representation",
        text: "We negotiate using local market data to secure the best price and terms, working to keep the outsider's premium off your purchase.",
      },
      {
        title: "After the deed",
        text: "We handle the transfer of titles and utilities and, if you want it, immediate integration into our Apartment Management or Airbnb Management service.",
      },
    ],
    specialTitle: "Specialised services for buyers and sellers",
    special: [
      {
        title: "Pre-construction (en pozo) strategy",
        text: "Access floor-one pricing on new developments through our vetted list of established developers.",
      },
      {
        title: "Luxury residential relocation",
        text: "Tailored searches for high-security villas and penthouses in the city's most sought-after gated communities.",
      },
      {
        title: "Commercial and land acquisition",
        text: "We identify strategic plots for future development or commercial use in Asunción's emerging industrial zones.",
      },
    ],
    benefitsTitle: "What representation adds",
    benefits: [
      {
        title: "Less risk",
        text: "We look at who is building, with what materials, and what is planned around it, so your capital goes into something built to hold its value.",
      },
      {
        title: "Time you get back",
        text: "We act as your single point of contact through the whole purchase, coordinating agents, lawyers and government paperwork on your behalf.",
      },
    ],
    faq: [
      {
        q: "Can a foreigner buy property in Paraguay?",
        a: "Yes. Paraguay is very open to foreign investment: you can purchase and title property under your own name or a corporation using only your valid passport.",
      },
      {
        q: "What are the closing costs when buying in Asunción?",
        a: "Closing costs (notary fees, registry filing and taxes) typically range between 2% and 3.5% of the transaction value. We provide a detailed estimate before any deal is finalised.",
      },
      {
        q: "What tax do I pay if I sell later on?",
        a: "Paraguay has a very competitive tax environment. If you sell as an individual, the notary withholds the tax when the deed is signed, and in practice it works out to an effective 2.4% of the sale value (there is an alternative method based on the actual gain, but that 2.4% presumptive method is what applies by default).",
      },
    ],
    ctaTitle: "Buy with someone on your side",
    ctaText: "Tell us what you are looking for and what budget you have.",
    ctaButton: "Talk to us",
  },
  residenciaParaguay: {
    metaTitle: "Residency in Paraguay, handled with you",
    metaDescription: (brand: string) =>
      `${brand} prepares your file and walks you through the Paraguayan residency process, up to your cédula.`,
    h1: "Residency in Paraguay",
    tagline:
      "One of the world's most accessible paths to residency, handled end to end, for investors, digital nomads and families.",
    intro:
      "Paraguayan residency is among the most accessible in the world, but the process has steps, stamps and appointments you would rather not discover as you go. We prepare the file before you fly and we are with you while you are here.",
    challengeTitle: "Why people choose it",
    challengeText:
      "Paraguay has become a top destination for people looking to escape high taxes and heavy regulation elsewhere. It runs on a territorial tax system: income earned outside Paraguay is generally not taxed at all, and local income is taxed at low personal-income rates. Residency — first temporary and, after two years, permanent — is also the formal path toward Paraguayan citizenship and a passport, and the country sits in a stable, convenient location for moving around the region.",
    frameworkTitle: "The process, step by step",
    framework: [
      {
        title: "Consultation and documents",
        text: "We review your case, give you a checklist of documents from your home country, and verify your apostilles and translations before you travel.",
      },
      {
        title: "Your days in Asunción",
        text: "Your in-person visit runs 3 to 5 days. We take you to every appointment — biometrics, medical check and interviews — with private transport, someone bilingual alongside, and a neighbourhood orientation tour while you're here.",
      },
      {
        title: "Monitoring",
        text: "We track your file with Immigration on a weekly basis and handle any extra requirements or questions that come up while it moves.",
      },
      {
        title: "Collection",
        text: "We collect your Temporary Residency card and can ship it to you internationally if you'd rather not wait here, and help you get your Cédula and RUC (tax ID) for local business.",
      },
    ],
    specialTitle: "Specialised services for global citizens",
    special: [
      {
        title: "Short-term landing rentals",
        text: "Need somewhere to stay while your process is underway? We keep serviced apartments ready so housing isn't one more thing to sort out.",
      },
      {
        title: "Investor visa assistance",
        text: "Specialised support if you're applying under one of the investment categories.",
      },
      {
        title: "Digital nomad support",
        text: "Tailored advice for remote workers looking to organise their global tax position.",
      },
      {
        title: "Family packages",
        text: "Full support for spouses and children, so the whole family moves through the process together.",
      },
    ],
    benefitsTitle: "What we take off your hands",
    benefits: [
      {
        title: "Few days here",
        text: "We prepare everything in advance so your time in Asunción is as short as possible.",
      },
      {
        title: "Documents checked before you travel",
        text: "We review your apostilles and translations against what Immigration actually asks for, so nothing comes back rejected at the counter.",
      },
      {
        title: "A legal network we already trust",
        text: "We work directly with lawyers and notaries we know, so your status holds up to scrutiny.",
      },
      {
        title: "Banking, sorted after",
        text: "Once your Cédula is issued, we help you open a local bank account too.",
      },
    ],
    faq: [
      {
        q: "Do I need to live in Paraguay to keep my residency?",
        a: "No. Paraguay has very flexible physical presence requirements, which is what makes it such a workable plan B.",
      },
      {
        q: "How long does the process take?",
        a: "The in-country portion takes less than a week. The final ID card (Cédula) usually takes a few months to be issued after that.",
      },
      {
        q: "Can I open a bank account?",
        a: "Yes. Once your Cédula is issued, we help you navigate the banking system to open your accounts.",
      },
      {
        q: "Will I pay tax on income from outside Paraguay?",
        a: "Paraguay runs a territorial tax system, so income earned outside the country is generally not taxed. Local income is taxed at low personal-income rates, depending on the type of income.",
      },
      {
        q: "Can I apply for permanent residency directly?",
        a: "For most people, no: you first get temporary residency, and only after two years with that status can you apply for permanent. People who qualify under one of the investment categories can access a more direct route. We tell you which path fits your situation.",
      },
    ],
    ctaTitle: "Start your residency",
    ctaText: "Tell us your nationality and your situation, and we will tell you what you need.",
    ctaButton: "Talk to us",
  },
  invertirEnParaguay: {
    metaTitle: "Investing in Paraguay: property and business",
    metaDescription: (brand: string) =>
      `${brand} supports your investment in Paraguay: sourcing the asset, the legal structure and the management afterwards, with clear reporting.`,
    h1: "Invest in Paraguay",
    tagline:
      "Property, farmland and business opportunities in Paraguay, with someone here to run them afterwards.",
    intro:
      "Investing at a distance works when someone on this side looks at the building, checks on the tenant and sends the numbers on time. We find the asset, get the structure right, and then manage it.",
    challengeTitle: "Why Paraguay",
    challengeText:
      "Paraguay's economy runs on fiscal discipline: a flat 10% corporate income tax on profits, a general 10% VAT, and a territorial tax regime that only taxes income earned inside the country, so your wealth elsewhere stays untouched, with no inheritance, wealth or gift tax on top. Dividend distributions carry their own withholding on top of that (lower for residents than for non-residents), so the effective burden on profits you remit abroad is not the same as on profits you reinvest here. Law No. 7548/2025 adds further incentives for larger projects, including exemptions on dividends and profit remittances above a certain investment size. The specific figures for your case — rates, incentives and expected returns — we go through case by case, because they depend on the asset, the structure and the year.",
    frameworkTitle: "How we work an investment",
    framework: [
      {
        title: "Property",
        text: "We look for property with real rental demand and a resale market in Asunción's premium corridors, such as Santa Teresa and Villa Morra.",
      },
      {
        title: "Farmland and agribusiness",
        text: "We facilitate the purchase of high-fertility land for soybean, corn, livestock and other agribusiness, with the local expertise to evaluate and run it.",
      },
      {
        title: "Legal and tax structure",
        text: "We work with local law firms so your investment is structured properly from the start, including applying for the benefits of Law 7548/2025 and the Maquila Regime where the project qualifies.",
      },
      {
        title: "Management",
        text: "Due diligence, purchase, getting it running, and regular bilingual reporting, so you can follow your investment from anywhere.",
      },
    ],
    specialTitle: "Specialised investment vehicles",
    special: [
      {
        title: "Pre-construction residential pooling",
        text: "Join a syndicate of investors to fund residential developments in Asunción from the pre-construction (\"pozo\") stage.",
      },
      {
        title: "Livestock fattening partnerships",
        text: "Invest in cattle-fattening (\"engorde\") cycles alongside professional ranchers: a tangible, asset-backed investment with defined cycles.",
      },
      {
        title: "Industrial park development",
        text: "Back logistics and warehouse space near the Bioceanic Corridor as demand for regional distribution grows.",
      },
    ],
    benefitsTitle: "What you get",
    benefits: [
      {
        title: "Boots on the ground",
        text: "Someone here who looks, decides and answers, while you stay where you are.",
      },
      {
        title: "Fiscal efficiency",
        text: "Paraguay's territorial tax system taxes only income earned inside the country, and there is no inheritance, wealth or gift tax, which matters for long-term estate planning.",
      },
      {
        title: "A Mercosur hub",
        text: "Paraguay sits at the centre of the continent, and the Maquila Law lets qualifying companies import raw materials duty-free and export finished goods at a symbolic 1% tax: a base for reaching neighbouring markets, not just Paraguay's own.",
      },
    ],
    faq: [
      {
        q: "Can foreigners buy property or farmland in Paraguay?",
        a: "Yes. Foreigners have the same property rights as Paraguayan citizens and can own real estate or farmland outright, in their own name or through a local company — with one specific exception: buying farmland inside the border security zone is restricted to citizens of neighbouring countries. Outside that zone, and in urban areas like Asunción, no such restriction applies.",
      },
      {
        q: "What tax regime applies to my investment?",
        a: "Paraguay taxes only income earned within the country. Corporate profits pay a flat 10% corporate income tax and the general VAT rate is 10%; dividend distributions carry their own withholding on top, lower for residents than for non-residents. There is no inheritance, wealth or gift tax. Larger projects can also apply for the incentives under Law No. 7548/2025.",
      },
      {
        q: "Is there a minimum investment to access the Law 7548/2025 benefits?",
        a: "You can invest any amount. Projects starting around USD 500,000 already qualify for base-tier benefits (duty-free capital equipment imports, fiscal credits), while the most significant exemptions — a full 10-year exemption on dividends and on interest from foreign project financing — are reserved for projects starting at USD 13 million.",
      },
      {
        q: "Can I move my capital and profits freely?",
        a: "Yes. Paraguay has no exchange controls, so you can move capital and profits in and out of the country in US dollars or euros through the regular banking system.",
      },
    ],
    ctaTitle: "Let's talk about your investment",
    ctaText: "Tell us the amount and the horizon you have in mind.",
    ctaButton: "Talk to us",
  },
  domicilioVirtual: {
    metaTitle: "Virtual address in Asunción",
    metaDescription: (brand: string) =>
      `${brand} gives you a commercial and legal domicile in Asunción, with mail handling and support for your paperwork.`,
    h1: "Virtual address",
    tagline:
      "A commercial and legal address in Asunción, without the overhead of renting an office.",
    intro:
      "Get a legal and commercial domicile in Asunción's premier business district, built for digital nomads, remote companies and international investors who want a foothold in Paraguay without renting a physical office. Your address doubles as the base for company registration, tax filings and everyday correspondence, and it comes with someone who actually opens the envelope when it arrives.",
    challengeTitle: "What a virtual address is for",
    challengeText:
      "If you are testing the Paraguayan market, or your operation runs remotely, a professional address in Asunción's financial district gives you credibility with local banks, government agencies and clients, without the cost, deposits or long-term commitment of a physical lease.",
    frameworkTitle: "What it includes",
    framework: [
      {
        title: "Premium business domicile",
        text: "A recognised commercial address in corridors like Santa Teresa or Villa Morra, for your website, stationery and official paperwork.",
      },
      {
        title: "Digital mailroom & management",
        text: "We receive your official mail, packages and government notifications, then scan and forward them so you can manage everything from wherever you are.",
      },
      {
        title: "Legal & tax domicile",
        text: "A stable, compliant seat in Paraguay for company registration and RUC (tax ID) applications.",
      },
      {
        title: "On-demand meeting spaces",
        text: "When you are in town, you get access to a boardroom or coworking space at the same registered address.",
      },
    ],
    specialTitle: "Specialized solutions for global founders",
    special: [
      {
        title: "Corporate formation package",
        text: "We pair the virtual address with legal support to incorporate your Paraguayan S.A. or S.A.S.",
      },
      {
        title: "Bilingual receptionist",
        text: "A local phone number answered in your company's name by a bilingual receptionist.",
      },
      {
        title: "Package forwarding",
        text: "International shipping for physical goods or documents that arrive at your Asunción address.",
      },
    ],
    benefitsTitle: "Why it works",
    benefits: [
      {
        title: "Enter without committing",
        text: "You test the Paraguayan market with a formal presence before signing a lease, skipping the deposits and utility bills of a physical office.",
      },
      {
        title: "Banking and residency support",
        text: "Banks require a physical address for KYC checks, and immigration filings need a stable one too — this covers both.",
      },
      {
        title: "Instant credibility",
        text: "A recognised business-district address signals legitimacy to banks, government offices and clients from day one.",
      },
    ],
    faq: [
      {
        q: "Do I need a physical address to open a bank account in Paraguay?",
        a: "Yes. Banks in Paraguay require a physical or commercial address for KYC (Know Your Customer) checks, and our business addresses meet that standard.",
      },
      {
        q: "How often will I hear about mail that arrives for me?",
        a: "As often as needed — we notify you as soon as something arrives and follow your instructions to scan, shred or forward it.",
      },
      {
        q: "Can I use this address during my residency process?",
        a: "Yes. It works as a reliable point of contact for the migration office and the national police while your residency is being processed.",
      },
    ],
    ctaTitle: "Get your address in Asunción",
    ctaText: "Tell us what you need it for and we will tell you what it takes.",
    ctaButton: "Talk to us",
  },
} as const;

/**
 * The English peer of `esDirectory`. The directory door serves Spanish only —
 * inmobiliarios.com.py is `locale: "es"` and there is no English directory
 * door — so nothing renders these strings today. They exist because
 * `Dictionary` is derived from the Spanish shape and a missing key is a type
 * error (src/i18n/index.ts), and because the day an English door appears the
 * copy should already be a peer rather than a rushed translation.
 *
 * Translated as intent, like the rest of en.ts: "inmobiliario" is a real
 * estate agent, "vos" has no English form, and no figure appears here that the
 * Spanish does not state.
 */
export const enDirectory = {
  metaTitle: "Find the right real estate agent in Paraguay",
  metaDescription: (brand: string) =>
    `${brand} connects you with real estate agents who already work in your area. Tell us what you want to sell or rent out and get proposals, at no cost.`,

  chromeNav: [
    { label: "Home", href: "/" },
    { label: "Agents", href: "/agentes" },
    { label: "Agencies", href: "/inmobiliarias" },
    { label: "For agents", href: "/para-inmobiliarios" },
    { label: "Contact", href: "/contacto" },
  ],
  chromeCtaLabel: "Find your agent",
  chromeCtaHref: "/#form",
  footerTagline: (brand: string) =>
    `${brand} is Paraguay's directory of real estate agents: we put you in touch with the ones who work your area.`,
  footerDirectoryTitle: "Directory",
  footerDirectoryLinks: [
    { label: "Agents", href: "/agentes" },
    { label: "Agencies", href: "/inmobiliarias" },
    { label: "For agents", href: "/para-inmobiliarios" },
  ],
  footerCompanyTitle: "Company",
  footerCompanyLinks: [
    { label: "Contact", href: "/contacto" },
    { label: "Terms and conditions", href: "/terminos" },
    { label: "Privacy policy", href: "/privacidad" },
  ],
  footerContactUs: "Write to us",
  footerLegalLine: (brand: string) =>
    `${brand} introduces owners to independent real estate agents. We take no part in the transaction and charge the owner no commission.`,

  heroKicker: "Free, no strings attached",
  heroTitle: "Find the right agent for your property",
  heroSubtitle:
    "Tell us what you want to sell or rent out and we will put you in touch with up to three agents who work in your area.",
  heroPoints: [
    "You talk to people, not to a form that goes nowhere",
    "No cost to you: we charge the owner nothing",
    "You decide who to keep talking to",
  ],

  formTitle: "Tell us about your property",
  formNameLabel: "Your name",
  formPhoneLabel: "WhatsApp",
  formPhonePlaceholder: "+595 981 234 567",
  formCityLabel: "City or area",
  formCityPlaceholder: "Choose a city",
  formTypeLabel: "Property type",
  formTypePlaceholder: "Choose a type",
  formOperationLabel: "What you want to do",
  formOperationOptions: [
    { value: "venta", label: "Sell" },
    { value: "alquiler", label: "Rent out" },
  ],
  formMessageLabel: "Anything else we should know",
  formMessagePlaceholder:
    "Neighbourhood, size, condition, when you want to start…",
  formSubmit: "Send me proposals",
  formSending: "Sending…",
  formPhoneError: "Please enter a valid WhatsApp number.",
  formError: "We could not send your enquiry. Please try again in a moment.",
  formNote: "We reply on WhatsApp. Your details are never published anywhere.",
  formFineprintPrefix: "By sending this you accept the",
  formTerms: "terms",
  formFineprintAnd: "and the",
  formPrivacy: "privacy policy",
  formSuccessTitle: "We have your enquiry",
  formSuccessText:
    "We will message you on WhatsApp with the agents who work your area.",

  howTitle: "How it works",
  howSteps: [
    {
      title: "Tell us",
      text: "A short form: what you have, where it is, and what you want to do with it.",
    },
    {
      title: "Compare",
      text: "We introduce agents who work that area, with their published portfolio in plain sight.",
    },
    {
      title: "Choose",
      text: "Talk to whoever you like and continue only with the one who convinces you. No exclusivity with us.",
    },
  ],

  chooseTitle: "How we decide who to introduce",
  chooseSubtitle:
    "No paid ranking and no star ratings. These are the criteria, exactly as they stand today.",
  choosePoints: [
    {
      title: "Verification",
      text: "We confirm the person or the office is real and that the portfolio they publish is theirs.",
    },
    {
      title: "Real activity",
      text: "Only agents with properties published today appear here — never empty profiles.",
    },
    {
      title: "Area",
      text: "We start with whoever already works the city your property is in.",
    },
  ],

  teaserTitle: "Verified agents",
  teaserSubtitle: "The ones already with us, with an active portfolio.",
  teaserAllLink: "See the full directory",
  teaserEmptyTitle: "Be among the first",
  teaserEmptyText:
    "We are building this directory one agency at a time. If you work in the trade, now is the moment to join.",
  teaserEmptyCta: "I want a profile",

  proKicker: "For professionals",
  proTitle: "Are you a real estate agent?",
  proText:
    "Get enquiries from owners in your area and show your portfolio on a profile of your own. Free while we build the directory.",
  proBullets: [
    "Enquiries from owners who have already decided to sell or rent out",
    "A profile with your published portfolio and your direct contact",
    "No cost at this stage",
  ],
  proCta: "See how it works",

  faqTitle: "Frequent questions",
  faq: [
    {
      q: "What does it cost me?",
      a: "Nothing. We do not charge owners for introducing agents. Whatever commission you agree is between you and the agent you choose.",
    },
    {
      q: "Am I tied to anyone?",
      a: "No. We make introductions; the relationship and any exclusivity agreement are settled directly with the agent, not with us.",
    },
  ],
} as const;
