/**
 * Canonical voseo strings (ARCHITECTURE.md §3.6) — the i18n es base.
 * All local-facing copy is Paraguayan voseo. NEVER generate
 * neutral-Spanish variants of these.
 */
import { BRAND_NAME } from "@/lib/brand";

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

/** Valuation tool (/tasacion) — the seller-side magnet. Honest by design. */
export const esTasacion = {
  title: "¿Cuánto vale tu propiedad?",
  subtitle:
    `Te damos un rango estimado en base a los precios publicados en ${BRAND_NAME}. Gratis, sin registrarte y sin que te llame nadie salvo que vos lo pidas.`,
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
  indexSubtitle:
    `Precio mediano por ciudad, calculado con los avisos publicados en ${BRAND_NAME}. Elegí una ciudad para ver el detalle por tipo de propiedad.`,
  indexEmpty:
    "Todavía no tenemos suficientes avisos publicados para calcular precios confiables.",
  cityTitle: (city: string) => `Precios de propiedades en ${city}`,
  citySubtitle: (city: string, period: string) =>
    `Precio mediano de venta y alquiler en ${city}, según los avisos publicados en ${BRAND_NAME}${period ? ` (${period})` : ""}.`,
  tableType: "Tipo",
  tableOperation: "Operación",
  tableMedian: "Precio mediano",
  tableMedianM2: "Por m²",
  tableSample: "Avisos",
  seeListings: "Ver avisos",
  fewSamples: "Pocos avisos — tomalo como referencia, no como precio de mercado.",
  methodTitle: "Cómo calculamos esto",
  methodBody:
    `Usamos la mediana (no el promedio) de los precios publicados en ${BRAND_NAME}, por ciudad y tipo de propiedad. La mediana aguanta mejor los avisos con precios extremos. Un grupo con menos de 8 avisos se muestra con aviso: es una referencia, no un precio de mercado. Los precios publicados no son precios de cierre.`,
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
  profileVerifiedNote: `Perfil verificado por ${BRAND_NAME}.`,
  profilePendingNote: "Verificación pendiente de aprobación.",

  // Admin
  adminReviewTitle: "Cola de revisión",
  adminReviewEmpty: "No hay avisos esperando revisión. 🎉",
  approve: "Aprobar",
  reject: "Rechazar",
  rejectReasonLabel: "Motivo del rechazo",
  rejectReasonPlaceholder: "Contale al publicador por qué (ej: fotos con marca de agua)",
  adminAgenciesTitle: "Inmobiliarias y agentes",
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
  photosRejected: "Algunas fotos no se pudieron subir.",
  photosNotConfigured:
    "El almacenamiento de fotos todavía no está configurado (faltan las claves de R2). Avisale al administrador.",
  photosPlaceholderNote:
    "Foto de muestra del importador — reemplazala por fotos reales de la propiedad.",

  // Agency
  agencyListingsTitle: "Tus propiedades",
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
  importLocationLabel: "Ubicación (confirmá o corregí)",
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
export function inquiryPrefillFor(title: string, url: string): string {
  return `Hola, vi esta propiedad en ${BRAND_NAME} y me interesa: ${title}\n${url}`;
}
