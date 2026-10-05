"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

// Structured inline text adds narrow emphasis without interpreting HTML.
function InlineHintText({ text }) {
  if (typeof text === 'string') return text;
  if (!Array.isArray(text)) return null;
  return text.map((part, index) => part.strong
    ? <strong key={index} className="font-semibold">{part.text}</strong>
    : <span key={index}>{part.text}</span>);
}

// Hover/focus previews; clicking pins the explanation until another click or Escape.
// A body portal avoids clipping by table overflow and fixed positioning stays in view.
export default function Hint({ text, label }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const pointerTypeRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const panelId = useId();
  const close = () => { setOpen(false); setPinned(false); };
  const cancelHoverClose = () => clearTimeout(hoverTimerRef.current);
  const leave = () => { cancelHoverClose(); if (!pinned && document.activeElement !== buttonRef.current) hoverTimerRef.current = setTimeout(close, 120); };
  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = buttonRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      if (!buttonRef.current.getClientRects().length) { close(); return; }
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
    // A retained Benchmark tab can become hidden without unmounting its Hint.
    const observer = new MutationObserver(place);
    let parent = buttonRef.current?.parentElement;
    while (parent && parent !== document.body) { observer.observe(parent, { attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden'] }); parent = parent.parentElement; }
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      observer.disconnect();
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return undefined;
    const onOtherHint = event => { if (event.detail !== panelId) close(); };
    document.dispatchEvent(new CustomEvent('research-explanation-open', { detail: panelId }));
    document.addEventListener('research-explanation-open', onOtherHint);
    const onClick = (event) => {
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      close();
    };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      close();
      // Protect the dialog while help itself has focus; preserve Escape on chart controls.
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target) || panelRef.current?.closest('[role="dialog"]')) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener('research-explanation-open', onOtherHint);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, panelId]);

  return <span className="inline-flex shrink-0 align-middle"
    onPointerEnter={(event) => { if (event.pointerType === "mouse") { cancelHoverClose(); setOpen(true); } }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse") leave(); }}>
    <button ref={buttonRef} type="button" data-explanation-trigger
      aria-label={`คำอธิบาย: ${label}`} aria-expanded={open}
      aria-describedby={open ? panelId : undefined}
      aria-controls={open ? panelId : undefined}
      onPointerDown={(event) => { pointerTypeRef.current = event.pointerType; }}
      onClick={(event) => {
        event.stopPropagation();
        cancelHoverClose();
        setPinned(!pinned); setOpen(!pinned);
      }}
      // Touch focus precedes the synthesized click. Previewing here can place the
      // panel over the trigger and redirect that click; touch opens on click.
      onFocus={() => { cancelHoverClose(); if (pointerTypeRef.current !== "touch") setOpen(true); }}
      onBlur={() => { pointerTypeRef.current = null; if (!pinned) setOpen(false); }}
      className="no-print inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
      <Info size={14} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={panelRef} id={panelId} role="tooltip" data-explanation-panel
      onPointerEnter={cancelHoverClose} onPointerLeave={leave}
      onClick={event => event.stopPropagation()}
      style={{ left: position?.left ?? 8, top: position?.top ?? 8, visibility: position ? "visible" : "hidden", width: "min(360px, calc(100vw - 16px))", maxHeight: "min(560px, calc(100dvh - 16px))" }}
      className="no-print fixed z-[10000] overflow-y-auto overscroll-contain break-words rounded-lg border border-slate-200 bg-white p-4 text-left text-xs font-normal leading-relaxed text-slate-700 shadow-lg">
      {(Array.isArray(text) ? text : [text]).map((section,index)=><div key={index} className="border-b border-slate-200 pb-3 last:border-0 last:pb-0 [&+div]:pt-3">
        <p className="mb-1.5 font-semibold text-slate-900">{typeof section === 'string' ? label : section.title}</p>
        {typeof section === 'string' ? <div className="space-y-2">{section.split(/\n+/).filter(Boolean).map((line,i)=><p key={i}>{line}</p>)}</div> : <ul className="list-disc space-y-1.5 pl-4">{section.lines.map((line,i)=><li key={i}><InlineHintText text={line} /></li>)}</ul>}
      </div>)}
    </div>, buttonRef.current?.closest('[data-explanation-container], [role="dialog"]') || document.body)}
  </span>;
}
