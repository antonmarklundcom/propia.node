/**
 * Verify the panel's ownership guards against a real database.
 *
 * These are the riskiest invariants in the app: every panel read and write is
 * scoped by a WHERE clause (`listingScopeWhere`), and if one of them ever loses
 * its guard, one agency edits another's listings and nothing visibly breaks.
 * Types cannot catch that — only exercising it can.
 *
 * Refuses to run against anything but a local database: it creates and deletes
 * users, agencies and listings, which must never happen in production.
 *
 *   docker compose up -d
 *   npm run db:migrate
 *   DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" npm run verify:scopes
 *
 * Cleans up the rows it created, so it is safe to re-run.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  agencies,
  agents,
  leadAssignments,
  leads,
  leadMatches,
  listings,
  locations,
  sessions,
  users,
} from "../src/db/schema";
import { registerAccount } from "../src/lib/registration";
import {
  getAgencyProfile,
  getOwnAgentProfile,
  updateAgencyProfile,
  updateOwnAccount,
  updateOwnAgentProfile,
} from "../src/lib/profile-queries";
import {
  listAllLeads,
  getPanelLeads,
  getPanelListings,
  setPanelListingStatus,
} from "../src/lib/panel-queries";
import { getEditableListing, updateListing } from "../src/lib/listing-edit";
import { isStaff, isStaffOrAbove, isSuperAdmin, isAgencyRole } from "../src/lib/auth/roles";
import { proposeMatches, markMatchSent } from "../src/lib/matching";
import {
  getSharedLeads,
  revokeShare,
  setShareState,
  shareLeads,
} from "../src/lib/lead-assignments";
import { verifyPassword } from "../src/lib/auth/password";
import {
  getEditableAgent,
  listEditableAgents,
  updateAgentProfile,
  type AgentEditor,
  type AgentProfileEdit,
} from "../src/lib/agent-profile-edit";
import {
  adminLeadRows,
  adminLeadsCsv,
  panelLeadSet,
  panelLeadsCsv,
  panelShowsOwnLeads,
  parseAdminLeadFilter,
} from "../src/lib/lead-export";
import { toCsv } from "../src/lib/csv";
import { getAgentNumbers } from "../src/lib/team-stats";

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1|mysql)[:/]/.test(url)) {
  console.error(
    "Refusing to run: DATABASE_URL must point at a local database " +
      "(this script creates and deletes users, agencies and listings).",
  );
  process.exit(1);
}

let failures = 0;
function check(label: string, condition: boolean, detail = ""): void {
  if (!condition) failures += 1;
  console.log(
    `${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`,
  );
}

/** Unique per run so a re-run never collides with leftovers. */
const stamp = Date.now();
const mail = (who: string) => `verify-${who}-${stamp}@example.test`;

