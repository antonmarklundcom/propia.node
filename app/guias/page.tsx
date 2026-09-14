import { Glyph } from "@/components/Glyph";
import { numberLocaleFor } from "@/i18n";
import { dict, currentLocale } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { imageThumbUrl } from "@/lib/format";
import {
  listPublishedPosts,
  POST_CATEGORY_LABEL,
  type PostCard,
} from "@/lib/post-queries";
import { CtaBand, PageHero, Section } from "@/components/MarketingUI";

// Editorial content changes when the founder publishes, not on a schedule.
export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).guidesPage;
  const brand = await brandName();
  return {
    title: c.metaTitle,
    description: c.description(brand),
    alternates: { canonical: `${await siteOrigin()}/guias` },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

function formatDate(d: Date | null, numberLocale: string): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString(numberLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function PostTile({ post, featured }: { post: PostCard; featured?: boolean }) {
  const c = (await dict()).guidesPage;
  const cover = imageThumbUrl(post.coverR2Key);
  const date = formatDate(post.publishedAt, numberLocaleFor(await currentLocale()));
  return (
    <Link
      className={`post-card${featured ? " post-card--featured" : ""}`}
      href={`/guias/${post.slug}`}
    >
      <div
        className={`post-card__media${cover ? "" : " post-card__media--empty"}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="media-cover-img"
            src={cover}
            alt={post.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="post-card__placeholder" aria-hidden>
            <Glyph name="doc" size={16} />
          </span>
        )}
        <span className="post-card__category">
          {c.categories[post.category]}
        </span>
      </div>
      <div className="post-card__body">
        <h2 className="post-card__title">{post.title}</h2>
        <p className="post-card__excerpt">{post.excerpt}</p>
        <div className="post-card__meta">
          {date && <span>{date}</span>}
          <span>{post.readingMinutes}{c.readingSuffix}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function GuiasPage() {
  const c = (await dict()).guidesPage;
  const [origin, posts] = await Promise.all([
    siteOrigin(),
    listPublishedPosts(),
  ]);

  const [featured, ...rest] = posts;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/guias" },
          ]),
          ...(posts.length > 0
            ? [
                itemListJsonLd(
                  origin,
                  posts.map((p) => ({
                    title: p.title,
                    url: `/guias/${p.slug}`,
                  })),
                ),
              ]
            : []),
        ]}
      />

      <PageHero
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.subtitle}
      />

      <Section>
        {posts.length === 0 ? (
          <div className="mk-empty">
            <p>
              {c.empty}</p>
            <div className="mk-cta__actions" style={{ marginTop: 16 }}>
              <Link className="mk-btn mk-btn--outline" href="/como-funciona">
                {c.howItWorks}</Link>
              <Link className="mk-btn mk-btn--outline" href="/financiamiento">
                {c.financing}</Link>
              <Link className="mk-btn mk-btn--outline" href="/preguntas-frecuentes">
                {c.faq}</Link>
            </div>
          </div>
        ) : (
          <>
            <PostTile post={featured} featured />
            {rest.length > 0 && (
              <div className="post-grid">
                {rest.map((p) => (
                  <PostTile key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.valuation, href: "/tasacion" }}
        secondary={{ label: c.marketData, href: "/datos" }}
      />
    </main>
  );
}
