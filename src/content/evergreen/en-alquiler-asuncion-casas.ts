/**
 * Evergreen page: /alquiler/asuncion/casas — English door, keyword "houses
 * for rent in asuncion". Pitched at foreign renters and newcomers; the URL
 * stays Spanish-slugged like every other door, the prose is English.
 *
 * Barrio section covers lot, yard, garage and security by zone — a tenant's
 * angle, distinct from the sale house page (title, taxes, closing) and from
 * the rental apartment page (towers, amenities, building fee).
 */
import type { EvergreenPage } from "./types";

export const enAlquilerAsuncionCasas: EvergreenPage = {
  path: "/alquiler/asuncion/casas",
  door: "en",
  keyword: "houses for rent in asuncion",
  secondaryKeywords: [
    "houses for rent in asuncion paraguay",
    "rent a house in asuncion",
    "homes for rent asuncion",
    "houses to rent with yard asuncion",
    "family house for rent asuncion paraguay",
    "rental houses asuncion",
  ],
  h1: "Houses for rent in Asunción",
  lede: "Houses with a yard for rent in Asunción: filter by price and by area, and leave your search if nothing available today fits.",
  metaDescription:
    "Houses for rent in Asunción with a yard and parking: filter by price and area. Leave your search and we'll reach out by WhatsApp.",
  priceBands: [{ max: 400 }, { min: 401, max: 700 }, { min: 701, max: 1200 }, { min: 1201 }],
  barrios: {
    title: "Areas of Asunción for renting a house with a yard",
    intro:
      "Someone looking for a house rather than an apartment usually cares more about the yard, the garage and the size of the lot than about a tower with amenities. Here is how those qualities are spread across the areas with the most houses on offer.",
    items: [
      {
        name: "Barrio Obrero",
        text:
          "Mostly older construction, plenty with a yard and some space for a car, close to the Mercado Cuatro market and the activity around it. Garage size swings a lot from house to house, so confirm it before ruling a place out on price alone.",
      },
      {
        name: "Ciudad Nueva",
        text:
          "Close to the old port area, with lots of varying sizes and a mix of renovated houses and others that need work. Check the roof and the wiring before letting the yard be the deciding factor.",
      },
      {
        name: "Santa María",
        text:
          "Quieter streets than Barrio Obrero or Ciudad Nueva, with houses built for family living and yards usually big enough for a play area or a small garden.",
      },
      {
        name: "San Vicente",
        text:
          "Houses closer to downtown, on smaller lots, where the garage doesn't always come included; in exchange, errands in the historic core are within walking distance.",
      },
    ],
  },
  prices: {
    title: "What the asking rents for houses tell you",
    paragraphs: [
      "The range above comes from houses listed on the portal today: what each landlord is asking based on the lot, the condition of the house, and whether it has a pool.",
      "A house with a covered garage and a large yard almost always asks for more than one on a small lot on the same block, even with a similar layout. The lot carries as much weight as the built area.",
      "Yard upkeep, pool maintenance where there is one, and minor repairs are usually the tenant's responsibility — confirm this before comparing two houses on rent alone. A newcomer weighing whether to rent or eventually buy should know the sale side works on a different logic, since there's no monthly rent involved.",
    ],
  },
  checklist: {
    title: "What to check before renting a house in Asunción",
    intro:
      "A house brings more to check than an apartment does: beyond the lease, confirm these points about the construction and the lot:",
    items: [
      "The condition of the roof and the gutters, especially on an older house.",
      "Whether the garage is covered or open, and whether the car you'll actually use fits in it.",
      "Where the water comes from and what the pressure is like inside the house, not just in the neighborhood.",
      "Whether the house has a septic tank or a sewer connection, and what condition it's in.",
      "How the yard drains in heavy rain — visit after a storm if you can.",
      "Whether pool maintenance, where there is a pool, is included or falls entirely on the tenant.",
      "Who is responsible for pruning any large trees on the property.",
      "The real commute to your job at the hour you'll actually be making it, since houses often sit farther from bus routes than a central apartment.",
    ],
  },
  financing: {
    title: "What it takes to move into a rented house",
    paragraphs: [
      "To move into a rented house in Asunción, along with the first month's rent, landlords typically ask for a guarantee: a guarantor who owns property, a seguro de caución, or a cash deposit, depending on what a given landlord accepts.",
      "Unlike an apartment, a rented house rarely comes with a building fee, but it does bring its own upkeep — the yard, a pool if there is one, and minor repairs. Talk through who covers what with the landlord before signing.",
      "The lease sets a term and the conditions for renewing it or leaving early; read it in full, especially the section on the deposit and on any changes you make to the yard.",
    ],
  },
  faq: [
    {
      q: "How much does it cost to rent a house in Asunción?",
      a: "It depends on the lot, the neighborhood, and the condition of the house; a house with a pool or a covered garage asks for more than a smaller one in the same area. The range above shows what is listed on the portal today.",
    },
    {
      q: "Do houses for rent in Asunción come with a yard?",
      a: "The large majority do, though the size varies a lot between neighborhoods and even between houses on the same block. Each listing states the lot size so you can compare before visiting.",
    },
    {
      q: "Who pays for yard and pool upkeep?",
      a: "That gets agreed with the landlord before signing: some leases put it on the tenant, and in others the landlord covers part of the maintenance. Get it in writing in the lease.",
    },
    {
      q: "Are there houses for rent in Asunción with a garage?",
      a: "Yes, though not every one is covered or the same size. Check the listing description for how many cars actually fit before ruling a house out on price.",
    },
    {
      q: "What guarantee do landlords ask for to rent a house?",
      a: "It varies by landlord: it can be a guarantor who owns property, a seguro de caución, or a cash deposit. Ask about this before visiting so you don't lose time on an option you can't meet.",
    },
    {
      q: "What if nothing available today fits what I need?",
      a: "Leave your search with your budget and the area you're after. Our team reaches out by WhatsApp as soon as a house for rent in Asunción comes up that fits.",
    },
  ],
  claimsToVerify: [
    "Barrio Obrero has predominantly older house construction and is close to the Mercado Cuatro market in Asunción.",
    "Ciudad Nueva is near Asunción's old port area, with houses of varying lot sizes and a mix of renovated and older construction.",
    "Santa María is a quieter residential neighborhood of Asunción with houses suited to family living.",
    "San Vicente has houses close to the historic center, generally on smaller lots than outer neighborhoods.",
    "Rental guarantees for houses in Paraguay are typically a property-owning guarantor, a seguro de caución, or a cash deposit, set by the landlord.",
    "Rented houses in Paraguay typically do not carry a building fee (gastos comunes), unlike apartments.",
    "Operational promise: a brief left on this page is read by the team, who reach out by WhatsApp when a matching house for rent in Asunción appears.",
  ],
};
