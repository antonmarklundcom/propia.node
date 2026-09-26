"use client";

/**
 * "Enviar por WhatsApp" next to an invite link (build A1, Agency 5).
 *
 * The number stays in the browser: it only builds the wa.me URL, is never
 * posted, and is not in the page URL either. Left blank, the link opens
 * WhatsApp's own contact picker with the invitation typed in.
 */
import { useState } from "react";
import { waLink } from "@/lib/wa";

export function InviteWhatsApp({
  text,
  label,
  sendLabel,
  hint,
  placeholder,
}: {
  /** The invitation, link included. */
  text: string;
  label: string;
  sendLabel: string;
  hint: string;
  placeholder: string;
}) {
  const [phone, setPhone] = useState("");
  const href =
    waLink(phone, text) ?? `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <>
      <label className="panel-form__field">
        <span className="auth-field__label">{label}</span>
        <input
          className="auth-field__input"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      <div className="panel-form__field panel-form__field--action">
        <a
          className="panel-btn panel-btn--whatsapp"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={hint}
        >
          {sendLabel}
        </a>
      </div>
    </>
  );
}
