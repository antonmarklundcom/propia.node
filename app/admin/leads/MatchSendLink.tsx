"use client";

/**
 * The WhatsApp hand-off for one proposed match.
 *
 * A plain link, so the browser opens wa.me exactly as it does everywhere else
 * in the panel — and one server action fired alongside the click, which is
 * the only honest moment to record `sent`: the message leaves from the
 * operator's own WhatsApp, so nothing server-side can observe delivery. If
 * the action fails the link still opened; the status simply stays `proposed`,
 * which is the safe direction to be wrong in.
 */
import { useTransition } from "react";
import { markMatchSentAction } from "./actions";

export function MatchSendLink({
  matchId,
  href,
  label,
}: {
  matchId: number;
  href: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <a
      className="panel-btn panel-btn--whatsapp"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-busy={pending || undefined}
      onClick={() => {
        startTransition(async () => {
          await markMatchSentAction(matchId);
        });
      }}
    >
      {label}
    </a>
  );
}
