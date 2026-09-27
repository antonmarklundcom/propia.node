/**
 * Evergreen page: /alquiler/asuncion/departamentos — English door, keyword
 * "apartments for rent in asuncion". Pitched at foreign renters and
 * newcomers, many of whom rent before deciding whether to buy; the URL stays
 * Spanish-slugged like every other door, the prose is English.
 *
 * Barrio section covers towers, amenities and building fees by zone — same
 * angle as the Spanish twin but written for a newcomer's first lease, not a
 * translation of it. Distinct from the sale twin (no financing) and from
 * the rental house page (yard/garage, no building fee).
 */
import type { EvergreenPage } from "./types";

export const enAlquilerAsuncionDepartamentos: EvergreenPage = {
  path: "/alquiler/asuncion/departamentos",
  door: "en",
  keyword: "apartments for rent in asuncion",
  secondaryKeywords: [
    "apartments for rent in asuncion paraguay",
    "furnished apartments asuncion",
    "rent apartment asuncion",
    "studio apartments for rent asuncion",
    "flats to rent asuncion paraguay",
    "monthly rental apartments asuncion",
  ],
  h1: "Apartments for rent in Asunción",
  lede: "Furnished and unfurnished apartments for rent in Asunción: filter by price and by neighborhood, and leave your search if nothing fits yet.",
  metaDescription:
    "Apartments for rent in Asunción: filter by price, neighborhood and furnished or not. Leave your search and we'll reach out by WhatsApp.",
  priceBands: [{ max: 300 }, { min: 301, max: 500 }, { min: 501, max: 800 }, { min: 801 }],
  barrios: {
    title: "Neighborhoods of Asunción and what kind of building you'll find in each",
    intro:
      "Renting an apartment here is not just about picking a price: the building type, the amenities and the building fee shift a lot by neighborhood, which matters especially for a newcomer choosing a first place before deciding whether to eventually buy.",
    items: [
      {
        name: "Villa Morra",
        text:
          "Home to many of the newest towers in the city, plenty with a pool, gym and shared grill area. Those amenities come with a building fee that varies a good deal from one tower to the next, so ask for the latest receipts before comparing prices.",
      },
      {
        name: "Recoleta",
        text:
          "A mix of older buildings and a handful of newer towers, in a quieter setting than Villa Morra. Building fees tend to run lower here when a property has fewer shared amenities to maintain.",
      },
      {
        name: "Centro and the historic core",
        text:
          "The area with the widest range of studios and small units, in older buildings, some remodeled and others not. Before signing, check the elevator and the plumbing, and ask whether the building charges a fee at all.",
      },
      {
        name: "Sajonia and the Costanera",
        text:
          "A growing area with newer buildings, some with a bay view from the higher floors. Since much of this is recent development, confirm exactly which services and fee apply to each property before deciding.",
      },
    ],
  },
  prices: {
    title: "What the asking rents tell you",
    paragraphs: [
      "The range above comes from apartments and studios listed on the portal right now — what each landlord is asking, not a fixed rate per square meter.",
      "A furnished unit almost always asks for more than an unfurnished one of the same size, since it comes with furniture and sometimes appliances. Check what is included before comparing two units on price.",
      "The building fee is paid separately from the rent in most cases, so add it to your budget before filtering by the rent alone. Newcomers often rent for a while before deciding whether to buy — the apartments for sale in Asunción follow a different price logic, since there is no monthly rent involved.",
    ],
  },
  checklist: {
    title: "What to check before renting an apartment in Asunción",
    intro:
      "Before putting down a deposit, get clear answers on these points, beyond whether you liked the view:",
    items: [
      "How much the building fee runs and exactly what it covers: doorman, elevator, shared areas, security.",
      "Whether the unit rents furnished or unfurnished, and exactly which furniture or appliances stay.",
      "The condition of the elevator and the rooftop or terrace, especially in older downtown buildings.",
      "Whether parking is included or costs extra, and where it sits relative to the building entrance.",
      "What guarantee the landlord or building management asks for: a property-owning guarantor, a rental insurance policy, or a deposit.",
      "How the building fee and the electricity bill are billed: to your name or to the management's.",
      "The building rules on pets and on moving hours, rather than assuming either is allowed.",
      "The real commute to your job at the time you'll actually be making it, not on a quiet Sunday.",
    ],
  },
  financing: {
    title: "What it takes to move into a rented apartment",
    paragraphs: [
      "Beyond the first month's rent, landlords almost always ask for a guarantee: a guarantor who owns property, a rental guarantee insurance policy (seguro de caución), or a cash deposit, depending on what the landlord or building management accepts.",
      "A newcomer without a local guarantor can ask the landlord or a rental agency whether a seguro de caución is accepted instead — this insurance-based guarantee is common enough that most landlords have an opinion on it.",
      "The building fee is billed separately from the rent and the deposit. Before signing, ask to see recent receipts to know whether it tends to rise and why. The lease sets a term and the conditions for renewing or leaving early — read the whole thing, especially the section on the deposit.",
    ],
  },
  faq: [
    {
      q: "How much does it cost to rent an apartment in Asunción?",
      a: "It varies widely by neighborhood, whether the building has amenities, and whether the unit is furnished. The range above shows what is listed on the portal today so you can measure it against your budget.",
    },
    {
      q: "What's the difference between a studio and a separate-bedroom apartment?",
      a: "A studio does not wall off the bedroom from the rest of the living space, while a separate-bedroom unit closes that room off. The difference shows up mainly in price and in privacy.",
    },
    {
      q: "Is the building fee included in the rent?",
      a: "Usually not — it is billed apart from the rent and depends on the building's shared amenities. Ask for recent receipts before comparing two apartments on price.",
    },
    {
      q: "Can I rent a furnished apartment in Asunción?",
      a: "Yes, furnished units are common, especially in newer buildings. Each listing states whether furniture is included and exactly what stays.",
    },
    {
      q: "What guarantee do I need to rent in Asunción as a newcomer?",
      a: "It depends on the landlord, but a property-owning guarantor, a seguro de caución, or a cash deposit are the usual options. Ask which ones a landlord accepts before you fall for a place you can't actually rent.",
    },
    {
      q: "What if nothing listed today fits what I need?",
      a: "Leave your search with your budget and the neighborhood you're after. Our team reaches out by WhatsApp as soon as a matching apartment in Asunción comes up.",
    },
  ],
  claimsToVerify: [
    "Villa Morra has a concentration of newer apartment towers, many with pool, gym and a shared grill area, which come with variable building fees.",
    "Recoleta combines older buildings with some newer towers and is generally quieter than Villa Morra.",
    "The Centro / historic core of Asunción has the widest range of studios and small apartments, many in older buildings.",
    "Sajonia and the Costanera area have newer apartment developments, some with bay views from higher floors.",
    "Building fees (gastos comunes) in Asunción apartment buildings are typically paid separately from the monthly rent.",
    "Rental guarantees for apartments in Paraguay are typically a property-owning guarantor, a seguro de caución (rental guarantee insurance), or a cash deposit, set by the landlord or building management.",
    "A seguro de caución is a rental guarantee insurance product used in place of a personal guarantor in Paraguay.",
    "Operational promise: a brief left on this page is read by the team, who reach out by WhatsApp when a matching apartment in Asunción appears.",
  ],
};
