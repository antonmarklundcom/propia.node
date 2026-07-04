import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PY">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#F6F7F5",
          color: "#1B1F24",
        }}
      >
        {children}
      </body>
    </html>
  );
}
