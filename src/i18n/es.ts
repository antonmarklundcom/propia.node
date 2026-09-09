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
  // Agent/agency admin-granted verification (agents.isVerified /
  // agencies.isVerified) — never listings.isVerified, see ListingCard.tsx.
  verified: "Verificado",
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

/**
 * The rental family — alquiler.com.py (this file) and rentparaguay.com
 * (`enRental`). One business in two languages, so unlike `guideEn` (a
 * translation of the marketplace's own pitch) the *source* language here is
 * English: the old rentparaguay.com wrote it, and this Spanish is a
 * translation of its intent for a Paraguayan reader, never a new claim.
 *
 * Chrome, hero, section titles, the seven service cards, the four "why us"
 * cards, the four process steps and the closing CTA are real copy from the
 * old site's home page (O2, sourced from the scratch extraction deleted as
 * of S3). `faq` (S2) is the five real Q&As from the old services page —
 * shown on both the home page and the services hub, the one FAQ this family
 * has.
 *
 * Nothing fabricated by the old WordPress theme survives (plan §1 item 13):
 * no "400+ agents", no demo listings, no testimonials, no team photos.
 */
export const esRental = {
  // ---- chrome (SiteHeader / SiteFooter / MobileMenu, chromeVariant "rental")
  chromeNav: [
    { label: "Alquileres", href: "/alquiler" },
    { label: "Servicios", href: "/servicios" },
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
  ],
  chromeCtaLabel: "Contactanos",
  chromeCtaHref: "/contacto",
  footerTagline:
    "Inmobiliaria y administración de propiedades en Asunción, para extranjeros, nómadas digitales e inversores. Buscamos, alquilamos y administramos, en tu idioma.",
  footerServicesTitle: "Servicios",
  footerCompanyTitle: "Empresa",
  footerLegalTitle: "Legal",
  footerCompanyLinks: [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
    { label: "Alquileres", href: "/alquiler" },
  ],
  footerLegalLinks: [
    { label: "Términos", href: "/terminos" },
    { label: "Política de privacidad", href: "/privacidad" },
  ],
  footerContactUs: "Escribinos",
  footerAddress: "Edificio Skytower, Asunción, Paraguay",
  footerLegalLine: (brand: string) =>
    `${brand} acompaña la búsqueda, el contrato y la administración. La información publicada es orientativa y no constituye asesoramiento legal, fiscal ni financiero.`,

  // ---- home: metadata (the <title> tail and the meta description of "/")
  metaTagline: "Alquiler y administración de propiedades en Asunción",
  metaDescription:
    "Inmobiliaria y administración de propiedades en Asunción para extranjeros, nómadas digitales e inversores: búsqueda, contrato, administración de alquileres y Airbnb, residencia y domicilio virtual.",

  // ---- home: hero
  heroKicker: "Alquiler y administración en Asunción",
  heroTitle: "Alquilar en Paraguay, sin complicaciones",
  heroSubtitle:
    "Ayudamos a extranjeros, nómadas digitales e inversores a encontrar, alquilar y administrar propiedades en Asunción. Sin estrés, sin barrera idiomática y con las cuentas claras.",
  heroPrimary: "Contactanos",
  heroSecondary: "Ver servicios",

  // ---- home: services
  servicesTitle: "Servicios",
  servicesLead: "Todo lo que hace falta para mudarte, quedarte o poner tu propiedad a rendir.",
  servicesMore: "Ver todos los servicios →",

  // ---- home: why us
  whyTitle: "Por qué nosotros",
  whyLead:
    "Combinamos experiencia local, transparencia y una atención pensada para quien llega de afuera.",
  whyCards: [
    {
      title: "Conocemos el mercado desde adentro",
      text: "Recorrimos el mercado inmobiliario de Asunción como locales y como extranjeros, y esa doble mirada es la que ponemos en cada búsqueda.",
    },
    {
      title: "De la búsqueda a la mudanza",
      text: "Desde la primera visita hasta la traducción del contrato, los servicios y la administración posterior: nos ocupamos de los detalles.",
    },
    {
      title: "Propiedades verificadas y cuentas claras",
      text: "Visitamos cada propiedad antes de ofrecerla y explicamos qué se paga, cuándo y por qué, sin costos que aparezcan al final.",
    },
    {
      title: "Atención bilingüe",
      text: "Trabajamos en español y en inglés, para que entiendas cada cláusula que firmás y cada conversación que tenemos por vos.",
    },
  ],

  // ---- home: process
  processTitle: "Cómo trabajamos",
  processLead: "Cuatro pasos, de la primera conversación a las llaves.",
  processSteps: [
    {
      step: "01",
      title: "Primera conversación",
      text: "Nos contás qué buscás: zona, presupuesto, plazo y con quién vas a vivir o qué querés que rinda tu propiedad.",
    },
    {
      step: "02",
      title: "Selección a medida",
      text: "Filtramos las mejores opciones en barrios como Villa Morra y Carmelitas y te mandamos una lista corta que encaja con lo que pediste.",
    },
    {
      step: "03",
      title: "Contrato y trámites",
      text: "Negociamos, traducimos el contrato y acompañamos la firma, para que sepas exactamente a qué te estás comprometiendo.",
    },
    {
      step: "04",
      title: "Llaves y después",
      text: "Te ayudamos con los servicios y con conocer el barrio, y seguimos disponibles cuando aparece algo para resolver.",
    },
  ],

  // ---- home: the door's own inventory (renders nothing while empty)
  recentTitle: "Alquileres disponibles",
  recentMore: "Ver todos →",

  // ---- home: faq — the same five Q&As shown on the services hub
  faqTitle: "Preguntas frecuentes",
  faqLead: "Respuestas breves a lo que más nos consultan.",
  faq: [
    {
      q: "¿Necesito hablar español para alquilar, comprar o poner mi propiedad en manos de alguien?",
      a: "No. Todo nuestro equipo es bilingüe y se ocupa de cada negociación, visita y traducción legal por vos: desde la primera consulta hasta la firma en la escribanía, entendés cada detalle en tu idioma.",
    },
    {
      q: "No tengo un codeudor paraguayo, ¿puedo alquilar igual?",
      a: "Sí. El codeudor local es uno de los obstáculos más grandes para quien llega de afuera. Como tenemos relaciones con propietarios y desarrolladoras en Asunción, negociamos alternativas por vos —un depósito distinto o un pago por adelantado— para que puedas firmar sin necesitar un conocido con propiedad.",
    },
    {
      q: "¿Puedo invertir en una propiedad acá sin vivir en Paraguay?",
      a: "Sí, para eso están nuestros servicios de inversión y administración de propiedades. Vos ponés el capital; nosotros buscamos la propiedad, gestionamos la compra, la ambientamos si es para Airbnb, colocamos inquilinos verificados y te enviamos reportes y pagos mensuales.",
    },
    {
      q: "¿Cuánto tarda la residencia en Paraguay?",
      a: "El plazo depende de los tiempos del organismo público, pero nuestro servicio de Residencia en Paraguay reduce la fricción: preparamos tu carpeta con anticipación, así que solo necesitás estar en Asunción unos días para presentar la documentación y la biometría, y seguimos el trámite hasta que tenés tu cédula.",
    },
    {
      q: "¿Cómo funciona la administración de Airbnb en el día a día?",
      a: "Tratamos tu propiedad como si fuera nuestra: precios dinámicos según la demanda local, ambientación y fotos profesionales, y nos ocupamos de la comunicación con huéspedes, la limpieza y el mantenimiento para mantener buena ocupación y buenas reseñas.",
    },
  ],

  // ---- home: closing CTA
  ctaTitle: "Tu próximo capítulo en Paraguay empieza acá",
  ctaText:
    "Ya sea que busques dónde vivir, quieras poner tu propiedad a rendir o estés evaluando invertir, contanos qué necesitás y te respondemos con opciones concretas.",
  ctaButton: "Hablemos",

  /**
   * Card title and one-liner per service, keyed by `dictKey` in
   * `src/config/rental-services.ts`. The full page copy is `rentalServices`
   * (S3); these two lines are what the home page and the footer show.
   */
  services: {
    alquiler: {
      title: "Alquiler de casas y departamentos",
      tagline:
        "Buscamos tu lugar en los barrios más seguros de Asunción y nos ocupamos de la negociación y del contrato.",
    },
    administracionAirbnb: {
      title: "Administración de Airbnb",
      tagline:
        "Administración llave en mano: ambientación, fotos, precios y toda la comunicación con los huéspedes.",
    },
    administracionDepartamentos: {
      title: "Administración de departamentos",
      tagline:
        "Vivís afuera y tu propiedad acá: inquilinos, cobro del alquiler, mantenimiento y cumplimiento legal.",
    },
    inmobiliariaAsuncion: {
      title: "Inmobiliaria en Asunción",
      tagline:
        "Acompañamiento bilingüe para comprar tu primera propiedad o sumar otra a tu portafolio.",
    },
    residenciaParaguay: {
      title: "Residencia en Paraguay",
      tagline:
        "Preparamos la carpeta y te acompañamos en todo el trámite, hasta que tenés tu cédula.",
    },
    invertirEnParaguay: {
      title: "Invertir en Paraguay",
      tagline:
        "Oportunidades inmobiliarias y de negocios para el capital que querés poner a trabajar acá.",
    },
    domicilioVirtual: {
      title: "Domicilio virtual",
      tagline:
        "Una dirección profesional en Asunción para tus necesidades legales y comerciales, sin alquilar oficina.",
    },
  },
  /**
   * The services hub (`/servicios`), the shared furniture every service page
   * uses, and the rental forks of `/nosotros` and `/contacto`. Minimal but
   * real as of O3 — S2 expands the about and contact copy.
   */
  hubMetaTitle: "Servicios",
  hubMetaDescription: (brand: string) =>
    `Alquiler, administración de propiedades y Airbnb, residencia, inversión y domicilio virtual en Asunción con ${brand}.`,
  hubIntro:
    "Siete servicios que se apoyan entre sí: buscar dónde vivir, poner una propiedad a rendir, quedarse legalmente y decidir dónde invertir.",
  allServices: "Todos los servicios",
  serviceFormTitle: "Escribinos",
  serviceFormLead:
    "Contanos qué necesitás y te respondemos por WhatsApp.",
  about: {
    metaTitle: "Nosotros",
    metaDescription: (brand: string) =>
      `${brand} es una consultora boutique en Asunción para extranjeros, nómadas digitales e inversores: alquiler, administración, residencia e inversión.`,
    h1: "Nosotros",
    lead: "El puente entre quien llega y el mercado paraguayo.",
    intro:
      "Nacimos de una diferencia que se notaba: inversores y extranjeros llegaban a un Paraguay en crecimiento y se encontraban con burocracia local, estándares de servicio dispares y poca transparencia en su idioma. Construimos la firma para ser el socio de esa llegada.",
    founderTitle: "Quién está detrás",
    founderText:
      "Fundada por Anton Marklund, un emprendedor sueco radicado en Asunción, la firma combina una forma de trabajar escandinava —honestidad, puntualidad y estándares altos— con experiencia de campo en el mercado inmobiliario y legal paraguayo.",
    visionTitle: "Visión",
    visionText:
      "Ser el puente más confiable para el capital y el talento internacional en Paraguay, y marcar el estándar en transparencia, diseño y mudanzas sin fricción.",
    missionTitle: "Misión",
    missionText:
      "Eliminar la fricción de una transición internacional con asesoramiento bilingüe, administración impecable y una mirada estratégica sobre la inversión.",
    valuesTitle: "Cómo trabajamos",
    values: [
      {
        title: "Transparencia",
        text: "Reportes honestos y detallados para el propietario, condiciones claras y justas para el inquilino.",
      },
      {
        title: "Respeto por tu tiempo",
        text: "Si algo se puede resolver en 24 horas, no lo estiramos a 48.",
      },
      {
        title: "Creemos en Paraguay",
        text: "Creemos en el crecimiento del país y estamos acá para que puedas ser parte de forma segura.",
      },
    ],
  },
  contact: {
    metaTitle: "Contacto",
    metaDescription: (brand: string) =>
      `Escribinos: ${brand} responde por WhatsApp consultas sobre alquiler, administración, residencia e inversión en Asunción.`,
    h1: "Contacto",
    lead: "Ya sea que te estés mudando a Asunción, busques la residencia o estés evaluando invertir, nuestro equipo bilingüe está para acompañarte.",
    formTitle: "Dejanos tu consulta",
    channelsTitle: "Canales directos",
    officeTitle: "Dónde estamos",
    officeText: "Edificio Skytower, en el corazón del distrito financiero de Asunción.",
    formNote: "Formulario de contacto (respondemos por acá)",
    reasonRent: "Quiero alquilar o mudarme",
    reasonManage: "Tengo una propiedad para administrar",
    reasonInvest: "Quiero comprar o invertir",
  },
} as const;

