import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PY">
      <body>
        <SiteHeader />
        <div className="site-main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
