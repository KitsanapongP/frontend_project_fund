"use client";

import { Printer, Download, ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

// Report header (§3.1/§5 A): a year-range picker (ปีเริ่มต้น–ปีสิ้นสุด) with an explicit
// "แสดงผล" apply button, secondary print/export actions, and a metadata line with
// per-source data dates. Editing the inputs only changes a DRAFT — the displayed
// report, its title and its exports do not change until the user applies (§3.1). An
// invalid range shows an inline error and is never silently swapped or auto-picked.
export default function ReportHeader({
  yearFrom,
  yearTo,
  minYear = 1900,
  maxYear,
  onApply,
  periodLabel,
  isRange = false,
  includesCurrentYear = false,
  trendRangeLabel,
  sourceDates = {},
  busy = false,
  onPrint,
  onRefresh,
  onExportYearly,
  onExportComparison,
  exportComparisonLabel = "ตารางเปรียบเทียบปีรายงาน (CSV)",
  onToggleSources,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [fromDraft, setFromDraft] = useState(String(yearFrom ?? ""));
  const [toDraft, setToDraft] = useState(String(yearTo ?? ""));
  const [error, setError] = useState("");

  // Keep the draft in sync with the APPLIED range (e.g. after รีเฟรช / detect / a
  // programmatic change), but never mid-edit override — this only runs when the
  // applied values themselves change.
  useEffect(() => {
    setFromDraft(String(yearFrom ?? ""));
    setToDraft(String(yearTo ?? ""));
    setError("");
  }, [yearFrom, yearTo]);

  const dateText = (value) => value || "ไม่ทราบวันที่อัปเดตข้อมูล";
  const dirty = fromDraft !== String(yearFrom ?? "") || toDraft !== String(yearTo ?? "");

  const apply = () => {
    const from = Number(fromDraft);
    const to = Number(toDraft);
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      setError("กรอกปีเป็นตัวเลข ค.ศ.");
      return;
    }
    if (from < minYear || to < minYear) {
      setError(`เลือกปีตั้งแต่ ${minYear} เป็นต้นไป`);
      return;
    }
    if (from > maxYear || to > maxYear) {
      setError(`เลือกปีได้ไม่เกิน ${maxYear}`);
      return;
    }
    if (from > to) {
      setError("ปีเริ่มต้นต้องไม่เกินปีสิ้นสุด");
      return;
    }
    setError("");
    onApply?.(from, to);
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply();
    }
  };

  return (
    <header className="border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500">วิจัย / รายงานเปรียบเทียบ</p>
          <h1 className="mt-1.5 text-[27px] font-semibold leading-tight tracking-tight text-slate-900">ผลการดำเนินงานวิจัย</h1>
          <p className="mt-1.5 text-sm text-slate-500">Computer Science · คณะเทียบมหาวิทยาลัยขอนแก่นและประเทศไทย</p>
        </div>

        <div className="no-print flex flex-col items-start gap-1 md:items-end">
          <div className="flex flex-wrap items-end justify-start gap-2 md:justify-end">
            <div className="flex items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                ปีเริ่มต้น (ค.ศ.)
                <input
                  type="number"
                  inputMode="numeric"
                  min={minYear}
                  max={maxYear}
                  value={fromDraft}
                  onChange={(event) => setFromDraft(event.target.value)}
                  onKeyDown={onKeyDown}
                  aria-label="ปีเริ่มต้น"
                  aria-invalid={!!error}
                  className="h-10 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <span className="pb-2.5 text-slate-400">–</span>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                ปีสิ้นสุด (ค.ศ.)
                <input
                  type="number"
                  inputMode="numeric"
                  min={minYear}
                  max={maxYear}
                  value={toDraft}
                  onChange={(event) => setToDraft(event.target.value)}
                  onKeyDown={onKeyDown}
                  aria-label="ปีสิ้นสุด"
                  aria-invalid={!!error}
                  className="h-10 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={apply}
              disabled={!dirty}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              แสดงผล
            </button>
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
                    {exportComparisonLabel}
                  </button>
                </div>
              )}
            </div>
          </div>
          {error ? (
            <p className="text-xs font-medium text-rose-600" role="alert">{error}</p>
          ) : dirty ? (
            <p className="text-xs text-slate-400">กด “แสดงผล” เพื่อดูรายงานตามช่วงปีที่เลือก</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{isRange ? "ช่วงปี" : "ปีรายงาน"} {periodLabel}{includesCurrentYear ? ` (รวมปี ${yearTo} ยังไม่ครบปี)` : ""}</span>
        {!isRange && (
          <>
            <span aria-hidden="true">·</span>
            <span>ช่วงแนวโน้ม {trendRangeLabel}</span>
          </>
        )}
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
