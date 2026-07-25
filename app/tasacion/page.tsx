import type { Metadata } from "next";
import { esTasacion } from "@/i18n/es";
import { listCities } from "@/lib/queries";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ValuationTool } from "@/components/ValuationTool";
import { estimateAction, requestValuationContactAction } from "./actions";

// Reads the city list and (through the actions) live medians.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${esTasacion.title} — Homes Paraguay`,
    description: esTasacion.subtitle,
    alternates: { canonical: `${await siteOrigin()}/tasacion` },
  };
}

export default async function TasacionPage() {
  const [cities, origin] = await Promise.all([listCities(), siteOrigin()]);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "1rem" }}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Inicio", url: "/" },
            { name: esTasacion.title, url: "/tasacion" },
          ]),
        ]}
      />

      <h1 style={{ fontSize: 26 }}>{esTasacion.title}</h1>
      <p style={{ color: "#5B6470" }}>{esTasacion.subtitle}</p>

      <ValuationTool
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        estimate={estimateAction}
        requestContact={requestValuationContactAction}
      />
    </main>
  );
}
