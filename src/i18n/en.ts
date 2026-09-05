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
