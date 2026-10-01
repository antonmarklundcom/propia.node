import Link from "next/link";
import "./residency.css";
import { LeadForm } from "@/components/LeadForm";
import {
  RESIDENCY_PAGES,
  residencyPageBySlug,
  type ResidencyPage,
} from "@/content/residency";

/** One landing page: hero, article, FAQ, a lead form in the aside, related links. */
export function ResidencyPageView({ page }: { page: ResidencyPage }) {
  const related = page.related
    .map((s) => residencyPageBySlug(s))
    .filter((p): p is ResidencyPage => p !== null);
  return (
    <main>
      <section className="rs-hero rs-hero--page">
        <div className="ds-container">
          <p className="rs-crumbs">
            <Link href="/">Inicio</Link> › {page.label}
          </p>
          <h1 className="rs-h1">{page.h1}</h1>
          <p className="rs-lead">{page.lead}</p>
        </div>
      </section>

      <div className="ds-container rs-body">
        <article className="rs-article">
          {page.sections.map((s) => (
            <section key={s.h2}>
              <h2>{s.h2}</h2>
              {s.paras.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {page.faq.length > 0 && (
            <section className="rs-faq">
              <h2>Preguntas frecuentes</h2>
              {page.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </section>
          )}

          {related.length > 0 && (
            <section>
              <h2>Seguí leyendo</h2>
              <div className="rs-related">
                {related.map((r) => (
                  <Link key={r.slug} className="rs-chip" href={`/${r.slug}`}>
                    {r.h1}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="rs-aside">
          <div className="rs-card" id="consulta">
            <h3>Consultá tu caso</h3>
            <p className="rs-note" style={{ marginTop: 0 }}>
              Contanos de dónde venís y qué querés hacer en Paraguay; te
              orientamos sobre la categoría y los documentos.
            </p>
            <LeadForm
              leadType="question"
              locale="es"
              source={`residencia:${page.slug}`}
              reasons={[
                { value: "question", label: "Quiero información" },
                { value: "buyer", label: "Quiero iniciar mi residencia" },
              ]}
            />
          </div>
          <div className="rs-card">
            <h3>Todas las guías</h3>
            <ul>
              {RESIDENCY_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`}>{p.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
