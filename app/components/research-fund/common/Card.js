"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Card({
  title,
  children,
  defaultCollapsed = false,
  icon: Icon,
  action,
  className = "",
  collapsible = true,
  headerClassName = "",
  bodyClassName = "",
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const hasHeader = Boolean(title || Icon || action);
  const canCollapse = collapsible && Boolean(title || Icon);

  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      {hasHeader ? (
        <header className={`flex min-h-14 items-center gap-3 border-b border-slate-200 px-5 py-1.5 ${headerClassName}`}>
          {canCollapse ? (
            <h2 className="min-w-0 flex-1">
              <button
                type="button"
                className="group flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={() => setCollapsed((current) => !current)}
                aria-expanded={!collapsed}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {Icon ? <Icon className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /> : null}
                  <span className="font-semibold text-slate-900">{title}</span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? "-rotate-90" : "rotate-0"}`}
                  aria-hidden="true"
                />
              </button>
            </h2>
          ) : (
            <h2 className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 font-semibold text-slate-900">
              {Icon ? <Icon className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /> : null}
              {title}
            </h2>
          )}
          {action ? <div className="shrink-0 [&_button]:min-h-11">{action}</div> : null}
        </header>
      ) : null}

      <div
        className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
        aria-hidden={collapsed}
        inert={collapsed}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
