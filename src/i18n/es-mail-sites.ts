/**
 * /admin/correo (the mail-site registry) and /correo (a member's inbox).
 * Panel copy, Spanish only like the rest of the panel, in its own file so
 * parallel builds don't collide in es.ts. The thread and list wording that
 * already exists (`esInbox`) is reused, not repeated.
 *
 * Nothing here states a Cloudflare price or limit; the operator's checklist
 * names the steps, and `.claude`/docs hold the numbers.
 */
export const esMailSites = {
  tab: "Dominios de correo",
  metaTitle: "Dominios de correo",
  title: "Dominios de correo",
  intro:
    "Cada dominio recibe su correo en este panel y cada persona ve solo los buzones que le des. El Worker de Cloudflare ya sirve a cualquier dominio: acá se decide de quién es cada dirección.",
  checklistTitle: "Para sumar un dominio",
  checklist: [
    "En Cloudflare: agregá el dominio (los nameservers tienen que ser los de Cloudflare), activá Email Routing y poné el catch-all en «Send to a Worker → inbound-email».",
    "Acá: registrá el dominio con el nombre con el que sale su correo, y creá sus buzones.",
    "Solo si querés que las respuestas salgan COMO esa dirección: dá de alta el dominio en Email Sending (Cloudflare) y recién entonces marcá «Enviar como». Mientras tanto salen desde la dirección del portal con respuesta al buzón.",
  ],
  siteForm: { domain: "Dominio", name: "Nombre con el que sale el correo", submit: "Registrar dominio" },
  sending: "Enviar como su propia dirección",
  sendingOn: "Envía como el buzón",
  sendingOff: "Envía desde el portal, con respuesta al buzón",
  active: "Activo",
  inactive: "Pausado (sus miembros no lo ven)",
  pause: "Pausar",
  resume: "Reactivar",
  enableSending: "Activar «Enviar como»",
  disableSending: "Desactivar «Enviar como»",
  deleteSite: "Borrar dominio",
  mailboxForm: { local: "Buzón (antes de la @)", label: "Nota (opcional)", submit: "Crear buzón" },
  noMailboxes: "Sin buzones todavía.",
  deleteMailbox: "Borrar buzón",
  members: "Miembros",
  noMembers: "Nadie lo ve todavía.",
  memberForm: { email: "Email de un usuario existente", canReply: "Puede responder", submit: "Dar acceso" },
  canReply: "puede responder",
  readOnly: "solo lectura",
  removeMember: "Quitar",
  unassignedTitle: "Correo sin buzón",
  unassignedHint:
    "Llegó a un dominio registrado pero a una dirección que no es de nadie. Solo lo ve el superadmin. Si la dirección es real, creá su buzón.",
  unassignedEmpty: "No hay correo sin buzón.",
  adopt: "Crear buzón",
  empty: "Todavía no registraste ningún dominio.",
  flash: {
    site_created: "Dominio registrado.",
    site_updated: "Dominio actualizado.",
    site_deleted: "Dominio borrado.",
    mailbox_created: "Buzón creado.",
    mailbox_deleted: "Buzón borrado. Sus mensajes siguen guardados; los ve el superadmin.",
    member_added: "Acceso dado.",
    member_removed: "Acceso quitado.",
    invalid_domain: "Ese dominio no es válido (ejemplo: hospital.com.py).",
    invalid_name: "Escribí un nombre de al menos dos letras.",
    exists: "Eso ya existe.",
    has_mailboxes: "Borrá primero los buzones de ese dominio.",
    invalid_local: "El buzón solo puede tener letras, números y . _ + - (y no empezar con «lead-»).",
    invalid_email: "Ese email no es válido.",
    no_user: "No hay un usuario con ese email. Tiene que registrarse primero: acá no se crean cuentas.",
    not_found: "No lo encontramos.",
    invalid: "Datos inválidos.",
  } as Record<string, string>,
  historyAction: {
    "mail.change": "Cambió dominios, buzones o accesos de correo",
  } as Record<string, string>,
  targetLabel: { mail: "Correo" } as Record<string, string>,
  // /correo — a member's own inbox
  member: {
    tab: "Correo",
    metaTitle: "Mi correo",
    title: "Mi correo",
    hint: (mailboxes: string) => `Lo que llega a: ${mailboxes}.`,
    none: "Todavía no tenés buzones asignados. Cuando te den acceso a uno, aparece acá.",
    readOnlyNote: "Tenés acceso de solo lectura a este buzón.",
    replyFrom: (mailbox: string, sender: string, asItself: boolean) =>
      asItself ? `Se envía como ${mailbox}.` : `Se envía desde ${sender}, con respuesta a ${mailbox}.`,
  },
} as const;
