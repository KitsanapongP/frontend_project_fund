"use client";

import { RESEARCH_FUND_PAGE_ICONS } from "@/app/lib/research_fund_menu_presentation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { scopusBenchmarkAPI } from "@/app/lib/api";
import { latestPositiveMetric, normalizeYearRange } from "@/app/lib/scopus_benchmark_helpers.mjs";
import PageLayout from "../common/PageLayout";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CURRENT_YEAR = new Date().getFullYear();
const ACCENT = "#4f46e5"; // indigo (faculty)
const C_UNI = "#0ea5e9"; // sky (KKU)
const C_COUNTRY = "#94a3b8"; // slate (Thailand)

const fmt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("th-TH"));
const share = (part, whole) => (part === null || part === undefined || !whole ? null : (Number(part) / Number(whole)) * 100);
const pctLabel = (part, whole) => {
  const s = share(part, whole);
  return s === null ? "–" : `${s.toFixed(1)}%`;
};
function formatDateTime(v) {
  if (!v) return "–";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatRunYears(run) {
  return run?.year_from && run?.year_to ? `${run.year_from}–${run.year_to}` : "ทุกปี";
}
const isRunning = (s) => ["running", "in_progress"].includes((s || "").toLowerCase());

function StatusDot({ state }) {
  const map = { done: "bg-emerald-500", partial: "bg-amber-400", todo: "bg-slate-300" };
  const label = { done: "เสร็จแล้ว", partial: "บางส่วน", todo: "ยังไม่ทำ" }[state] || "";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`h-2.5 w-2.5 rounded-full ${map[state] || map.todo}`} />
      {label}
    </span>
  );
}

function RunStatus({ status }) {
  const s = (status || "").toLowerCase();
  const cls =
    ["success", "completed"].includes(s) ? "text-emerald-600"
    : ["failed", "error"].includes(s) ? "text-rose-600"
    : ["cancelled", "canceled"].includes(s) ? "text-slate-500"
    : isRunning(s) ? "text-amber-600"
    : "text-slate-600";
  return <span className={`text-xs font-medium capitalize ${cls}`}>{status || "–"}</span>;
}

function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8"
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="text-base font-semibold text-slate-900">วิธีใช้งาน</div>
          <button type="button" onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600">ปิด</button>
        </div>
        <div className="space-y-5 px-6 py-5 text-sm leading-relaxed text-slate-700">
          <section>
            <div className="mb-1 font-semibold text-slate-900">หน้านี้ใช้ทำอะไร</div>
            <p>เปรียบเทียบจำนวนผลงานตีพิมพ์หมวด Computer Science ในแต่ละปี ระหว่างคณะของเรา
            มหาวิทยาลัยขอนแก่น และทั้งประเทศไทย เพื่อดูว่าคณะมีสัดส่วนผลงานมากน้อยแค่ไหน</p>
          </section>

          <section>
            <div className="mb-1 font-semibold text-slate-900">ตัวเลขแต่ละคอลัมน์มาจากไหน</div>
            <p className="mb-1">ตัวเลขใช้ข้อมูล Scopus โดยเกณฑ์ของแต่ละระดับดังนี้</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><b>คณะ</b> — ผลงาน Computer Science ในชุด KKU ที่อาจารย์ในระบบเป็นผู้แต่งและมี AF-ID 60017165 หรือ 60280609 บนผลงาน หากมีวันเริ่มงาน ระบบจะตัดผลงานก่อนวันนั้นออก</li>
              <li><b>KKU</b> — ผลงาน Computer Science ทั้งหมดของมหาวิทยาลัยขอนแก่น</li>
              <li><b>Thailand</b> — ผลงาน Computer Science ทั้งหมดของประเทศไทย</li>
            </ul>
          </section>

          <section>
            <div className="mb-1 font-semibold text-slate-900">ลำดับที่ควรทำ</div>
            <ol className="ml-4 list-decimal space-y-1">
              <li>ตั้งค่า AF-ID ของ KKU (ทำครั้งเดียว)</li>
              <li>เลือกช่วงปีที่ต้องการ</li>
              <li>กด “อัปเดตตัวเลข” เพื่อเติมตัวเลขทั้งสามคอลัมน์</li>
              <li>เปิดแท็บ “ผลเปรียบเทียบ” เพื่อดูกราฟและตาราง</li>
            </ol>
          </section>

          <section>
            <div className="mb-1 font-semibold text-slate-900">ช่วงปี</div>
            <p>กำหนดช่วงปีที่จะนับ กดปุ่ม “ตั้งแต่ปีแรก” เพื่อให้ระบบค้นหาปีที่เก่าที่สุดที่มีผลงานให้</p>
          </section>

          <section>
            <div className="mb-1 font-semibold text-slate-900">การเก็บเอกสารเต็ม (ขั้นสูง)</div>
            <p>ถ้าต้องการเก็บตัวเอกสารจริงไว้ใช้งานต่อ (ไม่ใช่แค่จำนวน) ใช้ปุ่มดึงข้อมูลในส่วนขั้นสูง
            ซึ่งต้องใช้สิทธิ์การเข้าถึง Scopus แบบเต็ม (COMPLETE) หากยังไม่พร้อม ให้ใช้แค่การนับตัวเลขก่อนได้</p>
          </section>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            หมายเหตุ: การดึงข้อมูลระดับประเทศ (Thailand) ใช้เวลานานเพราะมีเอกสารจำนวนมาก
            หากต้องการเพียงตัวเลขเปรียบเทียบ ไม่จำเป็นต้องดึง
          </p>
        </div>
      </div>
    </div>
  );
}

