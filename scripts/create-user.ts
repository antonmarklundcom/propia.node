/**
 * Create or update a panel user with an email+password login and a role.
 * Agencies and agents normally sign up themselves at /registro and staff are
 * normally created in /admin/usuarios; this CLI is how the founder bootstraps
 * the first super-admin, or fixes a login when the panel is unreachable.
 *
 * Idempotent — re-running for the same email resets the password/role/name:
 *
 *   npm run user:create -- <email> <password> <role> [name]
 *   npm run user:create -- --dry <email> <password> <role> [name]
 *
 * `--dry` (anywhere in the arguments) validates the same plan and prints what
 * would happen (create or update, and any role change) without hashing or
 * writing, on the read-only `DATABASE_URL`. Any other `--flag` is refused
 * rather than silently becoming part of the name. Error messages never echo
 * an argument: with the arguments in the wrong order, the echoed value would
 * be the password.
 *
 * <role> accepts the task's names or the raw enum:
 *   super_admin | admin           → admin
 *   agency      | agency_admin     → agency_admin
 *   agent                          → agent
 *   staff                          → staff
 *
 * Linking an agency/agent login to a specific agency is done in
 * /admin/usuarios ("Inmobiliaria"), which writes agents.user_id/agency_id.
 *
 * A real run writes, so it uses `DATABASE_URL_RW ?? DATABASE_URL` — a
 * read-only credential cannot create a login (see AGENTS.md). The password is
 * never printed, in either mode.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { DRY } from "./ops-cli";

type Role = (typeof users.$inferSelect)["role"];

const ROLE_ALIASES: Record<string, Role> = {
  super_admin: "admin",
  admin: "admin",
  agency: "agency_admin",
  agency_admin: "agency_admin",
  agent: "agent",
  staff: "staff",
  developer: "developer",
  consumer: "consumer",
};

const USAGE = "Usage: npm run user:create -- [--dry] <email> <password> <role> [name]";

interface UserPlan {
  email: string;
  password: string;
  role: Role;
  name: string | null;
}

/** Parse and validate once; the dry run and the real run both act on this. */
function planFromArgs(argv: string[]): UserPlan {
  const flags = argv.filter((a) => a.startsWith("--"));
  const unknown = flags.filter((f) => f !== "--dry");
  if (unknown.length) throw new Error(`Unknown flag (only --dry is accepted). ${USAGE}`);
  const [email, password, roleArg, ...nameParts] = argv.filter((a) => !a.startsWith("--"));
  if (!email || !password || !roleArg) throw new Error(USAGE);
  const role = ROLE_ALIASES[roleArg.toLowerCase()];
  if (!role) {
    throw new Error("Unknown role (third argument). Use: super_admin | staff | agency | agent | developer | consumer");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error(`The first argument is not an email address. ${USAGE}`);
  return { email: normalizedEmail, password, role, name: nameParts.join(" ").trim() || null };
}

async function main() {
  let plan: UserPlan;
  try {
    plan = planFromArgs(process.argv.slice(2));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: users.id, role: users.role, name: users.name })
    .from(users)
    .where(eq(users.email, plan.email))
    .limit(1);
  const verb = existing ? "update" : "create";
  const roleNote = existing && existing.role !== plan.role ? ` (role ${existing.role} → ${plan.role})` : "";
  console.info(
    `${DRY ? "would " : ""}${verb} user ${plan.email} as ${plan.role}${roleNote}, name ${plan.name ?? "(none)"}, password set`,
  );
  if (DRY) {
    console.info("--dry: nothing written.");
    process.exit(0);
  }

  const passwordHash = await hashPassword(plan.password);
  await db
    .insert(users)
    .values({ email: plan.email, name: plan.name, role: plan.role, passwordHash })
    .onDuplicateKeyUpdate({ set: { name: plan.name, role: plan.role, passwordHash } });

  const [row] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, plan.email))
    .limit(1);

  console.info(
    `✓ user ready: #${row?.id} ${row?.email} (${row?.role}) — login at /login`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
