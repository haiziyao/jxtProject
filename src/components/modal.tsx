"use client";

import { ReactNode, useEffect, useRef } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2d4a]/40 p-3 sm:p-5">
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="max-h-[calc(100dvh-24px)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-[#d2ddf4] bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#d9e2f2] pb-3">
          <h2 className="text-lg font-semibold text-[#365fae]">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-10 shrink-0 rounded-full border border-[#bfd0ee] px-3 text-sm text-[#6f84ad]">关闭</button>
        </div>
        {children}
      </div>
    </div>
  );
}
