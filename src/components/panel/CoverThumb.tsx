/** 56×42 cover thumbnail for admin tables; lazy, cropped to fill. */
import { esTriage } from "@/i18n/es-triage";

export function CoverThumb({ src }: { src: string | undefined }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized thumb derivative (imageThumbUrl).
    <img
      className="panel-thumb"
      src={src ?? "/img/listing-fallback.webp"}
      alt={src ? "" : esTriage.noCover}
      loading="lazy"
      decoding="async"
      width={56}
      height={42}
    />
  );
}
