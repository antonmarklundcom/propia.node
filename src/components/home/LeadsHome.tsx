/**
 * Home shell for inmobiliarios.com.py ("agents", `family: "directory"`,
 * `homeLayout() === "leads"`). Deliberately NOT a narrowed marketplace
 * feeder like terreno.com.py: this door sells two things the marketplace
 * doesn't —
 *
 *   1. Seller leads — a property owner who wants help selling, routed in as
 *      an ordinary `leadType: "seller"` lead (same pipeline `/contacto` and
 *      `/vender` already use).
 *   2. A marketing/exposure service pitch to realtors and agencies — social
 *      media promotion plus reach across the network's other doors
 *      (inmobiliaria.com.py, realestateinparaguay.com), not the free
 *      "publish your own inventory" offer `/para-inmobiliarias` already
 *      makes. Captured as `leadType: "agent_signup"` with `companyField`.
 *
 * Two audiences, two forms, one page — same MarketingUI building blocks
 * `/para-inmobiliarias` uses, so the two pages read as one family rather
 * than two different sites. Spanish-only forever (this vertical has no
 * English pair), so copy is hardcoded here rather than routed through the
 * i18n dictionary — the same choice `/para-inmobiliarias` already made.
 */
import Link from "next/link";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { siteOrigin } from "@/lib/origin";
import {
  CtaBand,
  FeatureGrid,
  PageHero,
  Section,
  StepList,
} from "@/components/MarketingUI";

const SELLER_BENEFITS = [
  {
    icon: "🏡",
    title: "Tasación sin costo",
    text: "Te decimos cuánto vale tu propiedad hoy, con datos reales del mercado paraguayo — sin compromiso.",
  },
  {
    icon: "🤝",
    title: "Te conectamos con un agente vetado",
    text: "Trabajamos con inmobiliarias y agentes que ya conocemos. Elegimos el que mejor se ajusta a tu propiedad y tu zona.",
  },
  {
    icon: "📣",
    title: "Tu propiedad, promocionada",
    text: "Una vez publicada, la mostramos en nuestra red de sitios y en redes sociales — más ojos, más rápido.",
  },
];

const SELLER_STEPS = [
  { title: "Contanos de tu propiedad", text: "Un formulario de dos minutos: ubicación, tipo y qué buscás." },
  { title: "Te llamamos por WhatsApp", text: "Coordinamos una tasación y respondemos tus preguntas sin costo." },
  { title: "Elegís cómo avanzar", text: "Te presentamos al agente o inmobiliaria que mejor encaja, o publicamos directamente." },
];

const AGENCY_BENEFITS = [
  {
    icon: "📇",
    title: "Vendedores que ya están buscando ayuda",
    text: "Los propietarios que llegan por esta puerta quieren vender pronto. Te los presentamos según tu zona y tipo de propiedad.",
  },
  {
    icon: "📱",
    title: "Marketing en redes sociales",
    text: "Creamos y gestionamos publicaciones para las propiedades de tus clientes — sin que tengas que armar el contenido vos.",
  },
  {
    icon: "🌎",
    title: "Alcance internacional",
    text: "Tus propiedades aptas para comprador extranjero llegan también a realestateinparaguay.com, en inglés, a nuestra audiencia fuera de Paraguay.",
  },
  {
    icon: "💬",
    title: "Todo coordinado por WhatsApp",
    text: "Sin plataforma nueva que aprender. Te escribimos para coordinar cada campaña y cada lead.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto cuesta vender mi propiedad por esta vía?",
    a: "La tasación y la presentación inicial no tienen costo para el propietario. Cualquier comisión se acuerda directamente con el agente o inmobiliaria que te presentamos — nunca cobramos al vendedor por este servicio.",
  },
  {
    q: "¿Qué diferencia hay con publicar en inmobiliaria.com.py?",
    a: "inmobiliaria.com.py es el portal de avisos: ahí publicás tu cartera vos mismo. Acá te ayudamos a conseguir vendedores nuevos y a promocionar esas propiedades en redes e internacionalmente — es un servicio, no un portal de autopublicación.",
  },
  {
    q: "¿Cómo se paga el servicio de marketing para inmobiliarias?",
    a: "Lo coordinamos por WhatsApp según el volumen y el tipo de campaña. Escribinos y te armamos una propuesta.",
  },
  {
    q: "¿Y si no soy inmobiliaria, soy agente independiente?",
    a: "También trabajamos con agentes independientes. Contanos tu zona y qué tipo de propiedades manejás.",
  },
];

