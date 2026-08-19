"use client";

import LoadingSpinner from "./LoadingSpinner";
import PageHeader from "./PageHeader";

export default function PageLayout({
  children,
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center text-slate-600" aria-live="polite">
        <LoadingSpinner size="large" label={`กำลังโหลด${title ? ` ${title}` : "หน้า"}`} />
        <p className="font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
