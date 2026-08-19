"use client";

export default function SimpleCard({
  title,
  children,
  icon: Icon,
  action,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  noPadding = false,
  noHeader = false,
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      {!noHeader ? (
        <header className={`flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 ${headerClassName}`}>
          <h2 className="flex min-w-0 items-center gap-2.5 font-semibold text-slate-900">
            {Icon ? <Icon className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /> : null}
            {title}
          </h2>
          {action ? <div className="shrink-0 [&_button]:min-h-11">{action}</div> : null}
        </header>
      ) : null}
      <div className={noPadding ? "" : "p-5 sm:p-6"}>
        <div className={bodyClassName}>{children}</div>
      </div>
    </section>
  );
}