export async function LeadsHome({ brand }: { brand: string }) {
  const origin = await siteOrigin();
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [{ name: "Inicio", url: "/" }]),
          faqJsonLd(FAQ),
        ]}
      />

      <PageHero
        tone="dark"
        kicker={brand}
        title="Vendedores para tu inmobiliaria. Ayuda para el propietario."
        subtitle="Conectamos propietarios que quieren vender con agentes de confianza, y le damos a tus propiedades marketing en redes sociales y alcance internacional."
        actions={
          <>
            <Link className="mk-btn mk-btn--accent" href="#vender">
              Quiero vender mi propiedad
            </Link>
            <Link className="mk-btn mk-btn--ghost" href="#inmobiliarias">
              Soy inmobiliaria o agente
            </Link>
          </>
        }
      />

      {/* -------------------------------------------------------------- */}
      {/* Audience 1: property owners / sellers                          */}
      {/* -------------------------------------------------------------- */}
      <Section
        title="¿Querés vender tu propiedad?"
        subtitle="Te ayudamos sin costo a llegar al agente correcto y a mostrar tu propiedad donde la están buscando."
      >
        <FeatureGrid items={SELLER_BENEFITS} />
      </Section>

      <Section tone="muted" title="Cómo funciona">
        <StepList steps={SELLER_STEPS} />
      </Section>

      <Section
        id="vender"
        width="narrow"
        title="Contanos de tu propiedad"
        subtitle="Sin costo ni compromiso. Te respondemos por WhatsApp."
      >
        <LeadForm
          leadType="seller"
          submitLabel="Quiero vender mi propiedad"
          messagePlaceholder="¿Dónde está la propiedad? ¿Casa, departamento o terreno?"
          successTitle="¡Listo! Te escribimos enseguida."
          successText="Coordinamos la tasación sin costo por WhatsApp."
          source="inmobiliarios:vender"
        />
      </Section>

      {/* -------------------------------------------------------------- */}
      {/* Audience 2: realtors and agencies                               */}
      {/* -------------------------------------------------------------- */}
      <Section
        tone="muted"
        title="Servicios para inmobiliarias y agentes"
        subtitle="No es publicar tu cartera — es conseguirte vendedores nuevos y promocionar lo que ya tenés."
      >
        <FeatureGrid items={AGENCY_BENEFITS} />
      </Section>

      <Section title="Preguntas frecuentes" width="narrow">
        <div className="mk-faq">
          {FAQ.map((f) => (
            <details key={f.q} className="mk-faq__item">
              <summary className="mk-faq__q">{f.q}</summary>
              <p className="mk-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section
        id="inmobiliarias"
        tone="muted"
        width="narrow"
        title="Sumá tu inmobiliaria"
        subtitle="Contanos tu zona y el tipo de propiedades que manejás — te armamos una propuesta por WhatsApp."
      >
        <LeadForm
          leadType="agent_signup"
          companyField
          submitLabel="Quiero sumar mi inmobiliaria"
          messagePlaceholder="¿En qué zonas trabajás? ¿Cuántas propiedades manejás hoy?"
          successTitle="¡Listo! Te escribimos enseguida."
          successText="Un integrante del equipo te contacta por WhatsApp para armar la propuesta."
          source="inmobiliarios:agencia"
        />
      </Section>

      <CtaBand
        title="Vendedores nuevos. Más alcance para tus propiedades."
        text="Escribinos y coordinamos los primeros leads o la primera campaña."
        primary={{ label: "Quiero vender mi propiedad", href: "#vender" }}
        secondary={{ label: "Soy inmobiliaria", href: "#inmobiliarias" }}
      />
    </main>
  );
}
