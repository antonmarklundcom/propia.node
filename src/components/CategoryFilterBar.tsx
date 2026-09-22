"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import { PROPERTY_TYPES, type Operation, type PropertyType } from "@/lib/import/types";
import { typePlural, parseTypePlural } from "@/lib/urls";

export type FilterChoice = { label: string; href: string };
export function CategoryFilterBar({ basePath, params, locale, count, operation, fixedType, typeChoices, locations, locationLabel, children, viewSwitch }: {
  basePath: string; params: Record<string, string>; locale: "es" | "en"; count: number;
  operation: Operation; fixedType?: PropertyType; typeChoices: FilterChoice[]; locations: FilterChoice[]; locationLabel: string;
  children: ReactNode; viewSwitch: ReactNode;
}) {
  const d = getDictionary(locale), t = d.filters;
  const numberLocale = locale === "en" ? "en-US" : "es-PY";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enhanced, setEnhanced] = useState(false);
  const [opened, setOpened] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [priceWaiting, setPriceWaiting] = useState(false);
  const clearPriceTimer = () => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = null;
    setPriceWaiting(false);
  };
  // Cancel drafts on back/forward navigation and when this browser unmounts.
  useEffect(() => {
    clearPriceTimer();
    return () => { if (priceTimer.current) clearTimeout(priceTimer.current); };
  }, [params]);
  const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;
  useEffect(() => setEnhanced(true), []);
  useEffect(() => {
    if (opened) dialog.current?.showModal();
  }, [opened]);
  const close = () => { dialog.current?.close(); setOpened(false); trigger.current?.focus(); };
  const navigate = (href: string) => { clearPriceTimer(); startTransition(() => router.push(href, { scroll: false })); };
  const hrefWithout = (key: string) => {
    const sp = new URLSearchParams(params); sp.delete(key); sp.delete("page");
    return `${basePath}?${sp}`;
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sp = new URLSearchParams();
    new FormData(event.currentTarget).forEach((v, k) => { if (typeof v === "string" && v && !(k === "orden" && v === "recientes")) sp.set(k, v); });
    if (opened) close();
    navigate(`${basePath}?${sp}`);
  };
  const summary = t.results(count.toLocaleString(numberLocale));
  const form = (mobile: boolean, suffix = mobile ? "-mobile" : "") => {
    return <form id={`listing-filters${suffix}`} className="listing-sidebar__form" action={basePath} method="GET" onSubmit={submit} key={JSON.stringify(params) + suffix}>
      {Object.entries(params).filter(([k]) => !["page", "precio_min", "precio_max", "dormitorios", "tipo", "orden"].includes(k)).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {mobile && <input type="hidden" name="orden" value={params.orden ?? "recientes"} />}

      <fieldset className="listing-sidebar__price"><legend>{t.price}<span className="listing-sidebar__price-pending" aria-live="polite">{!mobile && (priceWaiting || pending) ? t.applying : ""}</span></legend><div className="listing-sidebar__price-inputs">
        {(["precio_min", "precio_max"] as const).map((key, i) => <label key={key} htmlFor={key + suffix}>{i ? t.priceMaxLabel : t.priceMinLabel}<input className="filter-bar__input" data-pending={!mobile && (priceWaiting || pending)} onChange={e => {
          if (mobile || !isDesktop()) return;
          clearPriceTimer();
          const input = e.currentTarget;
          setPriceWaiting(true);
          priceTimer.current = setTimeout(() => { if (input.isConnected && isDesktop()) input.form?.requestSubmit(); else clearPriceTimer(); }, 600);
        }} onBlur={e => { if (!mobile && priceTimer.current && isDesktop()) e.currentTarget.form?.requestSubmit(); }} onKeyDown={e => { if (!mobile && isDesktop() && e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} id={key + suffix} name={key} type="number" min="0" step="any" inputMode="decimal" defaultValue={params[key]} placeholder={i ? t.priceMaxPlaceholder : t.priceMinPlaceholder} /></label>)}
        </div><div className="listing-filter-tags">{(operation === "venta" ? [50000,100000,200000,500000] : [300,500,1000,2000]).map(n => <a className="listing-filter-tag" key={n} href={`${basePath}?${new URLSearchParams({ ...params, page: "1", precio_min: "", precio_max: String(n) })}`} onClick={e => {
          e.preventDefault();
          const f = e.currentTarget.closest("form")!;
          (f.elements.namedItem("precio_min") as HTMLInputElement).value = "";
          (f.elements.namedItem("precio_max") as HTMLInputElement).value = String(n);
          if (!mobile && isDesktop()) f.requestSubmit();
        }}>{t.preset(n.toLocaleString(numberLocale))}</a>)}</div>
      </fieldset>
      <fieldset><legend>{t.bedroomsLabel}</legend><div className="listing-filter-tags listing-bedrooms">
        {["", "1", "2", "3", "4"].map(n => <label className="listing-filter-tag" key={n}><input type="radio" name="dormitorios" value={n} defaultChecked={(params.dormitorios ?? "") === n} onChange={e => { if (!mobile && isDesktop()) e.currentTarget.form?.requestSubmit(); }} />{n ? `${n}+` : t.bedroomsAny}</label>)}
      </div></fieldset>
      {!fixedType && <fieldset><legend>{t.type}</legend><div className="listing-filter-tags listing-types">{["", ...PROPERTY_TYPES].map(type => <label className="listing-filter-tag" key={type}><input type="radio" name="tipo" value={type ? typePlural(type as PropertyType) : ""} defaultChecked={(params.tipo ?? "") === (type ? typePlural(type as PropertyType) : "")} onChange={e => { if (!mobile && isDesktop()) e.currentTarget.form?.requestSubmit(); }} />{type ? d.category.typeLabel[type] : t.bedroomsAny}</label>)}</div></fieldset>}
      {fixedType && <fieldset><legend>{t.type}</legend><div className="listing-filter-tags listing-types">{typeChoices.map(choice => <a className="listing-filter-tag" key={choice.href} href={choice.href}>{choice.label}</a>)}</div></fieldset>}
      <fieldset><legend>{locationLabel}</legend><div className="listing-sidebar__locations">{locations.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</div></fieldset>
      <div className="listing-sidebar__actions"><button className="filter-bar__submit" type="submit">{t.viewResults(count.toLocaleString(numberLocale))}</button>{!mobile && <p className="listing-sidebar__instant">{t.instant}</p>}</div>

    </form>;
  };
  const labels: Record<string,string> = { precio_min: t.priceMinLabel, precio_max: t.priceMaxLabel, dormitorios: t.bedroomsLabel, tipo: t.type, barrio: t.barrio, orden: t.sortLabel };
  const chipValue = (key: string, value: string) => {
    if (key === "orden") return value === "precio_asc" ? t.sortPriceAsc : t.sortPriceDesc;
    if (key === "tipo") { const type = parseTypePlural(value); return type ? d.category.typeLabel[type] : value; }
    if (["precio_min", "precio_max", "dormitorios"].includes(key) && Number.isFinite(Number(value))) return Number(value).toLocaleString(numberLocale);
    return value;
  };
  const activeFilters = Object.entries(params).filter(([k,v]) => labels[k] && v && !(k === "orden" && v === "recientes"));
  return <section className={`listing-browser${enhanced ? " listing-browser--enhanced" : ""}`} aria-label={t.title}>
    <aside className="listing-sidebar">{form(false)}</aside>
    <details className="listing-filter-disclosure"><summary ref={trigger} className="listing-filter-open" aria-haspopup={enhanced ? "dialog" : undefined} onClick={e => { e.preventDefault(); setOpened(true); }}>{t.title}{activeFilters.length > 0 && <span className="listing-filter-badge">{activeFilters.length.toLocaleString(numberLocale)}</span>}</summary>{form(true, "-inline")}</details>
    <div className="listing-browser__main">
      <div className="listing-toolbar">
        <div className="listing-toolbar__results"><p className="listing-result-count" aria-live="polite" data-count={count}>{summary}</p>
        <div className="listing-active-filters">{activeFilters.map(([k,v]) => <a key={k} className="listing-filter-tag" data-filter={k} href={hrefWithout(k)} aria-label={`${t.remove}: ${labels[k]}`} onClick={e => { e.preventDefault(); navigate(e.currentTarget.href); }}>{labels[k]}: {chipValue(k,v)} ×</a>)}<a href={basePath}>{t.clear}</a></div></div>
        <div className="listing-toolbar__controls">
        <label htmlFor="orden">{t.sortLabel}<select key={params.orden ?? "recientes"} id="orden" name="orden" form="listing-filters" className="filter-bar__select" defaultValue={params.orden ?? "recientes"} onChange={e => e.currentTarget.form?.requestSubmit()}>
          <option value="recientes">{t.sortRecent}</option><option value="precio_asc">{t.sortPriceAsc}</option><option value="precio_desc">{t.sortPriceDesc}</option>
        </select></label>{viewSwitch}</div>
      </div>

      <div role="status" className="listing-pending">{pending && <><span className="listing-spinner" aria-hidden="true" />{t.loading}</>}</div>
      <div className="listing-browser__results" aria-busy={pending}>{children}</div>
    </div>
    {opened && <dialog ref={dialog} className="listing-filter-dialog" aria-labelledby="listing-filter-title" onCancel={close} onClose={() => { setOpened(false); trigger.current?.focus(); }}><h2 id="listing-filter-title">{t.title}</h2><button type="button" onClick={close}>{t.close}</button>{form(true)}</dialog>}
  </section>;
}
