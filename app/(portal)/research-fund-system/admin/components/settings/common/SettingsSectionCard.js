"use client";

import React from "react";

export default function SettingsSectionCard({
  icon: Icon,
  iconSize = 20,
  iconBgClass = "bg-blue-100",
  iconColorClass = "text-blue-600",
  title,
  description,
  subtitle,
  actions,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
}) {
  const supportingText = description || subtitle;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`.trim()}
    >
      <div
        className={`flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between ${headerClassName}`.trim()}
      >
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/15 ${iconBgClass}`}>
              <Icon size={iconSize} className={iconColorClass} aria-hidden="true" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {supportingText ? (
              <p className="mt-0.5 max-w-3xl text-sm text-slate-500">{supportingText}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end [&_button]:min-h-11 [&_button]:rounded-lg [&_input]:min-h-11 [&_input]:rounded-lg [&_select]:min-h-11 [&_select]:rounded-lg">
            {actions}
          </div>
        ) : null}
      </div>
      <div
        className={`p-4 sm:p-6 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-blue-500 [&_button]:focus-visible:ring-offset-2 [&_input:not([type='checkbox']):not([type='radio'])]:min-h-11 [&_input:not([type='checkbox']):not([type='radio'])]:rounded-lg [&_input:not([type='checkbox']):not([type='radio'])]:border-slate-300 [&_input:not([type='checkbox']):not([type='radio'])]:text-slate-900 [&_input:not([type='checkbox']):not([type='radio'])]:placeholder:text-slate-500 [&_input:not([type='checkbox']):not([type='radio'])]:focus:border-blue-500 [&_input:not([type='checkbox']):not([type='radio'])]:focus:ring-blue-500 [&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-700 [&_select]:min-h-11 [&_select]:rounded-lg [&_select]:border-slate-300 [&_select]:bg-white [&_select]:text-slate-900 [&_select]:focus:border-blue-500 [&_select]:focus:ring-blue-500 [&_textarea]:rounded-lg [&_textarea]:border-slate-300 [&_textarea]:text-slate-900 [&_textarea]:placeholder:text-slate-500 [&_textarea]:focus:border-blue-500 [&_textarea]:focus:ring-blue-500 ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </section>
  );
}
