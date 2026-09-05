/**
 * Canonical voseo strings (ARCHITECTURE.md §3.6) — the i18n es base.
 * All local-facing copy is Paraguayan voseo. NEVER generate
 * neutral-Spanish variants of these.
 */

export const es = {
  searchPlaceholder: "¿Dónde querés vivir?",
  publishCta: "Publicá gratis",
  contactWhatsapp: "Contactá por WhatsApp",
  priceAlert: "Avisame si baja",
  wizardNext: "Siguiente →",
  wizardPrev: "Anterior",
  valuationMagnet: "¿Cuánto vale tu casa? Descubrilo gratis",
  emptyState:
    "Todavía no hay propiedades acá — creá una alerta y te avisamos",
  rentalsHero: "Tu próximo lugar te está esperando.", // alquiler vertical: never ownership language
  foreignToggle: "Mostrale tu propiedad al mundo",
  foreignToggleDetail:
    "🌎 Tu propiedad también se mostrará a compradores extranjeros en realestateinparaguay.com — sin costo adicional.",
  inquiryPrefill: "Hola, estoy interesado en esta propiedad.",
  quickQuestions: ["¿Disponible?", "¿Puedo visitar?", "¿Requisitos?"],
} as const;

/**
 * Pre-launch notice (src/config/site-status.ts). Says the two things a
 * visitor needs: the listings are samples, and nothing here is an offer.
 * Deliberately plain — a disclosure that reads as marketing isn't one.
 */
export const esSiteNotice = {
  label: "Sitio en construcción",
  body: (brand: string) => `Estamos preparando el lanzamiento de ${brand}. Las propiedades que ves son ejemplos de prueba: no son inmuebles reales en venta ni ofertas comerciales, y los datos y las fotos pueden no corresponder a ninguna propiedad existente.`,
} as const;

/**
 * ContactForm (src/components/ContactForm.tsx) — a client component, so it
 * reaches this via getDictionary(locale) rather than dict(). Was hardcoded
 * Spanish regardless of locale until this namespace existed; every string a
 * visitor sees in the form now comes from here.
 */
export const esContactForm = {
  nameLabel: "Nombre",
  namePlaceholder: "Ingresa tu nombre",
  emailLabel: "Email",
  emailPlaceholder: "Ingresa tu email",
  phoneLabel: "Teléfono",
  phonePlaceholder: "981 234 567",
  messageLabel: "Mensaje",
  submitIdle: "Enviar Mensaje",
  submitSending: "Enviando…",
  submitSent: "¡Mensaje enviado!",
  waContinue: "💬 Continuar en WhatsApp",
  errorText: "No pudimos enviar tu consulta. Probá de nuevo en unos segundos.",
  directNote: "✓ Tu consulta llega directamente al vendedor",
  waLinkLabel: "💬 WhatsApp",
  phoneLinkLabel: "📞 Ver teléfono",
} as const;

/** Valuation tool (/tasacion) — the seller-side magnet. Honest by design. */
export const esTasacion = {
  title: "¿Cuánto vale tu propiedad?",
  subtitle: (brand: string) =>
    `Te damos un rango estimado en base a los precios publicados en ${brand}. Gratis, sin registrarte y sin que te llame nadie salvo que vos lo pidas.`,
  cityLabel: "Ciudad",
  typeLabel: "Tipo de propiedad",
  operationLabel: "Querés",
  operationSale: "Vender",
  operationRent: "Alquilar",
  areaLabel: "Superficie (m²)",
  areaHint:
    "Superficie construida. Si es un terreno, poné los m² del lote.",
  submit: "Calcular",
  calculating: "Calculando…",
  resultTitle: "Rango estimado",
  resultRange: (low: string, high: string) => `Entre ${low} y ${high}`,
  resultBasis: (n: number, perM2: string, city: string, period: string) =>
    `Calculado sobre ${n} avisos comparables en ${city} (${period}), a una mediana de ${perM2} por m².`,
  resultBandNote: (pct: number) =>
    `El rango es de ±${pct}%: cuantos menos avisos comparables hay, más ancho lo dejamos. Preferimos ser honestos antes que precisos.`,
  disclaimer:
    "Importante: es una referencia calculada con precios de publicación, no con precios de cierre, y no es una tasación oficial. Lo que define el valor real es el estado de la propiedad, su ubicación exacta y el momento del mercado.",
  errorBadArea: "Revisá los m²: poné un número entre 10 y 100.000.",
  errorUnknownCity: "Elegí una ciudad de la lista.",
  errorNoData:
    "Todavía no tenemos avisos comparables para ese tipo de propiedad en esa ciudad. Escribinos y lo vemos a mano.",
  errorThinData:
    "Tenemos muy pocos avisos comparables ahí para darte un número que podamos defender. Escribinos y lo vemos a mano.",
  errorGeneric: "No pudimos calcular el rango. Probá de nuevo.",
  nextTitle: "¿Querés publicarla o que te asesoremos?",
  nextBody:
    "Dejanos tu WhatsApp y te contactamos. También podés publicarla vos mismo, gratis.",
  nameLabel: "Tu nombre",
  whatsappLabel: "Tu WhatsApp",
  contactSubmit: "Quiero que me contacten",
  contactSent:
    "¡Listo! Te vamos a escribir por WhatsApp. Mientras tanto podés publicar tu propiedad vos mismo.",
  contactError: "No pudimos enviar tus datos. Probá de nuevo.",
  publishCta: "Publicar mi propiedad",
  publishCtaHint:
    "Llevamos los datos que cargaste acá, así no los escribís dos veces.",
  seePrices: "Ver precios de la zona",
} as const;

/** Price pages (/precios) — market data in plain voseo, caveats included. */
export const esPrecios = {
  indexTitle: "Precios de propiedades en Paraguay",
  indexSubtitle: (brand: string) =>
    `Precio mediano por ciudad, calculado con los avisos publicados en ${brand}. Elegí una ciudad para ver el detalle por tipo de propiedad.`,
  indexEmpty:
    "Todavía no tenemos suficientes avisos publicados para calcular precios confiables.",
  cityTitle: (city: string) => `Precios de propiedades en ${city}`,
  citySubtitle: (brand: string, city: string, period: string) =>
    `Precio mediano de venta y alquiler en ${city}, según los avisos publicados en ${brand}${period ? ` (${period})` : ""}.`,
  tableType: "Tipo",
  tableOperation: "Operación",
  tableMedian: "Precio mediano",
  tableMedianM2: "Por m²",
  tableSample: "Avisos",
  seeListings: "Ver avisos",
  fewSamples: "Pocos avisos — tomalo como referencia, no como precio de mercado.",
  methodTitle: "Cómo calculamos esto",
  methodBody: (brand: string) =>
    `Usamos la mediana (no el promedio) de los precios publicados en ${brand}, por ciudad y tipo de propiedad. La mediana aguanta mejor los avisos con precios extremos. Un grupo con menos de 8 avisos se muestra con aviso: es una referencia, no un precio de mercado. Los precios publicados no son precios de cierre.`,
  emptyCity:
    "Todavía no tenemos avisos suficientes en esta ciudad para calcular un precio.",
  backToPrices: "← Todos los precios",
  relatedPrices: (city: string) => `¿Cuánto vale una propiedad en ${city}?`,
  relatedPricesCta: "Ver precios medianos",

  /**
   * Market context stated as a number rather than a question (audit I8).
   * Rendered only for a sample of MIN_RELIABLE_SAMPLE or more — see
   * medianFor() in precios-queries.ts.
   */
  contextMedian: (params: {
    typeLabel: string;
    operationLabel: string;
    city: string;
    median: string;
    perM2: string | null;
    sample: number;
  }) =>
    `Mediana de ${params.operationLabel} de ${params.typeLabel.toLowerCase()} en ${params.city}: ${params.median}` +
    (params.perM2 ? ` · ${params.perM2}/m²` : "") +
    ` (${params.sample} avisos)`,
  /** This listing's own price per m², next to the zone median. */
  contextThisListing: (perM2: string) => `Esta propiedad: ${perM2}/m²`,
  contextOperationLabel: {
    venta: "venta",
    alquiler: "alquiler",
    alquiler_temporal: "alquiler temporal",
  } as Record<string, string>,
} as const;

/**
 * Panel / auth copy (admin + agency). Voseo, same register as `es`. This is the
 * internal surface (login, review queue, agency dashboard) — never indexed, but
 * still es-PY so the founder and agencies read the same language as the site.
 */
