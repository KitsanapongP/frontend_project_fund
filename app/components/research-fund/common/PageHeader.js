"use client";

import Link from "next/link";

export default function PageHeader({ title, subtitle, icon: Icon, actions, breadcrumbs }) {
  return (
    <header className="space-y-4 border-b border-slate-200 pb-5 pt-6">
      {breadcrumbs?.length ? (
        <nav aria-label="เส้นทางนำทาง">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {breadcrumbs.map((crumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1 || !crumb.href;
              return (
                <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                  {index > 0 ? <span className="text-slate-300" aria-hidden="true">/</span> : null}
                  {crumb.href && !isCurrent ? (
                    <Link
                      href={crumb.href}
                      className="rounded text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate text-slate-600" aria-current={isCurrent ? "page" : undefined}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1 max-w-3xl leading-relaxed text-slate-600">{subtitle}</p> : null}
            </div>
          </div>
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 [&_button]:min-h-11 sm:w-auto sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