/**
 * `LeadForm`'s own literals (`/contacto`, `/para-inmobiliarias`, and from O3
 * every rental service page). Lifted out of the component when the rental
 * doors needed it in English — every Spanish string here is byte-identical to
 * what the component hard-coded before, so the two existing call sites render
 * exactly as they did.
 */
export const esLeadForm = {
  reasonLabel: "Motivo de contacto",
  nameLabel: "Nombre",
  namePlaceholder: "Tu nombre",
  whatsappLabel: "WhatsApp",
  whatsappPlaceholder: "+595 981 234 567",
  emailLabel: "Email (opcional)",
  emailPlaceholder: "tu@email.com",
  companyLabel: "Inmobiliaria / empresa",
  companyPlaceholder: "Nombre comercial",
  /** Prefixed to the message body when the company field is shown and filled. */
  companyPrefix: "Inmobiliaria / empresa",
  messageLabel: "Mensaje",
  messagePlaceholder: "Contanos en qué podemos ayudarte",
  submitLabel: "Enviar consulta",
  sending: "Enviando…",
  successTitle: "¡Gracias! Recibimos tu mensaje.",
  successText:
    "Te contactamos por WhatsApp dentro de las próximas 24 horas hábiles.",
  invalidPhone: "Ingresá un número de WhatsApp válido.",
  sendError:
    "No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp.",
  finePrintLead: "Al enviar aceptás nuestros ",
  finePrintTerms: "términos",
  finePrintMid: " y la ",
  finePrintPrivacy: "política de privacidad",
  finePrintTail: ". Usamos tus datos solo para responderte.",
} as const;

