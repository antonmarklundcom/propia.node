"use client";

import { useState } from "react";

/**
 * "Oportunidades inmobiliarias" email capture. No newsletter infra exists
 * yet (no subscribers table, no ESP), so — same fallback pattern as the
 * publish CTA when NEXT_PUBLIC_CONTACT_WHATSAPP is unset — this opens a
 * pre-filled mailto to hola@propia.com.py rather than pretending to submit
 * to a backend that doesn't exist.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const subject = encodeURIComponent("Quiero recibir oportunidades inmobiliarias");
    const body = encodeURIComponent(`Suscribime con este email: ${email}`);
    window.location.href = `mailto:hola@propia.com.py?subject=${subject}&body=${body}`;
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input
        className="newsletter__input"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ingresa tu email"
        aria-label="Email"
      />
      <button className="newsletter__submit" type="submit">
        Suscribirme
      </button>
    </form>
  );
}
