/**
 * Password reset (/recuperar, /recuperar/<token>) and the two account emails
 * sent on a partner sign-up: the partner's welcome and the operator's
 * "verify this account" alert.
 *
 * Its own file, like the wave namespaces, so a parallel build does not append
 * to `es.ts` at the same time; `index.ts` wires it in as `authReset`.
 * `en-auth-reset.ts` is its peer, checked against this shape with `satisfies`
 * in `index.ts` and walked side by side by `npm run verify:i18n`.
 *
 * No email in here repeats anything the visitor typed: the address on a
 * reset request or a sign-up is unverified, so the only content is ours.
 */
export const esAuthReset = {
  forgotLink: "¿Olvidaste tu contraseña?",
  loginResetDone:
    "Listo: tu contraseña cambió y se cerraron todas las sesiones abiertas. Ingresá con la nueva.",

  request: {
    metaTitle: "Recuperar contraseña",
    title: "Recuperá tu contraseña",
    subtitle: "Escribí el email de tu cuenta y te mandamos un enlace para elegir una contraseña nueva.",
    emailLabel: "Email",
    submit: "Enviar enlace",
    sent: (minutes: number) =>
      `Si hay una cuenta con ese email, te mandamos un enlace. Revisá tu correo (también la carpeta de spam): vale ${minutes} minutos y sirve una sola vez.`,
    errorEmail: "Revisá el email.",
    errorThrottled: "Demasiados pedidos seguidos. Esperá un rato y volvé a probar.",
    unavailable: "La recuperación de contraseña no está disponible por ahora.",
    backToLogin: "Volver a ingresar",
  },

  reset: {
    metaTitle: "Nueva contraseña",
    title: "Elegí una contraseña nueva",
    subtitle: "Al guardarla se cierran todas las sesiones abiertas de tu cuenta.",
    passwordLabel: "Contraseña nueva",
    passwordHint: (min: number) => `Mínimo ${min} caracteres.`,
    confirmLabel: "Repetí la contraseña",
    submit: "Guardar contraseña",
    errorPassword: (min: number) => `La contraseña necesita al menos ${min} caracteres.`,
    errorMismatch: "Las dos contraseñas no coinciden.",
    errorThrottled: "Demasiados intentos seguidos. Esperá unos minutos y volvé a probar.",
    invalidTitle: "Este enlace ya no sirve",
    invalidBody: "Puede haber vencido, o ya se usó para cambiar la contraseña. Pedí uno nuevo.",
    requestNew: "Pedir un enlace nuevo",
  },

  email: {
    subject: (brand: string) => `Elegí una contraseña nueva — ${brand}`,
    heading: "Pediste cambiar tu contraseña",
    body: (minutes: number) =>
      `Usá el botón para elegir una contraseña nueva. El enlace vale ${minutes} minutos y sirve una sola vez.`,
    notYou: "Si no lo pediste vos, ignorá este correo: tu contraseña sigue igual.",
    cta: "Elegir contraseña nueva",
  },

  welcome: {
    subject: (brand: string) => `Tu cuenta en ${brand} está activa`,
    heading: "Tu cuenta ya está activa",
    body: "Ya podés cargar tus propiedades desde tu panel. Revisamos cada aviso antes de publicarlo.",
    verify:
      "Antes de compartirte consultas del portal verificamos cada cuenta a mano, después de revisar tus datos. Cuando esté verificada vas a ver el ✓ en tu perfil.",
    notYou: "Si no creaste esta cuenta, ignorá este correo.",
    cta: "Abrir mi panel",
  },

  /** Operator copy — Spanish on both doors, like every other operator alert. */
  operator: {
    newPartnerTitle: "Nueva cuenta de socio: falta verificarla",
    newPartnerDetail: (p: {
      kind: "agency" | "independent";
      name: string;
      agencyName: string | null;
      email: string;
    }) =>
      p.kind === "agency"
        ? `Inmobiliaria «${p.agencyName ?? ""}» · ${p.name} · ${p.email}`
        : `Agente independiente · ${p.name} · ${p.email}`,
  },
} as const;
