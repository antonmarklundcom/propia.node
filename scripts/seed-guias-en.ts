/**
 * Seed the three English guide posts realestateinparaguay.com's home page
 * links to (docs/style/realestateinparaguay.com.md §8 "New content pages
 * this domain needs"): buying-property-in-paraguay, costs-and-taxes,
 * residency. Uses the existing `posts` table (ARCHITECTURE.md §2.10, the
 * same `/guias/[slug]` content model the Spanish door already has). Explicitly
 * sets `locale` to `en`; omitting it would use the table's Spanish default.
 * Public guide queries currently do not filter by locale, so the shared
 * index still mixes languages; locale filtering is outside this script.
 *
 * No rate, fee, timeline or legal claim is stated without a source (plan
 * 2026-09-22 A6): the "(verify before launch)" placeholders were replaced by
 * what is verifiable and by the questions to ask the notary, the agent or
 * Migraciones. Put figures back only with a source the founder signs.
 *
 * Idempotent: upsert by slug, so re-running never duplicates.
 *
 *   DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" npm run seed:guias-en -- --dry
 *   DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" npm run seed:guias-en
 *
 * `--dry` reports which of the three posts would be created and which already
 * exist, writing nothing. This script has no runner in `src/lib/ops/` because S2
 * replaces it with `posts:upsert` over markdown files under `content/guias/en/`
 * (`fable-plan-ops.md` §5.2) — the dry flag is here so that, until then, no
 * writing script in the repo lacks one.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { inArray } from "drizzle-orm";
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
    body: `Foreigners can buy and own property in Paraguay in their own name. The transfer is formalised by public deed (escritura pública) before a notary (escribano) and then registered. Some land can carry extra rules, so ask the notary about the specific property before you commit.

Every listing on this site shows its price in the currency the seller chose, US dollars or guaraníes. Agree the currency and the payment method with the seller and the notary in writing.

## The five steps

1. **Choose and verify.** Find the property and ask the seller or agent for the basic facts of its title.
2. **Offer and reservation.** A price is agreed and a reservation is signed. Ask what deposit is expected and under which conditions it is returned, and get it in writing.
3. **Due diligence on title.** Your notary or attorney checks the title with the Registro Público (Public Registry): liens, boundaries and ownership history. Ask the notary how long this will take for your property.
4. **Public deed before a notary.** Both parties sign the escritura pública before the escribano. The notary sets the date.
5. **Registration and handover.** The notary files the deed for registration and coordinates the handover. Ask the notary for the expected timeline.

## Questions to ask your notary before you start

- Does my purchase need a cédula (Paraguayan ID), or is my passport enough?
- If I cannot be there in person, what must a power of attorney (poder) signed abroad contain, and does it need an apostille?
- How and to which account should the money be sent? Never send money to an account you have not confirmed with the notary directly.

> This page is a general orientation, not legal advice. Engage a Paraguayan attorney or escribano before signing anything.

See also: [Costs and taxes when buying in Paraguay](/guias/costs-and-taxes-buying-in-paraguay), [Residency in Paraguay](/guias/residency-in-paraguay).`,
  },
  {
    slug: "costs-and-taxes-buying-in-paraguay",
    title: "Costs and taxes when buying in Paraguay",
    excerpt:
      "What to ask for on top of the purchase price, and who can tell you the real figures.",
    body: `On top of the agreed price, a buyer usually pays closing costs: taxes on the transfer, the notary's fees and registration. The amounts depend on the property and on how the deal is structured, so get them in writing before you sign anything.

## Closing costs: what to ask for

- **Transfer taxes and registration.** Ask the notary for a written breakdown for your specific property.
- **Notary fees.** Ask the notary for a written quote before the due diligence starts.
- **Agent commission.** Ask the agent who pays it and how much, and agree it in writing before you visit.

## Ongoing taxes

Owning property in Paraguay comes with ongoing taxes, and your own income tax position depends on where you live and where your income comes from. Ask a Paraguayan accountant before you buy, and ask the municipality or the notary about the yearly property tax for the specific property.

## Opening a bank account

Requirements differ from bank to bank. Ask the bank which documents it needs from a foreigner, and whether you must be there in person, before you travel.

> This page is a general orientation, not tax or legal advice. Confirm every figure with a Paraguayan accountant or attorney before relying on it.

See also: [How buying property in Paraguay works](/guias/buying-property-in-paraguay), [Residency in Paraguay](/guias/residency-in-paraguay).`,
  },
  {
    slug: "residency-in-paraguay",
    title: "Residency in Paraguay for property buyers",
    excerpt:
      "Temporary and permanent residency paths, and what buying property does and doesn't do for your immigration status.",
    body: `Residency is a separate process from buying property. Treat them as two projects: the notary handles the purchase, and the migration office (Dirección General de Migraciones) or an immigration attorney handles residency.

## Questions to ask about residency

- Which residency category fits my situation, and what are its current requirements?
- Which documents from my home country do I need, and do they need an apostille or a translation?
- How long does the process take today, and do I need to be in Paraguay for any step?

Requirements change, so confirm them with Migraciones or an immigration attorney before you plan around them.

## What is a cédula?

The cédula de identidad is the Paraguayan identity document. Ask your notary whether your purchase needs one, and ask Migraciones how and when you can apply for it.

## Relocation basics

- **Banking.** Ask the bank which documents it needs from a foreigner before you travel.
- **Schools.** Contact schools directly for current programmes, languages and admission rules.
- **Healthcare.** Compare private health plans and what they cover before you move.
- **Moving.** Rules for bringing household goods and vehicles change; ask a licensed customs broker before you ship anything.

> This page is a general orientation, not immigration advice. Confirm every step with Migraciones or a Paraguayan immigration attorney before relying on it.

See also: [How buying property in Paraguay works](/guias/buying-property-in-paraguay), [Costs and taxes when buying in Paraguay](/guias/costs-and-taxes-buying-in-paraguay).`,
  },
];

const dry = process.argv.includes("--dry");

async function main() {
  const now = new Date();

  const existing = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      inArray(
        posts.slug,
        GUIDES.map((g) => g.slug),
      ),
    );
  const known = new Set(existing.map((r) => r.slug));

  for (const g of GUIDES) {
    console.log(`  ${known.has(g.slug) ? "update" : "create"}  ${g.slug}`);
    if (dry) continue;
    await db
      .insert(posts)
      .values({
        slug: g.slug,
        locale: "en",
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
          locale: "en",
        },
      });
  }
  console.log(
    dry
      ? `--dry: ${GUIDES.length} English guide post(s) would be written, nothing written.`
      : `seeded ${GUIDES.length} English guide posts`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
