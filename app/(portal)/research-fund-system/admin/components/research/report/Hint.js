"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

// Shared metric hint (§5): a labelled, keyboard-focusable button that reveals its
// explanation on hover, focus AND tap — never a bare title attribute (a title does
// not open on touch and does not print). Closes on Escape or an outside click/blur.
// The printed definition lives in the report's source notes, not here.
export default function Hint({ text, label }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`คำอธิบาย: ${label}`}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="no-print inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="no-print absolute left-0 top-6 z-30 w-72 rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] font-normal leading-relaxed text-slate-600 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
