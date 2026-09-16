"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { scopusBenchmarkAPI } from "@/app/lib/api";
import {
  selectReportYear,
  resolveBootstrapFloor,
  buildFindings,
  buildYearlyCsv,
  buildComparisonCsv,
  normalizeReportRow,
  formatCount,
  formatPct,
  formatPoints,
  highTierShare,
  shareOf,
  growthInfo,
  isUsable,
  observedRate,
  metricReady,
} from "@/app/lib/scopus_benchmark_report.mjs";
import ReportHeader from "./report/ReportHeader";
import KpiStrip from "./report/KpiStrip";
import KeyFindings from "./report/KeyFindings";
import TrendCharts from "./report/TrendCharts";
import ComparisonTable from "./report/ComparisonTable";
import CitationsSection from "./report/CitationsSection";
import QualityTypeDetails from "./report/QualityTypeDetails";
import SourceNotes from "./report/SourceNotes";

const CURRENT_YEAR = new Date().getFullYear();
// First read covers ~15 years ending at the current year; older windows are loaded
// on demand when the user selects an earlier report year (§4, R7) — never a
// year-by-year probe, just one wider GET when needed.
const DEFAULT_WINDOW_FROM = CURRENT_YEAR - 14;

function formatThaiDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function Skeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8" aria-label="กำลังโหลดรายงาน">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded bg-slate-100" />)}
      </div>
      <div className="mt-6 h-56 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

function EmptyState({ onGoSetup }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <BarChart3 className="mx-auto text-slate-400" size={36} aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-slate-800">ยังไม่มีข้อมูลสำหรับรายงาน</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">ไปที่แท็บตั้งค่า &amp; ดึงข้อมูล เพื่ออัปเดตตัวเลขหรือดึงเอกสาร benchmark ก่อน</p>
      <button type="button" onClick={onGoSetup} className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
        ไปหน้าตั้งค่า
      </button>
    </div>
  );
}

