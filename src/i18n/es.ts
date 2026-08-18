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
  // Read-only status rows (audit F25): the status <select> used to pre-set
  // "Borrador" on a row en revisión, so one save silently cancelled the review.
  statusPendingNote:
    "En revisión: lo publicamos nosotros apenas lo aprobemos. No hace falta hacer nada.",
  statusRejectedNote: "No aprobado. Corregilo desde «Editar» y reenvialo.",
  statusRejectedReason: "Motivo",
} as const;

/** Voseo strings for the publish wizard (ARCHITECTURE.md §3, M5). */
export const esPublish = {
  pageTitle: "Publicá tu propiedad",
  pageSubtitle:
    "Cargala en tres pasos. Guardamos tu avance automáticamente, así podés terminar cuando quieras.",

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
