"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { scopusBenchmarkAPI } from "@/app/lib/api";
import PageLayout from "../common/PageLayout";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CURRENT_YEAR = new Date().getFullYear();
const ACCENT = "#4f46e5"; // indigo (faculty)
const C_UNI = "#0ea5e9"; // sky (KKU)
const C_COUNTRY = "#94a3b8"; // slate (Thailand)

const fmt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("th-TH"));
const share = (part, whole) => (!whole ? null : (Number(part) / Number(whole)) * 100);
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

function YearRange({ yearFrom, yearTo, setYearFrom, setYearTo, onDetect, detecting, onRefresh, compact = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">ช่วงปี</span>
      <input type="number" min={1900} max={CURRENT_YEAR + 1} value={yearFrom}
        onChange={(e) => setYearFrom(Number(e.target.value) || 1)}
        className="w-20 rounded-md border border-slate-200 px-2 py-1.5" />
      <span className="text-slate-400">–</span>
      <input type="number" min={1900} max={CURRENT_YEAR + 1} value={yearTo}
        onChange={(e) => setYearTo(Number(e.target.value) || 1)}
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
      <div className="text-[11px] text-slate-400">{hint}</div>
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
    if (!activeRun) return undefined;
    const t = setTimeout(() => loadRuns(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun, runs]);

  async function loadScopes() {
    try {
      const res = await scopusBenchmarkAPI.listScopes();
      setScopes(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      notify(e?.message || "โหลด scope ไม่สำเร็จ", "error");
    }
  }
  async function loadComparison() {
    setComparisonLoading(true);
    try {
      const res = await scopusBenchmarkAPI.comparison(yearParams());
      setComparison(Array.isArray(res?.data?.years) ? res.data.years : []);
    } catch (e) {
      notify(e?.message || "โหลดข้อมูลเปรียบเทียบไม่สำเร็จ", "error");
    } finally {
      setComparisonLoading(false);
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
    if (!uni.af_id) { notify("ตั้ง AF-ID ของ KKU ก่อน (แท็บตั้งค่า ขั้นที่ 1)", "error"); return; }
    setDetecting(true);
    try {
      const res = await scopusBenchmarkAPI.detectYearRange(uni.id);
      const first = res?.data?.first_year;
      const last = res?.data?.last_year;
      if (first) {
        setYearFrom(first);
        setYearTo(Math.min(last || CURRENT_YEAR, CURRENT_YEAR));
        notify(`พบผลงานตั้งแต่ปี ${first} — ตั้งช่วงให้แล้ว`, "success");
      } else notify("ตรวจปีแรกไม่พบข้อมูล", "error");
    } catch (e) {
      notify(e?.message || "ตรวจปีแรกไม่สำเร็จ", "error");
    } finally {
      setDetecting(false);
    }
  }

  async function refreshCounts() {
    setCountsRunning(true);
    notify("");
    try {
      await scopusBenchmarkAPI.refreshCounts(yearParams());
      notify("อัปเดตตัวเลข KKU/Thailand เรียบร้อย", "success");
      await loadComparison();
    } catch (e) {
      notify(e?.message || "อัปเดตตัวเลขไม่สำเร็จ", "error");
    } finally {
      setCountsRunning(false);
    }
  }

  async function runHarvest(scopeId) {
    if (activeRun) { notify("มีงานกำลังรันอยู่ รอให้เสร็จหรือกดยกเลิกก่อน", "error"); return; }
    setHarvesting(true);
    notify("");
    try {
      await scopusBenchmarkAPI.harvest({ scope_id: Number(scopeId), ...yearParams() });
      notify("เริ่มดึงข้อมูลแล้ว สถานะจะอัปเดตอัตโนมัติ", "success");
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
      notify("ส่งคำขอยกเลิกแล้ว งานจะหยุดในไม่กี่วินาที", "info");
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
      notify(`ตั้ง AF-ID ${afId} ให้ KKU แล้ว`, "success");
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
  const step2 = facultyHasData ? "done" : lastUniHarvest ? "partial" : "todo";
  const step3 = countsHasData ? "done" : "todo";

  const asc = useMemo(() => [...comparison].sort((a, b) => a.year - b.year), [comparison]);
  const latest = useMemo(() => (asc.length ? asc[asc.length - 1] : null), [asc]);

  const chartOptions = useMemo(() => {
    const categories = asc.map((r) => String(r.year));
    const base = {
      chart: { toolbar: { show: false }, fontFamily: "inherit", animations: { enabled: false } },
      dataLabels: { enabled: false },
      grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
      legend: { position: "top", horizontalAlign: "right", markers: { radius: 4 } },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
      tooltip: { shared: true },
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
    yearFrom, yearTo, setYearFrom, setYearTo, onDetect: detectFirstYear, detecting,
  };

  const renderResults = () => (
    <div className="space-y-5">
      <YearRange {...yearRangeProps} onRefresh={loadComparison} />

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
            <StatTile label="คณะ (CS)" value={latest?.faculty} hint={latest ? `ปีล่าสุด ${latest.year}` : ""} color={ACCENT} />
            <StatTile label="KKU (CS)" value={latest?.university} hint={latest ? `ปีล่าสุด ${latest.year}` : ""} color={C_UNI} />
            <StatTile label="Thailand (CS)" value={latest?.country} hint={latest ? `ปีล่าสุด ${latest.year}` : ""} color={C_COUNTRY} />
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
              <p className="mt-1 text-center text-[11px] text-slate-400">สัดส่วนผลงานคณะเทียบกับ KKU และ Thailand (%)</p>
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
                      <div className="text-[11px] text-slate-400">
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
        <p className="mt-1 text-[11px] text-slate-400">ช่วงปีนี้ใช้กับทั้งขั้นที่ 2 (ดึงข้อมูล) และ 3 (นับตัวเลข)</p>
      </div>

      <Step n={2} title={'ดึงข้อมูล KKU → ได้ตัวเลข "คณะ"'} desc="ดึงเอกสาร CS ของ KKU มาเก็บ เพื่อจับคู่ว่าชิ้นไหนเป็นของอาจารย์ในระบบ (จำเป็นต่อคอลัมน์คณะ)" state={step2}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => uni && runHarvest(uni.id)} disabled={harvesting || !!activeRun || !uni?.af_id}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {activeRun ? "มีงานกำลังรัน…" : harvesting ? "กำลังเริ่ม…" : "เริ่มดึงข้อมูล KKU"}
          </button>
          {lastUniHarvest && <span className="text-xs text-slate-500">ล่าสุด: {formatDateTime(lastUniHarvest.finished_at)}</span>}
          {!uni?.af_id && <span className="text-xs text-rose-500">ต้องตั้ง AF-ID ในขั้นที่ 1 ก่อน</span>}
        </div>
      </Step>

      <Step n={3} title="อัปเดตตัวเลขเทียบ → เติม KKU / Thailand" desc="นับจำนวนจาก Scopus (เร็ว) เติมคอลัมน์ KKU และ Thailand ในช่วงปีที่เลือก" state={step3}>
        <button type="button" onClick={refreshCounts} disabled={countsRunning}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {countsRunning ? "กำลังอัปเดต…" : "อัปเดตตัวเลข KKU/Thailand"}
        </button>
      </Step>

      <Step n={4} title="(ไม่บังคับ) ดึงเอกสาร Thailand เต็ม" desc="ถ้าต้องการเก็บตัวเอกสารระดับประเทศไว้ใช้ต่อ — ถ้าอยากได้แค่จำนวนไม่ต้องทำ" state="todo">
        <button type="button" onClick={() => country && runHarvest(country.id)} disabled={harvesting || !!activeRun}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          เริ่มดึงข้อมูล Thailand
        </button>
      </Step>

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
                  <th className="px-4 py-2">เอกสาร</th><th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">ยังไม่มีประวัติ</td></tr>
                ) : runs.map((r) => (
                  <tr key={r.id} className="text-slate-700">
                    <td className="px-4 py-2 text-xs">{formatDateTime(r.started_at)}</td>
                    <td className="px-4 py-2"><RunStatus status={r.status} /></td>
                    <td className="px-4 py-2 text-xs">{r.year_from && r.year_to ? `${r.year_from}-${r.year_to}` : "ทุกปี"}</td>
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
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout
      title="เทียบผลงาน Scopus (Computer Science)"
      subtitle="เปรียบเทียบจำนวนผลงาน CS ระดับคณะ vs มหาวิทยาลัย (KKU) vs ประเทศ (Thailand)"
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
            <span>กำลังดึงข้อมูล (run #{activeRun.id}) — {fmt(activeRun.documents_upserted)} เอกสาร</span>
            <button type="button" onClick={() => cancelRun(activeRun.id)} disabled={cancellingId === activeRun.id}
              className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
              {cancellingId === activeRun.id ? "กำลังยกเลิก…" : "ยกเลิก"}
            </button>
          </div>
        )}

        {tab === "results" ? renderResults() : renderSetup()}
      </div>
    </PageLayout>
  );
}
