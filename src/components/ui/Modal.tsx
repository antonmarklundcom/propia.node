"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * One <dialog>-based overlay (§6.5): centered modal on desktop, bottom sheet
 * on mobile (see .modal in globals.css). Native focus trap + Escape handling
 * come free from <dialog>; backdrop click closes.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        // Clicks on the backdrop land on the <dialog> itself.
        if (e.target === ref.current) onClose();
      }}
    >
      <h2 className="modal__title">{title}</h2>
      <button
        type="button"
        className="modal__close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ✕
      </button>
      {children}
    </dialog>
  );
}
