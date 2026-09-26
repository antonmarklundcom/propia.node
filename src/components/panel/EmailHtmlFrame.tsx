"use client";

/**
 * A received email's HTML, in a frame that cannot run anything: `sandbox`
 * without `allow-scripts` or `allow-same-origin` (an opaque origin with no
 * access to the panel's cookies or DOM), plus the document's own CSP from
 * `emailFrameDocument()`. Links open in a new tab (`allow-popups…`).
 *
 * Remote images are off until the reader asks — the only reason this is a
 * client component. Both documents are built on the server; this only picks.
 */
import { useState } from "react";
import styles from "./inbox.module.css";

export function EmailHtmlFrame(props: {
  title: string;
  blocked: string;
  withImages: string | null;
  labels: { show: string; hide: string; note: string };
}) {
  const [images, setImages] = useState(false);
  return (
    <div>
      {props.withImages ? (
        <div className={styles.frameBar}>
          {images ? null : <span>{props.labels.note}</span>}
          <button type="button" className={styles.linkButton} onClick={() => setImages((v) => !v)}>
            {images ? props.labels.hide : props.labels.show}
          </button>
        </div>
      ) : null}
      <iframe
        className={styles.frame}
        title={props.title}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        srcDoc={images && props.withImages ? props.withImages : props.blocked}
      />
    </div>
  );
}