async function main() {
  // Listings need a real location FK; seed one with npm run seed:locations.
  const [anyLocation] = await db
    .select({ id: locations.id })
    .from(locations)
    .limit(1);
  if (!anyLocation) {
    console.error("No locations row — run `npm run seed:locations` first.");
    process.exit(1);
  }
  const locationId = anyLocation.id;

  const createdUserIds: number[] = [];
  const createdAgencyIds: number[] = [];
  const createdListingIds: number[] = [];
  const createdLeadIds: number[] = [];

  try {
    /* ---------------------------------------------------------------- */
    /* Sign-up creates a login, not trust                               */
    /* ---------------------------------------------------------------- */
    const agencyOwner = await registerAccount({
      kind: "agency",
      name: "Verify Agency Owner",
      email: mail("agency"),
      password: "secreto123",
      whatsapp: null,
      agencyName: `Verify Inmobiliaria ${stamp}`,
    });
    check("agency signup succeeds", agencyOwner.ok);
    if (!agencyOwner.ok) return;
    createdUserIds.push(agencyOwner.userId);

    const [ownerUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, agencyOwner.userId));
    check("agency owner gets agency_admin", ownerUser.role === "agency_admin");
    check(
      "password is stored hashed",
      !!ownerUser.passwordHash && !ownerUser.passwordHash.includes("secreto123"),
    );
    check(
      "password verifies",
      await verifyPassword("secreto123", ownerUser.passwordHash),
    );

    const [agentRow] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agencyOwner.userId));
    check("agents row links user to agency", agentRow?.agencyId != null);
    check("agent starts unverified", agentRow.isVerified === false);
    const agencyId = agentRow.agencyId!;
    createdAgencyIds.push(agencyId);

    const agencyRow = await getAgencyProfile(agencyId);
    check("agency starts unverified", agencyRow?.isVerified === false);

    const independent = await registerAccount({
      kind: "independent",
      name: "Verify Independent",
      email: mail("independent"),
      password: "secreto123",
      whatsapp: null,
      agencyName: null,
    });
    check("independent signup succeeds", independent.ok);
    if (!independent.ok) return;
    createdUserIds.push(independent.userId);

    const [indepUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, independent.userId));
    const [indepAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, independent.userId));
    check("independent gets the agent role", indepUser.role === "agent");
    check("independent has no agency", indepAgent.agencyId === null);

    const dup = await registerAccount({
      kind: "independent",
      name: "Duplicate",
      email: ownerUser.email!,
      password: "secreto123",
      whatsapp: null,
      agencyName: null,
    });
    check("duplicate email refused", !dup.ok && dup.error === "email_taken");

    const weak = await registerAccount({
      kind: "independent",
      name: "Weak",
      email: mail("weak"),
      password: "corto",
      whatsapp: null,
      agencyName: null,
    });
    check("short password refused", !weak.ok && weak.error === "password");

    /* ---------------------------------------------------------------- */
    /* Scope isolation — the invariant that actually matters            */
    /* ---------------------------------------------------------------- */
    const base = {
      operation: "venta" as const,
      propertyType: "casa" as const,
      priceCurrency: "USD" as const,
      locationId,
      status: "published" as const,
    };
    await db.insert(listings).values([
      {
        ...base,
        publicId: `vfy${String(stamp).slice(-7)}`,
        slug: `verify-agency-${stamp}`,
        title: "Verify agency listing",
        priceAmount: "100000",
        priceUsd: "100000",
        agencyId,
        /**
         * Must start as a DRAFT, and this is not cosmetic. maySetStatus()
         * always lets a row keep the status it already has, so if this
         * fixture inherited `base`'s `published` the F1 assertion below
         * ("agency cannot publish its own listing") would be published ->
         * published — permitted, and testing nothing. A draft is the state
         * the review queue actually exists to gate.
         */
        status: "draft" as const,
      },
      {
        ...base,
        publicId: `vfx${String(stamp).slice(-7)}`,
        slug: `verify-owner-${stamp}`,
        title: "Verify independent listing",
        priceAmount: "90000",
        priceUsd: "90000",
        ownerUserId: independent.userId,
      },
    ]);

    const agencyScope = { kind: "agency", agencyId } as const;
    const ownerScope = { kind: "owner", userId: independent.userId } as const;

    const agencyRows = await getPanelListings(agencyScope);
    const ownerRows = await getPanelListings(ownerScope);
    createdListingIds.push(...agencyRows.map((r) => r.id), ...ownerRows.map((r) => r.id));

    check(
      "agency dashboard shows only its own listing",
      agencyRows.length === 1 && agencyRows[0].title === "Verify agency listing",
    );
    check(
      "independent dashboard shows only their own listing",
      ownerRows.length === 1 &&
        ownerRows[0].title === "Verify independent listing",
    );

    const crossStatus = await setPanelListingStatus({
      listingId: ownerRows[0].id,
      scope: agencyScope,
      status: "paused",
    });
    check(
      "agency cannot change the independent's listing status",
      crossStatus === 0,
      `rows affected: ${crossStatus}`,
    );

    const ownStatus = await setPanelListingStatus({
      listingId: ownerRows[0].id,
      scope: ownerScope,
      status: "paused",
    });
    check("independent can change their own", ownStatus === 1);

    /* ---------------------------------------------------------------- */
    /* Review queue is not optional (audit F1)                          */
    /* ---------------------------------------------------------------- */
    const selfPublish = await setPanelListingStatus({
      listingId: agencyRows[0].id,
      scope: agencyScope,
      status: "published",
    });
    check(
      "agency cannot publish its own listing",
      selfPublish === 0,
      `rows affected: ${selfPublish}`,
    );

    const submit = await setPanelListingStatus({
      listingId: agencyRows[0].id,
      scope: agencyScope,
      status: "pending_review",
    });
    check("agency can submit its own listing for review", submit === 1);

    const adminPublish = await setPanelListingStatus({
      listingId: agencyRows[0].id,
      scope: { kind: "admin" },
      status: "published",
    });
    check("admin can publish it", adminPublish === 1);

    /**
     * The regression this fix could plausibly cause: an agency saving a typo
     * fix on a PUBLISHED listing. `published` is not a status they may move
     * to, so without maySetStatus()'s keep-current allowance the save would be
     * rejected outright or would quietly unpublish the row.
     *
     * Asserted through updateListing (the real edit path) rather than a
     * same-status setPanelListingStatus call, because an UPDATE that changes
     * nothing reports 0 affected rows and would prove nothing either way.
     */
    const editPublished = await updateListing({
      id: agencyRows[0].id,
      scope: agencyScope,
      input: {
        title: "Verify agency listing (edited)",
        descriptionEs: null,
        operation: "venta",
        propertyType: "casa",
        priceAmount: 100000,
        priceCurrency: "USD",
        bedrooms: null,
        bathrooms: null,
        parking: null,
        areaM2: null,
        landM2: null,
        locationId,
        videoUrl: null,
        foreignExposure: true,
        status: "published",
      },
    });
    check("agency can edit a published listing without unpublishing it", editPublished === 1);

    const [afterEdit] = await db
      .select({ status: listings.status })
      .from(listings)
      .where(eq(listings.id, agencyRows[0].id))
      .limit(1);
    check("...and it is still published", afterEdit?.status === "published");

    check(
      "agency cannot load the independent's listing for editing",
      (await getEditableListing(ownerRows[0].id, agencyScope)) === null,
    );
    check(
      "admin scope can load any listing",
      (await getEditableListing(ownerRows[0].id, { kind: "admin" })) !== null,
    );

    /* ---------------------------------------------------------------- */
    /* FSBO owner inbox — the `owner` lead lane (PLAN.md D8)            */
    /* ---------------------------------------------------------------- */
    /**
     * Before the lane existed, a lead on a self-published listing was written
     * as `internal` — the same lane as valuation and seller leads — so the
     * person waiting for it could not be shown it without also showing them
     * the founder's inbox. These assert both halves: the owner sees their own
     * `owner` lead, and `internal` still belongs to nobody's panel.
     */
    await db.insert(leads).values([
      {
        leadType: "buyer",
        vertical: "verify",
        listingId: ownerRows[0].id,
        whatsapp: `0983${String(stamp).slice(-6)}`,
        name: "Verify buyer lead",
        routedTo: "owner",
      },
      {
        leadType: "valuation",
        vertical: "verify",
        listingId: ownerRows[0].id,
        whatsapp: `0984${String(stamp).slice(-6)}`,
        name: "Verify internal lead",
        routedTo: "internal",
      },
    ]);

    await db.insert(leads).values(
      (["agency", "agent", "developer"] as const).map((routedTo) => ({
        leadType: "seller" as const,
        vertical: "verify",
        listingId: ownerRows[0].id,
        whatsapp: "0985000000",
        name: `Verify ${routedTo} lead ${stamp}`,
        routedTo,
      })),
    );
    const fixtureLeads = await db.select().from(leads)
      .where(eq(leads.listingId, ownerRows[0].id));
    await db.update(agents).set({ isVerified: true }).where(eq(agents.id, indepAgent.id));
    for (const lead of fixtureLeads) {
      const created = await proposeMatches(lead.id, [indepAgent.id], isStaff("staff"));
      check(`staff proposal scope: ${lead.routedTo}`, created === (lead.routedTo === "internal" ? 1 : 0));
      // Admin can still propose every lane; staff must not mark those as sent.
      if (lead.routedTo !== "internal") {
        check(`admin proposal unchanged: ${lead.routedTo}`, await proposeMatches(lead.id, [indepAgent.id]) === 1);
      }
      const [match] = await db.select().from(leadMatches).where(eq(leadMatches.leadId, lead.id));
      if (!match) { check("proposal fixture exists", false); continue; }
      await markMatchSent(match.id, isStaff("staff"));
      const [after] = await db.select().from(leadMatches).where(eq(leadMatches.id, match.id));
      check(`staff hand-off scope: ${lead.routedTo}`, after.status === (lead.routedTo === "internal" ? "sent" : "proposed"));
    }

    const staffInbox = await listAllLeads({ internalOnly: isStaff("staff"), q: "Verify" });
    check("staff can read internal leads", staffInbox.some((l) => l.name === "Verify internal lead"));
    check("staff cannot read non-internal leads", staffInbox.every((l) => l.routedTo === "internal"));
    check("staff passes the staff role gate", isStaffOrAbove("staff"));
    check("staff fails the super-admin and agency role gates", !isSuperAdmin("staff") && !isAgencyRole("staff"));

    const ownerInbox = await getPanelLeads(ownerScope);
    check(
      "owner sees the lead routed to them",
      ownerInbox.some((l) => l.name === "Verify buyer lead"),
      `${ownerInbox.length} lead(s) in the owner inbox`,
    );
    check(
      "an internal lead stays out of the owner's inbox",
      !ownerInbox.some((l) => l.name === "Verify internal lead"),
    );
    check(
      "the agency cannot see the owner's leads",
      (await getPanelLeads(agencyScope)).every(
        (l) => l.name !== "Verify buyer lead",
      ),
    );

    /* ---------------------------------------------------------------- */
    /* Shared leads — lead_assignments (plan-lead-access §3)            */
    /* ---------------------------------------------------------------- */
    /**
     * A shared lead is the one way a listing-less lead reaches a partner's
     * panel, so these pin who sees it and who can answer it: the target and
     * nobody else, not after revocation, and never a lane staff cannot see.
     */
    const otherOwner = await registerAccount({
      kind: "agency",
      name: "Verify Other Agency",
      email: mail("other-agency"),
      password: "secreto123",
      whatsapp: null,
      agencyName: `Verify Otra ${stamp}`,
    });
    check("second agency signup succeeds", otherOwner.ok);
    if (!otherOwner.ok) return;
    createdUserIds.push(otherOwner.userId);
    const [otherAgentRow] = await db.select().from(agents).where(eq(agents.userId, otherOwner.userId));
    const otherAgencyId = otherAgentRow.agencyId!;
    createdAgencyIds.push(otherAgencyId);

    await db.update(agencies).set({ isVerified: true }).where(eq(agencies.id, agencyId));
    await db.update(agents).set({ isVerified: true }).where(eq(agents.id, indepAgent.id));

    const [internalRes] = await db.insert(leads).values({
      leadType: "question",
      vertical: "verify",
      whatsapp: "0986000001",
      name: `Verify shared internal ${stamp}`,
      routedTo: "internal",
    });
    const [agencyLaneRes] = await db.insert(leads).values({
      leadType: "seller",
      vertical: "verify",
      whatsapp: "0986000002",
      name: `Verify shared agency lane ${stamp}`,
      routedTo: "agency",
    });
    const sharedLeadId = Number((internalRes as unknown as { insertId: number }).insertId);
    const agencyLaneLeadId = Number((agencyLaneRes as unknown as { insertId: number }).insertId);
    createdLeadIds.push(sharedLeadId, agencyLaneLeadId);

    const staffShared = await shareLeads({
      leadIds: [sharedLeadId, agencyLaneLeadId],
      target: { kind: "agency", id: agencyId },
      note: "Verify note",
      byUserId: agencyOwner.userId,
      internalOnly: isStaff("staff"),
    });
    check(
      "staff shares an internal lead but not an agency-lane one",
      staffShared.length === 1 && staffShared[0] === sharedLeadId,
      JSON.stringify(staffShared),
    );
    check(
      "an unverified agency cannot receive a share",
      (await shareLeads({
        leadIds: [sharedLeadId],
        target: { kind: "agency", id: otherAgencyId },
        note: null,
        byUserId: agencyOwner.userId,
        internalOnly: false,
      })).length === 0,
    );

    const viewerA = { agencyId, userId: agencyOwner.userId };
    const viewerB = { agencyId: otherAgencyId, userId: otherOwner.userId };
    const viewerIndep = { agencyId: null, userId: independent.userId };
    const seenByA = await getSharedLeads(viewerA);
    check("the target agency sees the shared lead", seenByA.some((l) => l.id === sharedLeadId));
    check("the share carries the operator's note", seenByA.find((l) => l.id === sharedLeadId)?.shareNote === "Verify note");
    check("another agency does not see it", (await getSharedLeads(viewerB)).every((l) => l.id !== sharedLeadId));
    check("an independent agent does not see an agency share", (await getSharedLeads(viewerIndep)).every((l) => l.id !== sharedLeadId));

    const shareA = seenByA.find((l) => l.id === sharedLeadId)!;
    check(
      "another agency cannot answer the share",
      (await setShareState({ assignmentId: shareA.assignmentId, state: "accepted", viewer: viewerB })) === 0,
    );
    check(
      "the target agency can answer it",
      (await setShareState({ assignmentId: shareA.assignmentId, state: "accepted", viewer: viewerA })) === 1,
    );
    check(
      "a share cannot be set back to pending by the realtor",
      (await setShareState({ assignmentId: shareA.assignmentId, state: "pending", viewer: viewerA })) === 0,
    );

    await shareLeads({
      leadIds: [sharedLeadId],
      target: { kind: "agent", id: indepAgent.id },
      note: null,
      byUserId: agencyOwner.userId,
      internalOnly: false,
    });
    check("an agent-targeted share reaches that agent", (await getSharedLeads(viewerIndep)).some((l) => l.id === sharedLeadId));

    check("revoking returns the lead id", (await revokeShare({ assignmentId: shareA.assignmentId, internalOnly: false })) === sharedLeadId);
    check("a revoked share disappears from the panel", (await getSharedLeads(viewerA)).every((l) => l.id !== sharedLeadId));
    check(
      "a revoked share cannot be answered",
      (await setShareState({ assignmentId: shareA.assignmentId, state: "contacted", viewer: viewerA })) === 0,
    );
    await shareLeads({
      leadIds: [sharedLeadId],
      target: { kind: "agency", id: agencyId },
      note: null,
      byUserId: agencyOwner.userId,
      internalOnly: false,
    });
    const [reshared] = await db.select().from(leadAssignments).where(eq(leadAssignments.id, shareA.assignmentId));
    check(
      "re-sharing a revoked lead restores it as pending, same row",
      reshared.revokedAt === null && reshared.state === "pending" && reshared.stateAt === null,
      `${reshared.state} ${String(reshared.revokedAt)}`,
    );

    /* ---------------------------------------------------------------- */
    /* Lead exports and per-agent numbers (build A1)                    */
    /* ---------------------------------------------------------------- */
    /**
     * The CSV must hold exactly what the panel shows: the same two reads
     * under the same scope, never another agency's row, and for staff never a
     * lane outside `internal`.
     */
    const setA = await panelLeadSet({ scope: agencyScope, viewer: viewerA, showOwn: true });
    const pageOwnA = await getPanelLeads(agencyScope);
    const pageSharedA = await getSharedLeads(viewerA);
    const ids = (rows: { id: number }[]) => rows.map((r) => r.id).join(",");
    check("export (own) = the page's own inbox", ids(setA.own) === ids(pageOwnA), `${setA.own.length} row(s)`);
    check("export (shared) = the page's shared list", ids(setA.shared) === ids(pageSharedA), `${setA.shared.length} row(s)`);
    check("export carries the lead shared with the agency", setA.shared.some((l) => l.id === sharedLeadId));
    const setB = await panelLeadSet({
      scope: { kind: "agency", agencyId: otherAgencyId },
      viewer: viewerB,
      showOwn: true,
    });
    check("another agency's export lacks the share", setB.shared.every((l) => l.id !== sharedLeadId));
    check(
      "another agency's export lacks the agency's own leads",
      setB.own.every((l) => !pageOwnA.some((a) => a.id === l.id)),
    );
    const setOwner = await panelLeadSet({ scope: ownerScope, viewer: viewerIndep, showOwn: true });
    check(
      "the independent's export has their owner-lane lead and no internal one",
      setOwner.own.some((l) => l.name === "Verify buyer lead") &&
        !setOwner.own.some((l) => l.name === "Verify internal lead"),
    );
    check(
      "an agency_admin with no agency exports no own inbox",
      !panelShowsOwnLeads({ agencyId: null, user: { role: "agency_admin" } }) &&
        panelShowsOwnLeads({ agencyId: null, user: { role: "agent" } }),
    );
    const csvA = panelLeadsCsv(setA, "http://localhost:3000");
    check("panel CSV starts with a UTF-8 BOM", csvA.startsWith("\uFEFF"));
    check("panel CSV holds the shared lead", csvA.includes(`Verify shared internal ${stamp}`));
    check("panel CSV has one line per row plus the header", csvA.trimEnd().split("\r\n").length === 1 + setA.own.length + setA.shared.length);

    const staffRows = await adminLeadRows(parseAdminLeadFilter({ q: `Verify shared` }, []), isStaff("staff"));
    check("staff export: internal lane only", staffRows.length > 0 && staffRows.every((l) => l.routedTo === "internal"));
    check("staff export lacks the agency-lane lead", staffRows.every((l) => l.id !== agencyLaneLeadId));
    const adminRows = await adminLeadRows(parseAdminLeadFilter({ q: `Verify shared` }, []), false);
    check("admin export includes the agency-lane lead", adminRows.some((l) => l.id === agencyLaneLeadId));
    const telRows = await adminLeadRows(parseAdminLeadFilter({ tel: "986000002" }, []), false);
    check("admin export honours the same-number filter", telRows.length > 0 && telRows.every((l) => l.whatsapp.endsWith("986000002")));
    check(
      "admin export ignores a site that no lead carries",
      parseAdminLeadFilter({ sitio: "nope" }, ["verify"]).vertical === undefined &&
        parseAdminLeadFilter({ sitio: "verify" }, ["verify"]).vertical === "verify",
    );
    check("admin CSV starts with a UTF-8 BOM", adminLeadsCsv(adminRows, "http://localhost:3000").startsWith("\uFEFF"));
    const injected = toCsv(["a", "b", "c"], [["=HYPERLINK(\"x\")", "+595 981 000 001", "-1+cmd"]]);
    check(
      "CSV neutralises formulas but keeps phone numbers",
      injected.includes(`"'=HYPERLINK(""x"")"`) && injected.includes(",+595 981 000 001,") && injected.includes("'-1+cmd"),
      JSON.stringify(injected),
    );

    // Per-agent numbers: one agent-owned published listing with a recent
    // lead, and one answered share, all inside agency A.
    await db.update(agents).set({ isVerified: true }).where(eq(agents.id, agentRow.id));
    const [teamListingRes] = await db.insert(listings).values({
      ...base,
      publicId: `vft${String(stamp).slice(-7)}`,
      slug: `verify-team-${stamp}`,
      title: "Verify team listing",
      priceAmount: "80000",
      priceUsd: "80000",
      agencyId,
      agentId: agentRow.id,
    });
    const teamListingId = Number((teamListingRes as unknown as { insertId: number }).insertId);
    createdListingIds.push(teamListingId);
    await db.insert(leads).values({
      leadType: "buyer",
      vertical: "verify",
      listingId: teamListingId,
      whatsapp: "0986000003",
      name: "Verify team lead",
      routedTo: "agency",
    });
    const ownAfter = (await panelLeadSet({ scope: agencyScope, viewer: viewerA, showOwn: true })).own;
    check(
      "the agency's export gains the new lead, exactly as its page does",
      ownAfter.some((l) => l.name === "Verify team lead") &&
        ids(ownAfter) === ids(await getPanelLeads(agencyScope)),
    );
    check(
      "another agency's export does not",
      (await panelLeadSet({ scope: { kind: "agency", agencyId: otherAgencyId }, viewer: viewerB, showOwn: true }))
        .own.every((l) => l.name !== "Verify team lead"),
    );
    await shareLeads({
      leadIds: [sharedLeadId],
      target: { kind: "agent", id: agentRow.id },
      note: null,
      byUserId: agencyOwner.userId,
      internalOnly: false,
    });
    const agentShare = (await getSharedLeads(viewerA)).find(
      (l) => l.id === sharedLeadId && l.assignmentId !== shareA.assignmentId,
    );
    check("an agent-of-the-agency share reaches the agency panel", Boolean(agentShare));
    if (agentShare) {
      await setShareState({ assignmentId: agentShare.assignmentId, state: "contacted", viewer: viewerA });
    }
    const numbersA = await getAgentNumbers(agencyId);
    const mine = numbersA.find((n) => n.agentId === agentRow.id);
    check(
      "team numbers count the agent's listing, lead and answer",
      mine?.published === 1 && mine.leads === 1 && mine.sharedAnswered === 1 && mine.medianHours != null,
      JSON.stringify(mine),
    );
    check(
      "team numbers stay inside the agency",
      numbersA.every((n) => n.agentId !== otherAgentRow.id && n.agentId !== indepAgent.id),
    );
    check(
      "another agency's numbers never list this agency's agent",
      (await getAgentNumbers(otherAgencyId)).every((n) => n.agentId !== agentRow.id),
    );

    /* ---------------------------------------------------------------- */
    /* Profile editing                                                  */
    /* ---------------------------------------------------------------- */
    const slugBefore = agencyRow!.slug;
    await updateAgencyProfile(agencyId, {
      name: "Verify Renamed",
      logoUrl: "https://example.test/logo.png",
      whatsapp: "0981000000",
      email: "hola@example.test",
    });
    const renamed = await getAgencyProfile(agencyId);
    check("agency rename applies", renamed?.name === "Verify Renamed");
    check(
      "agency slug is never rewritten on rename",
      renamed?.slug === slugBefore,
      `${slugBefore} -> ${renamed?.slug}`,
    );

    await updateAgencyProfile(agencyId, {
      name: "Verify Renamed",
      logoUrl: "",
      whatsapp: "",
      email: "",
    });
    check(
      "cleared field becomes NULL",
      (await getAgencyProfile(agencyId))?.logoUrl === null,
    );
    check(
      "empty agency name refused",
      (await updateAgencyProfile(agencyId, {
        name: " ",
        logoUrl: "",
        whatsapp: "",
        email: "",
      })) === false,
    );

    await updateOwnAgentProfile(independent.userId, {
      name: "Verify Independent Renamed",
      photoUrl: "https://example.test/a.jpg",
      whatsapp: "0982000000",
    });
    check(
      "own agent profile updates",
      (await getOwnAgentProfile(independent.userId))?.name ===
        "Verify Independent Renamed",
    );
    check(
      "another user's agent profile is untouched",
      (await getOwnAgentProfile(agencyOwner.userId))?.name ===
        "Verify Agency Owner",
    );

    /* ---------------------------------------------------------------- */
    /* Agent profile editing — who may write which agents row (A4)      */
    /* ---------------------------------------------------------------- */
    /**
     * `agentEditWhere()` is the whole boundary: an agent edits only their own
     * row, an agency admin also their own agency's agents, nobody else's. A
     * colleague joins the first agency the way an accepted invite leaves them:
     * an agents row with that agency_id and the `agent` role.
     */
    const colleague = await registerAccount({
      kind: "independent",
      name: "Verify Colleague",
      email: mail("colleague"),
      password: "secreto123",
      whatsapp: null,
      agencyName: null,
    });
    check("colleague signup succeeds", colleague.ok);
    if (!colleague.ok) return;
    createdUserIds.push(colleague.userId);
    await db.update(agents).set({ agencyId }).where(eq(agents.userId, colleague.userId));
    const [colleagueAgent] = await db.select().from(agents).where(eq(agents.userId, colleague.userId));
    const [ownerAgent] = await db.select().from(agents).where(eq(agents.userId, agencyOwner.userId));

    const [city] = await db
      .select({ slug: locations.slug })
      .from(locations)
      .where(eq(locations.level, "ciudad"))
      .limit(1);
    const citySlug = city?.slug ?? "";

    const adminEd: AgentEditor = { userId: agencyOwner.userId, role: "agency_admin", agencyId };
    const colleagueEd: AgentEditor = { userId: colleague.userId, role: "agent", agencyId };
    const indepEd: AgentEditor = { userId: independent.userId, role: "agent", agencyId: null };
    const otherAdminEd: AgentEditor = { userId: otherOwner.userId, role: "agency_admin", agencyId: otherAgencyId };
    // An agency_admin with no agency (a company account later unlinked).
    const looseAdminEd: AgentEditor = { userId: independent.userId, role: "agency_admin", agencyId: null };

    const edit = (over: Partial<AgentProfileEdit>): AgentProfileEdit => ({
      name: "Verify Profile",
      whatsapp: "",
      photoUrl: "",
      bio: "",
      licenseNo: "",
      yearsActive: "",
      zones: [],
      ...over,
    });
    const nameOf = async (agentId: number) =>
      (await db.select({ name: agents.name }).from(agents).where(eq(agents.id, agentId)))[0]?.name;

    const ownSave = await updateAgentProfile(colleagueEd, colleagueAgent.id, edit({
      name: "Verify Colleague Edited",
      bio: "Vendo casas en Asunción.",
      licenseNo: "MAT-123",
      yearsActive: "7",
      zones: [citySlug, "no-es-una-ciudad", citySlug],
    }));
    const [colleagueAfter] = await db.select().from(agents).where(eq(agents.id, colleagueAgent.id));
    check("agent edits their own profile", ownSave.ok && colleagueAfter.name === "Verify Colleague Edited");
    check(
      "bio, licence and years are stored",
      colleagueAfter.bio === "Vendo casas en Asunción." &&
        colleagueAfter.licenseNo === "MAT-123" &&
        colleagueAfter.yearsActive === 7,
    );
    const storedZones = (await getEditableAgent(colleagueEd, colleagueAgent.id))?.zones ?? [];
    check(
      "zones keep real ciudad slugs only, deduplicated",
      citySlug !== "" && storedZones.length === 1 && storedZones[0] === citySlug,
      JSON.stringify(storedZones),
    );

    check(
      "agent cannot edit their agency admin's profile",
      !(await updateAgentProfile(colleagueEd, ownerAgent.id, edit({ name: "Hijacked" }))).ok &&
        (await nameOf(ownerAgent.id)) !== "Hijacked",
    );
    check(
      "agent cannot read a colleague's profile for editing",
      (await getEditableAgent(colleagueEd, ownerAgent.id)) === null,
    );
    check(
      "agent cannot edit another agency's agent",
      !(await updateAgentProfile(colleagueEd, otherAgentRow.id, edit({ name: "Hijacked" }))).ok &&
        (await nameOf(otherAgentRow.id)) !== "Hijacked",
    );
    check(
      "independent cannot edit an agency's agent",
      !(await updateAgentProfile(indepEd, colleagueAgent.id, edit({ name: "Hijacked" }))).ok &&
        (await nameOf(colleagueAgent.id)) !== "Hijacked",
    );

    const adminSave = await updateAgentProfile(adminEd, colleagueAgent.id, edit({
      name: "Verify Colleague By Admin",
      zones: [citySlug],
    }));
    check(
      "agency admin edits their own agency's agent",
      adminSave.ok && (await nameOf(colleagueAgent.id)) === "Verify Colleague By Admin",
    );
    check(
      "another agency's admin cannot edit that agent",
      !(await updateAgentProfile(otherAdminEd, colleagueAgent.id, edit({ name: "Hijacked" }))).ok &&
        (await nameOf(colleagueAgent.id)) === "Verify Colleague By Admin",
    );
    check(
      "agency admin cannot edit an independent agent",
      !(await updateAgentProfile(adminEd, indepAgent.id, edit({ name: "Hijacked" }))).ok &&
        (await nameOf(indepAgent.id)) !== "Hijacked",
    );
    check(
      "an agency_admin with no agency reaches only their own row",
      (await listEditableAgents(looseAdminEd)).every((a) => a.userId === independent.userId),
    );

    const adminList = (await listEditableAgents(adminEd)).map((a) => a.id);
    check(
      "admin's editable list is exactly their agency's agents",
      adminList.includes(ownerAgent.id) &&
        adminList.includes(colleagueAgent.id) &&
        !adminList.includes(otherAgentRow.id) &&
        !adminList.includes(indepAgent.id),
      JSON.stringify(adminList),
    );
    const colleagueList = (await listEditableAgents(colleagueEd)).map((a) => a.id);
    check(
      "agent's editable list is only their own row",
      colleagueList.length === 1 && colleagueList[0] === colleagueAgent.id,
      JSON.stringify(colleagueList),
    );

    const badYears = await updateAgentProfile(colleagueEd, colleagueAgent.id, edit({ yearsActive: "200" }));
    check("years out of range refused", !badYears.ok && badYears.error === "years");
    const badPhoto = await updateAgentProfile(colleagueEd, colleagueAgent.id, edit({ photoUrl: "http://127.0.0.1/x.png" }));
    check("unsafe photo URL refused", !badPhoto.ok && badPhoto.error === "photo");
    const [slugAfter] = await db
      .select({ slug: agents.slug })
      .from(agents)
      .where(eq(agents.id, colleagueAgent.id));
    check("agent slug is never rewritten on edit", slugAfter.slug === colleagueAgent.slug);

    const collision = await updateOwnAccount(independent.userId, {
      name: "Verify Independent",
      email: ownerUser.email!,
      password: "",
      currentPassword: "secreto123",
    });
    check(
      "account email collision refused",
      !collision.ok && collision.error === "email_taken",
    );

    // Audit F21: a session alone must not be enough to move the credentials.
    const noReauth = await updateOwnAccount(independent.userId, {
      name: "Verify Independent",
      email: indepUser.email!,
      password: "otraclave1",
      currentPassword: "",
    });
    check(
      "password change without current password refused",
      !noReauth.ok && noReauth.error === "bad_password",
    );
    const wrongReauth = await updateOwnAccount(independent.userId, {
      name: "Verify Independent",
      email: mail("moved"),
      password: "",
      currentPassword: "no-es-la-clave",
    });
    check(
      "email change with wrong current password refused",
      !wrongReauth.ok && wrongReauth.error === "bad_password",
    );
    const renameOnly = await updateOwnAccount(independent.userId, {
      name: "Verify Independent",
      email: indepUser.email!,
      password: "",
      currentPassword: "",
    });
    check(
      "renaming alone needs no re-auth",
      renameOnly.ok && !renameOnly.passwordChanged,
    );

    await db.insert(sessions).values([
      {
        id: `verify-indep-${stamp}`,
        userId: independent.userId,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
      {
        id: `verify-owner-${stamp}`,
        userId: agencyOwner.userId,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    ]);

    const changed = await updateOwnAccount(independent.userId, {
      name: "Verify Independent",
      email: indepUser.email!,
      password: "nuevaclave1",
      currentPassword: "secreto123",
    });
    check("password change reported", changed.ok && changed.passwordChanged);

    const remaining = await db.select().from(sessions);
    check(
      "password change revokes that user's sessions",
      !remaining.some((s) => s.userId === independent.userId),
    );
    check(
      "another user's session survives",
      remaining.some((s) => s.userId === agencyOwner.userId),
    );

    const [afterPw] = await db
      .select()
      .from(users)
      .where(eq(users.id, independent.userId));
    check(
      "new password verifies",
      await verifyPassword("nuevaclave1", afterPw.passwordHash),
    );
    check(
      "old password stops working",
      !(await verifyPassword("secreto123", afterPw.passwordHash)),
    );
  } finally {
    // Clean up in FK order: leads before the listings they point at, listings
    // and sessions before the rows those point at.
    if (createdLeadIds.length) {
      await db.delete(leadAssignments).where(inArray(leadAssignments.leadId, createdLeadIds));
      await db.delete(leads).where(inArray(leads.id, createdLeadIds));
    }
    if (createdListingIds.length) {
      await db.delete(leadMatches).where(inArray(
        leadMatches.leadId,
        db.select({ id: leads.id }).from(leads).where(inArray(leads.listingId, createdListingIds)),
      ));
      await db.delete(leads).where(inArray(leads.listingId, createdListingIds));
    }
    if (createdListingIds.length) {
      await db.delete(listings).where(inArray(listings.id, createdListingIds));
    }
    if (createdUserIds.length) {
      await db.delete(sessions).where(inArray(sessions.userId, createdUserIds));
      await db.delete(agents).where(inArray(agents.userId, createdUserIds));
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
    if (createdAgencyIds.length) {
      await db.delete(agencies).where(inArray(agencies.id, createdAgencyIds));
    }
  }

  console.log(
    failures === 0
      ? "\nAll scope and profile checks passed."
      : `\n${failures} check(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
