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
  const [latestRun, setLatestRun] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);

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
      if (requestedPage === 1) setLatestRun(runsResponse?.data?.[0] || null);
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

  useEffect(() => {
    if (!showRefreshConfirm) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowRefreshConfirm(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showRefreshConfirm]);

  async function start(runType) {
    if (busy || activeRun) return;
    setShowRefreshConfirm(false);
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

  const latest = activeRun || latestRun;
  const disabled = busy || !!activeRun || !coverage;
  const cards = [
    { label: "ผลงานอาจารย์", value: coverage?.eligible, hint: "ผลงานไม่ซ้ำที่มีอาจารย์ในระบบเป็นผู้เขียน รวมทุกสถานะ" },
    { label: "ตรวจครบ", value: coverage?.complete, hint: "อ่าน XML และจับคู่ผู้เขียนได้ครบ พร้อมระบุ corresponding author" },
    { label: "XML ไม่ระบุ corresponding", value: coverage?.no_correspondence, hint: "จับคู่ผู้เขียนได้ แต่ XML ไม่ส่งชื่อ corresponding author" },
    { label: "รอตรวจสอบ", value: coverage?.needs_review, hint: "ได้ XML แล้ว แต่ยังจับคู่ผู้เขียนหรือบทบาทได้ไม่แน่ชัด" },
    { label: "ขอ XML ไม่สำเร็จ", value: coverage?.fetch_error, hint: "เรียก Scopus XML ไม่สำเร็จ สามารถลองเติมใหม่ได้" },
    { label: "ยังไม่ตรวจ", value: coverage?.pending, hint: "ยังไม่ได้ดึง XML หรือรายชื่อผู้เขียนเปลี่ยนหลังตรวจครั้งก่อน" },
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">สถานะข้อมูลบทบาท</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ label, value, hint }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="text-xs font-medium text-slate-600">{label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{coverage ? count(value) : "–"}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
                </div>
              ))}
            </div>
            {coverage && <p className="mt-2 text-xs leading-5 text-slate-600">
              ผลงานอาจารย์ {count(coverage.eligible)} = ตรวจครบ {count(coverage.complete)} + XML ไม่ระบุ corresponding {count(coverage.no_correspondence)} + สถานะอื่น {count((coverage.needs_review || 0) + (coverage.fetch_error || 0) + (coverage.pending || 0))}
            </p>}
          </div>

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
            <div className="mt-4 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => setShowRefreshConfirm(true)}
                disabled={disabled || !coverage?.refresh_requests}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-700 bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
                <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full border border-white text-xs font-bold">!</span>
                ดึงใหม่ทั้งหมด · ประมาณ {count(coverage?.refresh_requests)} คำขอ
              </button>
              <p className="mt-2 text-xs text-slate-500">ใช้เมื่อต้องตรวจ XML ใหม่ทุกผลงาน ระบบจะถามยืนยันก่อนเริ่ม</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">ผลการรันล่าสุด</h3>
          {latest ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <RunBadge status={latest.status} />
                <span>{runNames[latest.run_type] || latest.run_type} · {dateTime(latest.started_at)}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                เลือก {count(latest.selected)} · ได้ XML {count(latest.fetched)} · ตรวจครบ {count(latest.complete)} ·
                ไม่มี correspondence {count(latest.no_correspondence)} · รอตรวจ {count(latest.needs_review)} · ผิดพลาด {count(latest.failed)}
              </p>
              {latest.error_message && <p className="mt-2 text-sm text-rose-700">{latest.error_message}</p>}
            </>
          ) : <p className="mt-3 text-sm text-slate-500">ยังไม่มีประวัติจากหน้าเว็บ ข้อมูลที่เติมด้วย CLI แสดงในสถานะฝั่งซ้ายแล้ว</p>}
          <p className="mt-3 text-xs text-slate-500">XML ที่ไม่ระบุ corresponding ไม่ได้ยืนยันว่าไม่มี corresponding author</p>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">ประวัติการรันจากหน้าเว็บ</h3>
            {runs.length ? (
              <>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {runs.map((run) => <div key={run.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">{runNames[run.run_type] || run.run_type}</span>
                      <RunBadge status={run.status} />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{dateTime(run.started_at)} · ได้ XML {count(run.fetched)} · รอตรวจ {count(run.needs_review)} · ผิดพลาด {count(run.failed)}</div>
                  </div>)}
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
        </div>
      </div>

      {showRefreshConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setShowRefreshConfirm(false);
      }}>
        <div role="dialog" aria-modal="true" aria-labelledby="author-role-refresh-title" aria-describedby="author-role-refresh-description"
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-700" aria-hidden="true">!</div>
          <h2 id="author-role-refresh-title" className="mt-3 text-lg font-semibold text-slate-900">ยืนยันการดึงข้อมูลใหม่ทั้งหมด</h2>
          <p id="author-role-refresh-description" className="mt-2 text-sm leading-6 text-slate-600">
            ระบบจะเรียก Scopus XML ใหม่ประมาณ {count(coverage?.refresh_requests)} คำขอ และอัปเดตบทบาทของทุกผลงานอาจารย์ที่ตรวจได้สำเร็จ
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => setShowRefreshConfirm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">ยกเลิก</button>
            <button type="button" onClick={() => start("refresh")} disabled={disabled}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">ยืนยันและเริ่มดึง</button>
          </div>
        </div>
      </div>}
    </section>
  );
}
