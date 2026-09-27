/**
 * Peer of `es-auth-reset.ts` — password reset and the partner sign-up emails.
 * Checked against the Spanish shape with `satisfies` in `index.ts`, and walked
 * side by side by `npm run verify:i18n`.
 */
export const enAuthReset = {
  forgotLink: "Forgot your password?",
  loginResetDone:
    "Done: your password has changed and every open session was signed out. Sign in with the new one.",

  request: {
    metaTitle: "Reset password",
    title: "Reset your password",
    subtitle: "Enter your account's email and we will send you a link to choose a new password.",
    emailLabel: "Email",
    submit: "Send link",
    sent: (minutes: number) =>
      `If an account exists for that email, we sent it a link. Check your inbox (and the spam folder): it works for ${minutes} minutes and only once.`,
    errorEmail: "Check your email address.",
    errorThrottled: "Too many requests in a row. Wait a while and try again.",
    unavailable: "Password reset is not available right now.",
    backToLogin: "Back to sign in",
  },

  reset: {
    metaTitle: "New password",
    title: "Choose a new password",
    subtitle: "Saving it signs out every open session on your account.",
    passwordLabel: "New password",
    passwordHint: (min: number) => `At least ${min} characters.`,
    confirmLabel: "Repeat the password",
    submit: "Save password",
    errorPassword: (min: number) => `The password needs at least ${min} characters.`,
    errorMismatch: "The two passwords do not match.",
    errorThrottled: "Too many attempts in a row. Wait a few minutes and try again.",
    invalidTitle: "This link no longer works",
    invalidBody: "It may have expired, or it was already used to change the password. Request a new one.",
    requestNew: "Request a new link",
  },

  email: {
    subject: (brand: string) => `Choose a new password — ${brand}`,
    heading: "You asked to change your password",
    body: (minutes: number) =>
      `Use the button to choose a new password. The link works for ${minutes} minutes and only once.`,
    notYou: "If you did not ask for this, ignore this email: your password stays the same.",
    cta: "Choose a new password",
  },

  welcome: {
    subject: (brand: string) => `Your ${brand} account is active`,
    heading: "Your account is active",
    body: "You can add your properties from your dashboard now. We review each listing before publishing it.",
    verify:
      "Before we share enquiries from the portal with you, we verify each account manually after reviewing your details. Once it is verified you will see the ✓ on your profile.",
    notYou: "If you did not create this account, ignore this email.",
    cta: "Open my dashboard",
  },

  operator: {
    newPartnerTitle: "New partner account: needs verifying",
    newPartnerDetail: (p: {
      kind: "agency" | "independent";
      name: string;
      agencyName: string | null;
      email: string;
    }) =>
      p.kind === "agency"
        ? `Agency “${p.agencyName ?? ""}” · ${p.name} · ${p.email}`
        : `Independent agent · ${p.name} · ${p.email}`,
  },
};
