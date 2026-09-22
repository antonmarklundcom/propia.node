"use client";

import { useId, useRef, useState } from "react";
import { getDictionary, type Locale } from "@/i18n";

/** Client hydration adds the viewer; all gallery photos are server rendered. */
export function ListingGallery({ images, locale }: {
  images: { url: string; alt: string }[];
  locale: Locale;
}) {
  const t = getDictionary(locale).listing;
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const [current, setCurrent] = useState(0);
  const [opened, setOpened] = useState(false);
  const move = (delta: number) => setCurrent(n => (n + delta + images.length) % images.length);
  function open(index: number, button: HTMLButtonElement) {
    opener.current = button;
    setCurrent(index);
    setOpened(true);
    dialog.current?.showModal();
  }
  if (!images.length) return <div className="detail-gallery__empty"><span className="listing-card__nophoto">{t.galleryEmpty}</span></div>;
  const photo = (index: number, main = false) => (
    <button type="button" key={index} className={main ? "detail-gallery__main" : "detail-gallery__thumb"}
      aria-label={t.galleryOpen(index + 1, images.length)} onClick={e => open(index, e.currentTarget)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- eager SSR cover is the LCP image. */}
      <img className="media-cover-img" src={images[index].url} alt={images[index].alt}
        loading={main ? "eager" : "lazy"} fetchPriority={main ? "high" : undefined} decoding={main ? undefined : "async"} />
      {index === 4 && images.length > 5 && <span className="detail-gallery__more">{t.galleryMore(images.length - 5)}</span>}
    </button>
  );
  return <>
    <div className={`detail-gallery${images.length === 1 ? " detail-gallery--single" : ""}`}>
      {photo(0, true)}
      {images.length > 1 && <div className="detail-gallery__thumbs">{images.slice(1, 5).map((_, i) => photo(i + 1))}</div>}
    </div>
    <dialog ref={dialog} className="listing-viewer" aria-labelledby={headingId}
      onClose={() => { setOpened(false); opener.current?.focus(); }}
      onKeyDown={e => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          move(e.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="listing-viewer__toolbar">
        <h2 id={headingId}>{t.galleryTitle}</h2>
        <span aria-live="polite">{current + 1} / {images.length}</span>
        <button type="button" aria-label={t.galleryClose} onClick={() => dialog.current?.close()}>×</button>
      </div>
      <div className="listing-viewer__stage">
        {opened && images.map((im, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={im.url} alt={im.alt} hidden={i !== current} loading={i === current ? "eager" : "lazy"} />
        ))}
      </div>
      {images.length > 1 && <div className="listing-viewer__navigation">
        <button type="button" aria-label={t.galleryPrevious} onClick={() => move(-1)}>←</button>
        <button type="button" aria-label={t.galleryNext} onClick={() => move(1)}>→</button>
      </div>}
    </dialog>
  </>;
}