/**
 * The seven rental service pages (`/servicios/<slug>`), keyed by `dictKey` in
 * `src/config/rental-services.ts`. Shape is fixed — plan Appendix C — so
 * `RentalServicePage` renders every one of them without knowing which.
 *
 * O3 shipped `alquiler` filled from its own content file as the exemplar; S3
 * (2026-09-09) filled the other six from the old site's own service pages
 * (a scratch extraction, deleted once its copy landed here) to the same
 * shape — every section on every one of the seven is real copy.
 *
 * Empty arrays are still honest where they occur: a section with nothing in
 * it does not render, so a future edit that empties one out is safe rather
 * than a placeholder sentence would be.
 */
export const esRentalServices = {
  alquiler: {
    metaTitle: "Alquiler de casas y departamentos en Asunción",
    metaDescription: (brand: string) =>
      `${brand} busca, negocia y contrata tu alquiler en Asunción: barrios seguros, contrato traducido y acompañamiento hasta la mudanza.`,
    h1: "Alquiler de casas y departamentos",
    tagline:
      "Alquileres en los barrios más buscados de Asunción, pensados para quien llega de afuera y valora seguridad, calidad y una mudanza sin sobresaltos.",
    intro:
      "Buscar dónde vivir en un país nuevo no debería ser la parte más difícil de mudarse. Nos ocupamos de la búsqueda, de las visitas, de la negociación y del contrato, y te acompañamos hasta que tenés las llaves.",
    challengeTitle: "Por qué alquilar acá es distinto",
    challengeText:
      "El mercado de alquiler paraguayo está pensado para quien ya tiene raíces acá. La mayoría de los propietarios pide un codeudor local que firme con vos: negociamos alternativas, como un depósito distinto, para que no dependas de tener un conocido con propiedad. El contrato está en español legal, así que te lo traducimos entero y negociamos por vos. Y buena parte de las mejores propiedades nunca se publica: esas aparecen por red de contactos, no buscando en portales.",
    frameworkTitle: "Cómo trabajamos tu búsqueda",
    framework: [
      {
        title: "Qué necesitás",
        text: "Empezamos por cómo vivís: cercanía a un colegio internacional, al centro financiero, a dónde entrenás o a dónde trabajás.",
      },
      {
        title: "Visitas acompañadas",
        text: "Armamos una lista corta y te llevamos a verlas, con una opinión honesta sobre la calidad del edificio y sobre el barrio.",
      },
      {
        title: "Negociación",
        text: "No preguntamos solo el precio: negociamos las condiciones, desde las cláusulas de salida hasta quién se hace cargo del mantenimiento.",
      },
      {
        title: "Contrato y firma",
        text: "Revisamos el contrato, acompañamos el trámite ante escribanía y te explicamos cada cláusula antes de que firmes.",
      },
    ],
    specialTitle: "Servicios para quien recién llega",
    special: [
      {
        title: "Alquiler temporal de aterrizaje",
        text: "¿Necesitás un lugar por uno a tres meses mientras buscás el definitivo? Tenemos departamentos equipados listos para entrar.",
      },
      {
        title: "Mudanzas corporativas",
        text: "Trabajamos con áreas de RRHH para reubicar equipos completos, desde la vivienda hasta las visitas a colegios.",
      },
      {
        title: "Búsqueda pet-friendly",
        text: "Sabemos qué edificios realmente reciben mascotas y cuáles tienen buenas plazas cerca.",
      },
    ],
    benefitsTitle: "Qué ganás trabajando con nosotros",
    benefits: [
      {
        title: "Propiedades que no están publicadas",
        text: "Muchas de las mejores propiedades de Asunción no llegan a los portales; llegás a ellas por nuestra red.",
      },
      {
        title: "Un contrato que te protege",
        text: "Revisamos que el contrato cumpla la ley paraguaya y que tus derechos como inquilino extranjero estén contemplados, sin cláusulas escondidas.",
      },
      {
        title: "Sin codeudor local",
        text: "Negociamos alternativas al codeudor, que es el requisito que deja afuera a casi todo el que recién llega.",
      },
      {
        title: "Acompañamiento bilingüe",
        text: "Desde la letra chica hasta cómo se pagan las expensas del edificio: somos tu voz mientras te acomodás.",
      },
    ],
    faq: [
      {
        q: "¿Qué depósito se pide normalmente?",
        a: "Por lo general un mes de depósito más el primer mes por adelantado. Para extranjeros sin codeudor negociamos condiciones específicas con el propietario.",
      },
      {
        q: "¿Los servicios están incluidos en el alquiler?",
        a: "En contratos de largo plazo normalmente no. Te ayudamos a pasar las cuentas a tu nombre o a gestionar los pagos.",
      },
      {
        q: "¿Qué documentos necesito para firmar?",
        a: "Al principio, tu pasaporte. Cuando arranca tu trámite de residencia podemos actualizar el contrato con tu cédula paraguaya.",
      },
    ],
    ctaTitle: "No recorras el mercado solo",
    ctaText:
      "Contanos qué buscás y en cuánto tiempo lo necesitás, y te respondemos con opciones concretas.",
    ctaButton: "Empezar la búsqueda",
  },
  administracionAirbnb: {
    metaTitle: "Administración de Airbnb en Asunción",
    metaDescription: (brand: string) =>
      `${brand} administra tu alquiler temporal en Asunción: ambientación, fotos, precios dinámicos y atención al huésped, de punta a punta.`,
    h1: "Administración de Airbnb",
    tagline:
      "Administración integral de alquiler temporal en Asunción: ambientación, precios y hospitalidad, sin que tengas que estar encima.",
    intro:
      "Sostener un alquiler temporal que realmente rinda es un trabajo de tiempo completo: fotos que compitan, un precio que se mueva con la demanda y alguien que conteste a cualquier hora para que ninguna reserva quede sin respuesta. Nosotros nos ocupamos de todo, de punta a punta, para que la propiedad trabaje para vos y no al revés.",
    challengeTitle: "El mito del ingreso pasivo",
    challengeText:
      "Un aviso con fotos promedio queda enterrado en los resultados. Un precio fijo pierde plata en las semanas de alta demanda y espanta en las bajas. La comunicación con huéspedes y la entrega de llaves a toda hora terminan cansando a cualquier propietario. Y mantener una unidad con estándar hotelero exige un equipo dedicado, no una limpieza ocasional.",
    frameworkTitle: "Nuestra administración, en tres etapas",
    framework: [
      {
        title: "Lanzamiento y estética",
        text: "Ambientación profesional y fotografía de calidad editorial que capturan el ambiente del espacio, más un aviso redactado y traducido al inglés, portugués y español para llegar a huéspedes de cualquier lugar.",
      },
      {
        title: "Operación diaria",
        text: "Precios ajustados según la demanda y la temporada, atención bilingüe al huésped para reservas y recomendaciones, y cerraduras inteligentes para un check-in seguro sin que nadie tenga que estar presente.",
      },
      {
        title: "Mantenimiento y limpieza",
        text: "Limpieza con estándar hotelero entre estadía y estadía, revisiones preventivas del aire acondicionado, el wifi y los electrodomésticos, y reposición de amenities, café y blanquería.",
      },
    ],
    specialTitle: "Servicios especializados para propietarios en el exterior",
    special: [
      {
        title: "Totalmente hands-off",
        text: "Pensado para inversores que viven en el exterior y necesitan un equipo confiable en Asunción, para que nunca tengas que gestionar vos mismo una reserva.",
      },
      {
        title: "Reportes financieros transparentes",
        text: "Un resumen mensual muestra lo que entró y lo que se gastó, con tu ganancia neta transferida directamente a tu cuenta bancaria.",
      },
      {
        title: "Enlace impositivo y legal local",
        text: "Te ayudamos a mantener tu alquiler temporal en regla con la normativa paraguaya que aplica a tu propiedad.",
      },
      {
        title: "Amoblamiento llave en mano",
        text: "Para una unidad nueva, nos encargamos del amoblamiento y equipamiento completo desde cero.",
      },
    ],
    benefitsTitle: "Qué cambia para vos",
    benefits: [
      {
        title: "Una sola cara visible",
        text: "Nosotros hablamos con los huéspedes, con la limpieza y con el mantenimiento; vos ves el resultado.",
      },
      {
        title: "Más visibilidad",
        text: "Tu propiedad se sincroniza en Airbnb, Booking.com y VRBO, para que esté a la vista donde sea que un huésped esté buscando.",
      },
      {
        title: "Atención bilingüe al huésped",
        text: "Los huéspedes reciben atención en inglés, español y portugués, a cualquier hora, para que una barrera de idioma nunca te cueste una reserva.",
      },
      {
        title: "Una propiedad que se mantiene protegida",
        text: "Inspecciones periódicas y mantenimiento preventivo mantienen la unidad en el estado en que nos la entregaste.",
      },
    ],
    faq: [
      {
        q: "¿Cómo fijan el precio por noche?",
        a: "Miramos precios en tiempo real de la competencia local y la demanda de temporada en Asunción, y ajustamos tu tarifa con regularidad para conseguir el mejor rendimiento sin dejarte afuera de las reservas.",
      },
      {
        q: "¿Qué pasa si un huésped daña la propiedad?",
        a: "Hacemos una inspección después de cada estadía y te ayudamos a gestionar el reclamo, ya sea por el programa de protección de Airbnb o por un seguro privado.",
      },
      {
        q: "¿Cómo y cuándo cobro?",
        a: "Te enviamos un resumen mensual transparente y transferimos tu ganancia neta directamente a tu cuenta bancaria.",
      },
      {
        q: "¿Puedo bloquear fechas para uso personal?",
        a: "Sí. Podés bloquear fechas por sistema para tus propias estadías, y nos aseguramos de que la unidad esté lista cuando llegues.",
      },
      {
        q: "¿Se ocupan de la parte legal e impositiva?",
        a: "Te ayudamos a mantener tu aviso en regla con la normativa paraguaya sobre alquiler temporal, para que ese lado no quede en tus manos.",
      },
    ],
    ctaTitle: "Poné tu propiedad a rendir",
    ctaText: "Contanos dónde está y cómo está, y te decimos qué esperar.",
    ctaButton: "Hablemos",
  },
  administracionDepartamentos: {
    metaTitle: "Administración de departamentos en Asunción",
    metaDescription: (brand: string) =>
      `${brand} administra tu departamento en Asunción: selección de inquilinos, cobro, mantenimiento y reportes claros, aunque vivas afuera.`,
    h1: "Administración de departamentos",
    tagline:
      "Tu propiedad en Asunción, administrada como si vivieras a la vuelta: inquilinos verificados, mantenimiento al día y cuentas claras.",
    intro:
      "Alquilar a largo plazo en Asunción es una buena estrategia, hasta que la administración empieza a comerse el rendimiento. Para muchos propietarios que viven afuera, la autogestión termina en agotamiento: perseguir pagos, entender el sistema legal local, resolver un problema a la distancia. Nuestro trabajo es convertir tu propiedad en un ingreso realmente pasivo, cuidando el estado físico del inmueble y la relación con el inquilino, para que vos te ocupes de tu próxima inversión y nosotros de la operación diaria.",
    challengeTitle: "La realidad de tener una propiedad alquilada",
    challengeText:
      "Perseguir pagos atrasados, entender la ley local, resolver una filtración desde otro continente: son costos que no figuran en ninguna planilla y que terminan agotando al propietario que administra solo, sobre todo si vive en el exterior.",
    frameworkTitle: "Cómo administramos",
    framework: [
      {
        title: "Búsqueda y selección de inquilinos",
        text: "Avisos con fotos profesionales y descripciones pensadas para atraer buenos candidatos, visitas acompañadas y verificación de antecedentes, ingresos y referencias antes de firmar.",
      },
      {
        title: "Seguridad legal y administración",
        text: "Coordinamos la firma del contrato ante escribanía para que tenga plena validez legal, resguardamos el depósito en cuenta segura y documentamos el inventario con fotos para evitar disputas futuras.",
      },
      {
        title: "Operación y mantenimiento",
        text: "Somos el único contacto del inquilino una vez que se muda y resolvemos cualquier problema con proveedores de confianza a precios de mercado, con inspecciones periódicas para asegurar que la propiedad se cuide según nuestros estándares.",
      },
      {
        title: "Reportes",
        text: "Todos los meses recibís un estado detallado con ingresos, gastos y resultado neto, en tu idioma.",
      },
    ],
    specialTitle: "Servicios especializados",
    special: [
      {
        title: "Renovaciones y trámites legales",
        text: "Redactamos el contrato y gestionamos las notificaciones legales según la normativa vigente, para que siga teniendo validez en cada renovación.",
      },
      {
        title: "Impuestos y expensas",
        text: "Te ayudamos a gestionar los impuestos locales sobre la propiedad y el pago de las expensas del edificio, para que tu inversión se mantenga en regla.",
      },
      {
        title: "Inspecciones periódicas",
        text: "Visitamos la propiedad con regularidad para confirmar que el inquilino la está cuidando de acuerdo a lo acordado.",
      },
    ],
    benefitsTitle: "Por qué conviene delegarlo",
    benefits: [
      {
        title: "Menos días vacío",
        text: "Un buen inquilino encontrado rápido vale más que un mes de alquiler ahorrado en comisiones.",
      },
      {
        title: "Selección de inquilinos rigurosa",
        text: "Verificamos ingresos, historial laboral y referencias de alquileres anteriores, no solo un documento de identidad, para asegurar un buen ajuste.",
      },
      {
        title: "Se cuida el valor de tu propiedad",
        text: "Detectar a tiempo un problema chico, como una filtración o una falla eléctrica, evita que se convierta en una reparación estructural cara y protege el valor de reventa.",
      },
      {
        title: "Transparencia total",
        text: "Un estado mensual claro, en tu idioma, y gestión de impuestos y expensas para que tu inversión se mantenga en regla todo el año.",
      },
    ],
    faq: [
      {
        q: "¿Cómo seleccionan a los inquilinos?",
        a: "Verificamos ingresos, historial laboral y referencias de alquileres anteriores, además del documento de identidad, para asegurar que sea un buen ajuste a largo plazo.",
      },
      {
        q: "¿Qué pasa si un inquilino se atrasa con el pago?",
        a: "Tenemos un protocolo estricto para pagos atrasados, con seguimiento inmediato y, si hace falta, notificaciones legales.",
      },
      {
        q: "¿El mantenimiento corre por mi cuenta?",
        a: "Sí, como propietario sos responsable de los costos de mantenimiento, pero nosotros coordinamos el trabajo y nos aseguramos de que pagues precios justos de mercado.",
      },
      {
        q: "¿En qué idioma recibo los reportes?",
        a: "Te enviamos el estado mensual de ingresos, gastos y resultado neto en tu idioma, para que puedas seguir la rentabilidad de tu propiedad sin depender de nadie más.",
      },
    ],
    ctaTitle: "Delegá la administración",
    ctaText:
      "Contanos de tu propiedad y te explicamos cómo la administraríamos, para que dejes de preocuparte por los detalles y empieces a disfrutar el rendimiento.",
    ctaButton: "Hablemos",
  },
  inmobiliariaAsuncion: {
    metaTitle: "Inmobiliaria en Asunción para compradores extranjeros",
    metaDescription: (brand: string) =>
      `${brand} te representa en la compra en Asunción: búsqueda, verificación de títulos, negociación y acompañamiento hasta la escritura.`,
    h1: "Inmobiliaria en Asunción",
    tagline:
      "Representación bilingüe para comprar en Asunción, desde la búsqueda hasta la escritura.",
    intro:
      "Comprar en una ciudad que no es la tuya pide algo más que acceso a los avisos: pide entender los barrios, saber qué se está construyendo y tener con quién negociar. Trabajamos representándote a vos, no al vendedor.",
    challengeTitle: "Un mercado en plena transformación",
    challengeText:
      "Asunción cambió mucho en pocos años, con el crecimiento del Nuevo Centro Financiero y de corredores como Santa Teresa y Villa Morra, que atraen cada vez más capital internacional. Con eso llegaron zonas nuevas, desarrolladoras nuevas y precios que se mueven distinto según la cuadra. Sin esa lectura local, es fácil pagar de más por una propiedad difícil de revender.",
    frameworkTitle: "Cómo te acompañamos",
    framework: [
      {
        title: "Búsqueda y sourcing exclusivo",
        text: "Vamos más allá de los portales públicos: usamos una red privada de desarrolladoras y propietarios para encontrar oportunidades fuera de mercado y en pozo, filtradas por calidad de construcción, reputación de la desarrolladora y potencial de reventa.",
      },
      {
        title: "Debida diligencia y control legal",
        text: "Coordinamos con escribanías y asesores legales de primer nivel una verificación completa del título en busca de gravámenes, y traducimos cada documento legal para que avances con total claridad.",
      },
      {
        title: "Negociación y representación",
        text: "Negociamos con datos del mercado local para conseguir el mejor precio y las mejores condiciones, trabajando para que no pagues el sobreprecio que se le suele cobrar al de afuera.",
      },
      {
        title: "Después de la escritura",
        text: "Nos encargamos de la transferencia de títulos y servicios y, si querés, de la integración inmediata a nuestro servicio de administración de departamentos o de Airbnb.",
      },
    ],
    specialTitle: "Servicios especializados para compradores y vendedores",
    special: [
      {
        title: "Estrategia en pozo",
        text: "Accedé a precios de preventa en desarrollos nuevos a través de nuestra lista de desarrolladoras de trayectoria comprobada.",
      },
      {
        title: "Reubicación residencial de alta gama",
        text: "Búsquedas a medida de villas y penthouses con alta seguridad en los countries y barrios cerrados más buscados de la ciudad.",
      },
      {
        title: "Adquisición comercial y de terrenos",
        text: "Identificamos terrenos estratégicos para futuros desarrollos o uso comercial en las zonas industriales emergentes de Asunción.",
      },
    ],
    benefitsTitle: "Qué aporta tener representación",
    benefits: [
      {
        title: "Menos riesgo",
        text: "Revisamos quién construye, con qué materiales y qué hay proyectado alrededor, para que tu capital vaya a algo pensado para sostener su valor.",
      },
      {
        title: "Tiempo que te ahorrás",
        text: "Somos tu único punto de contacto durante toda la compra: coordinamos agentes, abogados y trámites ante organismos públicos en tu lugar.",
      },
    ],
    faq: [
      {
        q: "¿Puede un extranjero comprar propiedad en Paraguay?",
        a: "Sí. Paraguay está muy abierto a la inversión extranjera: podés comprar y titular una propiedad a tu nombre o a nombre de una sociedad usando solo tu pasaporte vigente.",
      },
      {
        q: "¿Cuáles son los costos de cierre al comprar en Asunción?",
        a: "Por lo general, los costos de cierre (honorarios de escribanía, inscripción registral e impuestos) rondan entre el 2% y el 3,5% del valor de la transacción. Te damos una estimación detallada antes de cerrar cualquier operación.",
      },
      {
        q: "¿Qué impuesto pago si vendo más adelante?",
        a: "Paraguay tiene un régimen impositivo muy competitivo. Si vendés como persona física, el escribano retiene el impuesto al firmar la escritura, y en la práctica suele ser un 2,4% efectivo sobre el valor de venta (hay un método alternativo sobre la ganancia real, pero ese 2,4% presuntivo es el que se aplica por defecto).",
      },
    ],
    ctaTitle: "Comprá con alguien de tu lado",
    ctaText: "Contanos qué estás buscando y con qué presupuesto.",
    ctaButton: "Hablemos",
  },
  residenciaParaguay: {
    metaTitle: "Residencia en Paraguay: trámite acompañado",
    metaDescription: (brand: string) =>
      `${brand} prepara tu carpeta y te acompaña en todo el trámite de residencia paraguaya, hasta que tenés tu cédula.`,
    h1: "Residencia en Paraguay",
    tagline:
      "Uno de los caminos a la residencia más accesibles del mundo, con acompañamiento de punta a punta, para inversores, nómadas digitales y familias.",
    intro:
      "La residencia paraguaya es de las más accesibles del mundo, pero el trámite tiene pasos, sellos y turnos que conviene no descubrir sobre la marcha. Preparamos la carpeta antes de que viajes y te acompañamos mientras estás acá.",
    challengeTitle: "Por qué la gente la elige",
    challengeText:
      "Paraguay se volvió un destino top para quien busca escapar de impuestos altos y regulación excesiva en otros países. Funciona con un sistema tributario territorial: el ingreso de fuente extranjera en general no paga impuesto, y el ingreso local paga tasas bajas de renta personal. La residencia —primero temporaria y, después de dos años, permanente— es además el camino formal hacia la ciudadanía y el pasaporte paraguayo, y el país tiene una ubicación estable y cómoda para moverte por la región.",
    frameworkTitle: "El trámite, paso a paso",
    framework: [
      {
        title: "Consulta y documentos",
        text: "Revisamos tu caso, te damos la lista de documentos de tu país y verificamos apostillas y traducciones antes de que viajes.",
      },
      {
        title: "Los días en Asunción",
        text: "Tu visita presencial dura de 3 a 5 días. Te acompañamos a cada turno: biometría, chequeo médico y entrevistas, con traslado privado, acompañamiento bilingüe y un recorrido de orientación por los barrios mientras estás acá.",
      },
      {
        title: "Seguimiento",
        text: "Monitoreamos el expediente ante Migraciones cada semana y resolvemos cualquier requisito o consulta administrativa adicional que surja mientras avanza.",
      },
      {
        title: "Entrega",
        text: "Retiramos tu carné de residencia temporaria y te lo enviamos por envío internacional si preferís no esperar acá, y te ayudamos a sacar tu cédula y tu RUC para operar localmente.",
      },
    ],
    specialTitle: "Servicios especializados para ciudadanos globales",
    special: [
      {
        title: "Alquiler temporal de aterrizaje",
        text: "¿Necesitás dónde quedarte mientras avanza tu trámite? Tenemos departamentos equipados listos, para que la vivienda no sea una cosa más por resolver.",
      },
      {
        title: "Asistencia para visa de inversor",
        text: "Acompañamiento especializado si aplicás bajo alguna de las categorías de inversión.",
      },
      {
        title: "Apoyo para nómadas digitales",
        text: "Asesoramiento a medida para quien trabaja en forma remota y quiere ordenar su situación fiscal global.",
      },
      {
        title: "Paquetes familiares",
        text: "Acompañamiento completo para cónyuges e hijos, para que toda la familia avance junta en el trámite.",
      },
    ],
    benefitsTitle: "Qué resolvemos",
    benefits: [
      {
        title: "Pocos días acá",
        text: "Preparamos todo por adelantado para que tu presencia en Asunción sea la mínima posible.",
      },
      {
        title: "Documentos revisados antes de viajar",
        text: "Revisamos tus apostillas y traducciones contra lo que realmente pide Migraciones, para que nada te rebote en la ventanilla.",
      },
      {
        title: "Una red legal de confianza",
        text: "Trabajamos directamente con abogados y escribanos que ya conocemos, para que tu situación quede firme ante cualquier control.",
      },
      {
        title: "Trámite bancario resuelto después",
        text: "Una vez que tenés tu cédula, te ayudamos a abrir una cuenta en un banco local.",
      },
    ],
    faq: [
      {
        q: "¿Necesito vivir en Paraguay para mantener mi residencia?",
        a: "No. Paraguay tiene requisitos de permanencia física muy flexibles, lo que la hace un plan B viable.",
      },
      {
        q: "¿Cuánto dura el trámite?",
        a: "La parte que se hace en el país toma menos de una semana. El carné definitivo (cédula) suele tardar unos meses en emitirse después de eso.",
      },
      {
        q: "¿Puedo abrir una cuenta bancaria?",
        a: "Sí. Una vez que tenés tu cédula, te ayudamos a moverte en el sistema bancario para abrir tus cuentas.",
      },
      {
        q: "¿Pago impuestos por ingresos de afuera de Paraguay?",
        a: "Paraguay funciona con un sistema tributario territorial, así que el ingreso generado fuera del país en general no paga impuesto. El ingreso local paga tasas bajas de renta personal, según el tipo de ingreso.",
      },
      {
        q: "¿Puedo pedir la residencia permanente directamente?",
        a: "Para la mayoría de las personas, no: primero se obtiene la residencia temporaria, y recién después de dos años con ese estatus se puede pedir la permanente. Quienes califican bajo alguna de las categorías de inversión pueden acceder a una vía más directa. Te decimos qué camino te conviene según tu situación.",
      },
    ],
    ctaTitle: "Empezá tu residencia",
    ctaText: "Contanos tu nacionalidad y tu situación, y te decimos qué necesitás.",
    ctaButton: "Hablemos",
  },
  invertirEnParaguay: {
    metaTitle: "Invertir en Paraguay: inmuebles y negocios",
    metaDescription: (brand: string) =>
      `${brand} acompaña tu inversión en Paraguay: búsqueda de activos, estructura legal y administración posterior, con reportes claros.`,
    h1: "Invertir en Paraguay",
    tagline:
      "Oportunidades inmobiliarias, de campo y de negocios en Paraguay, con quien las administre después.",
    intro:
      "Invertir a distancia funciona cuando hay alguien de este lado que mira la obra, controla al inquilino y manda los números a tiempo. Buscamos el activo, ordenamos la estructura y después lo administramos.",
    challengeTitle: "Por qué Paraguay",
    challengeText:
      "La economía paraguaya se apoya en disciplina fiscal: un Impuesto a la Renta Empresarial plano del 10% sobre las utilidades, un IVA general del 10% y un régimen tributario territorial que solo grava lo que se genera dentro del país, así que tu patrimonio en el resto del mundo queda intacto, sin impuesto a la herencia, al patrimonio ni a las donaciones. La distribución de dividendos tiene además su propia retención (más baja para residentes que para no residentes), así que la carga efectiva sobre lo que remitís al exterior no es igual a la que reinvertís acá. La Ley N.º 7548/2025 suma incentivos para proyectos más grandes, incluidas exenciones sobre dividendos y remesas de utilidades a partir de cierto monto de inversión. Las cifras concretas para tu caso —tasas, incentivos y rendimientos esperados— las repasamos caso por caso, porque dependen del activo, la estructura y el año.",
    frameworkTitle: "Cómo trabajamos una inversión",
    framework: [
      {
        title: "Inmuebles",
        text: "Buscamos propiedades con demanda real de alquiler y reventa en los corredores premium de Asunción, como Santa Teresa y Villa Morra.",
      },
      {
        title: "Campo y agronegocio",
        text: "Facilitamos la compra de tierra de alta fertilidad para soja, maíz, ganadería y otros agronegocios, con la asesoría local para evaluarla y administrarla.",
      },
      {
        title: "Estructura legal e impositiva",
        text: "Trabajamos con estudios jurídicos locales para que tu inversión quede bien estructurada desde el inicio, incluida la gestión de los beneficios de la Ley 7548/2025 y del Régimen de Maquila cuando el proyecto califica.",
      },
      {
        title: "Administración",
        text: "Debida diligencia, compra, puesta en marcha y reportes periódicos bilingües, para que puedas seguir tu inversión desde donde estés.",
      },
    ],
    specialTitle: "Vehículos de inversión especializados",
    special: [
      {
        title: "Inversión residencial en pozo",
        text: "Sumate a un grupo de inversores para financiar desarrollos residenciales en Asunción desde la etapa de pozo (preventa).",
      },
      {
        title: "Sociedades de engorde de ganado",
        text: "Invertí en ciclos de engorde junto a ganaderos profesionales: una inversión tangible, respaldada por el activo, con ciclos definidos.",
      },
      {
        title: "Desarrollo de parques industriales",
        text: "Participá en espacios de logística y depósito cerca del Corredor Bioceánico, a medida que crece la demanda de distribución regional.",
      },
    ],
    benefitsTitle: "Qué te damos",
    benefits: [
      {
        title: "Presencia local",
        text: "Alguien acá que mira, decide y responde, mientras vos seguís donde estás.",
      },
      {
        title: "Eficiencia fiscal",
        text: "El régimen tributario territorial de Paraguay grava solo lo que se genera dentro del país, y no hay impuesto a la herencia, al patrimonio ni a las donaciones, algo útil para planificar tu patrimonio a largo plazo.",
      },
      {
        title: "Un hub del Mercosur",
        text: "Paraguay está en el centro del continente, y la Ley de Maquila permite a las empresas que califican importar insumos sin arancel y exportar el producto terminado con un impuesto simbólico del 1%: una base para llegar a los mercados vecinos, no solo al paraguayo.",
      },
    ],
    faq: [
      {
        q: "¿Los extranjeros pueden comprar propiedades o campo en Paraguay?",
        a: "Sí. Los extranjeros tienen los mismos derechos de propiedad que los paraguayos y pueden ser dueños de inmuebles o campo a título propio, en su nombre o a través de una empresa local — con una excepción puntual: la compra de campo dentro de la franja de seguridad fronteriza está restringida para ciudadanos de países limítrofes. Fuera de esa franja, y en zonas urbanas como Asunción, no aplica ninguna restricción.",
      },
      {
        q: "¿Qué régimen tributario aplica a mi inversión?",
        a: "Paraguay grava solo lo que se genera dentro del país. Las utilidades corporativas pagan un 10% de Impuesto a la Renta Empresarial y el IVA general es del 10%; la distribución de dividendos tiene además su propia retención, más baja para residentes que para no residentes. No hay impuesto a la herencia, al patrimonio ni a las donaciones. Los proyectos más grandes también pueden acceder a los incentivos de la Ley N.º 7548/2025.",
      },
      {
        q: "¿Hay un monto mínimo para acceder a los beneficios de la Ley 7548/2025?",
        a: "Podés invertir cualquier monto. Proyectos desde unos USD 500.000 ya acceden a beneficios de base (importación de bienes de capital sin arancel, créditos fiscales), y las exenciones más importantes —la exención total sobre dividendos y sobre intereses de financiamiento externo, por 10 años— están reservadas a proyectos desde USD 13 millones.",
      },
      {
        q: "¿Puedo mover mi capital y mis utilidades libremente?",
        a: "Sí. Paraguay no tiene control de cambios, así que podés mover capital y utilidades dentro y fuera del país en dólares o euros por el sistema bancario habitual.",
      },
    ],
    ctaTitle: "Hablemos de tu inversión",
    ctaText: "Contanos qué monto y qué horizonte tenés en mente.",
    ctaButton: "Hablemos",
  },
  domicilioVirtual: {
    metaTitle: "Domicilio virtual en Asunción",
    metaDescription: (brand: string) =>
      `${brand} te da un domicilio comercial y legal en Asunción, con recepción de correspondencia y soporte para tus trámites.`,
    h1: "Domicilio virtual",
    tagline:
      "Una dirección comercial y legal en Asunción, sin la carga de alquilar una oficina.",
    intro:
      "Conseguí un domicilio comercial y legal en el distrito de negocios de Asunción, pensado para nómades digitales, empresas remotas e inversores internacionales que buscan pisar Paraguay sin alquilar una oficina física. Tu dirección funciona como base para inscribir la empresa, tramitar impuestos y recibir correspondencia del día a día, y viene con alguien que realmente abre el sobre cuando llega.",
    challengeTitle: "Para qué sirve un domicilio virtual",
    challengeText:
      "Si estás probando el mercado paraguayo, o tu operación es remota, una dirección profesional en el distrito financiero de Asunción te da credibilidad frente a bancos, organismos públicos y clientes, sin el costo, los depósitos ni el compromiso de largo plazo de un alquiler físico.",
    frameworkTitle: "Qué incluye",
    framework: [
      {
        title: "Domicilio comercial premium",
        text: "Una dirección comercial reconocida en corredores como Santa Teresa o Villa Morra, para tu web, tu papelería y tus trámites oficiales.",
      },
      {
        title: "Casilla de correspondencia digital",
        text: "Recibimos tu correspondencia oficial, paquetes y notificaciones del gobierno, los escaneamos y te los reenviamos para que gestiones todo desde donde estés.",
      },
      {
        title: "Domicilio legal y fiscal",
        text: "Una sede estable y conforme a la ley en Paraguay para inscribir tu empresa y tramitar el RUC.",
      },
      {
        title: "Salas de reunión a demanda",
        text: "Cuando venís, tenés acceso a una sala de reunión o espacio de coworking en la misma dirección registrada.",
      },
    ],
    specialTitle: "Soluciones para fundadores globales",
    special: [
      {
        title: "Paquete de constitución de empresa",
        text: "Combinamos el domicilio virtual con soporte legal para constituir tu S.A. o S.A.S. paraguaya.",
      },
      {
        title: "Recepcionista bilingüe",
        text: "Un número de teléfono local atendido a nombre de tu empresa por una recepcionista bilingüe.",
      },
      {
        title: "Reenvío de paquetes",
        text: "Envío internacional de bienes físicos o documentos que lleguen a tu dirección en Asunción.",
      },
    ],
    benefitsTitle: "Por qué conviene",
    benefits: [
      {
        title: "Entrar sin comprometerte",
        text: "Probás el mercado paraguayo con una presencia formal antes de firmar un alquiler, sin los depósitos ni las cuentas de servicios de una oficina física.",
      },
      {
        title: "Soporte para banco y residencia",
        text: "Los bancos piden una dirección física para sus controles KYC, y los trámites migratorios también necesitan una dirección estable: esto cubre las dos cosas.",
      },
      {
        title: "Credibilidad inmediata",
        text: "Una dirección reconocida en el distrito de negocios te da legitimidad frente a bancos, organismos públicos y clientes desde el primer día.",
      },
    ],
    faq: [
      {
        q: "¿Necesito una dirección física para abrir una cuenta bancaria en Paraguay?",
        a: "Sí. Los bancos en Paraguay piden una dirección física o comercial para sus controles KYC (conocé a tu cliente), y nuestras direcciones cumplen ese estándar.",
      },
      {
        q: "¿Cada cuánto me avisan si llega correspondencia?",
        a: "Tantas veces como haga falta: te avisamos apenas llega algo y seguimos tus instrucciones para escanearlo, destruirlo o reenviarlo.",
      },
      {
        q: "¿Puedo usar esta dirección durante mi trámite de residencia?",
        a: "Sí. Funciona como punto de contacto confiable para Migraciones y la Policía Nacional mientras se tramita tu residencia.",
      },
    ],
    ctaTitle: "Conseguí tu domicilio en Asunción",
    ctaText: "Contanos para qué lo necesitás y te decimos qué requiere.",
    ctaButton: "Hablemos",
  },
} as const;
