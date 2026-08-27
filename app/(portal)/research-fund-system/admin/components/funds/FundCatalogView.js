"use client";

import {
  AlertTriangle,
  Download,
  Info,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import PageLayout from "../common/PageLayout";
import { FORM_TYPE_CONFIG } from "../../../../../lib/form_type_config";

const NOTICE_STYLES = {
  danger: {
    container: "border-red-200 bg-red-50 text-red-900",
    icon: "border-red-200 bg-white text-red-700",
    description: "text-red-800",
    iconComponent: AlertTriangle,
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "border-amber-200 bg-white text-amber-700",
    description: "text-amber-800",
    iconComponent: AlertTriangle,
  },
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-900",
    icon: "border-blue-200 bg-white text-blue-700",
    description: "text-blue-800",
    iconComponent: Info,
  },
};

export function FundPeriodNotice({ tone = "info", title, description }) {
  const style = NOTICE_STYLES[tone] || NOTICE_STYLES.info;
  const NoticeIcon = style.iconComponent;

  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${style.container}`} role={tone === "danger" ? "alert" : "status"}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}>
        <NoticeIcon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold">{title}</h2>
        <p className={`mt-1 text-sm ${style.description}`}>{description}</p>
      </div>
    </div>
  );
}

export function FundCatalogLoadingState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-600" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 motion-reduce:animate-none" aria-hidden="true" />
      <p className="font-medium">กำลังโหลดข้อมูลทุน...</p>
    </div>
  );
}

export function FundCatalogErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="flex w-full max-w-xl items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">โหลดข้อมูลทุนไม่สำเร็จ</h2>
          <p className="mt-1 text-sm text-red-800">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            ลองโหลดอีกครั้ง
          </button>
        </div>
      </div>
    </div>
  );
}

function getFundName(fund) {
  return fund?.subcategory_name || fund?.subcategorie_name || "ไม่ระบุชื่อทุน";
}

function getFundKey(fund, index) {
  return fund?.subcategory_id || fund?.subcategorie_id || `${getFundName(fund)}-${index}`;
}

function flattenFunds(categories = []) {
  return (Array.isArray(categories) ? categories : []).flatMap((category) => {
    const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
    return subcategories.map((fund) => ({ fund, category }));
  });
}

function FundAction({ fund, onViewDetails }) {
  const formType = fund?.form_type || "download";
  const formConfig = FORM_TYPE_CONFIG[formType] || {};
  const isOnlineForm = Boolean(formConfig.isOnlineForm);

  if (isOnlineForm) {
    return (
      <button
        type="button"
        onClick={() => onViewDetails(fund)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`ดูรายละเอียด ${getFundName(fund)}`}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        ดูรายละเอียด
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        const docUrl = fund?.form_url || "/documents/default-fund-form.docx";
        window.open(docUrl, "_blank", "noopener,noreferrer");
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`ดาวน์โหลดแบบฟอร์ม ${getFundName(fund)}`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      ดาวน์โหลด
    </button>
  );
}

function FundConditionButton({ fund, onShowCondition }) {
  const fundName = getFundName(fund);

  if (!fund?.fund_condition) {
    return <span className="text-sm text-slate-500">ไม่มีเงื่อนไขเพิ่มเติม</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onShowCondition(fundName, fund.fund_condition)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`ดูเงื่อนไข ${fundName}`}
    >
      <Info className="h-4 w-4" aria-hidden="true" />
      ดูเงื่อนไข
    </button>
  );
}

function FundCatalogTable({ categories, isWithinApplicationPeriod, onShowCondition, onViewDetails }) {
  const rows = flattenFunds(categories);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="รายการทุนที่เปิดรับสมัคร">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="font-semibold text-slate-900">รายการทุน</h2>
        <p className="text-sm text-slate-500" aria-live="polite">พบ {rows.length.toLocaleString("th-TH")} รายการ</p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-600">
            <tr>
              <th className="w-2/5 px-5 py-3">ชื่อทุน</th>
              <th className="px-5 py-3">เงื่อนไข</th>
              <th className="px-5 py-3 text-right">แบบฟอร์มขอทุน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(({ fund }, index) => (
              <tr key={getFundKey(fund, index)} className={!isWithinApplicationPeriod ? "bg-slate-50" : "hover:bg-slate-50"}>
                <td className="px-5 py-4 align-top">
                  <p className="max-w-xl break-words font-semibold leading-6 text-slate-900">{getFundName(fund)}</p>
                  {fund?.has_multiple_levels ? (
                    <p className="mt-1 text-xs text-slate-500">มี {fund?.budget_count || fund?.budget_levels?.length || 0} ระดับงบประมาณ</p>
                  ) : null}
                </td>
                <td className="px-5 py-3 align-middle">
                  <FundConditionButton fund={fund} onShowCondition={onShowCondition} />
                </td>
                <td className="px-5 py-3 text-right align-middle">
                  <FundAction fund={fund} onViewDetails={onViewDetails} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {rows.map(({ fund }, index) => (
          <article key={getFundKey(fund, index)} className={`p-4 ${!isWithinApplicationPeriod ? "bg-slate-50" : ""}`}>
            <h3 className="break-words font-semibold leading-6 text-slate-900">{getFundName(fund)}</h3>
            {fund?.has_multiple_levels ? (
              <p className="mt-1 text-xs text-slate-500">มี {fund?.budget_count || fund?.budget_levels?.length || 0} ระดับงบประมาณ</p>
            ) : null}
            <div className="mt-3 flex flex-col items-stretch gap-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
              <FundConditionButton fund={fund} onShowCondition={onShowCondition} />
              <FundAction fund={fund} onViewDetails={onViewDetails} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConditionDialog({ conditionModal }) {
  if (!conditionModal?.isOpen) return null;

  const { isVisible, title, content, onClose, modalRef } = conditionModal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className={`fixed inset-0 bg-slate-950/60 transition-opacity duration-200 motion-reduce:transition-none ${isVisible ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
      <section
        ref={modalRef}
        className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white text-left shadow-[0_12px_32px_rgba(15,23,42,0.16)] transition-[opacity,transform] duration-200 motion-reduce:transition-none ${isVisible ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-condition-title"
        aria-describedby="fund-condition-description"
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">เงื่อนไขทุน</p>
            <h2 className="mt-1 break-words text-lg font-semibold leading-7 text-slate-900" id="fund-condition-title">{title}</h2>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเงื่อนไขทุน"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700" id="fund-condition-description">{content}</p>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
            onClick={onClose}
          >
            ปิด
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function FundCatalogView({
  title,
  subtitle,
  icon,
  breadcrumbLabel,
  applicationPeriodInfo,
  years,
  selectedYear,
  yearsLoading,
  onYearChange,
  searchTerm,
  onSearchChange,
  filteredFunds,
  fundCategories,
  emptyTitle,
  emptyYearMessage,
  isWithinApplicationPeriod,
  onShowCondition,
  onViewDetails,
  conditionModal,
}) {
  const EmptyIcon = icon;
  const visibleFundCount = flattenFunds(filteredFunds).length;

  return (
    <PageLayout
      title={title}
      subtitle={subtitle}
      icon={icon}
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/research-fund-system/admin" },
        { label: breadcrumbLabel },
      ]}
    >
      {applicationPeriodInfo}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="ตัวกรองรายการทุน">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-auto">
            <label htmlFor="fund-catalog-year" className="mb-2 block text-sm font-medium text-slate-700">ปีงบประมาณ</label>
            <select
              id="fund-catalog-year"
              className="min-h-11 w-full min-w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400 md:w-auto"
              value={selectedYear}
              onChange={onYearChange}
              disabled={yearsLoading}
            >
              {yearsLoading ? (
                <option>กำลังโหลด...</option>
              ) : (
                years.map((year) => (
                  <option key={year.year_id ?? year.year} value={year.year}>{year.year}</option>
                ))
              )}
            </select>
          </div>

          <div className="relative w-full md:max-w-sm">
            <label htmlFor="fund-catalog-search" className="mb-2 block text-sm font-medium text-slate-700">ค้นหารายการทุน</label>
            <Search className="absolute bottom-3.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="fund-catalog-search"
              type="search"
              placeholder="ค้นหาจากชื่อทุนหรือเงื่อนไข..."
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={searchTerm}
              onChange={onSearchChange}
            />
          </div>
        </div>
      </section>

      {visibleFundCount === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
            <EmptyIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">{emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            {fundCategories.length === 0 ? emptyYearMessage : "ไม่พบรายการที่ตรงกับคำค้นหา ลองใช้คำค้นหาอื่น"}
          </p>
        </section>
      ) : (
        <FundCatalogTable
          categories={filteredFunds}
          isWithinApplicationPeriod={isWithinApplicationPeriod}
          onShowCondition={onShowCondition}
          onViewDetails={onViewDetails}
        />
      )}

      <ConditionDialog conditionModal={conditionModal} />
    </PageLayout>
  );
}
