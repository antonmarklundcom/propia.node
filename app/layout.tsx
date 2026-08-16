import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNotice } from "@/components/SiteNotice";
import { brandMeta } from "@/lib/brand-server";
import { currentVertical } from "@/lib/vertical-context";
import { themeFor } from "@/design/themes";

/**
 * The brand suffix on every page title is set ONCE, here, as a title template.
 * Pages return only their own title segment ("Casas en Asunción") and Next
 * appends " — <brand>" from whichever domain served the request. Before this,
 * all 50 pages interpolated a global constant into their own title string,
 * which made the brand un-varyable by host and meant renaming it touched every
 * file. Do not put the brand back into a page's own title — it will double.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { name, tagline } = await brandMeta();
  return {
    title: { default: `${name} — ${tagline}`, template: `%s — ${name}` },
    description:
      "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The theme is the first thing in the render path to actually consume the
  // vertical the middleware resolved (PLAN.md D6 "consumption layer"). Both
  // live hosts resolve to the same values today, so this changes nothing a
  // visitor sees — it is the wire, not a divergence.
  const vertical = await currentVertical();
  const theme = themeFor(vertical.key) as CSSProperties;

  return (
    <html lang={vertical.locale === "en" ? "en" : "es-PY"} style={theme}>
      <head>
        {/* Cormorant Garamond + Jost, loaded from Google rather than through
            next/font: next/font fetches at build time, and the Hostinger build
            must not be able to fail on someone else's CDN. Self-hosting the two
            families is the eventual fix. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontWeight: 300,
          background: "var(--color-background)",
          color: "var(--color-ink)",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <SiteNotice />
        <SiteHeader />
        <div className="site-main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
