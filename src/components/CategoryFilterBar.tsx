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
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => setEnhanced(true), []);
  useEffect(() => {
    if (opened) dialog.current?.showModal();
  }, [opened]);
  const close = () => { dialog.current?.close(); setOpened(false); trigger.current?.focus(); };
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  const hrefWithout = (key: string) => {
    const sp = new URLSearchParams(params); sp.delete(key); sp.delete("page");
    return `${basePath}?${sp}`;
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sp = new URLSearchParams();
    new FormData(event.currentTarget).forEach((v, k) => { if (typeof v === "string" && v && !(k === "orden" && v === "recientes")) sp.set(k, v); });
    close(); navigate(`${basePath}?${sp}`);
  };
  const summary = t.results(count.toLocaleString(numberLocale));
  const form = (mobile: boolean) => {
    const suffix = mobile ? "-mobile" : "";
    return <form id={`listing-filters${suffix}`} className="listing-sidebar__form" action={basePath} method="GET" onSubmit={submit} key={JSON.stringify(params) + suffix}>
      {Object.entries(params).filter(([k]) => !["page", "precio_min", "precio_max", "dormitorios", "tipo", "orden"].includes(k)).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {mobile && <input type="hidden" name="orden" value={params.orden ?? "recientes"} />}
      <p>{summary}</p>
      <fieldset><legend>{t.price}</legend>
        {(["precio_min", "precio_max"] as const).map((key, i) => <label key={key} htmlFor={key + suffix}>{i ? t.priceMaxLabel : t.priceMinLabel}<input className="filter-bar__input" id={key + suffix} name={key} type="number" min="0" step="any" inputMode="decimal" defaultValue={params[key]} placeholder={i ? t.priceMaxPlaceholder : t.priceMinPlaceholder} /></label>)}
        <div className="listing-filter-tags">{(operation === "venta" ? [50000,100000,200000,500000] : [300,500,1000,2000]).map(n => <a className="listing-filter-tag" key={n} href={`${basePath}?${new URLSearchParams({ ...params, page: "1", precio_min: "", precio_max: String(n) })}`} onClick={e => {
          e.preventDefault();
          const f = e.currentTarget.closest("form")!;
          (f.elements.namedItem("precio_min") as HTMLInputElement).value = "";
          (f.elements.namedItem("precio_max") as HTMLInputElement).value = String(n);
          if (!mobile) f.requestSubmit();
        }}>{t.preset(n.toLocaleString(numberLocale))}</a>)}</div>
      </fieldset>
      <fieldset><legend>{t.bedroomsLabel}</legend><div className="listing-filter-tags">
        {["", "1", "2", "3", "4"].map(n => <label className="listing-filter-tag" key={n}><input type="radio" name="dormitorios" value={n} defaultChecked={(params.dormitorios ?? "") === n} onChange={e => { if (!mobile) e.currentTarget.form?.requestSubmit(); }} />{n ? `${n}+` : t.bedroomsAny}</label>)}
      </div></fieldset>
      {!fixedType && <fieldset><legend>{t.type}</legend><div className="listing-filter-tags">{["", ...PROPERTY_TYPES].map(type => <label className="listing-filter-tag" key={type}><input type="radio" name="tipo" value={type ? typePlural(type as PropertyType) : ""} defaultChecked={(params.tipo ?? "") === (type ? typePlural(type as PropertyType) : "")} onChange={e => { if (!mobile) e.currentTarget.form?.requestSubmit(); }} />{type ? d.category.typeLabel[type] : t.bedroomsAny}</label>)}</div></fieldset>}
      {fixedType && <fieldset><legend>{t.type}</legend><div className="listing-filter-tags">{typeChoices.map(choice => <a className="listing-filter-tag" key={choice.href} href={choice.href}>{choice.label}</a>)}</div></fieldset>}
      <fieldset><legend>{locationLabel}</legend><div className="listing-sidebar__locations">{locations.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</div></fieldset>
      <button className="filter-bar__submit" type="submit">{t.apply}</button>
      <a className="filter-bar__clear" href={basePath}>{t.clear}</a>
    </form>;
  };
  const labels: Record<string,string> = { precio_min: t.priceMinLabel, precio_max: t.priceMaxLabel, dormitorios: t.bedroomsLabel, tipo: t.type, barrio: t.barrio, orden: t.sortLabel };
  const chipValue = (key: string, value: string) => {
    if (key === "orden") return value === "precio_asc" ? t.sortPriceAsc : t.sortPriceDesc;
    if (key === "tipo") { const type = parseTypePlural(value); return type ? d.category.typeLabel[type] : value; }
    if (["precio_min", "precio_max", "dormitorios"].includes(key) && Number.isFinite(Number(value))) return Number(value).toLocaleString(numberLocale);
    return value;
  };
  return <section className={`listing-browser${enhanced ? " listing-browser--enhanced" : ""}`} aria-label={t.title}>
    <aside className="listing-sidebar">{form(false)}</aside>
    <div className="listing-browser__main">
      <div className="listing-toolbar">
        <p className="listing-result-count" aria-live="polite" data-count={count}>{summary}</p>
        <button ref={trigger} className="listing-filter-open" type="button" onClick={() => setOpened(true)} aria-haspopup="dialog">{t.title}</button>
        <label htmlFor="orden">{t.sortLabel}<select key={params.orden ?? "recientes"} id="orden" name="orden" form="listing-filters" className="filter-bar__select" defaultValue={params.orden ?? "recientes"} onChange={e => e.currentTarget.form?.requestSubmit()}>
          <option value="recientes">{t.sortRecent}</option><option value="precio_asc">{t.sortPriceAsc}</option><option value="precio_desc">{t.sortPriceDesc}</option>
        </select></label>{viewSwitch}
      </div>
      <div className="listing-active-filters">{Object.entries(params).filter(([k,v]) => labels[k] && v && !(k === "orden" && v === "recientes")).map(([k,v]) => <a key={k} className="listing-filter-tag" data-filter={k} href={hrefWithout(k)} aria-label={`${t.remove}: ${labels[k]}`} onClick={e => { e.preventDefault(); navigate(e.currentTarget.href); }}>{labels[k]}: {chipValue(k,v)} ×</a>)}<a href={basePath}>{t.clear}</a></div>
      <div role="status" className="listing-pending">{pending && <><span className="listing-spinner" aria-hidden="true" />{t.loading}</>}</div>
      <div className="listing-browser__results" aria-busy={pending}>{children}</div>
    </div>
    {opened && <dialog ref={dialog} className="listing-filter-dialog" aria-labelledby="listing-filter-title" onCancel={close} onClose={() => { setOpened(false); trigger.current?.focus(); }}><h2 id="listing-filter-title">{t.title}</h2><button type="button" onClick={close}>{t.close}</button>{form(true)}</dialog>}
  </section>;
}