function YearRange({ yearFrom, yearTo, onRangeChange, onDetect, detecting, onRefresh, compact = false }) {
  const [fromDraft, setFromDraft] = useState(String(yearFrom));
  const [toDraft, setToDraft] = useState(String(yearTo));

  useEffect(() => {
    setFromDraft(String(yearFrom));
    setToDraft(String(yearTo));
  }, [yearFrom, yearTo]);

  const updateDraft = (field, rawValue) => {
    if (field === "from") setFromDraft(rawValue);
    else setToDraft(rawValue);

    const numeric = Number(rawValue);
    if (!Number.isInteger(numeric) || numeric < 1900 || numeric > CURRENT_YEAR + 1) return;

    onRangeChange(normalizeYearRange(
      field === "from" ? numeric : yearFrom,
      field === "to" ? numeric : yearTo,
      field,
      1900,
      CURRENT_YEAR + 1,
    ));
  };

  const commitDraft = (field) => {
    const rawValue = field === "from" ? fromDraft : toDraft;
    if (rawValue.trim() === "") {
      setFromDraft(String(yearFrom));
      setToDraft(String(yearTo));
      return;
    }

    const normalized = normalizeYearRange(
      field === "from" ? rawValue : yearFrom,
      field === "to" ? rawValue : yearTo,
      field,
      1900,
      CURRENT_YEAR + 1,
    );
    setFromDraft(String(normalized.yearFrom));
    setToDraft(String(normalized.yearTo));
    onRangeChange(normalized);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">ช่วงปี</span>
      <input type="number" min={1900} max={CURRENT_YEAR + 1} value={fromDraft}
        onChange={(e) => updateDraft("from", e.target.value)} onBlur={() => commitDraft("from")}
        className="w-20 rounded-md border border-slate-200 px-2 py-1.5" />
      <span className="text-slate-400">–</span>
      <input type="number" min={1900} max={CURRENT_YEAR + 1} value={toDraft}
        onChange={(e) => updateDraft("to", e.target.value)} onBlur={() => commitDraft("to")}
        className="w-20 rounded-md border border-slate-200 px-2 py-1.5" />
      <button type="button" onClick={onDetect} disabled={detecting}
        className="rounded-md px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50">
        {detecting ? "…" : "ตั้งแต่ปีแรก"}
      </button>
      {!compact && onRefresh && (
        <button type="button" onClick={onRefresh}
          className="ml-auto rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">รีเฟรช</button>
      )}
    </div>
  );
}

