"use client";

import { useEffect, useMemo, useState } from "react";
import { scopusBenchmarkAPI } from "@/app/lib/api";
import PageLayout from "../common/PageLayout";

const TONE = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

function fmt(n) {
  if (n === null || n === undefined) return "-";
  return Number(n).toLocaleString("th-TH");
}

function pct(part, whole) {
  if (!whole) return "-";
  return `${((Number(part) / Number(whole)) * 100).toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls =
    ["success", "completed", "done"].includes(s) ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : ["failed", "error"].includes(s) ? "border-rose-200 bg-rose-50 text-rose-700"
    : ["running", "in_progress"].includes(s) ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>{status || "-"}</span>;
}

export default function AdminScopusBenchmark() {
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState("info");

  const [scopes, setScopes] = useState([]);
  const [yearsBack, setYearsBack] = useState(10);
  const [comparison, setComparison] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [countsRunning, setCountsRunning] = useState(false);

  const [lookupName, setLookupName] = useState("Khon Kaen University");
  const [lookupHits, setLookupHits] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupTargetScope, setLookupTargetScope] = useState(null);

  const [harvestScopeId, setHarvestScopeId] = useState("");
  const [harvestYearsBack, setHarvestYearsBack] = useState(10);
  const [harvesting, setHarvesting] = useState(false);

  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const notify = (m, t = "info") => { setMsg(m); setTone(t); };

  useEffect(() => {
    loadScopes();
    loadComparison(yearsBack);
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadScopes() {
    try {
      const res = await scopusBenchmarkAPI.listScopes();
      const items = Array.isArray(res?.data) ? res.data : [];
      setScopes(items);
      if (!harvestScopeId && items.length) setHarvestScopeId(String(items[0].id));
    } catch (e) {
      notify(e?.message || "โหลด scope ไม่สำเร็จ", "error");
    }
  }

  async function loadComparison(yb) {
    setComparisonLoading(true);
    try {
      const res = await scopusBenchmarkAPI.comparison(yb);
      setComparison(Array.isArray(res?.data?.years) ? res.data.years : []);
    } catch (e) {
      notify(e?.message || "โหลดข้อมูลเปรียบเทียบไม่สำเร็จ", "error");
    } finally {
      setComparisonLoading(false);
    }
  }

  async function loadRuns() {
    setRunsLoading(true);
    try {
      const res = await scopusBenchmarkAPI.listRuns({ page: 1 });
      setRuns(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRuns([]);
    } finally {
      setRunsLoading(false);
    }
  }

  async function refreshCounts() {
    setCountsRunning(true);
    notify("");
    try {
      await scopusBenchmarkAPI.refreshCounts(yearsBack);
      notify("อัปเดตตัวเลขจาก Scopus เรียบร้อย", "success");
      await loadComparison(yearsBack);
    } catch (e) {
      notify(e?.message || "อัปเดตตัวเลขไม่สำเร็จ", "error");
    } finally {
      setCountsRunning(false);
    }
  }

  async function doLookup(scope) {
    setLookupTargetScope(scope || null);
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

  async function setAfId(scope, afId) {
    try {
      await scopusBenchmarkAPI.updateScope(scope.id, { af_id: afId });
      notify(`บันทึก AF-ID ${afId} ให้ ${scope.label} แล้ว`, "success");
      setLookupHits([]);
      setLookupTargetScope(null);
      loadScopes();
    } catch (e) {
      notify(e?.message || "บันทึก AF-ID ไม่สำเร็จ", "error");
    }
  }

  async function runHarvest() {
    if (!harvestScopeId) { notify("เลือก scope ก่อน", "error"); return; }
    setHarvesting(true);
    notify("");
    try {
      await scopusBenchmarkAPI.harvest({
        scope_id: Number(harvestScopeId),
        years_back: Number(harvestYearsBack) || 0,
      });
      notify("เริ่ม harvest แล้ว ติดตามสถานะได้จากประวัติการรัน", "success");
      loadRuns();
    } catch (e) {
      notify(e?.message || "เริ่ม harvest ไม่สำเร็จ", "error");
    } finally {
      setHarvesting(false);
    }
  }

  const maxCountry = useMemo(
    () => comparison.reduce((m, r) => Math.max(m, Number(r.country || 0)), 0),
    [comparison]
  );

  return (
    <PageLayout
      title="เทียบผลงาน Scopus (Computer Science)"
      subtitle="เปรียบเทียบจำนวนผลงาน CS ระดับคณะ vs มหาวิทยาลัย (KKU) vs ประเทศ (Thailand)"
      breadcrumbs={[
        { label: "หน้าแรก", href: "/research-fund-system/admin" },
        { label: "เทียบผลงาน Scopus (CS)" },
      ]}
    >
      <div className="space-y-6">
        {msg && (
          <div className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${TONE[tone] || TONE.info}`}>{msg}</div>
        )}

        {/* Comparison */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comparison</div>
              <div className="text-xl font-semibold text-slate-900">ส่วนต่างผลงาน CS รายปี</div>
              <p className="text-sm text-slate-600">คณะ = ผลงานที่มีอาจารย์ในระบบเป็นผู้เขียน (derived) · KKU/Thailand = จำนวนจาก Scopus</p>
            </div>
            <div className="flex items-end gap-2">
              <label className="text-xs font-semibold text-slate-600">
                ย้อนหลัง (ปี)
                <input
                  type="number" min={1} max={40} value={yearsBack}
                  onChange={(e) => setYearsBack(Number(e.target.value) || 1)}
                  className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button" onClick={() => loadComparison(yearsBack)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                โหลดใหม่
              </button>
              <button
                type="button" onClick={refreshCounts} disabled={countsRunning}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {countsRunning ? "กำลังอัปเดต..." : "อัปเดตตัวเลขจาก Scopus"}
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">ปี</th>
                  <th className="px-3 py-2">คณะ (CS)</th>
                  <th className="px-3 py-2">KKU (CS)</th>
                  <th className="px-3 py-2">Thailand (CS)</th>
                  <th className="px-3 py-2">คณะ/KKU</th>
                  <th className="px-3 py-2">คณะ/Thailand</th>
                  <th className="px-3 py-2 w-40">สัดส่วน (Thailand)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonLoading ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">กำลังโหลด...</td></tr>
                ) : comparison.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">ยังไม่มีข้อมูล — กด "อัปเดตตัวเลขจาก Scopus"</td></tr>
                ) : (
                  comparison.map((r) => (
                    <tr key={r.year} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">{r.year}</td>
                      <td className="px-3 py-2 text-slate-700">{fmt(r.faculty)}</td>
                      <td className="px-3 py-2 text-slate-700">{fmt(r.university)}</td>
                      <td className="px-3 py-2 text-slate-700">{fmt(r.country)}</td>
                      <td className="px-3 py-2 text-slate-700">{pct(r.faculty, r.university)}</td>
                      <td className="px-3 py-2 text-slate-700">{pct(r.faculty, r.country)}</td>
                      <td className="px-3 py-2">
                        <div className="h-2 w-full rounded bg-slate-100">
                          <div className="h-2 rounded bg-indigo-500" style={{ width: maxCountry ? `${(Number(r.country || 0) / maxCountry) * 100}%` : "0%" }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scopes + affiliation lookup */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scopes</div>
          <div className="text-xl font-semibold text-slate-900">ตั้งค่าขอบเขต (AF-ID / ประเทศ)</div>
          <p className="text-sm text-slate-600">ระดับมหาวิทยาลัยต้องมี AF-ID ก่อน harvest — ใช้ affiliation lookup ด้านล่างค้นหาแล้วบันทึก</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Scope</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">AF-ID / ประเทศ</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{s.label}<div className="text-[11px] text-slate-500">{s.code}</div></td>
                    <td className="px-3 py-2 text-slate-700">{s.level}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {s.level === "country" ? (s.affil_country || "-") : (s.af_id ? <code className="font-mono">{s.af_id}</code> : <span className="text-rose-600">ยังไม่ตั้ง</span>)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{s.subject_area}</td>
                    <td className="px-3 py-2">
                      {s.level === "university" && (
                        <button
                          type="button" onClick={() => doLookup(s)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          ค้นหา AF-ID
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={lookupName} onChange={(e) => setLookupName(e.target.value)}
                placeholder="ชื่อสถาบัน เช่น Khon Kaen University"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button" onClick={() => doLookup(lookupTargetScope)} disabled={lookupLoading || !lookupName.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 disabled:opacity-60"
              >
                {lookupLoading ? "กำลังค้นหา..." : "ค้นหา Affiliation"}
              </button>
            </div>
            {lookupHits.length > 0 && (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">AF-ID</th>
                      <th className="px-3 py-2">ชื่อ</th>
                      <th className="px-3 py-2">เมือง / ประเทศ</th>
                      <th className="px-3 py-2">Docs</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lookupHits.map((h) => (
                      <tr key={h.af_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-xs">{h.af_id}</td>
                        <td className="px-3 py-2 text-slate-800">{h.name}</td>
                        <td className="px-3 py-2 text-slate-600">{[h.city, h.country].filter(Boolean).join(", ")}</td>
                        <td className="px-3 py-2 text-slate-700">{fmt(h.document_count)}</td>
                        <td className="px-3 py-2">
                          {lookupTargetScope ? (
                            <button
                              type="button" onClick={() => setAfId(lookupTargetScope, h.af_id)}
                              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              ใช้กับ {lookupTargetScope.label}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">เลือก "ค้นหา AF-ID" ที่ scope ก่อน</span>
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

        {/* Harvest */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harvest</div>
          <div className="text-xl font-semibold text-slate-900">ดึงเอกสารเข้าฐานข้อมูล (COMPLETE)</div>
          <p className="text-sm text-slate-600">ดึงผลงาน CS ของ scope ที่เลือกแบบละเอียด (cursor pagination) เก็บใน benchmark tables แยกจากระบบหลัก</p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Scope
              <select
                value={harvestScopeId} onChange={(e) => setHarvestScopeId(e.target.value)}
                className="mt-1 block w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {scopes.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.level})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              ย้อนหลัง (ปี, 0 = ทุกปี)
              <input
                type="number" min={0} max={60} value={harvestYearsBack}
                onChange={(e) => setHarvestYearsBack(Number(e.target.value))}
                className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button" onClick={runHarvest} disabled={harvesting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 disabled:opacity-60"
            >
              {harvesting ? "กำลังเริ่ม..." : "เริ่ม Harvest"}
            </button>
            <button
              type="button" onClick={loadRuns}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              รีเฟรชประวัติ
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">เริ่ม</th>
                  <th className="px-3 py-2">เสร็จ</th>
                  <th className="px-3 py-2">สถานะ</th>
                  <th className="px-3 py-2">ปี</th>
                  <th className="px-3 py-2">total</th>
                  <th className="px-3 py-2">หน้า/เอกสาร/คำขอ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runsLoading ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">กำลังโหลด...</td></tr>
                ) : runs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">ยังไม่มีประวัติการรัน</td></tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs text-slate-700">{formatDateTime(r.started_at)}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{formatDateTime(r.finished_at)}</td>
                      <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-xs text-slate-700">{r.year_from && r.year_to ? `${r.year_from}-${r.year_to}` : "ทุกปี"}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{fmt(r.total_results_reported)}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{fmt(r.pages_fetched)} / {fmt(r.documents_upserted)} / {fmt(r.requests_made)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
