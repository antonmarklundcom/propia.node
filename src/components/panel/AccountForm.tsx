import { esPanel } from "@/i18n/es";

/**
 * The signed-in user's own login: name, email and an optional new password,
 * with the current password as re-auth (audit F21). Shared by /agencia/perfil
 * and /admin/cuenta so both post the same fields to `updateOwnAccount()` —
 * one password-change path, not one per panel.
 */
export function AccountForm({
  action,
  name,
  email,
}: {
  action: (formData: FormData) => Promise<void>;
  name: string | null;
  email: string | null;
}) {
  return (
    <form action={action} className="panel-form">
      <label className="panel-form__field">
        <span className="auth-field__label">{esPanel.nameLabel}</span>
        <input
          className="auth-field__input"
          name="name"
          type="text"
          defaultValue={name ?? ""}
          maxLength={140}
          required
        />
      </label>

      <label className="panel-form__field">
        <span className="auth-field__label">{esPanel.emailLabel}</span>
        <input
          className="auth-field__input"
          name="email"
          type="email"
          defaultValue={email ?? ""}
          maxLength={190}
          required
        />
      </label>

      <label className="panel-form__field">
        <span className="auth-field__label">{esPanel.newPasswordLabel}</span>
        <input
          className="auth-field__input"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
        />
        <span className="auth-field__hint">{esPanel.newPasswordHint}</span>
      </label>

      {/* Re-auth (audit F21). Not `required`: the name can be edited on its
          own, and the server is what decides whether this field was needed —
          the form is not the gate. */}
      <label className="panel-form__field">
        <span className="auth-field__label">{esPanel.currentPasswordLabel}</span>
        <input
          className="auth-field__input"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
        />
        <span className="auth-field__hint">{esPanel.currentPasswordHint}</span>
      </label>

      <button className="panel-btn panel-btn--primary" type="submit">
        {esPanel.profileSave}
      </button>
    </form>
  );
}
