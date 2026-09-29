"use client";

import { useCallback, useEffect, useState } from "react";
import { scopusConfigAPI } from "@/app/lib/api";

const count = (value) => Number(value || 0).toLocaleString("th-TH");

function dateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const runNames = {
  backfill: "เติมรายการที่ยังไม่ตรวจ",
  retry_review: "ลองรายการรอตรวจใหม่",
  refresh: "ดึงใหม่ทั้งหมด",
};

const statusNames = {
  running: "กำลังทำงาน",
  success: "สำเร็จ",
  partial: "เสร็จพร้อมรายการที่ต้องตรวจ",
  failed: "ล้มเหลว",
};

function RunBadge({ status }) {
  const style = status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "failed" ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${style}`}>{statusNames[status] || status || "–"}</span>;
}

export default function AdminScopusAuthorRoles() {
  const [coverage, setCoverage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [runs, setRuns] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (requestedPage = 1, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [statusResponse, runsResponse] = await Promise.all([
        scopusConfigAPI.getAuthorRoleStatus(),
        scopusConfigAPI.listAuthorRoleRuns({ page: requestedPage, per_page: 5 }),
      ]);
      setCoverage(statusResponse?.data?.coverage || null);
      setActiveRun(statusResponse?.data?.active_run || null);
      setRuns(runsResponse?.data || []);
      setPagination(runsResponse?.pagination || null);
      setPage(requestedPage);
      setError("");
    } catch (err) {
      setError(err?.message || "โหลดสถานะบทบาทผู้เขียนไม่สำเร็จ");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (!activeRun) return undefined;
    const timer = setInterval(() => load(page, true), 5000);
    return () => clearInterval(timer);
  }, [activeRun, load, page]);

  async function start(runType) {
    if (busy || activeRun) return;
    if (runType === "refresh" && !window.confirm(
      `ดึง XML ใหม่ทั้งหมดประมาณ ${count(coverage?.refresh_requests)} คำขอ ใช่หรือไม่?`
    )) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await scopusConfigAPI.startAuthorRoleRun(runType, runType === "refresh");
      setActiveRun(response?.data || null);
      setMessage("เริ่มงานแล้ว ระบบจะแสดงความคืบหน้าและผลเมื่อเสร็จ");
      await load(1, true);
    } catch (err) {
      setError(err?.message || "เริ่มดึงบทบาทผู้เขียนไม่สำเร็จ");
      await load(1, true);
    } finally {
      setBusy(false);
    }
  }

  const latest = activeRun || runs[0];
  const disabled = busy || !!activeRun || !coverage;
  const cards = [
    ["ผลงานอาจารย์", coverage?.eligible],
    ["ตรวจครบ", coverage?.complete],
    ["XML ไม่ระบุ corresponding", coverage?.no_correspondence],
    ["รอตรวจสอบ", coverage?.needs_review],
    ["ขอ XML ไม่สำเร็จ", coverage?.fetch_error],
    ["ยังไม่ตรวจ", coverage?.pending],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="scopus-author-roles-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Author Roles (Abstract XML)</div>
          <h2 id="scopus-author-roles-heading" className="mt-1 text-xl font-semibold text-slate-900">บทบาทผู้เขียนในผลงานอาจารย์</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            ตรวจผลงานที่เชื่อมกับ Scopus Author ID ของอาจารย์ และเก็บบทบาทให้ผู้เขียนทุกคนในผลงานนั้น
            หนึ่งผลงานใช้ XML สูงสุดหนึ่งคำขอ ไม่ดึงคลัง Benchmark ระดับ KKU หรือ Thailand
          </p>
        </div>
        <button type="button" onClick={() => load(page)} disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          {loading ? "กำลังโหลด..." : "อัปเดตสถานะ"}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{coverage ? count(value) : "–"}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">สั่งดึงข้อมูล</h3>
          <p className="mt-1 text-sm text-slate-600">นำเข้าผลงาน Scopus ตามปกติก่อน แล้วใช้ปุ่มนี้เติมบทบาทของผลงานใหม่</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => start("backfill")}
              disabled={disabled || !coverage?.next_backfill_requests}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
              เติมที่ยังไม่ตรวจ · {count(coverage?.next_backfill_requests)} คำขอ
            </button>
            <button type="button" onClick={() => start("retry_review")}
              disabled={disabled || !coverage?.retry_review_requests}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              ลองรายการรอตรวจใหม่ · {count(coverage?.retry_review_requests)} คำขอ
            </button>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <button type="button" onClick={() => start("refresh")}
              disabled={disabled || !coverage?.refresh_requests}
              className="text-sm font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
              ดึงใหม่ทั้งหมด · ประมาณ {count(coverage?.refresh_requests)} คำขอ
            </button>
            <p className="mt-1 text-xs text-slate-500">ใช้เมื่อจำเป็นต้องตรวจ XML ใหม่ทั้งชุด ระบบจะถามยืนยันก่อนเริ่ม</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">ผลการรันล่าสุด</h3>
          {latest ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <RunBadge status={latest.status} />
                <span>{runNames[latest.run_type] || latest.run_type} · {dateTime(latest.started_at)}</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                เลือก {count(latest.selected)} · ได้ XML {count(latest.fetched)} · ตรวจครบ {count(latest.complete)} ·
                ไม่มี correspondence {count(latest.no_correspondence)} · รอตรวจ {count(latest.needs_review)} · ผิดพลาด {count(latest.failed)}
              </p>
              {latest.error_message && <p className="mt-2 text-sm text-rose-700">{latest.error_message}</p>}
            </>
          ) : <p className="mt-3 text-sm text-slate-500">ยังไม่มีประวัติจากหน้าเว็บ ข้อมูลที่เติมด้วย CLI แสดงในจำนวนด้านบนแล้ว</p>}
          <p className="mt-3 text-xs text-slate-500">XML ที่ไม่ระบุ corresponding ไม่ได้ยืนยันว่าไม่มี corresponding author</p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">ประวัติการรันจากหน้าเว็บ</h3>
        {runs.length ? (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="text-slate-500"><tr><th className="px-2 py-2">เริ่ม</th><th className="px-2 py-2">งาน</th><th className="px-2 py-2">สถานะ</th><th className="px-2 py-2">XML / รอตรวจ / ผิดพลาด</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run) => <tr key={run.id}>
                    <td className="px-2 py-2 text-slate-700">{dateTime(run.started_at)}</td>
                    <td className="px-2 py-2 text-slate-700">{runNames[run.run_type] || run.run_type}</td>
                    <td className="px-2 py-2"><RunBadge status={run.status} /></td>
                    <td className="px-2 py-2 text-slate-700">{count(run.fetched)} / {count(run.needs_review)} / {count(run.failed)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            {(pagination?.total_pages || 0) > 1 && <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>หน้า {page} / {pagination.total_pages}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => load(page - 1)} disabled={page <= 1 || loading} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50">ก่อนหน้า</button>
                <button type="button" onClick={() => load(page + 1)} disabled={!pagination.has_next || loading} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50">ถัดไป</button>
              </div>
            </div>}
          </>
        ) : <p className="mt-2 text-sm text-slate-500">ยังไม่มีประวัติการรันจากหน้าเว็บ</p>}
      </div>
    </section>
  );
}
