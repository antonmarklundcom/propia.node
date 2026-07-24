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
  logout: "Salir",

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
  agencyNoLink:
    "Tu usuario todavía no está vinculado a una inmobiliaria. Escribinos para activarlo.",
  statusLabel: "Estado",
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