function StatTile({ label, value, hint, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{fmt(value)}</div>
      <div className="text-xs text-slate-400">{hint}</div>
    </div>
  );
}

function Step({ n, title, desc, state, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{n}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium text-slate-900">{title}</div>
            <StatusDot state={state} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminScopusBenchmark() {
  const [tab, setTab] = useState("results");
  const [msg, setMsg] = useState(null);

  const [scopes, setScopes] = useState([]);
  const [runs, setRuns] = useState([]);

  const [yearFrom, setYearFrom] = useState(CURRENT_YEAR - 9);
  const [yearTo, setYearTo] = useState(CURRENT_YEAR);
  const [detecting, setDetecting] = useState(false);

  const [comparison, setComparison] = useState([]);
  const [facultyMetric, setFacultyMetric] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [showTable, setShowTable] = useState(false);

  const [countsRunning, setCountsRunning] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [lookupName, setLookupName] = useState("Khon Kaen University");
  const [lookupHits, setLookupHits] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const comparisonRequestId = useRef(0);
  const rangeEffectMounted = useRef(false);
  const skipAutoReloadRange = useRef(null);

  const notify = (text, tone = "info") => setMsg(text ? { text, tone } : null);
  const yearParams = useCallback(() => ({ year_from: yearFrom, year_to: yearTo }), [yearFrom, yearTo]);

  const uni = useMemo(() => scopes.find((s) => s.level === "university") || null, [scopes]);
  const country = useMemo(() => scopes.find((s) => s.level === "country") || null, [scopes]);
  const activeRun = useMemo(() => runs.find((r) => isRunning(r.status)) || null, [runs]);

  useEffect(() => {
    loadScopes();
    loadComparison();
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!rangeEffectMounted.current) {
      rangeEffectMounted.current = true;
      return undefined;
    }

    const rangeKey = `${yearFrom}:${yearTo}`;
    if (skipAutoReloadRange.current === rangeKey) {
      skipAutoReloadRange.current = null;
      return undefined;
    }
    skipAutoReloadRange.current = null;

    const t = setTimeout(() => {
      loadComparison({ year_from: yearFrom, year_to: yearTo });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFrom, yearTo]);

  useEffect(() => {
    if (!activeRun) return undefined;
    const t = setInterval(() => loadRuns(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id]);

  async function loadScopes() {
    try {
      const res = await scopusBenchmarkAPI.listScopes();
      setScopes(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      notify(e?.message || "โหลด scope ไม่สำเร็จ", "error");
    }
  }
  async function loadComparison(params = yearParams()) {
    const requestId = comparisonRequestId.current + 1;
    comparisonRequestId.current = requestId;
    setComparisonLoading(true);
    try {
      const res = await scopusBenchmarkAPI.comparison(params);
      if (comparisonRequestId.current !== requestId) return;
      setComparison(Array.isArray(res?.data?.years) ? res.data.years : []);
      setFacultyMetric(res?.data?.faculty_metric || null);
    } catch (e) {
      if (comparisonRequestId.current !== requestId) return;
      notify(e?.message || "โหลดข้อมูลเปรียบเทียบไม่สำเร็จ", "error");
    } finally {
      if (comparisonRequestId.current === requestId) setComparisonLoading(false);
    }
  }
  async function loadRuns() {
    try {
      const res = await scopusBenchmarkAPI.listRuns({ page: 1 });
      setRuns(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRuns([]);
    }
  }

  async function detectFirstYear() {
    if (!uni) return;
    if (!uni.af_id) { notify("กรุณาตั้งค่า AF-ID ของ KKU ก่อน (ขั้นที่ 1)", "error"); return; }
    setDetecting(true);
    try {
      const res = await scopusBenchmarkAPI.detectYearRange(uni.id);
      const first = res?.data?.first_year;
      const last = res?.data?.last_year;
      if (first) {
        const to = Math.min(last || CURRENT_YEAR, CURRENT_YEAR);
        const range = { year_from: first, year_to: to };
        skipAutoReloadRange.current = `${first}:${to}`;
        setYearFrom(first);
        setYearTo(to);
        await loadComparison(range);
        notify(`กำหนดช่วงปี ${first}–${to}`, "success");
      } else notify("ไม่พบข้อมูลผลงาน", "error");
    } catch (e) {
      notify(e?.message || "ค้นหาปีแรกไม่สำเร็จ", "error");
    } finally {
      setDetecting(false);
    }
  }

  async function refreshCounts() {
    setCountsRunning(true);
    notify("");
    try {
      const res = await scopusBenchmarkAPI.refreshCounts(yearParams());
      await loadComparison();
      const results = Array.isArray(res?.data) ? res.data : [];
      const failed = results.filter((item) => item?.error);
      const facultyResult = results.find((item) => item?.code === "faculty_cs");
      const facultyNeedsHarvest = facultyResult?.error?.includes("KKU benchmark documents are incomplete");

      if (failed.length === 0) {
        notify("อัปเดตตัวเลขแล้ว", "success");
      } else if (facultyNeedsHarvest && failed.every((item) => item.code === "faculty_cs")) {
        notify("อัปเดต KKU/Thailand แล้ว แต่ข้อมูลคณะยังไม่พร้อม: กรุณาดึงเอกสาร KKU ให้ครบช่วงปีนี้ก่อน", "error");
      } else {
        const names = failed.map((item) => item.label || item.code).join(", ");
        notify(`อัปเดตบางส่วนไม่สำเร็จ: ${names} — กรุณาลองใหม่หรือตรวจการเชื่อมต่อ Scopus`, "error");
      }
    } catch (e) {
      notify(e?.message || "อัปเดตตัวเลขไม่สำเร็จ", "error");
    } finally {
      setCountsRunning(false);
    }
  }

  async function runHarvest(scopeId) {
    if (activeRun) { notify("มีงานกำลังทำงานอยู่ กรุณารอให้เสร็จก่อน", "error"); return; }
    setHarvesting(true);
    notify("");
    try {
      await scopusBenchmarkAPI.harvest({ scope_id: Number(scopeId), ...yearParams() });
      notify("เริ่มดึงข้อมูลแล้ว", "success");
      loadRuns();
    } catch (e) {
      notify(e?.message || "เริ่มดึงข้อมูลไม่สำเร็จ", "error");
    } finally {
      setHarvesting(false);
    }
  }

  async function cancelRun(id) {
    setCancellingId(id);
    try {
      await scopusBenchmarkAPI.cancelRun(id);
      notify("กำลังยกเลิกงาน", "info");
      loadRuns();
    } catch (e) {
      notify(e?.message || "ยกเลิกไม่สำเร็จ", "error");
    } finally {
      setCancellingId(null);
    }
  }

  async function doLookup() {
    setLookupLoading(true);
    setLookupHits([]);
    try {
      const res = await scopusBenchmarkAPI.resolveAffiliation(lookupName.trim());
      setLookupHits(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      notify(e?.message || "ค้นหา affiliation ไม่สำเร็จ", "error");
    } finally {
      setLookupLoading(false);
    }
  }
  async function setAfId(afId) {
    if (!uni) return;
    try {
      await scopusBenchmarkAPI.updateScope(uni.id, { af_id: afId });
      notify("บันทึก AF-ID แล้ว", "success");
      setLookupHits([]);
      setLookupOpen(false);
      loadScopes();
    } catch (e) {
      notify(e?.message || "บันทึก AF-ID ไม่สำเร็จ", "error");
    }
  }

  const facultyHasData = useMemo(() => comparison.some((r) => Number(r.faculty) > 0), [comparison]);
  const countsHasData = useMemo(() => comparison.some((r) => Number(r.university) > 0 || Number(r.country) > 0), [comparison]);
  const lastUniHarvest = useMemo(
    () => runs.find((r) => uni && String(r.scope_id) === String(uni.id) && ["success", "completed"].includes((r.status || "").toLowerCase())) || null,
    [runs, uni]
  );
  const step1 = uni?.af_id ? "done" : "todo";
  const step2 = countsHasData ? "done" : "todo";
  const facultyMetricBlocked = facultyMetric?.ready === false;
  const facultyMetricUsesFallback = facultyMetric?.ready === true && facultyMetric?.employment_date_complete === false;
  const facultyBenchmarkYearsMissing = Array.isArray(facultyMetric?.benchmark_years_missing)
    ? facultyMetric.benchmark_years_missing
    : [];
  const facultyBenchmarkIncomplete = facultyBenchmarkYearsMissing.length > 0;
  const facultyCoverageText = facultyMetricUsesFallback
    ? `มีวันเริ่มงาน ${fmt(facultyMetric.employment_date_set)} จากอาจารย์ที่มี Scopus ID ${fmt(facultyMetric.faculty_with_scopus_id)} คน สำหรับอีก ${fmt(facultyMetric.employment_date_missing)} คน ระบบใช้ AF-ID 60017165 หรือ 60280609 บนผลงานเป็นหลักฐานการสังกัด KKU`
    : null;

  const asc = useMemo(() => [...comparison].sort((a, b) => a.year - b.year), [comparison]);
  const latestMetrics = useMemo(() => ({
    faculty: latestPositiveMetric(asc, "faculty"),
    university: latestPositiveMetric(asc, "university"),
    country: latestPositiveMetric(asc, "country"),
  }), [asc]);

  const metricHint = (metric) => {
    if (!metric) return "ยังไม่มีข้อมูล";
    return metric.year === CURRENT_YEAR
      ? `ปีล่าสุดที่มีข้อมูล ${metric.year} (ข้อมูลบางส่วน)`
      : `ปีล่าสุดที่มีข้อมูล ${metric.year}`;
  };

  const chartOptions = useMemo(() => {
    const categories = asc.map((r) => String(r.year));
    const base = {
      chart: { toolbar: { show: false }, fontFamily: "inherit", animations: { enabled: false } },
      dataLabels: { enabled: false },
      grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
      legend: { position: "top", horizontalAlign: "right", markers: { radius: 4 } },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
      tooltip: { shared: true, intersect: false },
    };
    if (chartType === "share") {
      return {
        ...base,
        colors: [ACCENT, C_UNI],
        stroke: { curve: "smooth", width: 2 },
        yaxis: { max: 100, labels: { formatter: (v) => `${Math.round(v)}%` } },
      };
    }
    return {
      ...base,
      colors: [ACCENT, C_UNI, C_COUNTRY],
      stroke: chartType === "line" ? { curve: "smooth", width: 2 } : { width: 0 },
      plotOptions: { bar: { columnWidth: "60%", borderRadius: 3 } },
      yaxis: { labels: { formatter: (v) => Number(v).toLocaleString("th-TH") } },
    };
  }, [asc, chartType]);

  const chartSeries = useMemo(() => {
    if (chartType === "share") {
      return [
        { name: "คณะ / KKU", data: asc.map((r) => Number((share(r.faculty, r.university) || 0).toFixed(1))) },
        { name: "คณะ / Thailand", data: asc.map((r) => Number((share(r.faculty, r.country) || 0).toFixed(1))) },
      ];
    }
    return [
      { name: "คณะ", data: asc.map((r) => Number(r.faculty || 0)) },
      { name: "KKU", data: asc.map((r) => Number(r.university || 0)) },
      { name: "Thailand", data: asc.map((r) => Number(r.country || 0)) },
    ];
  }, [asc, chartType]);

  const chartKind = chartType === "bar" ? "bar" : "line";

  const yearRangeProps = {
    yearFrom, yearTo,
    onRangeChange: ({ yearFrom: nextFrom, yearTo: nextTo }) => {
      setYearFrom(nextFrom);
      setYearTo(nextTo);
    },
    onDetect: detectFirstYear,
    detecting,
  };

  const renderResults = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <YearRange {...yearRangeProps} onRefresh={loadComparison} />
      </div>

      {facultyMetricBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ยังคำนวณตัวเลขคณะไม่ได้เพราะไม่พบอาจารย์ที่ตั้ง Scopus ID ระบบจึงซ่อนค่าคณะเดิมไว้ก่อน
        </div>
      )}
      {facultyMetricUsesFallback && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {facultyCoverageText} และจะใช้วันเริ่มงานเพิ่มโดยอัตโนมัติเมื่อมีข้อมูล
        </div>
      )}
      {facultyBenchmarkIncomplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ข้อมูลเอกสาร KKU ยังไม่ครบสำหรับปี {facultyBenchmarkYearsMissing.join(", ")} จึงซ่อนค่าคณะของปีเหล่านี้ กรุณาดึงเอกสาร KKU ในช่วงดังกล่าวก่อน
        </div>
      )}

      {!facultyHasData && !countsHasData && !comparisonLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <div className="text-sm font-medium text-slate-700">ยังไม่มีข้อมูลสำหรับเปรียบเทียบ</div>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            ไปที่แท็บ <b>ตั้งค่า &amp; ดึงข้อมูล</b> แล้วทำตามขั้นตอน 1 → 2 → 3 เพื่อให้ได้ตัวเลขมาแสดง
          </p>
          <button type="button" onClick={() => setTab("setup")}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">ไปหน้าตั้งค่า</button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="คณะ (CS)" value={latestMetrics.faculty?.value}
              hint={facultyMetricBlocked ? "รอข้อมูลวันเริ่มงานครบ" : metricHint(latestMetrics.faculty)} color={ACCENT} />
            <StatTile label="KKU (CS)" value={latestMetrics.university?.value} hint={metricHint(latestMetrics.university)} color={C_UNI} />
            <StatTile label="Thailand (CS)" value={latestMetrics.country?.value} hint={metricHint(latestMetrics.country)} color={C_COUNTRY} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-700">แนวโน้มรายปี</div>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                {[["bar", "จำนวน"], ["line", "แนวโน้ม"], ["share", "สัดส่วน %"]].map(([k, lbl]) => (
                  <button key={k} type="button" onClick={() => setChartType(k)}
                    className={`rounded-md px-3 py-1.5 ${chartType === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{lbl}</button>
                ))}
              </div>
            </div>
            {asc.length > 0 ? (
              <ApexChart key={chartType} options={chartOptions} series={chartSeries} type={chartKind} height={300} />
            ) : (
              <div className="py-16 text-center text-sm text-slate-400">{comparisonLoading ? "กำลังโหลด…" : "ไม่มีข้อมูลในช่วงปีนี้"}</div>
            )}
            {chartType === "share" && (
              <p className="mt-1 text-center text-xs text-slate-400">สัดส่วนผลงานคณะเทียบกับ KKU และ Thailand (%)</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setShowTable((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
              ตารางละเอียด <span className="text-slate-400">{showTable ? "▲" : "▼"}</span>
            </button>
            {showTable && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400">
                      <th className="px-4 py-2">ปี</th><th className="px-4 py-2">คณะ</th><th className="px-4 py-2">KKU</th>
                      <th className="px-4 py-2">Thailand</th><th className="px-4 py-2">คณะ/KKU</th><th className="px-4 py-2">คณะ/Thailand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {comparison.map((r) => (
                      <tr key={r.year} className="text-slate-700">
                        <td className="px-4 py-2 font-medium text-slate-900">{r.year}</td>
                        <td className="px-4 py-2">{fmt(r.faculty)}</td>
                        <td className="px-4 py-2">{fmt(r.university)}</td>
                        <td className="px-4 py-2">{fmt(r.country)}</td>
                        <td className="px-4 py-2">{pctLabel(r.faculty, r.university)}</td>
                        <td className="px-4 py-2">{pctLabel(r.faculty, r.country)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">ทำตามลำดับด้านล่าง</div>
        <button type="button" onClick={() => setHelpOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <span aria-hidden>?</span> วิธีใช้งาน
        </button>
      </div>
      {facultyMetricBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ยังคำนวณตัวเลขคณะไม่ได้เพราะไม่พบอาจารย์ที่ตั้ง Scopus ID ตัวเลข KKU และ Thailand ยังอัปเดตได้ตามปกติ
        </div>
      )}
      {facultyMetricUsesFallback && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {facultyCoverageText}
        </div>
      )}
      {facultyBenchmarkIncomplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ต้องดึงเอกสาร KKU เพิ่มสำหรับปี {facultyBenchmarkYearsMissing.join(", ")} ก่อนจึงจะคำนวณค่าคณะของปีเหล่านี้ได้
        </div>
      )}
      <Step n={1} title="ตั้งค่าขอบเขต KKU" desc="ระบุ Affiliation ID ของมหาวิทยาลัย (ทำครั้งเดียว) ใช้สำหรับค้นผลงาน" state={step1}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-600">AF-ID ปัจจุบัน:</span>
          {uni?.af_id ? <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-800">{uni.af_id}</code>
            : <span className="text-rose-600">ยังไม่ตั้ง</span>}
          <button type="button" onClick={() => setLookupOpen((v) => !v)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            {lookupOpen ? "ปิด" : "ค้นหา / เปลี่ยน AF-ID"}
          </button>
        </div>
        {lookupOpen && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={lookupName} onChange={(e) => setLookupName(e.target.value)}
                placeholder="ชื่อสถาบัน" className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <button type="button" onClick={doLookup} disabled={lookupLoading || !lookupName.trim()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {lookupLoading ? "กำลังค้นหา…" : "ค้นหา"}
              </button>
            </div>
            {lookupHits.length > 0 && (
              <div className="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200 bg-white">
                {lookupHits.map((h) => (
                  <div key={h.af_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-slate-800">{h.name}</div>
                      <div className="text-xs text-slate-400">
                        <span className="font-mono">{h.af_id}</span> · {[h.city, h.country].filter(Boolean).join(", ")} · {fmt(h.document_count)} docs
                      </div>
                    </div>
                    <button type="button" onClick={() => setAfId(h.af_id)}
                      className="shrink-0 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">ใช้ตัวนี้</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Step>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <YearRange {...yearRangeProps} compact />
        <p className="mt-1 text-xs text-slate-400">เลือกช่วงปีก่อนกดอัปเดตตัวเลขในขั้นที่ 2</p>
      </div>

      <Step n={2} title="อัปเดตตัวเลข → คณะ / KKU / Thailand" desc="คณะตรวจผู้แต่งและ AF-ID 60017165/60280609 พร้อมใช้วันเริ่มงานเมื่อมีข้อมูล ส่วน KKU/Thailand นับจาก benchmark" state={step2}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={refreshCounts} disabled={countsRunning || !uni?.af_id}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {countsRunning ? "กำลังอัปเดต…" : "อัปเดตตัวเลข"}
          </button>
          {!uni?.af_id && <span className="text-xs text-rose-500">ต้องตั้ง AF-ID ในขั้นที่ 1 ก่อน</span>}
        </div>
      </Step>

      <div className="rounded-xl border border-slate-200 bg-white">
        <button type="button" onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
          <span>เอกสาร KKU สำหรับตรวจผลงานคณะ / ข้อมูลขั้นสูง</span>
          <span className="text-slate-400">{showAdvanced ? "▲" : "▼"}</span>
        </button>
        {showAdvanced && (
          <div className="space-y-3 border-t border-slate-100 px-4 py-4">
            <p className="text-xs text-slate-500">
              ต้องมีเอกสาร KKU ครบช่วงปีที่เลือกเพื่อยืนยันว่าเป็น Computer Science และคำนวณค่าคณะ
              การดึงใช้สิทธิ์ Scopus แบบเต็ม (COMPLETE); เอกสาร Thailand เป็นข้อมูลขั้นสูงและไม่จำเป็นต่อค่าคณะ
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => uni && runHarvest(uni.id)} disabled={harvesting || !!activeRun || !uni?.af_id}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                ดึงเอกสาร KKU
              </button>
              <button type="button" onClick={() => country && runHarvest(country.id)} disabled={harvesting || !!activeRun}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                ดึงเอกสาร Thailand
              </button>
              {lastUniHarvest && <span className="self-center text-xs text-slate-500">KKU ล่าสุด: {formatDateTime(lastUniHarvest.finished_at)}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <button type="button" onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
          ประวัติการดึงข้อมูล <span className="text-slate-400">{showHistory ? "▲" : "▼"}</span>
        </button>
        {showHistory && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="px-4 py-2">เริ่ม</th><th className="px-4 py-2">สถานะ</th><th className="px-4 py-2">ปี</th>
                  <th className="px-4 py-2">เขียนแล้ว (สะสม)</th><th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">ยังไม่มีประวัติ</td></tr>
                ) : runs.map((r) => (
                  <tr key={r.id} className="text-slate-700">
                    <td className="px-4 py-2 text-xs">{formatDateTime(r.started_at)}</td>
                    <td className="px-4 py-2"><RunStatus status={r.status} /></td>
                    <td className="px-4 py-2 text-xs">{formatRunYears(r)}</td>
                    <td className="px-4 py-2 text-xs">{fmt(r.documents_upserted)}</td>
                    <td className="px-4 py-2">
                      {isRunning(r.status) && (
                        <button type="button" onClick={() => cancelRun(r.id)} disabled={cancellingId === r.id}
                          className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50">
                          {cancellingId === r.id ? "กำลังยกเลิก…" : "ยกเลิก"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              “เขียนแล้ว” เป็นจำนวนการเขียนสะสมตลอดทั้งรอบ อาจรวมหลายปีและนับรายการเดิมซ้ำเมื่อดึงข้อมูลใหม่
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout
      title="เทียบผลงาน Scopus (Computer Science)"
      subtitle="เปรียบเทียบจำนวนผลงาน CS ระดับคณะ vs มหาวิทยาลัย (KKU) vs ประเทศ (Thailand)"
      icon={RESEARCH_FUND_PAGE_ICONS.scopusBenchmark}
      breadcrumbs={[{ label: "หน้าแรก", href: "/research-fund-system/admin" }, { label: "เทียบผลงาน Scopus (CS)" }]}
    >
      <div className="space-y-5">
        <div className="flex gap-6 border-b border-slate-200">
          {[["results", "ผลเปรียบเทียบ"], ["setup", "ตั้งค่า & ดึงข้อมูล"]].map(([k, lbl]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === k ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {lbl}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`rounded-lg px-4 py-2.5 text-sm ${
            msg.tone === "success" ? "bg-emerald-50 text-emerald-700"
            : msg.tone === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
            {msg.text}
          </div>
        )}

        {activeRun && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span>
              กำลังดึงข้อมูล (run #{activeRun.id}) — เขียนแล้ว {fmt(activeRun.documents_upserted)} รายการ
              {` (สะสมทั้งรอบ ${formatRunYears(activeRun)})`}
            </span>
            <button type="button" onClick={() => cancelRun(activeRun.id)} disabled={cancellingId === activeRun.id}
              className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
              {cancellingId === activeRun.id ? "กำลังยกเลิก…" : "ยกเลิก"}
            </button>
          </div>
        )}

        {tab === "results" ? renderResults() : renderSetup()}
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </PageLayout>
  );
}
