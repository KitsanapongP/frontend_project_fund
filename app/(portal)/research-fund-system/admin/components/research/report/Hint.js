"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

// Hover/focus previews; clicking pins the explanation until another click or Escape.
// A body portal avoids clipping by table overflow and fixed positioning stays in view.
export default function Hint({ text, label }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const pointerTypeRef = useRef(null);
  const panelId = useId();

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = buttonRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      const gap = 8;
      const left = Math.max(gap, Math.min(anchor.left, window.innerWidth - panel.width - gap));
      const below = anchor.bottom + gap;
      const top = Math.max(gap, Math.min(
        below + panel.height <= window.innerHeight - gap ? below : anchor.top - panel.height - gap,
        window.innerHeight - panel.height - gap,
      ));
      setPosition({ left, top });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => { setOpen(false); setPinned(false); };
    const onClick = (event) => {
      if (buttonRef.current?.contains(event.target)) return;
      if (pinned || !panelRef.current?.contains(event.target)) close();
    };
    const onKey = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, pinned]);

  return <span className="inline-flex align-middle"
    onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse" && !pinned) setOpen(false); }}>
    <button ref={buttonRef} type="button"
      aria-label={`คำอธิบาย: ${label}`} aria-expanded={open}
      aria-describedby={open ? panelId : undefined}
      onPointerDown={(event) => { pointerTypeRef.current = event.pointerType; }}
      onClick={(event) => {
        event.stopPropagation();
        setPinned(!pinned); setOpen(!pinned);
      }}
      // Touch focus precedes the synthesized click. Previewing here can place the
      // panel over the trigger and redirect that click; touch opens on click.
      onFocus={() => { if (pointerTypeRef.current !== "touch") setOpen(true); }}
      onBlur={() => { pointerTypeRef.current = null; if (!pinned) setOpen(false); }}
      className="no-print inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
      <Info size={14} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={panelRef} id={panelId} role="tooltip"
      style={{ left: position?.left ?? 8, top: position?.top ?? 8, visibility: position ? "visible" : "hidden", width: "min(360px, calc(100vw - 16px))", maxHeight: "min(560px, calc(100dvh - 16px))" }}
      className="no-print fixed z-[10000] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-left text-xs font-normal leading-relaxed text-slate-700 shadow-lg">
      {(Array.isArray(text) ? text : [text]).map((section,index)=><div key={index} className="border-b border-slate-200 pb-3 last:border-0 last:pb-0 [&+div]:pt-3">
        <p className="mb-1.5 font-semibold text-slate-900">{typeof section === 'string' ? label : section.title}</p>
        {typeof section === 'string' ? <div className="space-y-2">{section.split(/\n+/).filter(Boolean).map((line,i)=><p key={i}>{line}</p>)}</div> : <ul className="list-disc space-y-1.5 pl-4">{section.lines.map((line,i)=><li key={i}>{line}</li>)}</ul>}
      </div>)}
    </div>, document.body)}
  </span>;
}
