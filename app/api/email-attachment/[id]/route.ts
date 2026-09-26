/**
 * Download one email attachment (waves E2 + E3). The bytes live in R2 under a
 * random key that is never rendered; this route is the only way to them, and
 * it asks exactly what the page that listed the attachment asked:
 * - a lead thread's file → `userMaySeeLead()` (the lead pages' own predicates);
 * - an inbox file → staff or super-admin, and staff only for shared mailboxes.
 *
 * Always a download (`Content-Disposition: attachment`, `nosniff`), and an
 * active type (HTML, SVG, XML, JS) is served as octet-stream: a received file
 * must never render as a page on our origin.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isStaffOrAbove, isSuperAdmin } from "@/lib/auth/roles";
import { getAttachment, safeFilename, viewerMayReadMailbox } from "@/lib/inbox";
import { userMaySeeLead } from "@/lib/inbox-access";
import { getPrivateObject } from "@/lib/r2";

export const dynamic = "force-dynamic";

const ACTIVE_TYPES = /(html|svg|xml|javascript|ecmascript|x-sh|x-httpd)/i;

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return notFound();
  const att = await getAttachment(id);
  // One answer for "missing" and "not yours": the id space is not a probe.
  if (!att?.r2Key) return notFound();

  const allowed = att.leadId
    ? await userMaySeeLead(user, att.leadId)
    : isStaffOrAbove(user.role) &&
      viewerMayReadMailbox({ userId: user.id, superAdmin: isSuperAdmin(user.role) }, att.mailbox);
  if (!allowed) return notFound();

  const bytes = await getPrivateObject(att.r2Key);
  if (!bytes) return notFound();

  const type = ACTIVE_TYPES.test(att.contentType) ? "application/octet-stream" : att.contentType;
  const name = safeFilename(att.filename);
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