export const esPanel = {
  loginTitle: "Ingresá a tu panel",
  loginSubtitle: "Usá tu email y contraseña.",
  emailLabel: "Email",
  passwordLabel: "Contraseña",
  loginSubmit: "Entrar",
  loginError: "Email o contraseña incorrectos.",
  loginLocked:
    "Demasiados intentos. Esperá unos minutos antes de volver a intentar.",
  logout: "Salir",
  loginToRegister: "¿Todavía no tenés cuenta? Registrate",

  // Registro (inmobiliarias y agentes)
  registerTitle: "Creá tu cuenta",
  registerSubtitle:
    "Cargá tus propiedades vos mismo. Es gratis: revisamos cada aviso antes de publicarlo.",
  registerKindLabel: "¿Cómo trabajás?",
  registerKindAgency: "Tengo una inmobiliaria",
  registerKindIndependent: "Soy agente independiente",
  registerAgencyNameLabel: "Nombre de la inmobiliaria",
  registerYourNameLabel: "Tu nombre y apellido",
  registerWhatsappLabel: "WhatsApp (opcional)",
  registerPasswordLabel: "Contraseña",
  registerPasswordHint: "Mínimo 8 caracteres.",
  registerSubmit: "Crear cuenta",
  registerToLogin: "¿Ya tenés cuenta? Ingresá",
  registerPendingNote:
    "Tu cuenta queda activa al instante. La verificación (el ✓ en tu perfil) la aprobamos a mano después de revisar tus datos.",
  registerErrorName: "Escribí tu nombre completo.",
  registerErrorEmail: "Revisá el email.",
  registerErrorEmailTaken:
    "Ya existe una cuenta con ese email. Probá ingresando.",
  registerErrorPassword: "La contraseña necesita al menos 8 caracteres.",
  registerErrorAgencyName: "Escribí el nombre de la inmobiliaria.",
  registerErrorGeneric: "No pudimos crear la cuenta. Probá de nuevo.",
  registerErrorThrottled:
    "Demasiados intentos desde esta conexión. Esperá unos minutos y volvé a probar.",

  // Registro por invitación de una inmobiliaria
  registerKindInvite: (agencyName: string) => `Unirme a ${agencyName}`,
  registerInviteNote: (agencyName: string, role: string) =>
    `${agencyName} te invitó a sumarte a su equipo como ${role}. Creá tu cuenta y tus avisos van a quedar dentro de esa inmobiliaria.`,
  registerErrorInvite:
    "Esa invitación ya no sirve: puede estar vencida o ya usada. Pedile a la inmobiliaria que te mande una nueva.",

  // Invitación aceptada con una cuenta que ya existe
  inviteTitle: "Invitación a una inmobiliaria",
  inviteJoinBody: (agencyName: string, role: string) =>
    `${agencyName} te invita a sumarte a su equipo como ${role}.`,
  inviteJoinNote:
    "Tus avisos publicados hasta ahora siguen siendo tuyos. Los nuevos van a quedar a nombre de la inmobiliaria.",
  inviteJoinSubmit: (agencyName: string) => `Unirme a ${agencyName}`,
  inviteBackToPanel: "← Volver a tu panel",
  inviteInvalid:
    "Esa invitación ya no sirve: puede estar vencida o ya usada. Pedile a la inmobiliaria que te mande una nueva.",
  inviteAlreadyInAgency:
    "Ya pertenecés a una inmobiliaria. Pediles que te den de baja antes de sumarte a otra.",
  inviteNotForAdmin:
    "Estás usando la cuenta de administración del sitio; no se suma a inmobiliarias.",
  inviteNoProfile:
    "Tu cuenta todavía no tiene perfil de agente. Escribinos para activarlo.",

  // Perfil (agencia + agente)
  profileTab: "Tu perfil",
  profileAgencyTitle: "Datos de la inmobiliaria",
  profileAgencyReadOnly:
    "Solo la cuenta administradora de la inmobiliaria puede cambiar estos datos.",
  profileAgentTitle: "Tu perfil público",
  profileAccountTitle: "Tu cuenta",
  profileNoAgency:
    "Trabajás como agente independiente, así que no hay datos de inmobiliaria para editar.",
  profileLogoLabel: "Logo (URL)",
  profilePhotoLabel: "Foto (URL)",
  profileWhatsappLabel: "WhatsApp",
  profileEmailLabel: "Email de contacto",
  profileSave: "Guardar",
  profileSaved: "Datos actualizados.",
  profileAgencySaved: "Datos de la inmobiliaria actualizados.",
  profileAccountSaved: "Tu cuenta se actualizó.",
  profilePasswordChanged:
    "Contraseña actualizada. Cerramos las otras sesiones abiertas.",
  profileEmailTaken: "Ese email ya está en uso por otra cuenta.",
  profileForbidden: "No tenés permiso para cambiar esos datos.",
  profileInvalid: "Revisá los datos ingresados.",
  profileBadPassword:
    "Tu contraseña actual no coincide. Para cambiar el email o la contraseña necesitamos confirmarla.",
  currentPasswordLabel: "Contraseña actual",
  currentPasswordHint:
    "Solo hace falta si cambiás el email o ponés una contraseña nueva.",
  profileVerifiedNote: (brand: string) => `Perfil verificado por ${brand}.`,
  profilePendingNote: "Verificación pendiente de aprobación.",

  // Equipo de la inmobiliaria (/agencia/equipo) — solo para el responsable
  teamTab: "Tu equipo",
  teamTitle: "Tu equipo",
  teamHint:
    "Los que aparecen acá comparten los avisos y las consultas de la inmobiliaria. El responsable es el único que puede invitar, ascender o dar de baja.",
  teamEmpty: "Todavía no hay nadie más en tu equipo.",
  teamRoleLabel: "Rol",
  teamRoleAgent: "Agente",
  teamRoleAdmin: "Responsable",
  teamRoleSuperAdmin: "Administrador del sitio",
  teamRoleNoLogin: "Sin cuenta",
  teamNoLoginHint: "Perfil sin cuenta: lo maneja el administrador del sitio.",
  teamPromote: "Hacer responsable",
  teamDemote: "Pasar a agente",
  teamRemove: "Sacar del equipo",
  teamRemoveWarning:
    "Deja de ver los avisos y las consultas de la inmobiliaria y vuelve a trabajar como agente independiente. No se borra su cuenta, y los avisos que cargó quedan con la inmobiliaria.",
  teamRemoveConfirm: "Sí, sacar del equipo",
  teamRoleSaved: "Rol actualizado.",
  teamMemberRemoved: "Esa persona ya no forma parte de tu equipo.",
  teamJoined: "¡Listo! Ya formás parte del equipo.",
  teamLastAdminError:
    "La inmobiliaria tiene que tener al menos un responsable. Nombrá a otro antes de hacer este cambio.",
  teamSelfRoleError: "No podés cambiarte el rol a vos mismo.",
  teamSelfRemoveError: "No podés sacarte a vos mismo del equipo.",

  // Invitaciones
  teamInviteTitle: "Invitar a un agente",
  teamInviteHint: (days: number) =>
    `Generá un enlace y mandáselo por WhatsApp. Sirve una sola vez y vence a los ${days} días. Quien lo abra ve el nombre de tu inmobiliaria antes de crear la cuenta.`,
  teamInviteCreate: "Generar enlace",
  teamInviteCreated: "Enlace generado. Copialo y mandáselo a la persona.",
  teamInviteRevoke: "Anular",
  teamInviteRevoked: "Enlace anulado.",
  teamInvitesEmpty: "No hay invitaciones pendientes.",
  teamInviteUrlLabel: (role: string, expires: string) =>
    `Enlace para sumar a un ${role.toLowerCase()} — vence el ${expires}`,

  // Admin
  adminReviewTitle: "Cola de revisión",
  adminReviewEmpty: "No hay avisos esperando revisión. 🎉",
  approve: "Aprobar",
  reject: "Rechazar",
  rejectReasonLabel: "Motivo del rechazo",
  rejectReasonPlaceholder: "Contale al publicador por qué (ej: fotos con marca de agua)",
  adminAgenciesTitle: "Inmobiliarias y agentes",
  adminAgencyNewTitle: "Crear inmobiliaria",
  adminAgencyNewHint:
    "Crea el perfil de la inmobiliaria. Empieza sin verificar: usá el botón de la lista para darle el ✓. No crea un usuario — eso se hace en Usuarios, con “Vincular”. Aparece en el directorio público recién cuando tenga un aviso publicado.",
  agencyNameLabel: "Nombre de la inmobiliaria",
  agencyWhatsappLabel: "WhatsApp",
  agencyEmailLabel: "Email de contacto",
  planLabel: "Plan",
  createAgency: "Crear inmobiliaria",
  agencyCreated: "Inmobiliaria creada. Todavía está sin verificar.",
  agencyInvalid: "Revisá los datos: el nombre es obligatorio.",
  verify: "Verificar",
  unverify: "Quitar verificación",
  verifiedBadge: "✓ Verificado",
  notVerifiedBadge: "Sin verificar",

  // Admin — usuarios
  adminUsersTitle: "Usuarios",
  /** Labels for the two panel tab rows — see PanelBar's `group`. */
  navMain: "Secciones del panel",
  navManage: "Administración",
  adminUsersEmpty: "Todavía no hay usuarios.",
  adminUsersNewTitle: "Crear usuario",
  adminUsersListTitle: "Usuarios del panel",
  nameLabel: "Nombre",
  roleLabel: "Rol",
  localeLabel: "Idioma",
  agencyLabel: "Inmobiliaria",
  agencyNone: "Independiente",
  newPasswordLabel: "Contraseña nueva",
  newPasswordHint: "Dejala vacía para no cambiarla.",
  createUser: "Crear usuario",
  saveUser: "Guardar",
  deleteUser: "Eliminar",
  linkAgency: "Vincular",
  noPasswordBadge: "Sin contraseña",
  userEmailTaken: "Ese email ya está en uso por otra cuenta.",
  userSelfRoleError: "No podés cambiarte el rol a vos mismo.",
  userSelfDeleteError: "No podés eliminar tu propia cuenta.",
  userLastAdminError: "No podés quitar al último administrador.",
  userCreated: "Usuario creado.",
  userSaved: "Usuario actualizado.",
  userDeleted: "Usuario eliminado.",
  userPasswordReset:
    "Contraseña actualizada. Se cerraron las sesiones abiertas de ese usuario.",
  userAgencyLinked: "Vínculo con la inmobiliaria actualizado.",

  // Admin — agentes e inmobiliarias
  adminAgentsTitle: "Agentes",
  adminAgentsHint:
    "Movés un agente de una inmobiliaria a otra, o lo dejás como independiente. Los avisos que ya cargó quedan con la inmobiliaria que los publicó.",
  adminAgentsEmpty: "Todavía no hay agentes.",
  adminAgentMove: "Mover",
  adminAgentMoved: "Agente actualizado.",
  adminAgentLastAdminError:
    "Ese agente es el único responsable de su inmobiliaria. Nombrá a otro antes de moverlo.",
  adminAgentProtectedError:
    "Esa cuenta es de administración del sitio: no se mueve entre inmobiliarias.",
  adminAgentProtectedHint:
    "Cuenta de administración del sitio. Su rol se cambia desde Usuarios.",
  adminAgentNoLoginHint:
    "Este perfil no tiene cuenta todavía: podés moverlo de inmobiliaria, pero el rol se aplica recién cuando tenga login.",
  adminAgencyNoAdminOption: (name: string) => `${name} (sin responsable)`,
  adminAgenciesWithoutAdmin: (names: string) =>
    `Estas inmobiliarias no tienen responsable: ${names}. Mové a alguien con el rol “Responsable” para que puedan manejar su equipo.`,

  // Admin — todas las consultas
  adminLeadsTitle: "Consultas",
  adminLeadsHint:
    "Todas las consultas que entran por el sitio, de cualquier inmobiliaria o agente. Las marcadas como “Interno” son tuyas para trabajar.",
  adminLeadsEmpty: "No hay consultas con ese filtro.",
  adminLeadsSearchLabel: "Buscar por nombre, WhatsApp o email",

  // Admin — todas las propiedades
  adminListingsTitle: "Propiedades",
  adminListingsEmpty: "No hay propiedades con ese filtro.",
  searchListingsLabel: "Buscar por título o código",
  searchSubmit: "Buscar",
  filterAll: "Todas",
  editListing: "Editar",
  viewListing: "Ver aviso",
  backToListings: "← Volver a propiedades",

  // Listing edit form (shared: admin + agency)
  listingTitleLabel: "Título del aviso",
  listingDescriptionLabel: "Descripción",
  listingOperationLabel: "Operación",
  listingTypeLabel: "Tipo de propiedad",
  listingPriceLabel: "Precio",
  listingCurrencyLabel: "Moneda",
  listingBedroomsLabel: "Dormitorios",
  listingBathroomsLabel: "Baños",
  listingParkingLabel: "Cocheras",
  listingAreaLabel: "Superficie (m²)",
  listingLandLabel: "Terreno (m²)",
  listingLocationLabel: "Ubicación",
  listingVideoLabel: "Video (URL)",
  listingForeignLabel: "Mostrar también a compradores del exterior",
  saveListing: "Guardar cambios",
  deleteListing: "Eliminar aviso",
  deleteListingWarning:
    "Se borra definitivamente, junto con sus fotos. Si solo querés sacarlo de la web, usá el estado “Eliminado”.",
  listingSaved: "Aviso actualizado.",
  listingDeleted: "Aviso eliminado.",
  listingNotFound: "No encontramos ese aviso.",
  listingInvalid: "Revisá los datos: faltan campos obligatorios.",

  // Fotos (shared: admin + agency)
  photosTitle: "Fotos",
  photosEmpty: "Este aviso todavía no tiene fotos.",
  photosHint:
    "La primera foto es la portada: es la que se ve en los listados. Podés subir varias a la vez (JPG, PNG, WebP o HEIC, hasta 12 MB cada una).",
  photosAddLabel: "Agregar fotos",
  photosUpload: "Subir",
  photosCover: "Portada",
  photosMakeCover: "Hacer portada",
  photosMoveUp: "Mover antes",
  photosMoveDown: "Mover después",
  photosDelete: "Borrar",
  photosDeleteConfirm: "¿Borrar esta foto? No se puede deshacer.",
  photosUploaded: "Fotos subidas.",
  photosDeleted: "Foto borrada.",
  photosReordered: "Orden actualizado.",
  photosNoFiles: "No elegiste ninguna foto.",
  photosTooManyFiles:
    "Son demasiadas fotos de una vez. Subí hasta 20 por tanda.",
  photosRejected: "Algunas fotos no se pudieron subir.",
  photosNotConfigured:
    "El almacenamiento de fotos todavía no está configurado (faltan las claves de R2). Avisale al administrador.",
  photosPlaceholderNote:
    "Foto de muestra del importador — reemplazala por fotos reales de la propiedad.",

  // Agency
  agencyListingsTitle: "Tus propiedades",
  agencyAddListingCta: "Publicar propiedad",
  agencyListingsEmpty: "Todavía no tenés propiedades cargadas.",
  agencyLeadsTitle: "Consultas recibidas",
  agencyLeadsEmpty: "Todavía no recibiste consultas.",
  agencyWelcome:
    "¡Bienvenido! Tu cuenta ya está lista. Cargá tu primera propiedad y nosotros la revisamos antes de publicarla.",
  agencyNoLink:
    "Tu usuario todavía no está vinculado a una inmobiliaria. Escribinos para activarlo.",
  statusLabel: "Estado",

  // Importar desde un enlace (3.5)
  importTab: "Importar",
  importTitle: "Traé tu aviso desde otro portal",
  importSubtitle:
    "Pegá el enlace de TU aviso y llenamos el formulario por vos. Queda como borrador: revisás los datos, agregás fotos y lo enviás a publicación.",
  importUrlLabel: "Enlace de tu aviso",
  importFetch: "Leer el enlace",
  importReading: "Leyendo…",
  importOwnershipLabel:
    "Declaro que este aviso es mío (o que la inmobiliaria me autorizó a publicarlo) y que puedo usar su texto y sus fotos.",
  importOwnershipRequired:
    "Necesitamos que confirmes que el aviso es tuyo antes de importarlo.",
  importReviewTitle: "Revisá lo que leímos",
  importReviewHint:
    "Corregí lo que haga falta. Lo que no pudimos leer quedó vacío a propósito: preferimos un campo en blanco a un dato inventado.",
  importCreate: "Crear borrador",
  importPhotosNote:
    "Las fotos no se copian automáticamente. Subilas desde la edición del aviso — así te quedás con tus propias imágenes, sin marcas de agua de otro portal.",
  importCreated:
    "Borrador creado. Revisalo, agregá fotos y mandalo a publicación.",
  importDuplicate: "Ese enlace ya fue importado antes:",
  importDuplicateFlash:
    "Ese enlace ya fue importado antes — no se creó un aviso duplicado.",
  importLocationLabel: "Ubicación (confirmá o corregí)",

  // Importación masiva (/admin/importar)
  adminImportTitle: "Importar planilla",
  adminImportSubtitle:
    "Subí la planilla de una inmobiliaria (.csv o .xlsx). Primero te mostramos qué va a pasar con cada fila; recién después se escribe algo.",
  importRollbackHint:
    "Todo lote se puede revertir después: se borran las propiedades que creó y se restauran las que modificó. Las que ya recibieron consultas o están publicadas se conservan y te avisamos cuáles.",
  importJobsTitle: "Lotes importados",
  importJobsEmpty: "Todavía no importaste ninguna planilla.",
  importJobRollback: "Revertir este lote",
  importJobRolledBack: "Lote revertido.",
  importJobRollbackFailed: "No pudimos revertir ese lote.",
  importPermissionMissing: "Sin autorización registrada",
  importErrorBadUrl: "Ese enlace no parece válido. Copialo completo, con https://",
  importErrorBlocked:
    "Solo podemos leer enlaces públicos de internet.",
  importErrorUnreachable:
    "No pudimos abrir esa página. Puede estar caída o bloquear lectores externos — cargá el aviso a mano.",
  importErrorNotHtml: "Ese enlace no es una página web con un aviso.",
  importErrorTooLarge: "Esa página es demasiado grande para leerla.",
  importErrorGeneric: "No pudimos leer ese enlace. Probá cargar el aviso a mano.",
  importErrorRateLimited:
    "Estás importando muy seguido. Esperá unos minutos y probá de nuevo.",
  importLegalNote:
    "Importamos un aviso a la vez, a pedido de su titular. No copiamos catálogos de otros portales.",

  // Estadísticas por aviso (3.3)
  statsViews: "Visitas",
  statsLeads: "Consultas",
  statsWindow: "Últimos 30 días",
  statsSummary: "En los últimos 30 días",
  statsNoData:
    "Todavía no hay visitas registradas. Las estadísticas empiezan a contar desde que el aviso está publicado.",
  statsViewsHint:
    "Visitas de personas: excluimos buscadores y bots para que el número signifique algo.",
  saveStatus: "Guardar",
  contactLead: "Responder por WhatsApp",
  /**
   * Operator alerts (I10). Outbound, to the person running the portal — never
   * rendered on a page, but copy all the same, so it lives here.
   */
  alertNewLeadTitle: "Nueva consulta en el portal",
  alertNewLeadDetail: (params: {
    leadType: string;
    name: string | null;
    whatsapp: string;
    listingTitle: string | null;
  }) =>
    [
      `${params.leadType} · ${params.name ?? "Sin nombre"} (${params.whatsapp})`,
      params.listingTitle ? `Aviso: ${params.listingTitle}` : null,
    ]
      .filter(Boolean)
      .join(" — "),
  alertReviewTitle: "Un aviso espera revisión",
  alertReviewDetail: (title: string, verified: boolean) =>
    `${title}${verified ? " · WhatsApp verificado" : " · WhatsApp sin verificar"}`,
  /** Leads that arrived in the last 24 h — the badge on the Consultas tab. */
  adminLeadsRecent: (n: number) =>
    n === 1 ? "1 consulta nueva en las últimas 24 h" : `${n} consultas nuevas en las últimas 24 h`,
  /**
   * FSBO leads land in the founder's inbox because a particular seller has no
   * panel of their own yet; these two are how the lead gets to them.
   */
  leadOwnerRouted: "Particular",
  forwardLead: "Reenviar al vendedor",
  forwardLeadMessage: (params: {
    listingTitle: string | null;
    name: string | null;
    whatsapp: string;
    message: string | null;
  }) =>
    [
      `Tenés una consulta${params.listingTitle ? ` por tu aviso: ${params.listingTitle}` : ""}.`,
      `De: ${params.name ?? "Sin nombre"} (${params.whatsapp})`,
      params.message ? `Mensaje: ${params.message}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  // Read-only status rows (audit F25): the status <select> used to pre-set
  // "Borrador" on a row en revisión, so one save silently cancelled the review.
  statusPendingNote:
    "En revisión: lo publicamos nosotros apenas lo aprobemos. No hace falta hacer nada.",
  statusRejectedNote: "No aprobado. Corregilo desde «Editar» y reenvialo.",
  statusRejectedReason: "Motivo",
  /**
   * Publishing is not a status an agency sets any more (audit F1). Says so
   * once, where the status control is, so "En revisión" reads as the way to
   * publish rather than as a step that leads nowhere.
   */
  statusReviewNote:
    "Para publicar un aviso, ponelo «En revisión»: lo revisamos y lo publicamos nosotros. Es lo que nos permite garantizarle al comprador que cada aviso pasó por una persona.",
} as const;

/**
 * The private seller's panel, /mis-avisos (PLAN.md D8).
 *
 * Separate from `esPanel` because the reader is different: /agencia talks to a
 * professional about their inventory, this talks to somebody selling one
 * house. No "propiedades", no "cartera" — "tu aviso". Voseo throughout, same
 * as the publish wizard they arrived from.
 */
export const esOwner = {
  panelTitle: "Tus avisos",
  listingsTab: "Tus avisos",
  leadsTab: "Consultas",

  listingsTitle: "Tus avisos",
  listingsEmpty:
    "Todavía no publicaste ningún aviso. Cuando publiques uno, lo vas a ver acá.",
  addListingCta: "Publicar una propiedad",

  /**
   * Same rule as the agency panel (audit F1): nobody publishes their own
   * listing. Worded for someone who has never used a portal panel.
   */
  statusReviewNote:
    "Para que tu aviso salga publicado, ponelo «En revisión»: lo revisamos y lo publicamos nosotros. Es lo que nos permite garantizarle al comprador que cada aviso pasó por una persona.",

  editListing: "Editar",
  backToListings: "← Volver a tus avisos",
  viewListing: "Ver el aviso publicado",
  saveStatus: "Guardar",
  statusLabel: "Estado",

  leadsTitle: "Consultas sobre tus avisos",
  leadsEmpty:
    "Todavía no recibiste consultas. Cuando alguien se interese por tu propiedad, sus datos aparecen acá.",
  contactLead: "Responder por WhatsApp",

  /** The seller sees the interested buyer's number; say what to do with it. */
  leadsNote:
    "Estas personas dejaron su número para hablar con vos. Respondeles cuanto antes: las consultas se enfrían rápido.",
} as const;

/** Voseo strings for the publish wizard (ARCHITECTURE.md §3, M5). */
export const esPublish = {
  pageTitle: "Publicá tu propiedad",
  pageSubtitle:
    "Cargala en tres pasos. Guardamos tu avance automáticamente, así podés terminar cuando quieras.",

  /** Shown when /tasacion carried the operation, type, city and m² over. */
  prefillNote:
    "Completamos lo que ya nos dijiste en la tasación. Revisalo y seguí — podés cambiar cualquier dato.",

  stepLabels: ["Detalles", "Ubicación", "Precio y publicación"] as const,

  // Step 1
  operationLabel: "¿Qué querés hacer?",
  propertyTypeLabel: "Tipo de propiedad",
  titleLabel: "Título del aviso",
  titlePlaceholder: "Casa a estrenar en Barrio San Roque",
  descriptionLabel: "Descripción",
  descriptionPlaceholder:
    "Contá lo que hace especial a la propiedad: estado, extras, cercanías…",
  bedroomsLabel: "Dormitorios",
  bathroomsLabel: "Baños",
  parkingLabel: "Cocheras",
  areaLabel: "Superficie (m²)",
  landLabel: "Terreno (m²)",

  // Step 2
  locationLabel: "Ubicación",
  locationPlaceholder: "Escribí tu ciudad o barrio",
  locationHint: "Elegí el barrio si está en la lista; si no, la ciudad.",
  projectLabel: "Proyecto cercano (opcional)",
  projectPlaceholder: "Buscá un edificio o loteamiento",
  projectHint: "Vinculá tu unidad de preventa al proyecto para que aparezca en su página.",

  // Step 3
  priceLabel: "Precio",
  cuotaWith: "con",
  videoLabel: "Video (opcional)",
  photosTitle: "Fotos",
  photosHint:
    "La primera foto es la portada. Podés agregarlas ahora o después, desde tu panel.",
  photosPickLabel: "Elegí las fotos",
  photosUploading: "Subiendo…",
  photosDelete: "Borrar",
  photosDraftFirst:
    "Completá los datos de la propiedad y seguí adelante: apenas se guarda el borrador vas a poder subir fotos.",
  photosStorageOff:
    "El almacenamiento de fotos todavía no está disponible. Podés publicar igual y agregarlas después.",
  photosFailed: "No pudimos subir algunas fotos. Probá de nuevo.",
  photosTooMany:
    "Son demasiadas fotos de una vez. Subí hasta 20 por tanda.",
  foreignExposureLabel:
    "Mostrar también a compradores del exterior (realestateinparaguay.com) — próximamente",

  // Publicación sin verificación (no hay proveedor de mensajería configurado)
  publishTitle: "Publicá tu aviso",
  publishSubtitle:
    "Dejanos tu WhatsApp para que te contacten los interesados. Revisamos el aviso antes de que salga publicado.",

  // OTP
  otpTitle: "Verificá tu WhatsApp para publicar",
  otpSubtitle:
    "Te mandamos un código por WhatsApp. Los avisos verificados muestran el sello ✓ y generan más confianza.",
  whatsappLabel: "Número de WhatsApp",
  codeLabel: "Código de 6 dígitos",
  sendCode: "Enviar código",
  sending: "Enviando…",
  resend: "Reenviar código",
  resendIn: "Reenviar en",
  publish: "Publicar aviso",
  publishing: "Publicando…",

  // Nav
  back: "Volver",
  next: "Siguiente",
  saving: "Guardando…",

  // Done
  doneTitle: "¡Tu aviso fue enviado!",
  doneBody:
    "Lo estamos revisando. En cuanto lo aprobemos, sale publicado en el sitio. Podés seguir su estado y sumarle fotos desde tu panel.",
  doneCta: "Ir a mi panel",

  errors: {
    operation: "Elegí si es venta o alquiler.",
    propertyType: "Elegí el tipo de propiedad.",
    title: "Poné un título de al menos 8 caracteres.",
    price: "Ingresá un precio válido.",
    location: "Elegí una ubicación de la lista.",
    invalidNumber: "Revisá el número de WhatsApp.",
    otpMismatch: "El código no coincide. Probá de nuevo.",
    otpTooMany: "Demasiados intentos. Pedí un código nuevo.",
    not_found: "No encontramos tu borrador. Recargá la página.",
    generic: "Algo salió mal. Probá de nuevo.",
  } as Record<string, string>,
} as const;

/** es-PY labels for listing statuses shown in the panel. */
export const listingStatusLabel: Record<string, string> = {
  draft: "Borrador",
  pending_review: "En revisión",
  published: "Publicado",
  paused: "Pausado",
  sold: "Vendido",
  rented: "Alquilado",
  removed: "Eliminado",
};

/**
 * Per-listing WhatsApp prefill: names the property and links back to it, so
 * the seller knows exactly which listing the message is about (and the
 * portal gets attribution in the chat itself).
 */
export function inquiryPrefillFor(brand: string, title: string, url: string): string {
  return `Hola, vi esta propiedad en ${brand} y me interesa: ${title}\n${url}`;
}

/** Public agent profile page (/agente/[slug]) — mirrors the agency profile. */
export const esAgentProfile = {
  notFoundTitle: "Agente no encontrado",
  kind: "Agente",
  verified: "Verificado",
  listingsTitle: "Propiedades publicadas",
  listingCount: (n: number) =>
    n === 1 ? "1 propiedad publicada" : `${n} propiedades publicadas`,
  noListings: "Sin propiedades publicadas por el momento",
  empty: "Este agente todavía no tiene propiedades publicadas.",
  contactTitle: "¿Querés contactar a este agente?",
  contactSubtitle: "Dejale un mensaje y te responde directamente por WhatsApp.",
  whatsappLink: "💬 WhatsApp",
  agencyPrefix: "Trabaja en",
  metaTitle: (agentName: string) =>
    `${agentName} — Propiedades en venta y alquiler`,
  metaDescription: (brand: string, agentName: string, n: number) =>
    `${n === 1 ? "1 propiedad publicada" : `${n} propiedades publicadas`} por ${agentName} en ${brand}.`,
} as const;

/**
 * Agent-profile WhatsApp prefill: names the agent and links back to their
 * profile, mirroring inquiryPrefillFor above for listings.
 */
export function agentInquiryPrefillFor(brand: string, agentName: string, url: string): string {
  return `Hola, vi tu perfil en ${brand} y quiero contactarte: ${agentName}\n${url}`;
}

/* ========================================================================== *
 * Buyer-facing surfaces (Batch 3, layer 1)
 *
 * Everything below was inline JSX until now. It is the half of the site a
 * visitor actually reads — home, the operation hubs, the category grid, the
 * search and filter bars, the listing card and the property detail page —
 * and it was the half `es.ts` did not cover, which is why "add en.ts" was
 * never a one-file job. Extraction only: every string here is byte-identical
 * to the literal it replaced.
 *
 * Read these through `getDictionary(locale)` (src/i18n/index.ts) rather than
 * importing them directly, so layer 2 can add `en.ts` without touching a
 * single call site.
 * ========================================================================== */

/** Hero search bar — operación / ciudad / tipo / presupuesto. */
export const esSearchBar = {
  operationLabel: "Operación",
  operationBuy: "Comprar",
  operationRent: "Alquilar",
  cityLabel: "Ciudad",
  cityAny: "Todas las ciudades",
  typeLabel: "Tipo",
  typeAny: "Todos los tipos",
  budgetLabel: "Presupuesto",
  budgetAny: "Sin límite",
  /** Locale-aware on purpose: the thousands separator is not universal. */
  budgetUpTo: (amount: number, locale: string) =>
    `Hasta US$ ${amount.toLocaleString(locale)}`,
  submit: "Buscar",
} as const;

/** Category page filter bar — a plain GET form, no client JS. */
export const esFilters = {
  priceMinLabel: "Precio mín. (US$)",
  priceMinPlaceholder: "Sin mínimo",
  priceMaxLabel: "Precio máx. (US$)",
  priceMaxPlaceholder: "Sin máximo",
  bedroomsLabel: "Dormitorios",
  bedroomsAny: "Cualquiera",
  sortLabel: "Ordenar por",
  sortRecent: "Más recientes",
  sortPriceAsc: "Menor precio",
  sortPriceDesc: "Mayor precio",
  submit: "Filtrar",
  clear: "Quitar filtros",
} as const;

/** Listing card — the grid tile. */
export const esCard = {
  operationBadge: {
    venta: "Venta",
    alquiler: "Alquiler",
    alquiler_temporal: "Alquiler temporal",
  } as Record<string, string>,
  featured: "Destacado",
  noPhoto: "Foto próximamente",
  bedroomsShort: (n: number) => `${n} dorm.`,
  bathrooms: (n: number) => `${n} ${n === 1 ? "baño" : "baños"}`,
  area: (m2: number) => `${m2} m²`,
  // Nórdico card variant pills (guide §5 "Listing card") — the framed-pill
  // CardVariant only, never rendered on the default photo-scrim card.
  foreignPill: "Publicado en inglés",
  featuredPill: "Destacada",
  cuotaLine: (cuota: string) => `Cuota est. ${cuota}`,
  // "Variant A" card variant only (realestateinparaguay.com guide §5) — never
  // rendered on this dictionary's own (Spanish) door.
  cardPerM2: (v: string) => `${v}/m²`,
} as const;

/**
 * Nórdico-only strings (docs/style/inmobiliaria.com.py.md), used only where
 * `homeLayout(vertical.key) === "nordico"` or `cardVariant`/`heroVariant`
 * select the Nórdico components — never on the default template.
 */
export const esNordico = {
  headerVender: "Vender",
  headerVenderCtaFull: "Vender mi propiedad",
  headerVenderCtaShort: "Vender",
  heroKicker: "Venta y alquiler en Paraguay",
  heroTitle: "La forma moderna de vender tu propiedad en Paraguay",
  heroSubtitle:
    "Fotografía profesional, marketing digital y compradores del exterior. Vos ponés la propiedad, nosotros el proceso.",
  heroSell: "Vender mi propiedad",
  heroSearch: "Buscar propiedades",
  // Guide §5: "only true figures... a placeholder number in a mockup is not
  // a licence to ship it." No response-time metric exists to measure yet
  // (that was a fabricated "48 h" in an earlier pass — cut, not filled with
  // a real number that doesn't exist), so this cell states a true service
  // fact instead, same pattern as the photography cell next to it.
  proofRow: [
    {
      numeral: "Marketing digital",
      label: "Incluido en cada propiedad publicada",
    },
    {
      numeral: "Fotografía profesional",
      label: "Incluida en cada aviso",
    },
    { numeral: "2 idiomas", label: "Español e inglés, un mismo aviso" },
    { numeral: "3 sitios", label: "Tu propiedad, en toda la red" },
  ],
  recentTitle: "Recién publicadas",
  recentMore: "Ver todas",
  processTitle: "Un proceso de venta, no un aviso.",
  processSteps: [
    {
      title: "Tasación con datos",
      text: "Un rango de precio basado en ventas comparables reales, no en una corazonada.",
    },
    {
      title: "Fotos y styling",
      text: "Fotografía profesional y una puesta en escena pensada para vender, no solo para mostrar.",
    },
    {
      title: "Publicación en español e inglés",
      text: "El mismo aviso llega a compradores locales y a compradores del exterior.",
    },
    {
      title: "Negociación y cierre",
      text: "Te acompañamos hasta la firma, con el proceso documentado en cada paso.",
    },
  ],
  processCta: "Empezar a vender",
  citiesTitle: "Buscar por ciudad",
  whySellTitle: "Por qué vender acá",
  whySellCards: [
    {
      title: "Fotografía y styling",
      text: "Cada propiedad se presenta con fotografía profesional y una puesta en escena que ayuda a vender más rápido.",
    },
    {
      title: "Marketing digital",
      text: "Tu aviso se promociona en redes y buscadores, no solo publicado y olvidado.",
    },
    {
      title: "Compradores del exterior",
      text: "El mismo aviso se traduce y se publica en realestateinparaguay.com, la puerta de entrada para compradores extranjeros.",
    },
  ],
  whySellCta: "Quiero vender así",
  partnersTitle: "Para inmobiliarias",
  partnersText:
    "Publicá tu cartera completa, sumá exposición internacional y recibí tus propios leads sin intermediarios.",
  partnersCta: "Conocer más",
} as const;

/**
 * `/vender` seller landing page strings (docs/style/inmobiliaria.com.py.md
 * §5 "Seller landing page /vender"). Rendered only on the Spanish door —
 * `sellerLandingEnabled()` (src/design/sections.ts) redirects every other
 * vertical's `/vender` request to `/` before this page ever mounts.
 *
 * Every placeholder is marked explicitly in both the string and the PR
 * description that shipped it (guide §1: "a placeholder number in a mockup
 * is not a licence to ship it" — the placeholders below are content the
 * founder must confirm, not numbers pretending to be real).
 */
export const esVender = {
  metaTitle: "Vendé tu propiedad al mejor precio",
  metaDescription: (brand: string) =>
    `Vendé con ${brand}: fotografía profesional, marketing digital, tasación con datos del mercado y compradores del exterior. Sin costo, sin exclusividad.`,
  heroKicker: "Vender con nosotros",
  heroTitle: "Vendé al mejor precio, con un proceso que se ve.",
  // Guide §5.1: "what the seller gets, in three lines."
  heroSubtitleLines: [
    "Fotografía profesional y home styling para tu propiedad.",
    "Marketing digital y publicación en español e inglés.",
    "Un proceso de venta documentado, no un aviso más.",
  ],
  formTitle: "Quiero una tasación",
  formNameLabel: "Nombre",
  formPhoneLabel: "Teléfono (WhatsApp)",
  formCityLabel: "Ciudad / barrio",
  formCityPlaceholder: "Elegí tu ciudad",
  formTypeLabel: "Tipo de propiedad",
  formTypePlaceholder: "Elegí el tipo",
  formMessageLabel: "Mensaje (opcional)",
  formMessagePlaceholder: "Contanos algo más sobre tu propiedad",
  formSubmit: "Quiero una tasación",
  formSending: "Enviando…",
  // Guide §5.1: "Sin costo. Sin compromiso. Respondemos en < 24 h (only if
  // true)." No measured response-time figure exists — the same reasoning
  // esNordico.proofRow's comment already gives for cutting a fabricated
  // "48 h" claim — so this states only the two facts that are true today.
  formNote: "Sin costo. Sin compromiso.",
  formSuccessTitle: "¡Listo! Recibimos tus datos.",
  formSuccessText: "Te contactamos por WhatsApp para coordinar la tasación.",
  formError:
    "No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp.",
  formPhoneError: "Ingresá un número de WhatsApp válido.",
  formFineprintPrefix: "Al enviar aceptás",
  formFineprintAnd: "y la",
  formTerms: "nuestros términos",
  formPrivacy: "política de privacidad",
  differentTitle: "Qué hacemos distinto",
  differentCards: [
    {
      title: "Fotografía y video profesional",
      text: "Fotografía profesional y video corto de cada propiedad, incluidos en la publicación.",
    },
    {
      title: "Home styling",
      text: "Puesta en escena pensada para mostrar el potencial de cada ambiente, no solo para retratarlo.",
    },
    {
      title: "Tasación con datos del mercado",
      text: "Un rango de precio basado en ventas comparables reales de la zona, no en una corazonada.",
    },
    {
      title: "Publicación en español e inglés",
      text: "El mismo aviso llega a compradores locales y a compradores que buscan desde el exterior.",
    },
    {
      title: "Marketing digital",
      text: "Promoción paga en Meta, Google y portales — tu aviso se promociona, no solo se publica.",
    },
    {
      title: "Red de sitios",
      // Named only the two sites that actually carry the same listing today
      // (inmobiliaria.com.py + its English translation) — terreno.com.py
      // filters to property_type: ["terreno"] (verticals.ts) and would never
      // show a casa/departamento, and "el resto de la red" implied doors
      // beyond the three that exist. Review finding: don't overclaim reach.
      text: "Tu propiedad visible en inmobiliaria.com.py y en realestateinparaguay.com, la puerta de entrada para compradores del exterior.",
    },
  ],
  foreignTitle: "Compradores del exterior",
  // Softened from "se traduce y se publica" (present tense, claims the
  // translation already happened): per CLAUDE.md, npm run cron:translate has
  // never run against the live database, so title_en/description_en are
  // still empty and every listing shows its Spanish fallback on the English
  // door today. The listing itself IS already live there (that part is
  // true) — only the translation step is described as in progress, not done.
  foreignText:
    "Cada propiedad se publica también en realestateinparaguay.com, la puerta de entrada del portal para quien busca desde otro país, con su ficha en camino de traducirse al inglés.",
  foreignPoints: [
    "Publicada también en realestateinparaguay.com",
    "Precio de referencia en dólares",
    "Contacto directo por WhatsApp, sin intermediarios",
  ],
  // PLACEHOLDER (guide §5.4): a real screenshot of realestateinparaguay.com
  // on a laptop belongs here — this renders a marked placeholder frame
  // instead of a fabricated screenshot.
  foreignImageLabel: "Vista previa de realestateinparaguay.com",
  foreignImagePlaceholderNote: "Imagen de referencia — pendiente de reemplazo",
  behindTitle: "Quién está detrás",
  // PLACEHOLDER (guide §5.6): founder's name inferred from the repository
  // owner, not sourced from app copy anywhere else. Review finding: an
  // inferred name must carry the same visible marker the photo and the
  // laptop mock already do, not ship as unmarked fact — so the rendered
  // string itself says so, the same way the photo/mock captions do.
  behindName: "Anton Marklund (nombre a confirmar)",
  behindRole:
    "Fundador de Inmobiliaria Paraguay y de la red de sitios del portal.",
  // PLACEHOLDER (guide §5.6 asks for "the EAS company named" — a real razón
  // social, not the type of entity). "EAS" is the only company reference
  // anywhere in this codebase (src/i18n/es.ts's existing disclaimer line,
  // reused here) and isn't itself a company name — no real razón social
  // exists in this repo to reuse. Flagged rather than invented.
  behindCompany: (brand: string) =>
    `${brand} es un servicio de EAS (razón social a confirmar).`,
  // PLACEHOLDER (guide §5.6): stated without a specific status this codebase
  // doesn't establish. verticals.ts's own note only says "license issues
  // (~Oct 2026)" generally — it does not say a licence application is
  // actually filed/"en trámite", so this no longer claims that. The
  // "confirm before launch" instruction lives in this comment now, not in
  // the rendered string (review finding: a builder-to-founder note had
  // leaked into visitor-facing copy) — confirm the real status before
  // publishing.
  behindLicense: "Sin matrícula profesional publicada.",
  behindPhotoLabel: "Foto del fundador",
  behindPhotoPlaceholderNote: "Imagen de referencia — pendiente de reemplazo",
  faqTitle: "Preguntas de vendedores",
  // Guide §5.7: comisión, plazo, exclusividad, qué pasa si no se vende, quién
  // atiende las visitas. Answers adapted from the portal's own existing
  // policy copy (src/config/faq.ts's "¿Cobran comisión por la operación?" and
  // /terminos's "licencia no exclusiva y gratuita"), not invented fresh.
  faq: [
    {
      q: "¿Cobran comisión por vender con ustedes?",
      a: "No cobramos comisión sobre la venta. Publicar es gratis; si tu propiedad la gestiona una inmobiliaria o agente de la red, sus honorarios los acordás directamente con esa persona.",
    },
    {
      q: "¿Cuánto tarda en venderse mi propiedad?",
      a: "Depende del precio, la zona y el estado del mercado — no damos un plazo genérico. Una tasación basada en datos reales evita el error más común: publicar por encima del precio de mercado y pasar meses sin consultas.",
    },
    {
      q: "¿Tengo que darles exclusividad?",
      a: "No. Al publicar nos das una licencia no exclusiva y gratuita para mostrar tu propiedad — podés seguir vendiéndola por tu cuenta o con otra inmobiliaria al mismo tiempo.",
    },
    {
      q: "¿Qué pasa si no se vende?",
      a: "No hay costo ni compromiso de plazo. Podés ajustar el precio, actualizar las fotos o pausar el aviso cuando quieras.",
    },
    {
      q: "¿Quién atiende las visitas?",
      a: "Las consultas te llegan directo por WhatsApp. Si publicás como particular, coordinás vos las visitas; si tu propiedad la gestiona una inmobiliaria o agente de la red, ellos se encargan del contacto y las visitas.",
    },
  ],
  closingTitle: "¿Listo para vender?",
  closingText:
    "Dejanos tus datos y te contactamos para empezar con la tasación.",
} as const;

/**
 * "Variant A, guide-first" strings (docs/style/realestateinparaguay.com.md),
 * used only where `homeLayout(vertical.key) === "guide-en"` or
 * `cardVariant`/`heroVariant`/`chromeVariant` select its components — never
 * on the default template. This Spanish copy is never rendered (the English
 * door is the only one that reads `enGuideEn`); it exists purely so
 * `Dictionary`'s shape is derived from a real, non-empty namespace the way
 * every other one is (`npm run verify:i18n` walks both dictionaries and
 * rejects an empty string).
 */
export const esGuideEn = {
  chromeNav: [
    { label: "Comprar", href: "/venta" },
    { label: "Alquilar", href: "/alquiler" },
    { label: "Terrenos", href: "/venta/asuncion/terrenos" },
    { label: "Proyectos nuevos", href: "/proyectos" },
    { label: "Cómo funciona la compra", href: "/guias/buying-property-in-paraguay" },
    { label: "Guías", href: "/guias" },
  ],
  footerBuyTitle: "Comprar",
  footerBuyLinks: [
    { label: "Propiedades en Asunción", href: "/venta/asuncion" },
    { label: "Propiedades en San Bernardino", href: "/venta/san-bernardino" },
    { label: "Propiedades en Encarnación", href: "/venta/encarnacion" },
    { label: "Propiedades en Ciudad del Este", href: "/venta/ciudad-del-este" },
    { label: "Terrenos en venta", href: "/venta/asuncion/terrenos" },
    { label: "Proyectos nuevos", href: "/proyectos" },
  ],
  footerGuidesTitle: "Guías",
  footerGuidesLinks: [
    { label: "Cómo funciona la compra", href: "/guias/buying-property-in-paraguay" },
    { label: "Costos e impuestos", href: "/guias/costs-and-taxes-buying-in-paraguay" },
    { label: "Residencia", href: "/guias/residency-in-paraguay" },
    { label: "Todas las guías", href: "/guias" },
  ],
  footerAreasTitle: "Zonas",
  footerAreasLinks: [
    { label: "Asunción — Villa Morra", href: "/venta/asuncion" },
    { label: "San Bernardino", href: "/venta/san-bernardino" },
    { label: "Encarnación", href: "/venta/encarnacion" },
    { label: "Ciudad del Este", href: "/venta/ciudad-del-este" },
    { label: "Luque", href: "/venta/luque" },
  ],
  footerCompanyLinks: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
  ],
  footerLegalLinks: [
    { label: "Términos", href: "/terminos" },
    { label: "Política de privacidad", href: "/privacidad" },
  ],
  footerCompanyTitle: "Empresa",
  footerLegalTitle: "Legal",
  footerVersionEs: "Versión en español",
  footerTagline:
    "Un portal guía-primero para comprar una propiedad en Paraguay desde el exterior — título pleno, precios en dólares y el proceso de escritura pública, junto con avisos reales.",
  footerContactUs: "Contactanos",
  footerAddress: "Asunción, Paraguay",
  footerLegalLine: (brand: string) =>
    `${brand} es un servicio de EAS. Los precios de referencia y los cálculos de costos publicados son orientativos y no constituyen asesoramiento legal, fiscal ni financiero.`,
  heroKicker: "Propiedades en Paraguay · Para compradores internacionales",
  heroTitleLead: "Comprá una propiedad en Paraguay. ",
  heroTitleAccent: "Título pleno",
  heroTitleTail: ", en dólares, desde el exterior.",
  heroStrap:
    "Los extranjeros pueden ser dueños plenos de tierras y viviendas; las compras se cotizan y se pagan en dólares; el título se transfiere por escritura pública ante escribano y se inscribe a nivel nacional.",
  heroGuideLink: "O empezá por la guía: Cómo funciona la compra →",
  factsStrip: [
    { numeral: "Título pleno", label: "Propiedad extranjera permitida (verificar)" },
    { numeral: "USD", label: "Se cotiza y se paga en dólares" },
    { numeral: "≈ 3–5 %", label: "Costos totales de compra (verificar)" },
    { numeral: "Escritura pública", label: "Escriturado e inscripto" },
  ],
  newWeekTitle: "Nuevo esta semana",
  newWeekMore: "Ver todas →",
  whyTitle: "Por qué Paraguay",
  whyReadGuide: "Leer la guía →",
  whyCards: [
    {
      title: "Propiedad",
      text: "Título pleno para extranjeros en la mayoría de los casos — algunos terrenos rurales y de zona de frontera tienen restricciones (verificar antes de publicar).",
      href: "/guias/buying-property-in-paraguay",
    },
    {
      title: "Costo de vida e impuestos",
      text: "Sistema tributario territorial, impuesto plano del 10 % (verificar antes de publicar).",
      href: "/guias/costs-and-taxes-buying-in-paraguay",
    },
    {
      title: "Residencia",
      text: "De temporal a permanente — requisitos y plazos (verificar antes de publicar).",
      href: "/guias/residency-in-paraguay",
    },
  ],
  whereTitle: "Dónde comprar",
  whereTiles: [
    { name: "Asunción — Villa Morra", slug: "asuncion", why: "El barrio de negocios y estilo de vida más establecido de la capital." },
    { name: "San Bernardino", slug: "san-bernardino", why: "Casas de fin de semana sobre el lago Ypacaraí." },
    { name: "Encarnación", slug: "encarnacion", why: "Sobre el río Paraná, calidad de vida y clima más templado." },
    { name: "Ciudad del Este", slug: "ciudad-del-este", why: "Frontera comercial con Brasil y Argentina." },
    { name: "Luque", slug: "luque", why: "Zona metropolitana en crecimiento, cerca del aeropuerto." },
  ],
  howTitle: "Cómo funciona la compra",
  howSteps: [
    { title: "Elegir y verificar", text: "Encontrá la propiedad y verificá los datos básicos del título.", who: "Comprador", time: "Variable" },
    { title: "Oferta y reserva", text: "Se acuerda un precio y se firma una reserva.", who: "Comprador y vendedor", time: "1–2 semanas (verificar)" },
    { title: "Diligencia sobre el título", text: "Verificación en el Registro Público.", who: "Escribano", time: "2–4 semanas (verificar)" },
    { title: "Escritura pública", text: "Firma ante escribano.", who: "Escribano", time: "1 día (verificar)" },
    { title: "Inscripción y entrega", text: "Inscripción registral y entrega de llaves.", who: "Escribano", time: "2–6 semanas (verificar)" },
  ],
  costsTableTitle: "Costos de la compra",
  costsTableHead: ["Concepto", "Quién paga", "% típico"],
  costsRows: [
    { item: "Impuesto de transferencia", who: "Comprador", typical: "≈ 1,5–2 % (verificar)" },
    { item: "Honorarios del escribano", who: "Comprador", typical: "≈ 1–3 % (verificar)" },
    { item: "Inscripción registral", who: "Comprador", typical: "≈ 0,5–1 % (verificar)" },
    { item: "Comisión de la inmobiliaria", who: "Vendedor (habitual)", typical: "≈ 3–5 % (verificar)" },
  ],
  relocationTitle: "Mudarse a Paraguay",
  relocationCards: [
    { title: "Mudanza", text: "Qué traer y cómo entrar al país (verificar antes de publicar).", href: "/guias/residency-in-paraguay" },
    { title: "Bancos", text: "Abrir una cuenta como extranjero (verificar antes de publicar).", href: "/guias/costs-and-taxes-buying-in-paraguay" },
    { title: "Colegios", text: "Opciones bilingües en Asunción y alrededores.", href: "/guias/residency-in-paraguay" },
    { title: "Salud", text: "Cobertura privada y pública (verificar antes de publicar).", href: "/guias/residency-in-paraguay" },
  ],
  faqTitle: "Preguntas frecuentes",
  faqSubtitle: (brand: string) => `Lo que necesitás saber antes de comprar en ${brand}.`,
  faq: [
    { q: "¿Pueden los extranjeros ser dueños de tierras en Paraguay?", a: "Sí, con título pleno en la mayoría de los casos (verificar antes de publicar)." },
    { q: "¿Necesito estar presente en persona?", a: "No siempre — un poder notarial puede autorizar la firma en tu nombre (verificar antes de publicar)." },
    { q: "¿Cómo envío el dinero?", a: "Transferencia bancaria internacional a una cuenta paraguaya o del escribano (verificar antes de publicar)." },
    { q: "¿Qué es una cédula?", a: "El documento de identidad paraguayo; no siempre es obligatorio para comprar (verificar antes de publicar)." },
  ],
  cardPerM2: (v: string) => `${v}/m²`,
  cardSqftArea: (sqft: string, m2: string) => `${sqft} pies² (${m2} m²)`,
  foreignerBoxTitle: "Comprar esta propiedad como extranjero",
  foreignerBoxOwnershipLabel: "Tipo de propiedad",
  foreignerBoxOwnershipValue: "Título pleno (verificar)",
  foreignerBoxTitleStatusLabel: "Estado del título",
  foreignerBoxTitleStatusValue: "Verificar en el Registro Público",
  foreignerBoxCostsLabel: "Costos de cierre estimados",
  foreignerBoxCostsValue: (v: string) => `≈ ${v} (verificar)`,
  foreignerBoxNextStepLabel: "Siguiente paso",
  foreignerBoxNextStepValue: "Contactá al vendedor y pedí una verificación de título.",
  replyInEnglish: "We reply in English",
} as const;

/** Home page. */
export const esHome = {
  metaDescription:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
  publishWaPrefill: (brand: string) =>
    `Hola, quiero publicar una propiedad en ${brand}.`,

  heroKicker: "Asunción · Paraguay",
  heroTitleLead: "Encontrá tu propiedad en ",
  heroTitleHighlight: "Paraguay",
  heroSubtitle:
    "Casas, departamentos y terrenos en venta y alquiler — con cuota estimada y financiamiento.",
  heroSeeListings: "Ver propiedades",
  heroSellCta: "Vender mi propiedad",
  heroStatCount: (total: string) => `${total} propiedades publicadas`,
  heroStatCountEmpty: "Propiedades en todo Paraguay",
  heroStatUpdated: "Actualizado diariamente",

  zonesKicker: "Zonas",
  zonesTitle: "Dónde querés vivir",
  zonesAll: "Ver todas las zonas →",
  /**
   * The one translatable half of a zone card. Name, slug and photograph are
   * structural and stay in `app/page.tsx`; the strapline is copy, so it lives
   * here keyed by slug.
   */
  zoneCardSub: {
    asuncion: "Capital — la mayor oferta",
    "san-bernardino": "Lago Ypacaraí, casas de fin de semana",
    luque: "Zona en crecimiento",
    encarnacion: "Sobre el Paraná, calidad de vida",
  } as Record<string, string>,

  howTitle: "Cómo funciona",
  howSubtitle: "Buscar, comparar y contactar. Gratis, sin registro y sin comisión.",
  howMore: "Ver la guía completa →",
  howSteps: [
    {
      icon: "🔎",
      title: "Buscá por zona y presupuesto",
      text: "Filtrá por ciudad, barrio, tipo de propiedad y rango de precio. Mirá los resultados en lista o sobre el mapa.",
    },
    {
      icon: "📊",
      title: "Compará con el mercado",
      text: "Cada propiedad en venta muestra su cuota estimada, y publicamos la mediana de precio por m² de cada ciudad.",
    },
    {
      icon: "💬",
      title: "Contactá directo",
      text: "Escribile por WhatsApp a quien publicó, desde la misma ficha y sin intermediarios ni costo.",
    },
  ],

  sellKicker: "Vender",
  sellTitle: "Vendé con quien conoce el mercado",
  sellText:
    "Publicá tu propiedad gratis y llegá a compradores de todo Paraguay. Te damos un rango de precio estimado con los avisos publicados de tu zona, para que sepas dónde parás antes de decidir.",
  sellImageAlt: "Interior de una casa en Paraguay",
  sellValuationCta: "Solicitar valuación",
  sellPublishCta: "Publicar una propiedad →",

  investKicker: "Invertir",
  investTitle: "Invertí en Paraguay con datos, no con corazonadas",
  investText:
    "Publicamos la mediana de precio por m² de cada ciudad, calculada sobre los avisos del portal, y la cuota estimada de cada propiedad en venta según los programas de financiamiento vigentes.",
  investImageAlt: "Asunción al atardecer",
  investPricesCta: "Ver precios por zona",
  investFinancingCta: "Cómo funciona el financiamiento →",

  projectsTitle: "🏗 Nuevos proyectos en Paraguay",
  projectsSubtitle:
    "Obra nueva verificada — departamentos en pozo, en construcción y entrega inmediata.",

  citiesTitle: "Explorá por ciudad",

  rowMore: "Ver todas →",
  rowRecommended: "Propiedades recomendadas",
  rowHousesForSale: "Casas en Venta — Asunción y alrededores",
  rowFlatsForSale: "Departamentos en Venta — Asunción",
  rowRentals: "Alquileres en Asunción",
  rowLand: "Terrenos",

  developersTitle: "Desarrolladoras destacadas",
  developersSubtitle: "Conocé quién construye los proyectos del país.",
  developerProjectCount: (n: number) => `${n} ${n === 1 ? "proyecto" : "proyectos"}`,

  pricesTitle: "📊 Precios de referencia por ciudad",
  pricesMore: "Ver todos →",
  pricesSubtitle:
    "Medianas de precio por m² calculadas sobre los avisos publicados. Para saber si un aviso está en línea con su zona antes de negociar.",
  pricesSample: (n: string) => `${n} avisos analizados`,

  values: [
    {
      icon: "✅",
      title: "Contacto directo",
      text: "Hablás directo con el vendedor o la inmobiliaria, sin intermediarios.",
    },
    {
      icon: "💳",
      title: "Cuota estimada",
      text: "Cada propiedad en venta muestra su cuota mensual con financiamiento vigente.",
    },
    {
      icon: "🇵🇾",
      title: "Hecho para Paraguay",
      text: "Precios en guaraníes y dólares, barrios reales y WhatsApp primero.",
    },
  ],

  discoverTitle: (brand: string) => `Descubre más en ${brand}`,
  discoverCards: [
    {
      icon: "🏡",
      title: "Publicá tu propiedad gratis",
      text: "Cargá fotos, precio y ubicación en minutos. Sin comisión, sin costo de publicación.",
      cta: "Publicar ahora",
      href: "/publicar",
    },
    {
      icon: "💰",
      title: es.valuationMagnet,
      text: "Te damos un rango estimado con los precios publicados en la zona. Gratis y sin registrarte.",
      cta: "Calcular gratis",
      href: "/tasacion",
    },
    {
      icon: "📊",
      title: "Precios del mercado",
      text: "Mediana de precio por m² en cada ciudad, calculada sobre los avisos publicados del portal.",
      cta: "Ver precios",
      href: "/precios",
    },
    {
      icon: "🏦",
      title: "Financiamiento y cuotas",
      text: "Qué programas existen en Paraguay, qué piden y cómo calculamos la cuota estimada de cada aviso.",
      cta: "Leer la guía",
      href: "/financiamiento",
    },
  ],

  proKicker: "Para inmobiliarias y agentes",
  proTitle: "¿Vendés propiedades todos los días?",
  proText:
    "Publicá tu cartera completa, mostrá tu inmobiliaria con perfil verificado y recibí las consultas directo en tu WhatsApp. Sin costo por aviso, sin costo por lead y sin comisión sobre tus operaciones.",
  proBullets: [
    "✓ Avisos ilimitados en el plan gratuito",
    "✓ Perfil público de la inmobiliaria y de cada agente",
    "✓ Importación de cartera desde planilla o enlace",
    "✓ Panel con las consultas de cada propiedad",
  ],
  proMore: "Conocer más",
  proPlans: "Ver planes →",
  proAgencyCardTitle: "Directorio de inmobiliarias",
  proAgencyCardText: "Mirá quiénes ya publican su cartera en el portal.",
  proProjectsCardTitle: "Desarrolladoras y proyectos",
  proProjectsCardText: "Obra nueva, en pozo y entrega inmediata.",

  ctaTitle: "Publicá tu propiedad gratis",
  ctaText:
    "Llegá a miles de compradores e inquilinos en todo Paraguay. Simple, rápido y sin costo.",
  ctaButton: "Publicar ahora",
  ctaWhatsapp: "o escribinos por WhatsApp",

  newsletterTitle: "Oportunidades inmobiliarias, una vez por semana",
  newsletterText:
    "Propiedades curadas, señales del mercado y las últimas del sector — en tu correo. Sin spam, podés cancelar cuando quieras.",

  faqTitle: "Preguntas frecuentes",
  faqSubtitle: (brand: string) => `Todo lo que necesitás saber sobre ${brand}.`,
  faqMore: "Ver todas las preguntas →",
} as const;

/** National operation hubs: /venta, /alquiler, /alquiler-temporal. */
export const esHub = {
  copy: {
    venta: {
      h1: "Propiedades en venta en Paraguay",
      lead: "Casas, departamentos, terrenos y locales en venta en todo el país. Cada aviso muestra su cuota mensual estimada, para saber de entrada si el número te cierra.",
      label: "Venta",
      cityLabel: "Comprar en",
    },
    alquiler: {
      h1: "Propiedades en alquiler en Paraguay",
      lead: "Departamentos, casas, oficinas y locales en alquiler en todo el país. Contacto directo con el propietario o la inmobiliaria, sin comisión del portal.",
      label: "Alquiler",
      cityLabel: "Alquilar en",
    },
    alquiler_temporal: {
      h1: "Alquiler temporal en Paraguay",
      lead: "Estadías cortas y alquileres por temporada en todo el país.",
      label: "Alquiler temporal",
      cityLabel: "Alquilar por temporada en",
    },
  } as Record<string, { h1: string; lead: string; label: string; cityLabel: string }>,
  breadcrumbHome: "Inicio",
  count: (total: string) => `${total} propiedades publicadas`,
  byTypeTitle: "Por tipo de propiedad",
  byTypeSubtitle: (opLabel: string) =>
    `Elegí qué estás buscando. Los totales son avisos publicados hoy en ${opLabel}.`,
  byCityTitle: "Por ciudad",
  byCitySubtitle:
    "Todas las ciudades con inventario activo, ordenadas por cantidad de avisos.",
  latestTitle: "Últimas publicaciones",
  latestNoteLead: "¿Buscás en una zona puntual? Entrá a",
  latestNoteTail: "y filtrá por barrio, precio y dormitorios.",
  emptyBody: (opLabel: string) =>
    `Todavía no hay propiedades publicadas en ${opLabel}.`,
  emptyCta: "Publicar la primera",
  ctaTitleSale: "¿Vendés una propiedad?",
  ctaTitleRent: "¿Tenés una propiedad para alquilar?",
  ctaText: "Publicala gratis y llegá a quienes están buscando en tu zona.",
  ctaPrimary: "Publicar gratis",
  ctaSecondary: "¿Cuánto vale?",
} as const;

/** Category grid: /[operacion]/[...segments]. */
export const esCategory = {
  operationLabel: {
    venta: "venta",
    alquiler: "alquiler",
    alquiler_temporal: "alquiler temporal",
  } as Record<string, string>,
  typeLabel: {
    casa: "Casas",
    departamento: "Departamentos",
    terreno: "Terrenos",
    duplex: "Dúplex",
    comercial: "Locales comerciales",
    oficina: "Oficinas",
    deposito: "Depósitos",
    quinta: "Quintas",
  } as Record<string, string>,
  typeLabelAny: "Propiedades",
  /** "Casas en venta en Villa Morra, Asunción" */
  title: (typeLabel: string, opLabel: string, where: string) =>
    `${typeLabel} en ${opLabel} en ${where}`,
  titlePaged: (title: string, page: number) => `${title} — página ${page}`,
  metaNotFound: "No encontrado",
  metaDescription: (count: number, title: string, brand: string) =>
    `${count} ${title.toLowerCase()} en ${brand}. Encontrá tu próxima propiedad con cuota estimada y financiamiento.`,
  breadcrumbHome: "Inicio",
  count: (n: number) => `${n} ${n === 1 ? "propiedad" : "propiedades"} disponibles.`,
  emptyTypeNotice: (typeLabel: string, opLabel: string, city: string) =>
    `No hay ${typeLabel} en ${opLabel} en ${city} por el momento. Te mostramos todas las propiedades en ${city}.`,
  viewSwitchLabel: "Vista",
  viewList: "Lista",
  viewMap: "Mapa",
  filterEmpty: "No hay propiedades que coincidan con estos filtros.",
  filterEmptyClear: "Quitar filtros",
  paginationLabel: "Paginación",
  paginationPrev: "← Anterior",
  paginationNext: "Siguiente →",
  paginationStatus: (page: number, total: number) => `Página ${page} de ${total}`,
} as const;

/** Property detail: /propiedad/[slug]. */
export const esListing = {
  metaNotFound: "Propiedad no encontrada",
  metaTitle: (title: string, price: string) => `${title} — ${price}`,
  ogTitle: (title: string, brand: string) => `${title} — ${brand}`,
  stateLabel: {
    entrega_inmediata: "Entrega inmediata",
    en_construccion: "En construcción",
    en_pozo: "En pozo",
    usado: "Usado",
  } as Record<string, string>,
  breadcrumbHome: "Inicio",
  breadcrumbLabel: "Ruta de navegación",

  galleryEmpty: "Fotos próximamente",
  galleryThumbAlt: (title: string, n: number) => `${title} — foto ${n}`,
  galleryMore: (n: number) => `+${n} fotos`,

  factBedrooms: (n: number) => `${n} dorm`,
  factBathrooms: (n: number) => `${n} ${n === 1 ? "baño" : "baños"}`,
  factParking: (n: number) => `${n} cocheras`,
  factArea: (m2: number) => `${m2} m²`,

  priceRentLabel: "Alquiler",
  priceRentPeriod: "/mes",

  financingHead: (program: string) => `💳 Con ${program}`,
  financingStateProgram: " (programa estatal)",
  financingCuotaLabel: "Cuota estimada",
  financingTermsLabel: "Condiciones",
  financingTerms: (rate: string, years: number) => `Tasa ${rate}% · ${years} años`,
  financingFoot:
    "Estimación referencial para esta propiedad — la aprobación depende del banco y del programa.",

  detailsTitle: "☰ Detalles de la propiedad",
  detailBarrio: "Barrio",
  detailCity: "Ciudad",
  detailType: "Tipo",
  detailState: "Estado",
  detailArea: "Superficie",
  detailLand: "Terreno",
  detailParking: "Cocheras",

  amenitiesTitle: "✨ Comodidades de la propiedad",
  descriptionTitle: "📄 Descripción",
  locationTitle: "📍 Ubicación aproximada",

  sellerFallback: (brand: string) => `Publicado en ${brand}`,
  sellerVerified: "Verificado",
  sellerKindAgency: "Inmobiliaria",
  sellerKindAgent: "Agente",
  /** FSBO: the listing was published by its owner, not by a professional. */
  sellerKindOwner: "Particular",

  contactTitle: "¿Interesado en esta propiedad?",
  contactSubtitle: "Contactanos hoy para más información o para agendar una visita.",

  similarTitle: "Propiedades similares",
  fromAgencyTitleLead: "Más de",
  fromAgencyFallback: "esta inmobiliaria",

  moreInBarrio: (barrio: string) => `📍 Más propiedades en ${barrio}`,
  moreInCity: (city: string) => `🏙 Todas las propiedades en ${city}`,

  ctaBarWhatsapp: "Contactar por WhatsApp",
  ctaBarConsult: "Consultar",
  ctaBarCall: "Llamar",

  publishedToday: "Publicado hoy",
  publishedYesterday: "Publicado ayer",
  publishedDaysAgo: (n: number) => `Publicado hace ${n} días`,
  publishedWeeksAgo: (n: number) => `Publicado hace ${n} semanas`,
  publishedMonthsAgo: (n: number) => `Publicado hace ${n} meses`,
} as const;

/**
 * Public agency and agent profile pages (/inmobiliaria/[slug], /agente/[slug]).
 * `breadcrumbHome` and `verified` are not repeated here — both pages already
 * read `listing.breadcrumbHome` and `listing.sellerVerified` for those.
 */
export const esProfile = {
  navAriaLabel: "Ruta de navegación",
  emptyState: "Sin propiedades publicadas por el momento",
} as const;

/** Development project page (/proyecto/[slug]). */
export const esProject = {
  stageLabel: {
    en_pozo: "En pozo",
    en_construccion: "En construcción",
    entrega_inmediata: "Entrega inmediata",
  } as Record<string, string>,
  typeLabel: {
    edificio: "Edificio",
    loteamiento: "Loteamiento",
    condominio: "Condominio",
    barrio_cerrado: "Barrio cerrado",
  } as Record<string, string>,
  stateLabel: {
    entrega_inmediata: "Entrega inmediata",
    en_construccion: "En construcción",
    en_pozo: "En pozo",
    usado: "Usado",
  } as Record<string, string>,
  available: "Disponible",
  developer: "Desarrolladora",
  /** Locale-aware on purpose: month names are not universal. */
  delivery: (date: Date, numberLocale: string) =>
    `Entrega ${date.toLocaleDateString(numberLocale, { month: "long", year: "numeric" })}`,
} as const;
