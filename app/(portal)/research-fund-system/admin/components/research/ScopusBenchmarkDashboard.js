"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { scopusBenchmarkAPI } from "@/app/lib/api";
import {
  selectReportYear,
  resolveBootstrapFloor,
  buildFindings,
  buildRangeFindings,
  buildYearlyCsv,
  buildComparisonCsv,
  normalizeReportRow,
  aggregateRangeCounts,
  formatCount,
  formatPct,
  formatPoints,
  highTierShare,
  highTierDenomText,
  intlDenomText,
  shareOf,
  growthInfo,
  isUsable,
  observedRate,
  metricReady,
  refreshSettled,
  HINT_T1Q2,
  HINT_INTL,
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
// on demand when the user selects an earlier report year/range (§4, R7) — never a
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
//
// isActive (§6): the dashboard stays MOUNTED while the user is on the setup tab so
// switching tabs never re-fetches or loses state. The report-only print styles and
// the browser-print listeners are attached ONLY while the report is the active tab,
// so printing the setup tab never inherits the report's A4 page rule. `stale` shows a
// "data may have changed — refresh" banner after a setup write, without auto-reloading
// on a mere tab switch.
export default function ScopusBenchmarkDashboard({ onGoSetup, api = scopusBenchmarkAPI, isActive = true, stale = false, onRefreshed }) {
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [reload, setReload] = useState(0);

  // Applied range is the atomic report context (§3.1). Draft edits in the header do
  // not touch this until the user presses "แสดงผล". null until the default resolves.
  const [appliedFrom, setAppliedFrom] = useState(null);
  const [appliedTo, setAppliedTo] = useState(null);
  const userApplied = useRef(false);

  const [trendRange, setTrendRange] = useState(5);
  const [windowFrom, setWindowFrom] = useState(DEFAULT_WINDOW_FROM);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // insightsY: single-year insight; insightsPrev: prior year (single mode only);
  // rangeInsights: aggregated range payload (range mode only).
  const [insightsY, setInsightsY] = useState(null);
  const [insightsPrev, setInsightsPrev] = useState(null);
  const [rangeInsights, setRangeInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsReload, setInsightsReload] = useState(0);
  const insightRequest = useRef(0);

  // Refresh coordination (§6/R1): a รีเฟรช marks a pending refresh and stale is cleared
  // ONLY after BOTH the comparison and insights reads of THAT refresh succeed — never
  // on the click, and never by a stale/failed response.
  const refreshTracker = useRef({ pending: false, comparison: false, insights: false });
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const markRefreshLoaded = useCallback((stream) => {
    const tracker = refreshTracker.current;
    if (!tracker.pending) return;
    tracker[stream] = true;
    if (refreshSettled(tracker)) {
      tracker.pending = false;
      onRefreshedRef.current?.();
    }
  }, []);

  // A4 page size is applied ONLY while this report is the active tab (injected at
  // runtime), never as a global @page rule — so printing other pages/tabs is
  // unaffected (§6/R2).
  useEffect(() => {
    if (!isActive) return undefined;
    const style = document.createElement("style");
    style.setAttribute("data-scopus-report-page", "");
    style.textContent = "@media print { @page { size: A4 portrait; margin: 14mm; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, [isActive]);

  // A printed report must be self-contained: expand every collapsed <details> for the
  // duration of the print, then restore. Bound only while the report is active so the
  // setup tab's Ctrl+P is never affected (§6).
  useEffect(() => {
    if (!isActive) return undefined;
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
  }, [isActive]);

  // Comparison read (report context) — kept separate from the setup tab's counts.
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setDataError("");
    api
      .comparison({ year_from: windowFrom, year_to: CURRENT_YEAR })
      .then((response) => {
        if (cancelled) return;
        setData(response?.data || null);
        markRefreshLoaded("comparison"); // a superseded (cancelled) read never clears stale
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
  }, [reload, windowFrom, api, markRefreshLoaded]);

  const yearMeta = data?.year_meta || {};
  // Scope consistency drives EVERY comparison surface (findings, table, KPI share,
  // trend share, CSV). Declared here — before trendPoints/KPIs use it (R3-1).
  const scopeConsistent = data?.report_scope ? data.report_scope.consistent !== false : true;
  const selection = useMemo(() => selectReportYear(yearMeta, CURRENT_YEAR), [yearMeta]);

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
    if (years.length) return years;
    return selection?.year ? [selection.year] : [];
  }, [data, selection]);

  // Default applied range = the deterministically selected single report year. Once
  // the user applies their own range we never override it on a data reload (§3.1).
  useEffect(() => {
    if (userApplied.current) return;
    if (selection?.year != null) {
      setAppliedFrom(selection.year);
      setAppliedTo(selection.year);
    }
  }, [selection]);

  const isRange = appliedFrom != null && appliedTo != null && Number(appliedFrom) !== Number(appliedTo);
  const reportYear = appliedTo; // single-year paths read the (single) applied year
  const includesCurrentYear = appliedTo != null && appliedFrom != null && Number(appliedFrom) <= CURRENT_YEAR && Number(appliedTo) >= CURRENT_YEAR;
  const isCurrentYear = !isRange && reportYear !== null && Number(reportYear) === CURRENT_YEAR;
  const facultyReady = yearMeta?.[reportYear]?.faculty?.status === "available";

  // Widen the comparison read so the applied range/default selection is decided from
  // real readiness (R4-1). We load down to the lowest of: the applied range start, the
  // single-year trend window start, and (for a default) the earliest ended snapshot.
  useEffect(() => {
    if (!yearOptions.length) return;
    const earliest = yearOptions[yearOptions.length - 1];
    const candidates = [];
    if (appliedFrom != null) candidates.push(appliedFrom);
    if (!isRange && reportYear != null) candidates.push(reportYear - trendRange + 1);
    if (!userApplied.current) {
      const floor = resolveBootstrapFloor(data?.available_years, CURRENT_YEAR);
      if (floor != null) candidates.push(floor);
    }
    if (!candidates.length) return;
    const needed = Math.max(earliest, Math.min(...candidates));
    if (needed < windowFrom) setWindowFrom(needed);
  }, [appliedFrom, isRange, reportYear, trendRange, yearOptions, data, windowFrom]);

  // Insights read for the applied context. Range mode issues ONE range request (no
  // per-year fan-out); single-year mode keeps the year + prior-year reads. A request
  // id guards against a stale response overwriting a newer range (§6).
  useEffect(() => {
    if (appliedFrom === null || appliedTo === null) return;
    const requestId = insightRequest.current + 1;
    insightRequest.current = requestId;
    setInsightsLoading(true);
    setInsightsError("");
    setInsightsY(null);
    setInsightsPrev(null);
    setRangeInsights(null);

    if (isRange) {
      api
        .insights({ year_from: appliedFrom, year_to: appliedTo })
        .then((response) => {
          if (insightRequest.current !== requestId) return;
          setRangeInsights(response?.data || null);
          markRefreshLoaded("insights");
        })
        .catch((error) => {
          if (insightRequest.current !== requestId) return;
          setInsightsError(error?.message || "โหลดข้อมูลเชิงลึกของช่วงปีไม่สำเร็จ");
        })
        .finally(() => {
          if (insightRequest.current === requestId) setInsightsLoading(false);
        });
      return;
    }

    const requests = [api.insights({ year: reportYear })];
    // No prior-year insights for a cumulative current year (no YoY) — §9 C.
    if (!isCurrentYear) requests.push(api.insights({ year: reportYear - 1 }));

    Promise.allSettled(requests)
      .then(([current, previous]) => {
        if (insightRequest.current !== requestId) return;
        if (current.status === "fulfilled") {
          setInsightsY(current.value?.data || null);
          // Only the primary year read is required for a refresh; the optional prior-year
          // read failing must not keep the report stale.
          markRefreshLoaded("insights");
        } else setInsightsError(current.reason?.message || "โหลดข้อมูลเชิงลึกไม่สำเร็จ");
        if (previous && previous.status === "fulfilled") setInsightsPrev(previous.value?.data || null);
      })
      .finally(() => {
        if (insightRequest.current === requestId) setInsightsLoading(false);
      });
  }, [appliedFrom, appliedTo, isRange, reportYear, isCurrentYear, insightsReload, api, markRefreshLoaded]);

  const rows = useMemo(() => (Array.isArray(data?.years) ? [...data.years].sort((a, b) => Number(a.year) - Number(b.year)) : []), [data]);
  const rowByYear = useCallback((year) => rows.find((row) => Number(row.year) === Number(year)) || null, [rows]);

  // Per-year usability comes from the snapshot metadata, so a missing snapshot is a
  // gap while a real zero snapshot is a value.
  const usableFaculty = useCallback((year) => yearMeta?.[year]?.faculty?.status === "available", [yearMeta]);
  const usableKku = useCallback((year) => yearMeta?.[year]?.university?.status === "available", [yearMeta]);

  // Insight payload used by every downstream surface: the aggregate levels in range
  // mode, the single-year insight otherwise. Both expose the same `.levels` shape.
  const insightsForDisplay = isRange ? rangeInsights : insightsY;

  // Trend points. Single mode: the 5/10-year window ending at the report year. Range
  // mode: exactly the selected years, so the chart shows the chosen span (§3.1).
  const trendPoints = useMemo(() => {
    if (appliedFrom === null || appliedTo === null) return [];
    const start = isRange ? Number(appliedFrom) : reportYear - trendRange + 1;
    const end = isRange ? Number(appliedTo) : reportYear;
    const points = [];
    for (let year = start; year <= end; year += 1) {
      const row = rowByYear(year);
      const faculty = row && usableFaculty(year) && isUsable(row.faculty) ? Number(row.faculty) : null;
      const kku = row && usableKku(year) && isUsable(row.university) ? Number(row.university) : null;
      // Share is a คณะ-vs-KKU comparison — withheld entirely when scope is inconsistent (R3-1).
      points.push({ year, faculty, kku, share: scopeConsistent ? shareOf(faculty, kku) : null });
    }
    return points;
  }, [appliedFrom, appliedTo, isRange, reportYear, trendRange, rowByYear, usableFaculty, usableKku, scopeConsistent]);

  // Range count aggregation: sum per level across the applied window, null when any
  // year is missing/blocked (with the offending years recorded) — §3.2.
  const rangeCounts = useMemo(
    () => (isRange ? aggregateRangeCounts(rows, yearMeta, Number(appliedFrom), Number(appliedTo)) : null),
    [isRange, rows, yearMeta, appliedFrom, appliedTo],
  );

  const reportRow = rowByYear(reportYear);
  const reportMeta = yearMeta?.[reportYear] || null;
  const normalizedReportRow = useMemo(() => normalizeReportRow(reportRow, reportMeta), [reportRow, reportMeta]);
  const prevRow = rowByYear(reportYear - 1);

  // Counts feeding the KPI + share: aggregate in range mode, single-year otherwise.
  const facultyCount = isRange
    ? rangeCounts?.faculty ?? null
    : reportRow && facultyReady && isUsable(reportRow.faculty) ? Number(reportRow.faculty) : null;
  const kkuCount = isRange
    ? rangeCounts?.university ?? null
    : reportRow && usableKku(reportYear) && isUsable(reportRow.university) ? Number(reportRow.university) : null;
  const prevFacultyCount = prevRow && usableFaculty(reportYear - 1) && isUsable(prevRow.faculty) ? Number(prevRow.faculty) : null;
  const prevKkuCount = prevRow && usableKku(reportYear - 1) && isUsable(prevRow.university) ? Number(prevRow.university) : null;

  const shareNow = shareOf(facultyCount, kkuCount);
  const sharePrev = shareOf(prevFacultyCount, prevKkuCount);

  const facultyInsight = insightsForDisplay?.levels?.faculty || null;
  const kkuInsight = insightsForDisplay?.levels?.kku || null;
  const prevFacultyInsight = insightsPrev?.levels?.faculty || null;

  const scope = data?.report_scope || insightsForDisplay?.scope || { subject_area: "COMP" };
  const sourceDates = useMemo(() => ({
    faculty: formatThaiDate(yearMeta?.[reportYear]?.faculty?.snapshot_at),
    university: formatThaiDate(yearMeta?.[reportYear]?.university?.snapshot_at),
    country: formatThaiDate(yearMeta?.[reportYear]?.country?.snapshot_at),
  }), [yearMeta, reportYear]);

  // Range mode: per-year/per-level snapshot dates so the report never presents the
  // last year's data date as if it covered the whole range (R3). Unknown dates stay
  // unknown — the year is kept, not dropped, so the table can't imply a full window.
  const perYearSnapshots = useMemo(() => {
    if (!isRange || appliedFrom === null || appliedTo === null) return null;
    const out = [];
    for (let year = Number(appliedFrom); year <= Number(appliedTo); year += 1) {
      const meta = yearMeta?.[year] || {};
      out.push({
        year,
        faculty: formatThaiDate(meta.faculty?.snapshot_at),
        university: formatThaiDate(meta.university?.snapshot_at),
        country: formatThaiDate(meta.country?.snapshot_at),
      });
    }
    return out;
  }, [isRange, appliedFrom, appliedTo, yearMeta]);

  const periodLabel = isRange ? `${appliedFrom}–${appliedTo}` : String(reportYear ?? "–");

  const findings = useMemo(() => {
    if (isRange) {
      return buildRangeFindings({
        yearFrom: Number(appliedFrom),
        yearTo: Number(appliedTo),
        includesCurrentYear,
        facultyCount,
        facultyMissingYears: rangeCounts?.missing?.faculty || [],
        faculty: facultyInsight,
        kku: kkuInsight,
        scopeConsistent,
      });
    }
    return buildFindings({
      isCurrentYear,
      reportYear,
      facultyCount,
      prevFacultyCount,
      kkuCount,
      prevKkuCount,
      facultyReady,
      faculty: facultyInsight,
      kku: kkuInsight,
    });
  }, [isRange, appliedFrom, appliedTo, includesCurrentYear, isCurrentYear, reportYear, facultyCount, prevFacultyCount, kkuCount, prevKkuCount, facultyReady, facultyInsight, kkuInsight, rangeCounts, scopeConsistent]);

  // KPI strip (§5 B). In range mode there is NO year-over-year subline (§3.2); the
  // T1–Q2 and international cards always carry a self-explaining denominator + a hint.
  const kpiItems = useMemo(() => {
    const growth = !isRange && !isCurrentYear ? growthInfo(facultyCount, prevFacultyCount) : { status: "unknown" };
    let countSub;
    if (isRange) {
      countSub = rangeCounts?.faculty == null
        ? `ยังรวมทั้งช่วงไม่ได้ (ข้อมูลปี ${(rangeCounts?.missing?.faculty || []).join(", ")} ยังไม่พร้อม)`
        : `รวมช่วง ${periodLabel}${includesCurrentYear ? ` · รวมปี ${appliedTo} ที่ยังไม่ครบปี` : ""}`;
    } else {
      countSub = isCurrentYear
        ? "ข้อมูลสะสม (ยังไม่ครบปี)"
        : growth.status === "pct"
        ? `ปีก่อน ${formatCount(prevFacultyCount)} · ${growth.delta >= 0 ? "+" : "−"}${formatCount(Math.abs(growth.delta))} ผลงาน (${formatPct(growth.pct)})`
        : growth.status === "from_zero"
        ? `ปีก่อน 0 · +${formatCount(growth.delta)} ผลงาน`
        : growth.status === "flat"
        ? "ไม่เปลี่ยนแปลงจากปีก่อน"
        : "ไม่มีข้อมูลปีก่อน";
    }

    const shareValue = scopeConsistent ? formatPct(shareNow) : "ยังเทียบไม่ได้";
    let shareSub;
    if (!scopeConsistent) shareSub = "ขอบเขตไม่ตรง — งดสัดส่วนคณะ/KKU";
    else if (shareNow === null) shareSub = isRange ? "ยังคำนวณสัดส่วนไม่ได้ (ข้อมูลช่วงยังไม่ครบ)" : "ยังคำนวณสัดส่วนไม่ได้";
    else if (isRange) shareSub = `สัดส่วนรวมช่วง ${periodLabel}`;
    else if (isCurrentYear) shareSub = "ข้อมูลสะสม (ยังไม่ครบปี)";
    else if (shareNow !== null && sharePrev !== null) shareSub = `ปีก่อน ${formatPct(sharePrev)} · ${formatPoints(shareNow - sharePrev)}`;
    else shareSub = "ไม่มีข้อมูลปีก่อน";

    const facultyMismatch = facultyInsight?.readiness?.snapshot_mismatch;
    const mismatchNote = facultyMismatch ? "ข้อมูลชุดนี้ยังไม่ครบเทียบ snapshot (ค่าที่แสดงเป็นค่าที่สังเกตได้)" : null;

    const htNow = highTierShare(facultyInsight?.quartile);
    const htDenom = facultyInsight?.available ? highTierDenomText(facultyInsight?.quartile) : "ยังไม่มีข้อมูล";
    const htPrev = highTierShare(prevFacultyInsight?.quartile);
    const qualityComparable = metricReady(facultyInsight, "quality") && metricReady(prevFacultyInsight, "quality");
    const htSub2 = isRange || isCurrentYear
      ? (facultyInsight?.available && !metricReady(facultyInsight, "quality") ? "ข้อมูลวารสารบางส่วนยังไม่ครบในช่วงนี้" : null)
      : qualityComparable && htPrev !== null
      ? `ปีก่อน ${formatPct(htPrev)}`
      : facultyInsight?.available && !metricReady(facultyInsight, "quality")
      ? "ยังเทียบปีก่อน/ระดับไม่ได้ (ข้อมูลวารสารไม่ครบ)"
      : null;

    const intlNowR = observedRate(facultyInsight, "intl");
    const intlNow = intlNowR.value;
    const intlSub = facultyInsight?.available ? intlDenomText(facultyInsight) : "ยังไม่มีข้อมูล";
    const intlPrevR = observedRate(prevFacultyInsight, "intl");
    const intlComparable = metricReady(facultyInsight, "intl") && metricReady(prevFacultyInsight, "intl");
    const intlSub2 = isRange || isCurrentYear
      ? (facultyInsight?.available && !metricReady(facultyInsight, "intl") ? "ข้อมูลสังกัดบางส่วนยังไม่ครบในช่วงนี้" : null)
      : intlComparable && intlPrevR.value !== null
      ? `ปีก่อน ${formatPct(intlPrevR.value)}`
      : facultyInsight?.available && !metricReady(facultyInsight, "intl")
      ? "ยังเทียบปีก่อน/ระดับไม่ได้ (ข้อมูลสังกัดไม่ครบ)"
      : null;

    return [
      { label: isRange ? "จำนวนผลงานคณะ (รวมช่วง)" : "จำนวนผลงานคณะ", value: formatCount(facultyCount), unit: "ผลงาน", sublines: [countSub, mismatchNote].filter(Boolean) },
      { label: "สัดส่วนผลงานคณะต่อ KKU", value: shareValue, sublines: [shareSub] },
      { label: "ผลงานในวารสารกลุ่ม T1–Q2", value: formatPct(htNow), sublines: [htDenom, htSub2].filter(Boolean), hint: HINT_T1Q2 },
      { label: "ผลงานร่วมกับต่างประเทศ", value: formatPct(intlNow), sublines: [intlSub, intlSub2].filter(Boolean), hint: HINT_INTL },
    ];
  }, [isRange, isCurrentYear, includesCurrentYear, appliedTo, periodLabel, rangeCounts, facultyCount, prevFacultyCount, shareNow, sharePrev, facultyInsight, prevFacultyInsight, scopeConsistent]);

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
    // Export the years actually shown: the applied range in range mode, else the
    // trend window ending at the report year (R8).
    const start = isRange ? Number(appliedFrom) : reportYear - trendRange + 1;
    const end = isRange ? Number(appliedTo) : reportYear;
    const visibleRows = rows.filter((row) => Number(row.year) >= start && Number(row.year) <= end);
    download(`scopus-benchmark-รายปี-${start}-${end}.csv`, buildYearlyCsv({ rows: visibleRows, yearMeta, scope }));
  }, [download, rows, yearMeta, scope, isRange, appliedFrom, appliedTo, reportYear, trendRange]);

  const exportComparison = useCallback(() => {
    if (isRange) {
      download(
        `scopus-benchmark-เปรียบเทียบ-${appliedFrom}-${appliedTo}.csv`,
        buildComparisonCsv({
          yearFrom: Number(appliedFrom),
          yearTo: Number(appliedTo),
          counts: { faculty: rangeCounts?.faculty ?? null, kku: rangeCounts?.university ?? null, thailand: rangeCounts?.country ?? null },
          insights: rangeInsights,
          scope,
        }),
      );
      return;
    }
    download(`scopus-benchmark-เปรียบเทียบ-${reportYear}.csv`, buildComparisonCsv({ reportYear, row: reportRow, meta: reportMeta, insights: insightsY, scope }));
  }, [download, isRange, appliedFrom, appliedTo, rangeCounts, rangeInsights, reportYear, reportRow, reportMeta, insightsY, scope]);

  const applyRange = useCallback((from, to) => {
    userApplied.current = true;
    setAppliedFrom(from);
    setAppliedTo(to);
  }, []);

  // Document-level CSV export (§10). The level + applied range are captured at call
  // time so a later range change never redirects an in-flight export. One export runs
  // at a time; a 404 ("no documents") and any other failure surface a message and
  // never leave a half-written file.
  const [exportingLevel, setExportingLevel] = useState(null);
  const [exportDocMsg, setExportDocMsg] = useState(null);
  const exportDocuments = useCallback(async (level) => {
    if (exportingLevel) return;
    if (typeof api.exportDocuments !== "function") {
      setExportDocMsg({ tone: "error", text: "การส่งออกเอกสารใช้ได้เฉพาะบนระบบจริง (ไม่รองรับในตัวอย่าง)" });
      return;
    }
    const from = Number(appliedFrom);
    const to = Number(appliedTo);
    const levelLabel = level === "country" ? "Thailand" : "KKU";
    setExportingLevel(level);
    setExportDocMsg(null);
    try {
      const meta = await api.exportDocuments(level, { year_from: from, year_to: to });
      const rows = meta?.count ? `${meta.count.toLocaleString("th-TH")} แถว ` : "";
      if (meta?.incomplete) {
        const yearNote = meta.missingYears?.length ? `: ปี ${meta.missingYears.join(", ")} ยังดึงเอกสารไม่ครบ` : "";
        const harvestNote = meta.activeHarvest ? " · กำลังดึงข้อมูลอยู่" : "";
        setExportDocMsg({ tone: "warn", text: `ส่งออกเอกสาร ${levelLabel} ${rows}ช่วงปี ${from}–${to} แล้ว — ข้อมูลที่จัดเก็บอาจยังไม่ครบตาม snapshot${yearNote}${harvestNote}` });
      } else {
        setExportDocMsg({ tone: "success", text: `ส่งออกเอกสาร ${levelLabel} ${rows}ช่วงปี ${from}–${to} แล้ว` });
      }
    } catch (error) {
      const status = error?.status;
      setExportDocMsg({
        tone: "error",
        text: status === 404
          ? `ไม่พบเอกสาร ${levelLabel} ในช่วงปี ${from}–${to}`
          : `ส่งออกเอกสาร ${levelLabel} ไม่สำเร็จ: ${error?.message || "เกิดข้อผิดพลาด"}`,
      });
    } finally {
      setExportingLevel(null);
    }
  }, [api, appliedFrom, appliedTo, exportingLevel]);

  if (dataLoading && !data) return <Skeleton />;
  if (dataError && !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <span className="flex items-center gap-2"><AlertCircle size={17} aria-hidden="true" />{dataError}</span>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="font-semibold underline">ลองใหม่</button>
      </div>
    );
  }
  if (appliedFrom === null || appliedTo === null) {
    if (yearOptions.length) return <Skeleton />;
    return <EmptyState onGoSetup={onGoSetup} />;
  }

  const trendRangeLabel = `${reportYear - trendRange + 1}–${reportYear}`;
  const busy = dataLoading || (insightsLoading && !insightsForDisplay);
  const refreshAll = () => {
    // Arm the refresh; stale is cleared later, only once BOTH reads succeed (R1).
    refreshTracker.current = { pending: true, comparison: false, insights: false };
    setReload((value) => value + 1);
    setInsightsReload((value) => value + 1);
  };
  // Scope guard (§4/R2-3/R3-1): on mismatch we withhold every comparative surface.
  const scopeMismatch = !scopeConsistent;
  const shownFindings = scopeMismatch
    ? ["ขอบเขตข้อมูลของสามระดับไม่ตรงกันหรือไม่ใช่ Computer Science (COMP) จึงงดข้อสรุปเปรียบเทียบจนกว่าจะตั้งค่าขอบเขตให้ตรง"]
    : findings;

  return (
    <div id="scopus-report-root" className="rounded-lg border border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <ReportHeader
          yearFrom={Number(appliedFrom)}
          yearTo={Number(appliedTo)}
          minYear={yearOptions.length ? yearOptions[yearOptions.length - 1] : 1900}
          maxYear={CURRENT_YEAR}
          onApply={applyRange}
          periodLabel={periodLabel}
          isRange={isRange}
          includesCurrentYear={includesCurrentYear}
          trendRangeLabel={trendRangeLabel}
          sourceDates={sourceDates}
          busy={busy}
          onPrint={() => { if (!busy) window.print(); }}
          onRefresh={refreshAll}
          onExportYearly={exportYearly}
          onExportComparison={exportComparison}
          exportComparisonLabel={isRange ? "ตารางเปรียบเทียบช่วงปี (CSV)" : "ตารางเปรียบเทียบปีรายงาน (CSV)"}
          onExportDocsKku={() => exportDocuments("university")}
          onExportDocsThailand={() => exportDocuments("country")}
          exportingLevel={exportingLevel}
          onToggleSources={() => {
            setSourcesOpen(true);
            requestAnimationFrame(() => document.getElementById("scopus-report-sources")?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        />

        {exportDocMsg && (
          <div className={`no-print mt-4 flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm ${exportDocMsg.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : exportDocMsg.tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"}`} role="status">
            <AlertCircle size={16} aria-hidden="true" />{exportDocMsg.text}
          </div>
        )}

        {stale && (
          <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span className="flex items-center gap-2"><AlertCircle size={16} aria-hidden="true" />ข้อมูลอาจมีการอัปเดต กดรีเฟรชเพื่อดูข้อมูลล่าสุด</span>
            <button type="button" onClick={refreshAll} className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">รีเฟรช</button>
          </div>
        )}

        {scopeMismatch && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <AlertCircle size={16} aria-hidden="true" />ขอบเขตข้อมูลของสามระดับไม่ตรงกันหรือไม่ใช่ Computer Science (COMP) — งดข้อสรุปและการเปรียบเทียบทั้งหมด แสดงเฉพาะค่าที่สังเกตได้ (คณะ {scope.faculty_subject_area || "?"} · KKU {scope.university_subject_area || scope.subject_area} · ประเทศไทย {scope.country_subject_area || "?"})
          </div>
        )}

        {dataError && data && (
          // A refresh/reload of the comparison read failed but a previous set is still
          // shown — say so explicitly so old counts + new insights are never read as one
          // freshly-refreshed set (R1). Printable; retry is screen-only.
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span className="flex items-center gap-2"><AlertCircle size={16} aria-hidden="true" />โหลดข้อมูลเปรียบเทียบใหม่ไม่สำเร็จ — กำลังแสดงข้อมูลชุดเดิม: {dataError}</span>
            <button type="button" onClick={() => setReload((value) => value + 1)} className="no-print font-semibold underline">ลองใหม่</button>
          </div>
        )}

        {insightsError && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            <span className="flex items-center gap-2"><AlertCircle size={16} aria-hidden="true" />ข้อมูลเชิงลึกบางส่วนโหลดไม่สำเร็จ: {insightsError}</span>
            <button type="button" onClick={() => setInsightsReload((value) => value + 1)} className="no-print font-semibold underline">ลองใหม่</button>
          </div>
        )}

        <KpiStrip items={kpiItems} />
        <KeyFindings findings={shownFindings} />
        <TrendCharts
          points={trendPoints}
          reportYear={isRange ? null : reportYear}
          currentYear={CURRENT_YEAR}
          trendRange={trendRange}
          onRangeChange={setTrendRange}
          scopeConsistent={scopeConsistent}
          showRangeSelector={!isRange}
          periodLabel={periodLabel}
        />

        {insightsLoading && !insightsForDisplay ? (
          <div className="border-b border-slate-200 py-6"><div className="h-40 animate-pulse rounded bg-slate-100" /></div>
        ) : (
          <>
            <ComparisonTable periodLabel={periodLabel} isRange={isRange} row={isRange ? { faculty: rangeCounts?.faculty ?? null, university: rangeCounts?.university ?? null, country: rangeCounts?.country ?? null } : normalizedReportRow} insights={insightsForDisplay} scopeConsistent={scopeConsistent} />
            <CitationsSection periodLabel={periodLabel} isRange={isRange} insights={insightsForDisplay} />
            <QualityTypeDetails insights={insightsForDisplay} />
          </>
        )}

        <SourceNotes
          periodLabel={periodLabel}
          isRange={isRange}
          perYearSnapshots={perYearSnapshots}
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
