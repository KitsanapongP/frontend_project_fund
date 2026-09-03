"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  BarChart3,
  Download,
  FileText,
  Globe2,
  Info,
  LockKeyhole,
  Printer,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { scopusBenchmarkAPI } from "@/app/lib/api";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = { faculty: "#2563eb", kku: "#0ea5e9", thailand: "#94a3b8" };
const LEVELS = [
  { key: "faculty", label: "คณะ", color: COLORS.faculty },
  { key: "kku", label: "KKU", color: COLORS.kku },
  { key: "thailand", label: "Thailand", color: COLORS.thailand },
];

const fmt = (value, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "–";
  return Number(value).toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const percent = (part, whole) => (Number(whole) > 0 ? (Number(part || 0) / Number(whole)) * 100 : null);
const pct = (value, digits = 1) => (value === null || value === undefined ? "–" : `${fmt(value, digits)}%`);
const q12Percent = (level) => {
  const q = level?.quartile;
  if (!level?.available || !q) return null;
  return percent(Number(q.q1 || 0) + Number(q.q2 || 0), Number(q.q1 || 0) + Number(q.q2 || 0) + Number(q.q3 || 0) + Number(q.q4 || 0));
};

function InfoTip({ text }) {
  return (
    <span className="group relative inline-flex shrink-0 align-middle">
      <button type="button" aria-label={`ข้อมูลเพิ่มเติม: ${text}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
        <Info size={15} aria-hidden="true" />
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function Panel({ title, info, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <InfoTip text={info} />
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5" aria-label="กำลังโหลดแดชบอร์ด">
      <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg bg-slate-200" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3"><div className="h-96 animate-pulse rounded-lg bg-slate-200 xl:col-span-2" /><div className="h-96 animate-pulse rounded-lg bg-slate-200" /></div>
    </div>
  );
}

function MiniBar({ label, value, color, highlight }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={highlight ? "font-semibold text-blue-800" : "text-slate-600"}>{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">{pct(value, 0)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-slate-200">
        <div className="h-full rounded-sm" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, unit, delta, hint, color }) {
  const deltaValue = delta === null ? null : Number(delta);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50" style={{ color }}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <InfoTip text={hint} />
      </div>
      <div className="mt-4 text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-end gap-1.5">
        <span className="text-4xl font-bold leading-none tabular-nums text-slate-900">{value}</span>
        {unit && <span className="pb-0.5 text-sm text-slate-500">{unit}</span>}
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {deltaValue === null ? "ไม่มีข้อมูลปีก่อนหน้า" : (
          <span className={deltaValue > 0 ? "text-green-700" : deltaValue < 0 ? "text-red-700" : "text-slate-500"}>
            {deltaValue > 0 ? "+" : ""}{fmt(deltaValue, 1)}% จากปีก่อน
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ onGoSetup }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <BarChart3 className="mx-auto text-slate-400" size={36} aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-slate-800">ยังไม่มีข้อมูลสำหรับเปรียบเทียบ</h2>
      <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">ไปที่แท็บตั้งค่า &amp; ดึงข้อมูล แล้วอัปเดตตัวเลขหรือดึงเอกสาร benchmark ก่อน</p>
      <button type="button" onClick={onGoSetup}
        className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
        ไปหน้าตั้งค่า
      </button>
    </div>
  );
}

export default function ScopusBenchmarkDashboard({
  comparison = [], loading, yearFrom, yearTo, onRangeChange, onRefresh, onGoSetup,
}) {
  const [chartMode, setChartMode] = useState("count");
  const [deepYear, setDeepYear] = useState(yearTo);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState("");
  const [insightsReload, setInsightsReload] = useState(0);
  const [journals, setJournals] = useState([]);
  const [journalsError, setJournalsError] = useState("");
  const insightRequest = useRef(0);

  const rows = useMemo(() => [...comparison].sort((a, b) => Number(a.year) - Number(b.year)), [comparison]);
  const hasData = rows.some((row) => Number(row.faculty) > 0 || Number(row.university) > 0 || Number(row.country) > 0);
  const deepYears = useMemo(() => rows.filter((row) => Number(row.faculty) > 0 || Number(row.university) > 0 || Number(row.country) > 0).map((row) => Number(row.year)).sort((a, b) => b - a), [rows]);
  const minYearOption = Math.min(yearFrom, CURRENT_YEAR - 19);
  const yearOptions = useMemo(() => Array.from({ length: CURRENT_YEAR - minYearOption + 1 }, (_, index) => CURRENT_YEAR - index), [minYearOption]);

  useEffect(() => {
    if (!deepYears.length) return;
    if (!deepYears.includes(Number(deepYear)) || deepYear < yearFrom || deepYear > yearTo) setDeepYear(deepYears.find((year) => year >= yearFrom && year <= yearTo) || yearTo);
  }, [deepYear, deepYears, yearFrom, yearTo]);

  useEffect(() => {
    if (!deepYear) return;
    const requestId = insightRequest.current + 1;
    insightRequest.current = requestId;
    setInsightsLoading(true);
    setInsights(null);
    setInsightsError("");
    scopusBenchmarkAPI.insights({ year: deepYear })
      .then((response) => {
        if (insightRequest.current === requestId) setInsights(response?.data || null);
      })
      .catch((error) => {
        if (insightRequest.current === requestId) setInsightsError(error?.message || "โหลดข้อมูลเชิงลึกไม่สำเร็จ");
      })
      .finally(() => {
        if (insightRequest.current === requestId) setInsightsLoading(false);
      });
  }, [deepYear, insightsReload]);

  useEffect(() => {
    scopusBenchmarkAPI.topJournals({ limit: 8 })
      .then((response) => setJournals(Array.isArray(response?.data) ? response.data : []))
      .catch((error) => setJournalsError(error?.message || "โหลดวารสารเด่นไม่สำเร็จ"));
  }, []);

  const selectedRows = useMemo(() => rows.filter((row) => Number(row.year) >= yearFrom && Number(row.year) <= yearTo), [rows, yearFrom, yearTo]);
  const latest = [...selectedRows].reverse().find((row) => Number(row.faculty) > 0 || Number(row.university) > 0 || Number(row.country) > 0) || null;
  const previous = latest ? selectedRows.find((row) => Number(row.year) === Number(latest.year) - 1) : null;
  const yoy = useCallback((key) => {
    if (!latest || !previous || Number(previous[key]) <= 0) return null;
    return ((Number(latest[key] || 0) - Number(previous[key])) / Number(previous[key])) * 100;
  }, [latest, previous]);
  const shareNow = latest ? percent(latest.faculty, latest.university) : null;
  const sharePrev = previous ? percent(previous.faculty, previous.university) : null;
  const shareDelta = shareNow === null || sharePrev === null || sharePrev === 0 ? null : ((shareNow - sharePrev) / sharePrev) * 100;

  const chartOptions = useMemo(() => ({
    chart: { toolbar: { show: false }, fontFamily: "Sarabun, sans-serif", animations: { enabled: false } },
    colors: [COLORS.faculty, COLORS.kku, COLORS.thailand],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    markers: { size: 3, strokeWidth: 0 },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
    xaxis: { categories: selectedRows.map((row) => String(row.year)), axisBorder: { color: "#cbd5e1" }, axisTicks: { show: false } },
    yaxis: { min: 0, labels: { formatter: (value) => chartMode === "share" ? `${fmt(value, 0)}%` : fmt(value) } },
    tooltip: { shared: true, intersect: false, y: { formatter: (value) => chartMode === "share" ? pct(value) : `${fmt(value)} ผลงาน` } },
  }), [chartMode, selectedRows]);
  const chartSeries = useMemo(() => chartMode === "count" ? [
    { name: "คณะ", data: selectedRows.map((row) => Number(row.faculty || 0)) },
    { name: "KKU", data: selectedRows.map((row) => Number(row.university || 0)) },
    { name: "Thailand", data: selectedRows.map((row) => Number(row.country || 0)) },
  ] : [
    { name: "คณะ / KKU", data: selectedRows.map((row) => Number((percent(row.faculty, row.university) || 0).toFixed(2))) },
    { name: "KKU / Thailand", data: selectedRows.map((row) => Number((percent(row.university, row.country) || 0).toFixed(2))) },
    { name: "คณะ / Thailand", data: selectedRows.map((row) => Number((percent(row.faculty, row.country) || 0).toFixed(2))) },
  ], [chartMode, selectedRows]);

  const availableLevels = LEVELS.filter(({ key }) => insights?.levels?.[key]?.available);
  const thailandMissing = insights && !insights.levels?.thailand?.available;
  const coverage = insights?.quartile_coverage;
  const coveragePct = percent(coverage?.classified, coverage?.total);
  const maxJournalDocs = Math.max(...journals.map((journal) => Number(journal.docs || 0)), 1);

  const deepBarOptions = (max = 100, suffix = "%") => ({
    chart: { toolbar: { show: false }, fontFamily: "Sarabun, sans-serif", animations: { enabled: false } },
    colors: availableLevels.map((level) => level.color), dataLabels: { enabled: true, formatter: (value) => `${fmt(value, 0)}${suffix}` },
    legend: { show: false }, grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: "55%" } },
    xaxis: { categories: availableLevels.map((level) => level.label), max, labels: { formatter: (value) => `${fmt(value, 0)}${suffix}` } },
    tooltip: { y: { formatter: (value) => `${fmt(value, 1)}${suffix}` } },
  });

  const exportCsv = () => {
    const header = ["year", "faculty", "kku", "thailand", "faculty_kku_pct", "faculty_thailand_pct"];
    const lines = selectedRows.map((row) => [row.year, row.faculty ?? "", row.university ?? "", row.country ?? "", percent(row.faculty, row.university)?.toFixed(2) ?? "", percent(row.faculty, row.country)?.toFixed(2) ?? ""]);
    const blob = new Blob(["\uFEFF" + [header, ...lines].map((line) => line.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `scopus-benchmark-${yearFrom}-${yearTo}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (years) => {
    const latestYear = deepYears[0] || CURRENT_YEAR;
    onRangeChange({ yearFrom: latestYear - years + 1, yearTo: latestYear });
    setDeepYear(latestYear);
  };
  const updateBoundary = (field, value) => {
    const numeric = Number(value);
    const next = field === "from"
      ? { yearFrom: Math.min(numeric, yearTo), yearTo }
      : { yearFrom: Math.min(yearFrom, numeric), yearTo: numeric };
    onRangeChange(next);
    if (field === "to") setDeepYear(numeric);
  };

  if ((loading && !comparison.length) || (insightsLoading && !insights)) return <Skeleton />;
  if (!hasData) return <EmptyState onGoSetup={onGoSetup} />;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700"><Sparkles size={16} aria-hidden="true" /> BENCHMARK INSIGHT <InfoTip text="สรุปจุดเด่นของคณะจากข้อมูล document-level ในปีที่เลือก" /></div>
            <h2 className="mt-3 text-2xl font-semibold leading-snug text-slate-950">
              ภาพรวมคุณภาพและเครือข่ายงานวิจัย Computer Science
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              ปี {deepYear}: ผลงานคณะอยู่ในวารสาร Q1–Q2 {pct(q12Percent(insights?.levels?.faculty), 0)} และมีความร่วมมือต่างชาติ {pct(insights?.levels?.faculty?.intl_pct, 0)}
            </p>
            <p className="mt-4 border-l-2 border-blue-600 pl-3 text-sm font-medium text-slate-700">
              {q12Percent(insights?.levels?.faculty) >= q12Percent(insights?.levels?.kku)
                ? "คณะมีสัดส่วนผลงาน Q1–Q2 สูงกว่าหรือเท่าภาพรวม KKU ในปีที่เลือก"
                : "คุณภาพวารสารของคณะยังมีช่องว่างเมื่อเทียบกับภาพรวม KKU ในปีที่เลือก"}
            </p>
          </div>
          <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-white/80 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">ผลงาน Q1–Q2 <InfoTip text="สัดส่วนเอกสาร Q1 และ Q2 ต่อเอกสารที่จับคู่ CiteScore quartile ได้ในแต่ละระดับ" /></div>
              <div className="space-y-2">{availableLevels.map((level) => <MiniBar key={level.key} label={level.label} value={q12Percent(insights?.levels?.[level.key])} color={level.color} highlight={level.key === "faculty"} />)}</div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white/80 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">ความร่วมมือต่างชาติ <InfoTip text="ร้อยละของเอกสารที่มีผู้แต่งอย่างน้อยหนึ่งคนจากหน่วยงานนอกประเทศไทย" /></div>
              <div className="space-y-2">{availableLevels.map((level) => <MiniBar key={level.key} label={level.label} value={insights?.levels?.[level.key]?.intl_pct} color={level.color} highlight={level.key === "faculty"} />)}</div>
            </div>
          </div>
        </div>
      </section>

      {insightsError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2"><AlertCircle size={17} aria-hidden="true" />{insightsError}</span>
          <button type="button" onClick={() => setInsightsReload((value) => value + 1)} className="font-semibold underline">ลองใหม่</button>
        </div>
      )}
      {thailandMissing && <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">Thailand ยังไม่มีข้อมูล document-level ในปี {deepYear} — ส่วนเชิงลึกจะแสดงเฉพาะคณะเทียบกับ KKU</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label={`ผลงานคณะ · ${latest?.year || "–"}`} value={fmt(latest?.faculty)} unit="ผลงาน" delta={yoy("faculty")} color={COLORS.faculty} hint="จำนวนผลงาน Computer Science ที่ยืนยันผู้แต่งคณะในปีล่าสุดของช่วงที่เลือก เทียบ YoY กับปีก่อนหน้า" />
        <KpiCard icon={BarChart3} label={`ผลงาน KKU · ${latest?.year || "–"}`} value={fmt(latest?.university)} unit="ผลงาน" delta={yoy("university")} color={COLORS.kku} hint="จำนวนผลงาน Computer Science ทั้งมหาวิทยาลัยขอนแก่นในปีล่าสุดของช่วงที่เลือก" />
        <KpiCard icon={Globe2} label={`ผลงาน Thailand · ${latest?.year || "–"}`} value={fmt(latest?.country)} unit="ผลงาน" delta={yoy("country")} color={COLORS.thailand} hint="จำนวนผลงาน Computer Science ที่มีหน่วยงานในประเทศไทยในปีล่าสุดของช่วงที่เลือก" />
        <KpiCard icon={TrendingUp} label={`สัดส่วนคณะ / KKU · ${latest?.year || "–"}`} value={pct(shareNow, 1)} delta={shareDelta} color="#16a34a" hint="จำนวนผลงานคณะหารด้วยจำนวนผลงาน KKU ในปีเดียวกัน พร้อมการเปลี่ยนแปลงเทียบปีก่อน" />
      </div>

      {Number(latest?.year) === CURRENT_YEAR && <div className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{CURRENT_YEAR} · ข้อมูลบางส่วน</div>}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="แนวโน้มรายปี" info="กราฟ 3 ระดับตามช่วงปีที่เลือก สลับระหว่างจำนวนผลงานและสัดส่วนเปรียบเทียบได้" className="xl:col-span-2"
          action={<div className="flex flex-wrap items-center gap-2">
            <select aria-label="ปีเริ่มต้น" value={yearFrom} onChange={(event) => updateBoundary("from", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <span className="text-xs text-slate-400">ถึง</span>
            <select aria-label="ปีสิ้นสุด" value={yearTo} onChange={(event) => updateBoundary("to", event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <button type="button" onClick={() => applyPreset(5)} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">5 ปีล่าสุด</button>
            <button type="button" onClick={() => applyPreset(10)} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">10 ปี</button>
            <button type="button" aria-label="รีเฟรชข้อมูล" onClick={onRefresh} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"><RefreshCw size={15} aria-hidden="true" /></button>
          </div>}>
          <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {[{ key: "count", label: "จำนวน" }, { key: "share", label: "สัดส่วน %" }].map((mode) => <button key={mode.key} type="button" onClick={() => setChartMode(mode.key)} className={`rounded-md px-3 py-1.5 ${chartMode === mode.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{mode.label}</button>)}
          </div>
          <ApexChart key={`${chartMode}-${yearFrom}-${yearTo}`} type="line" height={330} options={chartOptions} series={chartSeries} />
        </Panel>

        <Panel title="คุณภาพวารสาร" info="สัดส่วน Q1+Q2 จากเอกสารที่มี CiteScore quartile ในแต่ละระดับสำหรับปี deep-dive ที่เลือก"
          action={<select aria-label="ปีข้อมูลเชิงลึก" value={deepYear} onChange={(event) => setDeepYear(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">{deepYears.filter((year) => year >= yearFrom && year <= yearTo).map((year) => <option key={year} value={year}>{year}</option>)}</select>}>
          {insightsLoading ? <div className="h-64 animate-pulse rounded-md bg-slate-100" /> : availableLevels.length ? <>
            <ApexChart type="bar" height={245} options={deepBarOptions()} series={[{ name: "Q1+Q2", data: availableLevels.map((level) => Number((q12Percent(insights?.levels?.[level.key]) || 0).toFixed(2))) }]} />
            <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">อิงวารสารที่มีค่า CiteScore {pct(coveragePct, 1)} ({fmt(coverage?.classified)}/{fmt(coverage?.total)} ผลงาน)</div>
          </> : <div className="py-16 text-center text-sm text-slate-400">ไม่มีข้อมูลเชิงลึกในปีนี้</div>}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Open Access" info="ร้อยละของเอกสารที่ Scopus ระบุ openaccess_flag = 1 ในปีที่เลือก">
          {insightsLoading ? <div className="h-52 animate-pulse bg-slate-100" /> : <ApexChart type="bar" height={220} options={deepBarOptions()} series={[{ name: "Open Access", data: availableLevels.map((level) => insights?.levels?.[level.key]?.oa_pct || 0) }]} />}
        </Panel>
        <Panel title="ความร่วมมือต่างชาติ" info="ร้อยละของเอกสารที่มีหน่วยงานผู้แต่งอย่างน้อยหนึ่งแห่งอยู่นอกประเทศไทย">
          {insightsLoading ? <div className="h-52 animate-pulse bg-slate-100" /> : <ApexChart type="bar" height={220} options={deepBarOptions()} series={[{ name: "International", data: availableLevels.map((level) => insights?.levels?.[level.key]?.intl_pct || 0) }]} />}
        </Panel>
        <Panel title="ประเภทผลงาน" info="จำแนก Scopus subtype เป็น Article, Conference Paper และ Other สำหรับปีที่เลือก">
          {insightsLoading ? <div className="h-52 animate-pulse bg-slate-100" /> : <ApexChart type="bar" height={220} options={{ ...deepBarOptions(undefined, ""), colors: ["#2563eb", "#60a5fa", "#cbd5e1"], chart: { ...deepBarOptions().chart, stacked: true }, dataLabels: { enabled: false }, legend: { show: true, position: "bottom" }, xaxis: { categories: availableLevels.map((level) => level.label), labels: { formatter: (value) => fmt(value) } } }} series={[
            { name: "Article", data: availableLevels.map((level) => insights?.levels?.[level.key]?.doctypes?.article || 0) },
            { name: "Conference", data: availableLevels.map((level) => insights?.levels?.[level.key]?.doctypes?.conference || 0) },
            { name: "Other", data: availableLevels.map((level) => insights?.levels?.[level.key]?.doctypes?.other || 0) },
          ]} />}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="วารสารเด่นของ KKU" info="วารสารที่ผลงาน KKU ในชุด benchmark ทุกปีตีพิมพ์บ่อยที่สุด เรียงตามจำนวนเอกสาร">
          {journalsError ? <p className="text-sm text-red-700">{journalsError}</p> : journals.length ? <div className="space-y-3">{journals.map((journal, index) => <div key={`${journal.name}-${index}`}>
            <div className="flex items-start justify-between gap-4 text-xs"><span className="min-w-0 text-slate-700"><span className="mr-2 font-semibold text-slate-400">{index + 1}</span>{journal.name}</span><span className="shrink-0 tabular-nums text-slate-500">{fmt(journal.docs)} · cite {fmt(journal.avg_cite, 1)}</span></div>
            <div className="mt-1.5 h-1.5 bg-slate-100"><div className="h-full bg-sky-500" style={{ width: `${(Number(journal.docs) / maxJournalDocs) * 100}%` }} /></div>
          </div>)}</div> : <div className="py-12 text-center text-sm text-slate-400">ยังไม่มีข้อมูลวารสาร</div>}
        </Panel>
        <Panel title="การมีส่วนร่วมของคณะ" info="สัดส่วนผลงานคณะต่อผลงาน KKU ในแต่ละปีของช่วงที่เลือก ยิ่งสูงยิ่งสะท้อนส่วนร่วมของคณะมาก">
          <ApexChart type="area" height={300} options={{ ...chartOptions, colors: [COLORS.faculty], fill: { type: "solid", opacity: 0.12 }, yaxis: { min: 0, labels: { formatter: (value) => `${fmt(value, 0)}%` } }, legend: { show: false } }} series={[{ name: "คณะ / KKU", data: selectedRows.map((row) => Number((percent(row.faculty, row.university) || 0).toFixed(2))) }]} />
        </Panel>
      </div>

      <Panel title="รายงานและการส่งออก" info="ส่งออกข้อมูล time-series ตามช่วงปีที่เลือกเป็น CSV หรือเปิดหน้าต่างพิมพ์เพื่อจัดทำรายงาน PDF">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3"><span className="rounded-md border border-blue-200 bg-blue-50 p-2 text-blue-700"><LockKeyhole size={18} aria-hidden="true" /></span><div><div className="text-sm font-semibold text-slate-800">ข้อมูลสำหรับงานบริหารและวางแผน</div><p className="mt-0.5 text-xs text-slate-500">ช่วงปี {yearFrom}–{yearTo} · deep-dive ปี {deepYear}</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"><Download size={16} aria-hidden="true" />ส่งออก CSV</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"><Printer size={16} aria-hidden="true" />พิมพ์รายงาน</button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
