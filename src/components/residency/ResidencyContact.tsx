import "./residency.css";
import { LeadForm } from "@/components/LeadForm";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";

export function ResidencyContact() {
  const waHref = waLink(
    CONTACT_WHATSAPP,
    "Hola, quiero consultar por la residencia en Paraguay.",
  );
  return (
    <main>
      <section className="rs-hero rs-hero--page">
        <div className="ds-container">
          <h1 className="rs-h1">Consultá tu residencia en Paraguay</h1>
          <p className="rs-lead">
            Contanos tu nacionalidad, de dónde venís y qué querés hacer en
            Paraguay. Te respondemos con la categoría que te corresponde y la
            lista de documentos para tu caso.
          </p>
        </div>
      </section>
      <div className="ds-container rs-contact">
        <div>
          <LeadForm
            leadType="question"
            locale="es"
            source="residencia:contacto"
            reasons={[
              { value: "question", label: "Quiero información" },
              { value: "buyer", label: "Quiero iniciar mi residencia" },
            ]}
          />
        </div>
        <div className="rs-card">
          <h3>Otros canales</h3>
          <ul>
            {waHref && (
              <li>
                <a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp {CONTACT_WHATSAPP}</a>
              </li>
            )}
            {CONTACT_EMAIL && (
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
            )}
          </ul>
          <p className="rs-note">
            Usamos tus datos solo para responder tu consulta. Más en la{" "}
            <a href="/privacidad">política de privacidad</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
