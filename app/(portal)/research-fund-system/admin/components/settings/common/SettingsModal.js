"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

const SIZE_CLASS_MAP = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
  "3xl": "max-w-5xl",
  full: "max-w-full",
};

const SettingsModal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
  panelClassName = "",
  bodyClassName = "overflow-y-auto px-4 py-5 sm:px-6",
  footerClassName = "flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
  hideCloseButton = false,
  closeOnBackdrop = true,
  headerClassName = "flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6",
  headerContent,
}) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    let timeoutId;

    if (open) {
      setShouldRender(true);
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => setIsVisible(true));
      } else {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
      timeoutId = setTimeout(() => setShouldRender(false), 200);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose, open]);

  if (!shouldRender) return null;

  const sizeClass = SIZE_CLASS_MAP[size] || size || SIZE_CLASS_MAP.lg;

  const showHeader = Boolean(headerContent || title || description || !hideCloseButton);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-opacity duration-200 sm:p-6 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className="absolute inset-0 bg-slate-950/60"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={`relative flex max-h-[calc(100dvh-1.5rem)] w-full transform flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.16)] transition-all duration-200 sm:max-h-[calc(100dvh-3rem)] ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        } ${sizeClass} ${panelClassName} [&_button]:min-h-11 [&_button]:rounded-lg [&_input:not([type='checkbox']):not([type='radio'])]:min-h-11 [&_input:not([type='checkbox']):not([type='radio'])]:rounded-lg [&_input:not([type='checkbox']):not([type='radio'])]:border-slate-300 [&_input:not([type='checkbox']):not([type='radio'])]:focus:border-blue-500 [&_input:not([type='checkbox']):not([type='radio'])]:focus:ring-blue-500 [&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-700 [&_select]:min-h-11 [&_select]:rounded-lg [&_select]:border-slate-300 [&_select]:focus:border-blue-500 [&_select]:focus:ring-blue-500 [&_textarea]:rounded-lg [&_textarea]:border-slate-300 [&_textarea]:focus:border-blue-500 [&_textarea]:focus:ring-blue-500`}
      >
        {showHeader && (
          <div className={headerClassName}>
            {headerContent ? (
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex-1">{headerContent}</div>
                {!hideCloseButton ? (
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="ปิดหน้าต่าง"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div>
                  {title ? <div id={titleId} className="text-lg font-semibold text-slate-900">{title}</div> : null}
                  {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
                </div>
                {!hideCloseButton ? (
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="ปิดหน้าต่าง"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}
        <div className={bodyClassName}>{children}</div>
        {footer ? <div className={footerClassName}>{footer}</div> : null}
      </div>
    </div>
  );
};

export default SettingsModal;
