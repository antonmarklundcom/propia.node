import Link from "next/link";
import "./residency.css";
import { RESIDENCY_PAGES, residencyPageBySlug } from "@/content/residency";

const STEPS = [
  "Elegís la categoría de radicación que corresponde a tu situación: Mercosur, jubilación, inversión, trabajo remoto o familia.",
  "Reunís y apostillás en tu país los documentos: antecedentes penales, partida de nacimiento y pruebas de medios de vida.",
  "Viajás a Asunción y presentás el expediente en la Dirección Nacional de Migraciones, con la toma de datos biométricos.",
  "Seguimos el trámite hasta la radicación y resolvemos observaciones.",
  "Tramitás la cédula paraguaya y, si vas a operar, el RUC. Ya podés vivir, trabajar e invertir con todo en regla.",
];

const WHO = [
  { slug: "residencia-paraguay-para-espanoles", text: "Documentos desde España, apostilla y trámite en Asunción." },
  { slug: "residencia-mercosur-paraguay", text: "El acuerdo de residencia para argentinos, brasileños, uruguayos y más." },
  { slug: "residencia-paraguay-jubilados", text: "Cómo acreditar tu pensión y radicarte con tranquilidad." },
  { slug: "residencia-paraguay-nomadas-digitales", text: "Ingresos del exterior, cédula y vida en remoto." },
  { slug: "residencia-paraguay-inversores", text: "Inversión, empresa y residencia en un mismo plan." },
];

export function ResidencyHome({ brand }: { brand: string }) {
  return (
    <main>
      <section className="rs-hero">
        <div className="ds-container">
          <p className="rs-eyebrow">Para extranjeros que quieren vivir en Paraguay</p>
          <h1 className="rs-h1">Residencia en Paraguay, paso a paso</h1>
          <p className="rs-lead">
            Requisitos, documentos, costos y trámite de la residencia
            paraguaya, explicados con claridad y con acompañamiento de punta a
            punta: desde España, Argentina y toda Latinoamérica.
          </p>
          <div className="rs-actions">
            <Link href="/contacto" className="ds-btn ds-btn--primary">Consultá tu caso</Link>
            <Link href="/residencia-paraguay" className="ds-btn ds-btn--secondary">Leé la guía completa</Link>
          </div>
        </div>
      </section>

      <section className="rs-section ds-container">
        <h2 className="home-section__title">¿Cómo es tu caso?</h2>
        <div className="rs-grid">
          {WHO.map((w) => {
            const p = residencyPageBySlug(w.slug);
            return p ? (
              <Link key={w.slug} href={`/${w.slug}`} className="rs-tile">
                <h3 className="rs-tile__title">{p.h1}</h3>
                <p className="rs-tile__text">{w.text}</p>
              </Link>
            ) : null;
          })}
        </div>
      </section>

      <section className="rs-section rs-section--muted">
        <div className="ds-container">
          <h2 className="home-section__title">El trámite en cinco pasos</h2>
          <ol className="rs-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="rs-note">
            Las reglas migratorias cambian: confirmamos los requisitos vigentes
            con Migraciones para tu caso antes de empezar.
          </p>
        </div>
      </section>

      <section className="rs-section ds-container">
        <h2 className="home-section__title">Todo sobre la residencia en Paraguay</h2>
        <div className="rs-grid">
          {RESIDENCY_PAGES.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className="rs-tile">
              <h3 className="rs-tile__title">{p.label}</h3>
              <p className="rs-tile__text">{p.lead}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rs-section rs-section--muted">
        <div className="ds-container">
          <h2 className="home-section__title">¿Empezamos?</h2>
          <p className="rs-lead">
            Contanos de dónde venís y qué querés hacer en Paraguay. {brand} te
            orienta sobre la categoría, los documentos y los tiempos de tu caso.
          </p>
          <Link href="/contacto" className="ds-btn ds-btn--primary">Escribinos</Link>
        </div>
      </section>
    </main>
  );
}
