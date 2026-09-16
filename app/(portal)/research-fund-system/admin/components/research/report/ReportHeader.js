"use client";

import { Printer, Download, ChevronDown, RefreshCw } from "lucide-react";
import { useState } from "react";

// Report header (§5 A): single year select drives the whole page, secondary print
// and export actions, and a metadata line with per-source data dates. No hero,
// gradient, sparkle, leading icon, or slogan.
export default function ReportHeader({
  reportYear,
  yearOptions,
  onYearChange,
  trendRangeLabel,
  sourceDates = {},
  cumulative = false,
  busy = false,
  onPrint,
  onRefresh,
  onExportYearly,
  onExportComparison,
  onToggleSources,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const dateText = (value) => value || "ไม่ทราบวันที่อัปเดตข้อมูล";

  return (
    <header className="border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500">วิจัย / รายงานเปรียบเทียบ</p>
          <h1 className="mt-1.5 text-[27px] font-semibold leading-tight tracking-tight text-slate-900">ผลการดำเนินงานวิจัย</h1>
          <p className="mt-1.5 text-sm text-slate-500">Computer Science · คณะเทียบมหาวิทยาลัยขอนแก่นและประเทศไทย</p>
        </div>

        <div className="no-print flex flex-wrap items-end justify-start gap-2 md:justify-end">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            ปีรายงาน (ค.ศ.)
            <select
              value={reportYear ?? ""}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="เลือกปีรายงาน"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
            aria-label="รีเฟรชข้อมูลรายงาน"
          >
            <RefreshCw size={16} aria-hidden="true" className={busy ? "animate-spin" : ""} /> รีเฟรช
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={busy}
            title={busy ? "รอข้อมูลโหลดเสร็จก่อนพิมพ์" : undefined}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
          >
            <Printer size={16} aria-hidden="true" /> พิมพ์รายงาน
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((open) => !open)}
              disabled={busy}
              aria-expanded={exportOpen}
              aria-haspopup="menu"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
            >
              <Download size={16} aria-hidden="true" /> ส่งออกข้อมูล <ChevronDown size={14} aria-hidden="true" />
            </button>
            {exportOpen && (
              <div role="menu" className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                <button type="button" role="menuitem" onClick={() => { setExportOpen(false); onExportYearly(); }} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  ตัวเลขรายปี (CSV)
                </button>
                <button type="button" role="menuitem" onClick={() => { setExportOpen(false); onExportComparison(); }} className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  ตารางเปรียบเทียบปีรายงาน (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>ปีรายงาน {reportYear ?? "–"}{cumulative ? " (ข้อมูลสะสม)" : ""}</span>
        <span aria-hidden="true">·</span>
        <span>ช่วงแนวโน้ม {trendRangeLabel}</span>
        <span aria-hidden="true">·</span>
        <span>คณะอัปเดต {dateText(sourceDates.faculty)}</span>
        <span aria-hidden="true">·</span>
        <span>KKU {dateText(sourceDates.university)}</span>
        <span aria-hidden="true">·</span>
        <span>ประเทศไทย {dateText(sourceDates.country)}</span>
        <button type="button" onClick={onToggleSources} className="no-print font-medium text-blue-600 underline-offset-2 hover:underline">
          ดูแหล่งข้อมูล
        </button>
      </div>
    </header>
  );
}
