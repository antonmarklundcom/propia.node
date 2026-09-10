import { esPanel } from "@/i18n/es";
import { waLink } from "@/lib/wa";
import type { AgentSuggestion, LeadMatchRow } from "@/lib/matching";
import { MAX_MATCHES_PER_LEAD } from "@/lib/matching";
import { proposeMatchesAction } from "./actions";
import { MatchSendLink } from "./MatchSendLink";

/**
 * The "match 3" panel on a directory seller lead (D3).
 *
 * Two halves, in the order the operator works them: the ranked suggestions to
 * choose from, and the proposals already saved with their hand-off links.
 * Every number shown is a real one — inventory counts come from published
 * rows, and there are no ratings or response times to invent (plan §1 item 2).
 */
export function MatchPanel({
  leadId,
  citySlug,
  suggestions,
  matches,
  forwardText,
}: {
  leadId: number;
  citySlug: string | null;
  suggestions: AgentSuggestion[];
  matches: LeadMatchRow[];
  forwardText: string;
}) {
  const matchedIds = new Set(matches.map((m) => m.agentId));
  const offered = suggestions.filter((s) => !matchedIds.has(s.id));

  return (
    <div className="panel-card__body">
      <h4 className="panel-card__title">{esPanel.matchTitle}</h4>
      <p className="panel-card__meta">
        {esPanel.matchHint(MAX_MATCHES_PER_LEAD)}
      </p>
      {citySlug == null ? (
        <p className="panel-note">{esPanel.matchNoCity}</p>
      ) : null}

      {matches.length > 0 ? (
        <div className="panel-card__meta" style={{ display: "block" }}>
          <strong>{esPanel.matchExistingTitle}</strong>
          {matches.map((m) => {
            const href = waLink(m.agentWhatsapp, forwardText);
            return (
              <div key={m.id} className="panel-form">
                <span className="panel-form__field">
                  {m.agentName} —{" "}
                  {esPanel.matchStatus[m.status] ?? m.status}
                </span>
                <div className="panel-form__field panel-form__field--action">
                  {href ? (
                    <MatchSendLink
                      matchId={m.id}
                      href={href}
                      label={esPanel.matchSend}
                    />
                  ) : (
                    <span className="panel-card__meta">
                      {esPanel.matchNoWhatsapp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {offered.length === 0 ? (
        matches.length === 0 ? (
          <p className="panel-empty">{esPanel.matchNoCandidates}</p>
        ) : null
      ) : (
        <form action={proposeMatchesAction} className="panel-form">
          <input type="hidden" name="leadId" value={leadId} />
          {offered.map((s) => (
            <label
              key={s.id}
              className="panel-form__field"
              style={{ flexBasis: "260px" }}
            >
              <span className="auth-field__label">
                <input type="checkbox" name="agentId" value={s.id} /> {s.name}
              </span>
              <span className="panel-card__meta">
                {[
                  s.agencyName ?? esPanel.matchIndependent,
                  s.hasInventoryThere ? esPanel.matchInventoryThere : null,
                  s.zoneDeclared ? esPanel.matchZoneDeclared : null,
                  esPanel.matchListingCount(s.listingCount),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </label>
          ))}
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn panel-btn--primary" type="submit">
              {esPanel.matchSave}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
