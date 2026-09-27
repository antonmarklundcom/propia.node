/**
 * Evergreen page: /venta/asuncion/departamentos — English door, keyword
 * "apartments for sale in asuncion". Pitched at foreign buyers and people
 * relocating to Paraguay; the URL stays Spanish-slugged like every other
 * door, the prose is English.
 *
 * Barrio section covers towers, amenities and building fees by zone, and the
 * en-pozo (pre-construction) angle — distinct from the sale house page
 * (lot/yard/garage) and from the rental twin (tenant angle, no purchase
 * financing).
 */
import type { EvergreenPage } from "./types";

export const enVentaAsuncionDepartamentos: EvergreenPage = {
  path: "/venta/asuncion/departamentos",
  door: "en",
  keyword: "apartments for sale in asuncion",
  secondaryKeywords: [
    "apartments for sale in asuncion paraguay",
    "buy apartment asuncion",
    "condos for sale in asuncion",
    "pre-construction apartments asuncion",
    "apartment prices asuncion paraguay",
    "flats for sale in asuncion",
  ],
  h1: "Apartments for sale in Asunción",
  lede: "Compare asking prices by square meter, filter between finished buildings and pre-construction, and leave your search if nothing on the market fits yet.",
  metaDescription:
    "Apartments for sale in Asunción: compare prices per square meter, finished or pre-construction, and leave your search for new listings.",
  priceBands: [
    { max: 80_000 },
    { min: 80_001, max: 130_000 },
    { min: 130_001, max: 200_000 },
    { min: 200_001 },
  ],
  barrios: {
    title: "Where apartments for sale cluster in Asunción",
    intro:
      "Apartment stock is not spread evenly across the capital: it clusters along a few corridors depending on whether a building is new or a converted older property. Here is what changes between the areas where apartments for sale show up most.",
    items: [
      {
        name: "Villa Morra, Carmelitas and Manorá",
        text:
          "This corridor has the newest towers in the capital and the widest pre-construction supply — units still being built and sold off the floor plan. Before committing to one, ask for the construction timeline and who is backing the project financially.",
      },
      {
        name: "Microcentro, near the Palacio de Gobierno",
        text:
          "Home to the oldest buildings in the capital, many converted into housing rather than built as apartments from the start. Units here tend to be resale, and each building sets its own bylaws and building fee, so ask for both before deciding.",
      },
      {
        name: "The Costanera and Jardín Botánico corridor",
        text:
          "The newest riverfront developments sit along this stretch, with river views from the upper floors. These tend to carry the highest asking price per square meter in the capital, and amenities such as a pool or a gym are covered through the building fee.",
      },
      {
        name: "Trinidad and San Vicente",
        text:
          "Smaller, older buildings with fewer floors sit in these in-between neighborhoods, at resale prices well below the newer towers. They suit a buyer who wants a well-located unit without paying for amenities they will not use.",
      },
    ],
  },
  prices: {
    title: "What to look at in an apartment's asking price",
    paragraphs: [
      "The range above comes from apartments listed on the portal right now, at the price each seller is asking — not a closed sale price, and it shifts as units go up and come down each week.",
      "Comparing by price per square meter tells you more than comparing total prices: a small unit in a new tower can cost more per meter than a larger, older one elsewhere in the city. Check what the building fee covers too, since not every building includes a doorman, pool or parking space.",
      "Pre-construction units are priced for whatever stage a project is at, and that price tends to climb as the building goes up. The portal's projects page gathers the developments we know about in general terms, without listing specific units.",
    ],
  },
  checklist: {
    title: "What to check before buying an apartment in Asunción",
    intro:
      "An apartment brings questions a house does not, tied to the building and to shared ownership:",
    items: [
      "Whether the title is registered in the seller's name with the corresponding property registry.",
      "The current building fee, and whether an increase or an unpaid debt is on the horizon.",
      "The building's bylaws — what you can and cannot do with the unit, and whether renting it out is allowed.",
      "The condition of the elevator, the water tank and the shared areas, not only the unit itself.",
      "Whether the parking space and storage room are part of the deed or rented separately.",
      "How water pressure holds up on the higher floors during peak demand.",
      "If buying pre-construction, what guarantees the developer gives on the delivery date and what happens if it slips.",
    ],
  },
  financing: {
    title: "How an apartment purchase in Asunción gets paid for",
    paragraphs: [
      "Many foreign buyers pay in cash, and mortgage credit also exists through local banks and lenders for buyers who prefer to finance part of the purchase. A pre-construction unit is usually paid in installments while the building goes up, with the balance due at the deed signing, on terms each developer sets on its own.",
      "The portal's financing page brings together the first-home programs we know about, with an estimated monthly payment for comparison. Eligibility for a non-resident buyer is set by each lender — confirm directly with them before relying on any figure.",
    ],
  },
  faq: [
    {
      q: "How much does an apartment cost in Asunción?",
      a: "It depends on the area, whether the building is new or older, and whether the unit is still pre-construction. The range above reflects what is listed on the portal right now, not a fixed citywide average.",
    },
    {
      q: "What does buying pre-construction mean?",
      a: "It means buying a unit that is still being built, sold off the floor plan, with payments made as construction progresses. The portal's projects page gathers general information on developments we know about in Asunción, without promising unit availability.",
    },
    {
      q: "Is the building fee included in the sale price?",
      a: "No — the building fee is a separate monthly cost that starts once you own the unit. Ask the seller for the current amount before comparing two apartments on price alone.",
    },
    {
      q: "Can a foreigner buy an apartment in Asunción?",
      a: "That's worth asking before you fall for a listing: an escribano público or a Paraguayan lawyer can walk you through the current rules for a foreign buyer, since requirements depend on your specific situation and are worth confirming directly.",
    },
    {
      q: "Should I buy a resale unit or a pre-construction one?",
      a: "Each has its own logic: resale lets you move in sooner and see the actual building, while pre-construction can cost less per stage but means checking closely who stands behind the project.",
    },
    {
      q: "What if nothing listed today fits what I need?",
      a: "Leave your search on this page with your budget and the area you prefer. Our team reaches out on WhatsApp as soon as a matching apartment in Asunción goes up.",
    },
  ],
  claimsToVerify: [
    "Villa Morra, Carmelitas and Manorá are Asunción neighborhoods with newer apartment towers and pre-construction development.",
    "Asunción's microcentro, near the Palacio de Gobierno, has some of the capital's oldest buildings, many converted into housing.",
    "Newer riverfront apartment developments concentrate along the Costanera / Jardín Botánico corridor of Asunción.",
    "Trinidad and San Vicente are Asunción neighborhoods with smaller, older apartment buildings and generally lower resale prices.",
    "An apartment purchase in Paraguay is registered with the corresponding property registry.",
    "Pre-construction (en pozo) apartments in Paraguay are typically paid in installments during construction with the balance due at the deed signing, on terms set by the developer.",
    "Local mortgage lenders set their own eligibility rules for non-resident buyers.",
    "Operational promise: a brief left on this page is read by the team, who reach out by WhatsApp when a matching apartment appears.",
  ],
};
