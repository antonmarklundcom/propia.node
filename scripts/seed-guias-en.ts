/**
 * Seed the three English guide posts realestateinparaguay.com's home page
 * links to (docs/style/realestateinparaguay.com.md §8 "New content pages
 * this domain needs"): buying-property-in-paraguay, costs-and-taxes,
 * residency. Uses the existing `posts` table (ARCHITECTURE.md §2.10, the
 * same `/guias/[slug]` content model the Spanish door already has) — there
 * is no `locale` column on `posts`, so these three rows also appear in the
 * shared /guias index and mixed with Spanish posts on any door; that is a
 * pre-existing limitation of the content model, not something this script
 * (or PR3) fixes. See the PR description.
 *
 * Every rate, fee, timeline and legal claim in the body below is a
 * placeholder pending a real source, marked "(verify before launch)" per
 * build-prompt.md's explicit instruction for these three pages — do not
 * remove the markers without actually sourcing the figure.
 *
 * Idempotent: upsert by slug, so re-running never duplicates.
 *
 *   DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" \
 *     npx tsx scripts/seed-guias-en.ts
 */
import { db } from "../src/db";
import { posts } from "../src/db/schema";

interface GuideSeed {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
}

const GUIDES: GuideSeed[] = [
  {
    slug: "buying-property-in-paraguay",
    title: "How buying property in Paraguay works",
    excerpt:
      "The five-step process a foreign buyer goes through, from choosing a property to registration and handover.",
    body: `Foreigners can own land and homes outright in Paraguay in most cases (verify before launch — confirm any category of restricted rural or border-zone land with a local attorney before publishing this as unconditional). Purchases are priced and paid in US dollars, and title passes by public deed before a notary (escribano) and is registered with the Registro Público (Public Registry).

## The five steps

1. **Choose and verify.** Find the property and verify the basic facts of its title with the seller or agency.
2. **Offer and reservation.** A price is agreed and a reservation is signed, typically with a deposit (verify before launch — confirm typical deposit percentage).
3. **Due diligence on title.** Your notary or attorney checks the title against the Registro Público — liens, boundary disputes and ownership history. Typical time: 2–4 weeks (verify before launch).
4. **Public deed before a notary.** Both parties sign the escritura pública before an escribano, who is a public official in Paraguay's system, not merely a private notary. Typical time: one day for the signing itself.
5. **Registration and handover.** The notary files the deed for registration and coordinates key handover. Typical time: 2–6 weeks (verify before launch).

## What you need before you start

- A cédula (Paraguayan ID) is not always required to buy — a passport is often sufficient, but confirm with your notary (verify before launch).
- If you cannot be present in person, a power of attorney (poder) can authorise someone to sign on your behalf (verify before launch — confirm the notarisation/apostille requirements for a POA executed abroad).
- Funds are typically sent by international bank transfer to a Paraguayan account or the notary's escrow (verify before launch).

> This page is a general orientation, not legal advice. Engage a Paraguayan attorney or escribano before signing anything, and verify every figure above against current law before relying on it.

See also: [Costs and taxes when buying in Paraguay](/guias/costs-and-taxes-buying-in-paraguay), [Residency in Paraguay](/guias/residency-in-paraguay).`,
  },
  {
    slug: "costs-and-taxes-buying-in-paraguay",
    title: "Costs and taxes when buying in Paraguay",
    excerpt:
      "What a buyer typically pays on top of the purchase price, and the territorial tax system foreign owners should understand.",
    body: `Total purchase costs on top of the agreed price are typically in the range of 3–5% of the property's value (verify before launch — confirm current rates before publishing this as fact).

## Typical closing costs

- Transfer tax: buyer, ≈ 1.5–2% (verify before launch)
- Notary fees: buyer, ≈ 1–3% (verify before launch)
- Registration: buyer, ≈ 0.5–1% (verify before launch)
- Agent commission: seller (typically), ≈ 3–5% (verify before launch)

## Ongoing taxes

Paraguay runs a territorial tax system — income earned outside Paraguay is generally not taxed here (verify before launch). Personal income tax (IRP) applies at a flat rate around 10% on Paraguay-source income above a threshold (verify before launch — confirm current rate and threshold). Property owners also pay an annual municipal real-estate tax (impuesto inmobiliario), assessed on the cadastral value rather than market value (verify before launch — confirm current rate).

## Opening a bank account

Foreign buyers can generally open an account as a foreigner, though requirements (proof of address, minimum deposit, in-person visit) vary by bank (verify before launch).

> This page is a general orientation, not tax or legal advice. Verify every rate above with a Paraguayan accountant or attorney before relying on it.

See also: [How buying property in Paraguay works](/guias/buying-property-in-paraguay), [Residency in Paraguay](/guias/residency-in-paraguay).`,
  },
  {
    slug: "residency-in-paraguay",
    title: "Residency in Paraguay for property buyers",
    excerpt:
      "Temporary and permanent residency paths, and what buying property does and doesn't do for your immigration status.",
    body: `Buying property in Paraguay does not by itself grant residency (verify before launch — confirm whether any investment-linked residency category currently exists). Residency is a separate application, though many buyers pursue both around the same time.

## Temporary to permanent

Paraguay's residency process generally runs temporary → permanent, with specific requirements at each stage (verify before launch — confirm current requirements, minimum deposit amounts and processing times with an immigration attorney before publishing any figure as current). A police-clearance certificate from your home country and a local cédula application are typically part of the process (verify before launch).

## What is a cédula?

The cédula de identidad is Paraguay's national ID document. It is not always required to buy property, but it is generally required to formalise residency, open certain accounts and register a vehicle (verify before launch).

## Relocation basics

- **Banking.** Opening an account as a foreigner is generally possible; requirements vary by bank (verify before launch).
- **Schools.** Asunción and the surrounding metro area have several bilingual (Spanish/English) private schools (verify before launch — confirm current list and admissions requirements).
- **Healthcare.** Paraguay has both public and private healthcare; most expatriates use private clinics and private insurance (verify before launch — confirm current private insurance costs).
- **Moving.** Import rules for household goods and vehicles brought in as part of a relocation vary and change; confirm with a licensed customs broker before shipping anything (verify before launch).

> This page is a general orientation, not immigration advice. Residency law and requirements change — verify every claim above with a Paraguayan immigration attorney before relying on it.

See also: [How buying property in Paraguay works](/guias/buying-property-in-paraguay), [Costs and taxes when buying in Paraguay](/guias/costs-and-taxes-buying-in-paraguay).`,
  },
];

async function main() {
  const now = new Date();
  for (const g of GUIDES) {
    await db
      .insert(posts)
      .values({
        slug: g.slug,
        title: g.title,
        excerpt: g.excerpt,
        body: g.body,
        category: "guia",
        status: "published",
        authorUserId: null,
        publishedAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: g.title,
          excerpt: g.excerpt,
          body: g.body,
          updatedAt: now,
        },
      });
  }
  console.log(`seeded ${GUIDES.length} English guide posts`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
