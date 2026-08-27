"use client";

import { AlertCircle, CheckCircle2, Inbox, Search } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title, message, action, variant = "default" }) {
  const variants = {
    default: "rounded-xl border border-slate-200 bg-white px-6 py-10",
    simple: "px-6 py-8",
    bordered: "rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10",
  };

  return (
    <section className={variants[variant] || variants.default} aria-label={title || "สถานะข้อมูล"}>
      <div className="mx-auto max-w-md text-center">
        {Icon ? (
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : null}
        {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
        {message ? <p className="mt-2 leading-relaxed text-slate-600">{message}</p> : null}
        {action ? <div className="mt-5 flex justify-center [&_button]:min-h-11">{action}</div> : null}
      </div>
    </section>
  );
}

export function EmptyStateIllustration({ title, message, action, illustrationType = "no-data" }) {
  const icons = {
    "no-data": Inbox,
    search: Search,
    error: AlertCircle,
    success: CheckCircle2,
  };

  return (
    <EmptyState
      icon={icons[illustrationType] || Inbox}
      title={title}
      message={message}
      action={action}
      variant="simple"
    />
  );
}
