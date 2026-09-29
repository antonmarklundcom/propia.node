/**
 * Download the media of one WhatsApp message. The bytes live in the private
 * inbox bucket under a random key that is never rendered; this route is the
 * only way to them, and it asks what the page that listed the message asked
 * (the email attachment route's rule):
 * - a lead's message → `userMaySeeLead()`;
 * - an unattached chat → staff or super-admin (the business number's chats).
 *
 * Always a download (`attachment`, `nosniff`); an active type is served as
 * octet-stream so a received file never renders as a page on our origin.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isStaffOrAbove } from "@/lib/auth/roles";
import { safeFilename } from "@/lib/inbox";
import { userMaySeeLead } from "@/lib/inbox-access";
import { getPrivateObject } from "@/lib/r2";
import { getWhatsAppMedia } from "@/lib/whatsapp-inbox";

export const dynamic = "force-dynamic";

const ACTIVE_TYPES = /(html|svg|xml|javascript|ecmascript|x-sh|x-httpd)/i;

/** A file name when WhatsApp gave none: `whatsapp-image-42.jpg`. */
function fallbackName(type: string, id: number, mime: string | null): string {
  const ext = mime?.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return `whatsapp-${type}-${id}${ext ? `.${ext}` : ""}`;
}

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return notFound();
  const row = await getWhatsAppMedia(id);
  // One answer for "missing" and "not yours".
  if (!row?.mediaR2Key) return notFound();
  const allowed = row.leadId ? await userMaySeeLead(user, row.leadId) : isStaffOrAbove(user.role);
  if (!allowed) return notFound();

  const bytes = await getPrivateObject(row.mediaR2Key);
  if (!bytes) return notFound();

  const mime = row.mediaMime ?? "application/octet-stream";
  const type = ACTIVE_TYPES.test(mime) ? "application/octet-stream" : mime;
  const name = safeFilename(row.mediaFilename || fallbackName(row.type, id, row.mediaMime));
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": type,
      "content-length": String(bytes.byteLength),
      "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
