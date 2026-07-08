import { ImageResponse } from "next/og";

/**
 * Default share-preview image (§6.6) — partner/agent links travel over
 * WhatsApp, where the OG preview IS the first impression. Listing detail
 * pages override this with the listing's own cover photo when one exists
 * (see app/propiedad/[slug]/page.tsx generateMetadata).
 */
export const runtime = "edge";
export const alt = "Propia — Encontrá tu propiedad en Paraguay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A5D3A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "#E8A13D",
              color: "#3A2A08",
              fontSize: 72,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div
            style={{
              display: "flex",
              color: "#FFFFFF",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            Propia
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            color: "#DFE7E0",
            fontSize: 36,
            fontWeight: 600,
          }}
        >
          Encontrá tu propiedad en Paraguay
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            color: "#9FB3A5",
            fontSize: 26,
          }}
        >
          Casas · Departamentos · Terrenos · Cuota estimada
        </div>
      </div>
    ),
    { ...size },
  );
}