// `api` is injectable so a dev harness can render the real report with fixture
// data; production always uses the real scopusBenchmarkAPI.
export default function ScopusBenchmarkDashboard({ onGoSetup, api = scopusBenchmarkAPI }) {
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [reload, setReload] = useState(0);

  const [manualYear, setManualYear] = useState(null);
  const [trendRange, setTrendRange] = useState(5);
  const [windowFrom, setWindowFrom] = useState(DEFAULT_WINDOW_FROM);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const [insightsY, setInsightsY] = useState(null);
  const [insightsPrev, setInsightsPrev] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsReload, setInsightsReload] = useState(0);
  const insightRequest = useRef(0);

  // A4 page size is applied ONLY while this report is mounted (injected at runtime),
  // never as a global @page rule — so printing other pages is unaffected (R2).
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-scopus-report-page", "");
    style.textContent = "@media print { @page { size: A4 portrait; margin: 14mm; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // A printed report must be self-contained: expand every collapsed <details> (the
  // quality appendix and the source-note definitions) for the duration of the print
  // so they are never dropped, then restore each to how the reader left it. Bound to
  // beforeprint/afterprint so it covers the "พิมพ์รายงาน" button AND the browser's own
  // Ctrl+P. Setting `.open` directly also drives the controlled <details> via its
  // onToggle, keeping React state in sync.
  useEffect(() => {
    let reopened = [];
    const expand = () => {
      const root = document.getElementById("scopus-report-root");
      if (!root) return;
      reopened = Array.from(root.querySelectorAll("details:not([open])"));
      reopened.forEach((element) => { element.open = true; });
    };
    const restore = () => {
      reopened.forEach((element) => { element.open = false; });
      reopened = [];
    };
    window.addEventListener("beforeprint", expand);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", expand);
      window.removeEventListener("afterprint", restore);
    };
  }, []);

  // Comparison read (report context) — kept separate from the setup tab's counts.
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setDataError("");
    api
      .comparison({ year_from: windowFrom, year_to: CURRENT_YEAR })
      .then((response) => {
        if (!cancelled) setData(response?.data || null);
      })
      .catch((error) => {
        if (!cancelled) setDataError(error?.message || "โหลดข้อมูลรายงานไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload, windowFrom]);

  const yearMeta = data?.year_meta || {};
  // Scope consistency drives EVERY comparison surface (findings, table, KPI share,
  // trend share, CSV). Declared here — before trendPoints/KPIs use it (R3-1).
  const scopeConsistent = data?.report_scope ? data.report_scope.consistent !== false : true;
  const selection = useMemo(() => selectReportYear(yearMeta, CURRENT_YEAR), [yearMeta]);
  const reportYear = manualYear ?? selection?.year ?? null;
  const isCurrentYear = reportYear !== null && Number(reportYear) === CURRENT_YEAR;
  const facultyReady = yearMeta?.[reportYear]?.faculty?.status === "available";

  // Year choices come from available_years (ALL snapshot years across every level),
  // so years older than the currently loaded window are still selectable (R7).
  const yearOptions = useMemo(() => {
    const available = data?.available_years || {};
    const union = new Set([
      ...(available.faculty || []),
      ...(available.university || []),
      ...(available.country || []),
    ]);
    const years = [...union].map(Number).filter(Number.isFinite).sort((a, b) => b - a);
    return years.length ? years : reportYear ? [reportYear] : [];
  }, [data, reportYear]);

  // Widen the comparison read so the DEFAULT selection is decided from real
  // readiness, not from snapshot existence (R4-1). For a default (no manual pick) we
  // load down to the earliest ended snapshot year (resolveBootstrapFloor) so every
  // candidate's true faculty status is in year_meta and selectReportYear can prefer
  // an older faculty-READY year over a recent BLOCKED one. We also always ensure the
  // shown year's trend window is loaded. A manual pick is respected (only its trend
  // window is loaded). One wider GET, clamped to the earliest year that has data,
  // and it settles (the floor is stable) so there is no widen/reload loop.
  useEffect(() => {
    if (!yearOptions.length) return;
    const earliest = yearOptions[yearOptions.length - 1];
    const candidates = [];
    const shown = manualYear ?? reportYear;
    if (shown != null) candidates.push(shown - trendRange + 1);
    if (manualYear == null) {
      const floor = resolveBootstrapFloor(data?.available_years, CURRENT_YEAR);
      if (floor != null) candidates.push(floor);
    }
    if (!candidates.length) return;
    const needed = Math.max(earliest, Math.min(...candidates));
    if (needed < windowFrom) setWindowFrom(needed);
  }, [manualYear, reportYear, trendRange, yearOptions, data, windowFrom]);

  // Report year is an atomic context: whenever it changes, prior values are cleared
  // before the new ones load so no figure from another year is ever shown (§4).
  useEffect(() => {
    if (reportYear === null) return;
    const requestId = insightRequest.current + 1;
    insightRequest.current = requestId;
    setInsightsLoading(true);
    setInsightsError("");
    setInsightsY(null);
    setInsightsPrev(null);

    const requests = [api.insights({ year: reportYear })];
    // No prior-year insights for a cumulative current year (no YoY) — §9 C.
    if (!isCurrentYear) requests.push(api.insights({ year: reportYear - 1 }));

    Promise.allSettled(requests)
      .then(([current, previous]) => {
        if (insightRequest.current !== requestId) return;
        if (current.status === "fulfilled") setInsightsY(current.value?.data || null);
        else setInsightsError(current.reason?.message || "โหลดข้อมูลเชิงลึกไม่สำเร็จ");
        if (previous && previous.status === "fulfilled") setInsightsPrev(previous.value?.data || null);
      })
      .finally(() => {
        if (insightRequest.current === requestId) setInsightsLoading(false);
      });
  }, [reportYear, isCurrentYear, insightsReload]);

  const rows = useMemo(() => (Array.isArray(data?.years) ? [...data.years].sort((a, b) => Number(a.year) - Number(b.year)) : []), [data]);
  const rowByYear = useCallback((year) => rows.find((row) => Number(row.year) === Number(year)) || null, [rows]);

  // Per-year usability comes from the snapshot metadata, so a missing snapshot is a
  // gap while a real zero snapshot is a value.
  const usableFaculty = useCallback((year) => yearMeta?.[year]?.faculty?.status === "available", [yearMeta]);
  const usableKku = useCallback((year) => yearMeta?.[year]?.university?.status === "available", [yearMeta]);

  const trendPoints = useMemo(() => {
    if (reportYear === null) return [];
    const start = reportYear - trendRange + 1;
    const points = [];
    for (let year = start; year <= reportYear; year += 1) {
      const row = rowByYear(year);
      const faculty = row && usableFaculty(year) && isUsable(row.faculty) ? Number(row.faculty) : null;
      const kku = row && usableKku(year) && isUsable(row.university) ? Number(row.university) : null;
      // Share is a คณะ-vs-KKU comparison — withheld entirely when scope is inconsistent (R3-1).
      points.push({ year, faculty, kku, share: scopeConsistent ? shareOf(faculty, kku) : null });
    }
    return points;
  }, [reportYear, trendRange, rowByYear, usableFaculty, usableKku, scopeConsistent]);

  const reportRow = rowByYear(reportYear);
  const reportMeta = yearMeta?.[reportYear] || null;
  // Rows carry legacy default-0 for missing snapshots; normalize against year_meta
  // so the table/CSV/share never read a missing snapshot as a real zero (R4).
  const normalizedReportRow = useMemo(() => normalizeReportRow(reportRow, reportMeta), [reportRow, reportMeta]);
  const prevRow = rowByYear(reportYear - 1);
  const facultyCount = reportRow && facultyReady && isUsable(reportRow.faculty) ? Number(reportRow.faculty) : null;
  const prevFacultyCount = prevRow && usableFaculty(reportYear - 1) && isUsable(prevRow.faculty) ? Number(prevRow.faculty) : null;
  const kkuCount = reportRow && usableKku(reportYear) && isUsable(reportRow.university) ? Number(reportRow.university) : null;
  const prevKkuCount = prevRow && usableKku(reportYear - 1) && isUsable(prevRow.university) ? Number(prevRow.university) : null;

  const shareNow = shareOf(facultyCount, kkuCount);
  const sharePrev = shareOf(prevFacultyCount, prevKkuCount);

  const facultyInsight = insightsY?.levels?.faculty || null;
  const kkuInsight = insightsY?.levels?.kku || null;
  const prevFacultyInsight = insightsPrev?.levels?.faculty || null;

  const scope = data?.report_scope || insightsY?.scope || { subject_area: "COMP" };
  const sourceDates = useMemo(() => ({
    faculty: formatThaiDate(yearMeta?.[reportYear]?.faculty?.snapshot_at),
    university: formatThaiDate(yearMeta?.[reportYear]?.university?.snapshot_at),
    country: formatThaiDate(yearMeta?.[reportYear]?.country?.snapshot_at),
  }), [yearMeta, reportYear]);

  const findings = useMemo(() => buildFindings({
    isCurrentYear,
    reportYear,
    facultyCount,
    prevFacultyCount,
    kkuCount,
    prevKkuCount,
    facultyReady,
    faculty: facultyInsight,
    kku: kkuInsight,
  }), [isCurrentYear, reportYear, facultyCount, prevFacultyCount, kkuCount, prevKkuCount, facultyReady, facultyInsight, kkuInsight]);

  // KPI sublines (§5 B). Every subline shows the prior-year comparator only when it
  // is usable and the year has ended.
  const kpiItems = useMemo(() => {
    const growth = !isCurrentYear ? growthInfo(facultyCount, prevFacultyCount) : { status: "unknown" };
    const countSub = isCurrentYear
      ? "ข้อมูลสะสม (ยังไม่ครบปี)"
      : growth.status === "pct"
      ? `ปีก่อน ${formatCount(prevFacultyCount)} · ${growth.delta >= 0 ? "+" : "−"}${formatCount(Math.abs(growth.delta))} ผลงาน (${formatPct(growth.pct)})`
      : growth.status === "from_zero"
      ? `ปีก่อน 0 · +${formatCount(growth.delta)} ผลงาน`
      : growth.status === "flat"
      ? "ไม่เปลี่ยนแปลงจากปีก่อน"
      : "ไม่มีข้อมูลปีก่อน";

    // Share (คณะ/KKU) is a cross-scope comparison — withheld when scope inconsistent (R3-1).
    const shareValue = scopeConsistent ? formatPct(shareNow) : "ยังเทียบไม่ได้";
    const shareSub = !scopeConsistent
      ? "ขอบเขตไม่ตรง — งดสัดส่วนคณะ/KKU"
      : isCurrentYear
      ? "ข้อมูลสะสม (ยังไม่ครบปี)"
      : shareNow !== null && sharePrev !== null
      ? `ปีก่อน ${formatPct(sharePrev)} · ${formatPoints(shareNow - sharePrev)}`
      : "ไม่มีข้อมูลปีก่อน";

    // When the faculty harvest is incomplete for the year, the observed metric
    // values still show but carry a note (their cohort ≠ the official count) (R2-1).
    const facultyMismatch = facultyInsight?.readiness?.snapshot_mismatch;
    const mismatchNote = facultyMismatch ? "ข้อมูลชุดนี้ยังไม่ครบเทียบ snapshot (ค่าที่แสดงเป็นค่าที่สังเกตได้)" : null;

    const htNow = highTierShare(facultyInsight?.quartile);
    const htPrev = highTierShare(prevFacultyInsight?.quartile);
    const htQ = facultyInsight?.quartile;
    const htDenom = htQ
      ? `${formatCount(Number(htQ.t1 || 0) + Number(htQ.q1 || 0) + Number(htQ.q2 || 0))}/${formatCount(Number(htQ.t1 || 0) + Number(htQ.q1 || 0) + Number(htQ.q2 || 0) + Number(htQ.q3 || 0) + Number(htQ.q4 || 0))} ที่จัดกลุ่มได้`
      : "ยังไม่มีข้อมูล";
    // Prior-year comparator only when the QUALITY metric is ready in BOTH years.
    const qualityComparable = metricReady(facultyInsight, "quality") && metricReady(prevFacultyInsight, "quality");
    const htSub2 = isCurrentYear
      ? null
      : qualityComparable && htPrev !== null
      ? `ปีก่อน ${formatPct(htPrev)}`
      : facultyInsight?.available && !metricReady(facultyInsight, "quality")
      ? "ยังเทียบปีก่อน/ระดับไม่ได้ (ข้อมูลวารสารไม่ครบ)"
      : null;

    // Observed international-collaboration rate over KNOWN docs (shared helper — R2-2).
    const intlNowR = observedRate(facultyInsight, "intl");
    const intlPrevR = observedRate(prevFacultyInsight, "intl");
    const intlNow = intlNowR.value;
    const intlSub = facultyInsight?.available
      ? intlNowR.known !== null
        ? `${formatCount(intlNowR.positive)}/${formatCount(intlNowR.known)} ที่ทราบ${intlNowR.unknown > 0 ? ` · ไม่ทราบ ${formatCount(intlNowR.unknown)}` : ""}`
        : `จาก ${formatCount(facultyInsight?.docs)} ผลงาน (observed)`
      : "ยังไม่มีข้อมูล";
    const intlComparable = metricReady(facultyInsight, "intl") && metricReady(prevFacultyInsight, "intl");
    const intlSub2 = isCurrentYear
      ? null
      : intlComparable && intlPrevR.value !== null
      ? `ปีก่อน ${formatPct(intlPrevR.value)}`
      : facultyInsight?.available && !metricReady(facultyInsight, "intl")
      ? "ยังเทียบปีก่อน/ระดับไม่ได้ (ข้อมูลสังกัดไม่ครบ)"
      : null;

    return [
      { label: "จำนวนผลงานคณะ", value: formatCount(facultyCount), unit: "ผลงาน", sublines: [countSub, mismatchNote].filter(Boolean) },
      { label: "สัดส่วนผลงานคณะต่อ KKU", value: shareValue, sublines: [shareSub] },
      { label: "ผลงานในวารสารกลุ่ม T1–Q2", value: formatPct(htNow), sublines: [htDenom, htSub2].filter(Boolean) },
      { label: "ผลงานร่วมกับต่างประเทศ", value: formatPct(intlNow), sublines: [intlSub, intlSub2].filter(Boolean) },
    ];
  }, [isCurrentYear, facultyCount, prevFacultyCount, shareNow, sharePrev, facultyInsight, prevFacultyInsight, scopeConsistent]);

  const download = useCallback((filename, contents) => {
    const blob = new Blob(["﻿" + contents], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportYearly = useCallback(() => {
    // Export exactly the trend range shown on screen (5/10 ending at reportYear),
    // not the full read window (R8).
    const start = reportYear - trendRange + 1;
    const visibleRows = rows.filter((row) => Number(row.year) >= start && Number(row.year) <= reportYear);
    download(`scopus-benchmark-รายปี-${start}-${reportYear}.csv`, buildYearlyCsv({ rows: visibleRows, yearMeta, scope }));
  }, [download, rows, yearMeta, scope, reportYear, trendRange]);
  const exportComparison = useCallback(() => {
    download(`scopus-benchmark-เปรียบเทียบ-${reportYear}.csv`, buildComparisonCsv({ reportYear, row: reportRow, meta: reportMeta, insights: insightsY, scope }));
  }, [download, reportYear, reportRow, reportMeta, insightsY, scope]);

  if (dataLoading && !data) return <Skeleton />;
  if (dataError && !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <span className="flex items-center gap-2"><AlertCircle size={17} aria-hidden="true" />{dataError}</span>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="font-semibold underline">ลองใหม่</button>
      </div>
    );
  }
  if (reportYear === null) {
    // Snapshots exist (available_years non-empty) but all fall outside the loaded
    // window — show loading while the widen effect fetches the older range, never a
    // dead-end empty state (R2-4). True empty only when nothing is available anywhere.
    if (yearOptions.length) return <Skeleton />;
    return <EmptyState onGoSetup={onGoSetup} />;
  }

  const trendRangeLabel = `${reportYear - trendRange + 1}–${reportYear}`;
  const busy = dataLoading || (insightsLoading && !insightsY);
  const refreshAll = () => {
    setReload((value) => value + 1);
    setInsightsReload((value) => value + 1);
  };
  // Scope guard (§4/R2-3/R3-1): on mismatch we withhold every comparative surface —
  // findings, table gaps, the share KPI, the trend share line, and the CSV share.
  const scopeMismatch = !scopeConsistent;
  const shownFindings = scopeMismatch
    ? ["ขอบเขตข้อมูลของสามระดับไม่ตรงกันหรือไม่ใช่ Computer Science (COMP) จึงงดข้อสรุปเปรียบเทียบจนกว่าจะตั้งค่าขอบเขตให้ตรง"]
    : findings;

  return (
    <div id="scopus-report-root" className="rounded-lg border border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <ReportHeader
          reportYear={reportYear}
          yearOptions={yearOptions}
          onYearChange={setManualYear}
          trendRangeLabel={trendRangeLabel}
          sourceDates={sourceDates}
          cumulative={isCurrentYear}
          busy={busy}
          onPrint={() => { if (!busy) window.print(); }}
          onRefresh={refreshAll}
          onExportYearly={exportYearly}
          onExportComparison={exportComparison}
          onToggleSources={() => {
            setSourcesOpen(true);
            requestAnimationFrame(() => document.getElementById("scopus-report-sources")?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        />

        {scopeMismatch && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <AlertCircle size={16} aria-hidden="true" />ขอบเขตข้อมูลของสามระดับไม่ตรงกันหรือไม่ใช่ Computer Science (COMP) — งดข้อสรุปและการเปรียบเทียบทั้งหมด แสดงเฉพาะค่าที่สังเกตได้ (คณะ {scope.faculty_subject_area || "?"} · KKU {scope.university_subject_area || scope.subject_area} · ประเทศไทย {scope.country_subject_area || "?"})
          </div>
        )}

        {insightsError && (
          // Printable so a failed load is visible in the printed report (§7), while
          // the retry control itself stays screen-only.
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            <span className="flex items-center gap-2"><AlertCircle size={16} aria-hidden="true" />ข้อมูลเชิงลึกบางส่วนโหลดไม่สำเร็จ: {insightsError}</span>
            <button type="button" onClick={() => setInsightsReload((value) => value + 1)} className="no-print font-semibold underline">ลองใหม่</button>
          </div>
        )}

        <KpiStrip items={kpiItems} />
        <KeyFindings findings={shownFindings} />
        <TrendCharts points={trendPoints} reportYear={reportYear} currentYear={CURRENT_YEAR} trendRange={trendRange} onRangeChange={setTrendRange} scopeConsistent={scopeConsistent} />

        {insightsLoading && !insightsY ? (
          <div className="border-b border-slate-200 py-6"><div className="h-40 animate-pulse rounded bg-slate-100" /></div>
        ) : (
          <>
            <ComparisonTable reportYear={reportYear} row={normalizedReportRow} insights={insightsY} scopeConsistent={scopeConsistent} />
            <CitationsSection reportYear={reportYear} insights={insightsY} />
            <QualityTypeDetails insights={insightsY} />
          </>
        )}

        <SourceNotes
          reportYear={reportYear}
          scope={scope}
          sourceDates={sourceDates}
          facultyMetric={data?.faculty_metric}
          open={sourcesOpen}
          onToggle={setSourcesOpen}
          onGoSetup={onGoSetup}
          generatedAt={new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
        />
      </div>
    </div>
  );
}
