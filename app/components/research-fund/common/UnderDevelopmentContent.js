"use client";

import { ArrowLeft, Construction, Info } from "lucide-react";
import PageLayout from "./PageLayout";

export default function UnderDevelopmentContent({
  currentPage,
  title = null,
  description = null,
  breadcrumbs,
  homeHref = "/",
}) {
  const pageTitle = title || currentPage;
  const pageDescription = description || "หน้านี้อยู่ระหว่างการพัฒนา";
  const pageBreadcrumbs = breadcrumbs ?? [
    { label: "หน้าหลัก", href: homeHref },
    { label: pageTitle },
  ];

  return (
    <PageLayout
      title={pageTitle}
      subtitle={pageDescription}
      icon={Construction}
      breadcrumbs={pageBreadcrumbs}
    >
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center sm:px-8 sm:py-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
          <Construction className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-slate-900">อยู่ระหว่างการพัฒนา</h2>
        <p className="mx-auto mt-2 max-w-lg leading-relaxed text-slate-600">
          หน้า <span className="font-semibold text-slate-900">{pageTitle}</span> ยังไม่พร้อมใช้งานในขณะนี้
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ย้อนกลับ
        </button>
        <div className="mx-auto mt-7 flex max-w-lg items-start gap-3 border-t border-slate-200 pt-5 text-left text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
          <p>คุณยังสามารถเลือกเมนูอื่นที่พร้อมใช้งานได้จากแถบนำทางของระบบ</p>
        </div>
      </section>
    </PageLayout>
  );
}
