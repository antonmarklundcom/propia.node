import { esPanel } from "@/i18n/es";
import { esA4 } from "@/i18n/es-a4";
import {
  BIO_MAX,
  LICENSE_MAX,
  YEARS_MAX,
  ZONES_MAX,
  type EditableAgentProfile,
} from "@/lib/agent-profile-edit";
import styles from "./a4.module.css";

/**
 * The public agent profile card on /agencia/perfil (plan-build A4).
 *
 * `own` only changes wording and where the save lands; which row the save may
 * touch is decided by `agentEditWhere()` in the server action, never here —
 * a form is not a trust boundary.
 */
export function AgentProfileForm({
  agent,
  own,
  cities,
  action,
}: {
  agent: EditableAgentProfile;
  own: boolean;
  cities: { slug: string; name: string }[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = esA4.profile;
  const chosen = new Set(agent.zones);

  return (
    <form action={action} className="panel-form">
      <input type="hidden" name="agentId" value={agent.id} />
      {own ? <input type="hidden" name="own" value="1" /> : null}

      <label className="panel-form__field" style={{ flexBasis: "100%" }}>
        <span className="auth-field__label">{esPanel.nameLabel}</span>
        <input
          className="auth-field__input"
          name="name"
          type="text"
          defaultValue={agent.name}
          maxLength={140}
          minLength={2}
          required
        />
      </label>

      <label className="panel-form__field">
        <span className="auth-field__label">{esPanel.profileWhatsappLabel}</span>
        <input
          className="auth-field__input"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          defaultValue={agent.whatsapp ?? ""}
          maxLength={30}
        />
      </label>

      <label className="panel-form__field">
        <span className="auth-field__label">{t.yearsLabel}</span>
        <input
          className="auth-field__input"
          name="yearsActive"
          type="number"
          inputMode="numeric"
          min={0}
          max={YEARS_MAX}
          step={1}
          defaultValue={agent.yearsActive ?? ""}
        />
      </label>

      <label className="panel-form__field">
        <span className="auth-field__label">{t.licenseLabel}</span>
        <input
          className="auth-field__input"
          name="licenseNo"
          type="text"
          defaultValue={agent.licenseNo ?? ""}
          maxLength={LICENSE_MAX}
        />
      </label>

      <label className="panel-form__field" style={{ flexBasis: "100%" }}>
        <span className="auth-field__label">{esPanel.profilePhotoLabel}</span>
        <input
          className="auth-field__input"
          name="photoUrl"
          type="url"
          defaultValue={agent.photoUrl ?? ""}
          maxLength={500}
          placeholder="https://…"
        />
      </label>

      <label className="panel-form__field" style={{ flexBasis: "100%" }}>
        <span className="auth-field__label">{t.bioLabel}</span>
        <textarea
          className="panel-reject__textarea"
          name="bio"
          rows={5}
          maxLength={BIO_MAX}
          defaultValue={agent.bio ?? ""}
        />
        <span className="panel-card__meta">{t.bioHint(BIO_MAX)}</span>
      </label>

      {cities.length > 0 ? (
        <fieldset className={styles.zones}>
          <legend className="auth-field__label">{t.zonesLabel}</legend>
          <p className="panel-card__meta">{t.zonesHint(ZONES_MAX)}</p>
          <div className={styles.zoneGrid}>
            {cities.map((c) => (
              <label key={c.slug} className={styles.zone}>
                <input
                  type="checkbox"
                  name="zones"
                  value={c.slug}
                  defaultChecked={chosen.has(c.slug)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="panel-form__field panel-form__field--action">
        <button className="panel-btn panel-btn--primary" type="submit">
          {esPanel.profileSave}
        </button>
      </div>
    </form>
  );
}

/**
 * The agency admin's "whose profile" picker — a plain GET form, so it works
 * without JavaScript and the chosen id lands in `?agente=`, where the page
 * re-checks it against the same predicate the save uses.
 */
export function AgentPicker({
  agents,
  currentId,
  ownUserId,
}: {
  agents: EditableAgentProfile[];
  currentId: number;
  ownUserId: number;
}) {
  const t = esA4.profile;
  return (
    <form method="get" action="/agencia/perfil" className="panel-form">
      <label className="panel-form__field">
        <span className="auth-field__label">{t.teamPickerLabel}</span>
        <select className="panel-select" name="agente" defaultValue={currentId}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.userId === ownUserId ? t.teamPickerOwn(a.name) : a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="panel-form__field panel-form__field--action">
        <button className="panel-btn" type="submit">
          {t.teamPickerGo}
        </button>
      </div>
    </form>
  );
}
