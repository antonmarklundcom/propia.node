/**
 * Evergreen page: /venta/asuncion/casas — English door, keyword "houses for
 * sale in asuncion". Pitched at foreign buyers and people relocating to
 * Paraguay; the URL stays Spanish-slugged like every other door, the prose
 * is English.
 *
 * Barrio section covers lot size, garage and the closing process by zone,
 * with a buyer's angle — distinct from the apartment sale page (towers,
 * amenities, en pozo) and from the rental twin (tenant angle).
 */
import type { EvergreenPage } from "./types";

export const enVentaAsuncionCasas: EvergreenPage = {
  path: "/venta/asuncion/casas",
  door: "en",
  keyword: "houses for sale in asuncion",
  secondaryKeywords: [
    "houses for sale in asuncion paraguay",
    "buy house in asuncion",
    "homes for sale asuncion",
    "house prices in asuncion paraguay",
    "villas for sale asuncion",
    "real estate for sale in asuncion",
  ],
  h1: "Houses for sale in Asunción",
  lede: "Browse houses for sale by neighborhood and by price, and leave your search saved if nothing on the market matches what you need yet.",
  metaDescription:
    "Houses for sale in Asunción by neighborhood and price: browse today's listings and leave your search to hear about new houses as they come up.",
  priceBands: [
    { max: 100_000 },
    { min: 100_001, max: 200_000 },
    { min: 200_001, max: 350_000 },
    { min: 350_001 },
  ],
  barrios: {
    title: "Neighborhoods of Asunción and the kind of house you'll find in each",
    intro:
      "The capital is small in area but wide in what it offers: the same budget buys a very different house depending on the neighborhood. These are the groups of areas that come up most often among the houses on offer.",
    items: [
      {
        name: "The northern residential neighborhoods",
        text:
          "Villa Morra, Carmelitas and Las Lomas hold much of the capital's largest housing stock, on generous lots along tree-lined streets. This is where shops, offices and private schools sit closest at hand, and the asking price per square meter reflects that.",
      },
      {
        name: "Around the Jardín Botánico and the Costanera",
        text:
          "Neighborhoods bordering the botanical reserve and reaching toward the riverside avenue offer greener settings with some distance from the heaviest downtown traffic. Check the drive back into the rest of the city during rush hour before deciding.",
      },
      {
        name: "Traditional neighborhoods near the historic center",
        text:
          "Recoleta, Trinidad and Sajonia are older neighborhoods with houses from mixed eras standing side by side, from properties that need work to others already renovated. Closeness to government offices and banks shapes both the price and the daily noise and traffic.",
      },
      {
        name: "Neighborhoods toward the edge of the city",
        text:
          "San Vicente, Republicano and other neighborhoods to the south and east tend to offer more square meters for the same budget, though it pays to check street conditions and the real distance to a bus stop or clinic case by case.",
      },
    ],
  },
  prices: {
    title: "How to read the asking prices",
    paragraphs: [
      "The ranges above are drawn from listings currently active on the portal: prices the seller is asking, not closing prices, so a given house can end up selling for a different figure after negotiation.",
      "In Asunción, listing in dollars and listing in guaraníes both happen, depending on what the seller prefers. The portal ranks by the dollar equivalent, so if your budget is set in guaraníes, convert it before using the price filters.",
      "The neighborhood tends to explain more of the price gap between two similar houses than the built area does.",
    ],
  },
  checklist: {
    title: "What to check before buying a house in Asunción",
    intro:
      "Before making an offer, get a clear answer on each of these points, beyond whatever the listing itself says:",
    items: [
      "That the title is in the seller's name, backed by a property report ruling out active mortgages and liens.",
      "That the municipal property tax is paid up to date, with proof of the latest payment on hand.",
      "Whether any extensions or later construction have municipally approved plans, or were built without one.",
      "How water reaches the house and what the pressure is like during peak use.",
      "The real state of the sidewalk and street in front of the house, especially right after heavy rain.",
      "The real commute to your work or your children's school, timed on a weekday rather than a quiet Sunday.",
      "Who will draft the deed, and what transfer costs land on your side beyond the agreed price.",
    ],
  },
  financing: {
    title: "Paying for a house in Asunción",
    paragraphs: [
      "Many foreign buyers pay in cash for a house in the capital, while mortgage credit through banks and lenders is also available for buyers who prefer to finance part of the purchase. Some lenders offer first-home programs, with eligibility for a non-resident buyer set individually by each one.",
      "The portal's financing page brings together the programs we know about along with an estimated monthly payment, meant as a planning reference rather than an approval. The final rate and term are set by whichever lender extends the credit — confirm directly with them before relying on any figure.",
    ],
  },
  faq: [
    {
      q: "How much does a house cost in Asunción?",
      a: "It mostly comes down to the neighborhood, the lot size and the condition of the house. The range above reflects what is listed on the portal today; we do not publish a citywide average because it shifts as listings come and go.",
    },
    {
      q: "Are houses sold in dollars or in guaraníes?",
      a: "Both currencies are used, depending on what the seller chooses when listing. The portal shows the dollar equivalent so you can compare and sort by price regardless of the original currency.",
    },
    {
      q: "What documents should I ask the seller for?",
      a: "At minimum the property title, a recent property report, proof that the municipal property tax is current, and approved plans for any extension. A lawyer or escribano you trust can review these before you sign anything.",
    },
    {
      q: "Which neighborhood suits someone working downtown?",
      a: "There's no single answer — it depends on your budget and how much traffic you're willing to sit through. Time the real commute by car or bus before settling on a neighborhood.",
    },
    {
      q: "Can a foreigner buy a house in Paraguay?",
      a: "Ask an escribano público or a Paraguayan lawyer about the current rules for a foreign buyer before you commit to an offer — the specifics of your situation are best confirmed directly with them.",
    },
    {
      q: "What if none of today's listings fit?",
      a: "Leave your search on this page with your budget and what you need. Our team reaches out by WhatsApp as soon as a house in Asunción that matches goes up.",
    },
  ],
  claimsToVerify: [
    "Villa Morra, Carmelitas and Las Lomas are residential neighborhoods of Asunción known for larger houses on generous lots.",
    "The Jardín Botánico is a nature reserve in Asunción, near the Costanera riverside avenue.",
    "Recoleta, Trinidad and Sajonia are older, traditional neighborhoods of Asunción close to the historic center.",
    "San Vicente and Republicano are neighborhoods toward the southern/eastern edge of Asunción with generally more affordable prices.",
    "The municipal property tax for an Asunción property is paid to the Municipalidad de Asunción; extensions need a municipally approved plan.",
    "A property sale deed in Paraguay is signed before an escribano; a property report shows liens and mortgages against the title.",
    "Some lenders offer first-home mortgage programs in Paraguay; terms and non-resident eligibility are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who reach out by WhatsApp when a matching house appears.",
  ],
};
