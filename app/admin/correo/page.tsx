import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { listMailSites, unassignedAddresses } from "@/lib/mail-sites";
import { esMailSites } from "@/i18n/es-mail-sites";
import { adminTabs } from "../tabs";
import {
  addMemberAction,
  adoptAddressAction,
  createMailboxAction,
  createSiteAction,
  deleteMailboxAction,
  deleteSiteAction,
  removeMemberAction,
  toggleSiteAction,
} from "./actions";

export const metadata: Metadata = {
  title: esMailSites.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esMailSites;

const OK_CODES = new Set([
  "site_created",
  "site_updated",
  "site_deleted",
  "mailbox_created",
  "mailbox_deleted",
  "member_added",
  "member_removed",
]);

/**
 * /admin/correo — which domains' mail lands here, who owns each address, and
 * who reads it. Super-admin only (the guard is on the page and on every
 * action). Nothing here sends mail or touches Cloudflare: the page lists the
 * steps that are the founder's to do there.
 */
export default async function AdminMailSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const [reviewCount, sites, unassigned] = await Promise.all([
    countReviewQueue(),
    listMailSites(),
    unassignedAddresses().catch(() => []),
  ]);
  const flash = msg && t.flash[msg] ? { text: t.flash[msg], error: !OK_CODES.has(msg) } : null;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("mail", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-card__meta">{t.intro}</p>
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}

        <details className="panel-card">
          <summary>
            <strong>{t.checklistTitle}</strong>
          </summary>
          <ol>
            {t.checklist.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </details>

        <form action={createSiteAction} className="panel-form panel-card">
          <label className="panel-form__field">
            <span className="auth-field__label">{t.siteForm.domain}</span>
            <input className="auth-field__input" name="domain" required maxLength={190} placeholder="hospital.com.py" />
          </label>
          <label className="panel-form__field">
            <span className="auth-field__label">{t.siteForm.name}</span>
            <input className="auth-field__input" name="name" required maxLength={160} />
          </label>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn panel-btn--primary" type="submit">
              {t.siteForm.submit}
            </button>
          </div>
        </form>

        {sites.length === 0 ? <p className="panel-empty">{t.empty}</p> : null}

        {sites.map((s) => (
          <section key={s.id} className="panel-card">
            <h3 className="panel-card__title">
              {s.domain} <span className="panel-card__meta">— {s.displayName}</span>
            </h3>
            <p className="panel-note">
              {s.active ? t.active : t.inactive} · {s.sendingEnabled ? t.sendingOn : t.sendingOff}
            </p>
            <div className="panel-form">
              <form action={toggleSiteAction}>
                <input type="hidden" name="siteId" value={s.id} />
                <input type="hidden" name="field" value="sendingEnabled" />
                <input type="hidden" name="on" value={s.sendingEnabled ? "0" : "1"} />
                <button className="panel-btn" type="submit">
                  {s.sendingEnabled ? t.disableSending : t.enableSending}
                </button>
              </form>
              <form action={toggleSiteAction}>
                <input type="hidden" name="siteId" value={s.id} />
                <input type="hidden" name="field" value="active" />
                <input type="hidden" name="on" value={s.active ? "0" : "1"} />
                <button className="panel-btn" type="submit">
                  {s.active ? t.pause : t.resume}
                </button>
              </form>
              {s.mailboxes.length === 0 ? (
                <form action={deleteSiteAction}>
                  <input type="hidden" name="siteId" value={s.id} />
                  <button className="panel-btn" type="submit">
                    {t.deleteSite}
                  </button>
                </form>
              ) : null}
            </div>

            {s.mailboxes.length === 0 ? <p className="panel-empty">{t.noMailboxes}</p> : null}
            {s.mailboxes.map((b) => (
              <div key={b.id} className="panel-card">
                <p>
                  <strong>{b.address}</strong>
                  {b.label ? <span className="panel-card__meta"> — {b.label}</span> : null}
                </p>
                <p className="panel-note">{t.members}</p>
                {b.members.length === 0 ? <p className="panel-empty">{t.noMembers}</p> : null}
                <ul>
                  {b.members.map((m) => (
                    <li key={m.id}>
                      {m.name ? `${m.name} · ` : ""}
                      {m.email ?? `#${m.userId}`} ({m.canReply ? t.canReply : t.readOnly}){" "}
                      <form action={removeMemberAction} style={{ display: "inline" }}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <button className="panel-btn" type="submit">
                          {t.removeMember}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <form action={addMemberAction} className="panel-form">
                  <input type="hidden" name="mailboxId" value={b.id} />
                  <label className="panel-form__field">
                    <span className="auth-field__label">{t.memberForm.email}</span>
                    <input className="auth-field__input" name="email" type="email" required maxLength={254} />
                  </label>
                  <label className="panel-form__field">
                    <span className="auth-field__label">
                      <input type="checkbox" name="canReply" value="1" defaultChecked /> {t.memberForm.canReply}
                    </span>
                  </label>
                  <div className="panel-form__field panel-form__field--action">
                    <button className="panel-btn" type="submit">
                      {t.memberForm.submit}
                    </button>
                  </div>
                </form>
                <form action={deleteMailboxAction}>
                  <input type="hidden" name="mailboxId" value={b.id} />
                  <button className="panel-btn" type="submit">
                    {t.deleteMailbox}
                  </button>
                </form>
              </div>
            ))}

            <form action={createMailboxAction} className="panel-form">
              <input type="hidden" name="siteId" value={s.id} />
              <label className="panel-form__field">
                <span className="auth-field__label">{t.mailboxForm.local}</span>
                <input className="auth-field__input" name="local" required maxLength={64} placeholder="hola" />
              </label>
              <label className="panel-form__field">
                <span className="auth-field__label">{t.mailboxForm.label}</span>
                <input className="auth-field__input" name="label" maxLength={120} />
              </label>
              <div className="panel-form__field panel-form__field--action">
                <button className="panel-btn panel-btn--primary" type="submit">
                  {t.mailboxForm.submit}
                </button>
              </div>
            </form>
          </section>
        ))}

        {sites.length > 0 ? (
          <section className="panel-card">
            <h3 className="panel-card__title">{t.unassignedTitle}</h3>
            <p className="panel-note">{t.unassignedHint}</p>
            {unassigned.length === 0 ? <p className="panel-empty">{t.unassignedEmpty}</p> : null}
            <ul>
              {unassigned.map((u) => (
                <li key={u.address}>
                  {u.address} ({u.count}){" "}
                  <form action={adoptAddressAction} style={{ display: "inline" }}>
                    <input type="hidden" name="address" value={u.address} />
                    <button className="panel-btn" type="submit">
                      {t.adopt}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
