"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  ChevronDown,
} from "lucide-react";
import Header from "../component/layout/Header";
import api from "../../../lib/api";

//Badge สีตาม Action
const ACTION_STYLE = {
  INSERT:  { bg: "bg-emerald-100", text: "text-emerald-700", label: "เพิ่ม" },
  UPDATE:  { bg: "bg-amber-100",   text: "text-amber-700",   label: "แก้ไข" },
  DELETE:  { bg: "bg-red-100",     text: "text-red-600",     label: "ลบ" },
};

const PAGE_SIZE = 15;

const SKIP_KEYS = new Set([
  "id", "user_id", "created_at", "updated_at", "deleted_at",
  "course", "tier_details", "ranking_source",
]);

// DiffViewer 
function DiffViewer({ oldValue, newValue, action }) {
  const parseVal = (v) => {
    if (!v || v === "" || v === "-") return null;
    try { return JSON.parse(v); } catch { return v; }
  };

  const oldObj = parseVal(oldValue);
  const newObj = parseVal(newValue);

  if (typeof oldObj === "string" || typeof newObj === "string") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {oldObj && (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
            {oldObj}
          </span>
        )}
        {oldObj && newObj && <span className="text-slate-400 text-xs">→</span>}
        {newObj && (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            {newObj}
          </span>
        )}
      </div>
    );
  }

  const oldItem = Array.isArray(oldObj) ? oldObj[0] : oldObj;
  const newItem = Array.isArray(newObj) ? newObj[0] : newObj;

  const allKeys = [
    ...new Set([
      ...Object.keys(oldItem || {}),
      ...Object.keys(newItem || {}),
    ]),
  ].filter((k) => !SKIP_KEYS.has(k));

  const displayKeys =
    action === "INSERT"
      ? allKeys.filter((k) => newItem?.[k] != null)
      : action === "DELETE"
      ? allKeys.filter((k) => oldItem?.[k] != null)
      : allKeys.filter((k) => String(oldItem?.[k] ?? "") !== String(newItem?.[k] ?? ""));

  if (displayKeys.length === 0)
    return <span className="text-xs text-slate-400 italic">ไม่มีการเปลี่ยนแปลง</span>;

  return (
    <div className="flex flex-col gap-1">
      {displayKeys.map((k) => {
        const o = oldItem?.[k];
        const n = newItem?.[k];
        return (
          <div key={k} className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400 font-mono min-w-[80px]">{k}</span>
            {action !== "INSERT" && o != null && (
              <span className="font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
                {String(o)}
              </span>
            )}
            {action === "UPDATE" && <span className="text-slate-400">→</span>}
            {action !== "DELETE" && n != null && (
              <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {String(n)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditTrailPage() {
  const router = useRouter();

  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterTable, setFilterTable]   = useState("ALL");
  const [page, setPage]                 = useState(1);
  const [tables, setTables]             = useState([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/researcher-management/audit-logs");
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setLogs(list);
      const uniqueTables = [...new Set(list.map((l) => l.table_name).filter(Boolean))];
      setTables(uniqueTables);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const matchAction = filterAction === "ALL" || log.action === filterAction;
    const matchTable  = filterTable  === "ALL" || log.table_name === filterTable;
    
    const term = searchTerm.toLowerCase();
    if (!term) return matchAction && matchTable;

    //สร้างตัวแปรเก็บชื่อรวมคำนำหน้าของผู้แก้ไขสำหรับใช้ Search
    const editorName = log.user_edit
      ? `${log.user_edit.prefix ?? ""} ${log.user_edit.user_fname} ${log.user_edit.user_lname}`.toLowerCase()
      : "ไม่ระบุผู้แก้ไข";

    //เช็คการค้นหาจากข้อมูลเก่า-ใหม่ (Old value / New value)
    const matchOldValue = (log.old_value || "").toLowerCase().includes(term);
    const matchNewValue = (log.new_value || "").toLowerCase().includes(term);

    const matchSearch =
      String(log.record_id).includes(term) ||
      (log.table_name || "").toLowerCase().includes(term) ||
      (log.field_name || "").toLowerCase().includes(term) ||
      (log.action     || "").toLowerCase().includes(term) ||
      editorName.includes(term) ||    
      matchOldValue ||                
      matchNewValue;                  

    return matchAction && matchTable && matchSearch;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
  const handleFilterAction = (e) => { setFilterAction(e.target.value); setPage(1); };
  const handleFilterTable  = (e) => { setFilterTable(e.target.value);  setPage(1); };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-12">
      <Header currentPageTitle="ประวัติการแก้ไขข้อมูล (Audit Trail)" />

      <main className="w-full pt-28 px-6">
        <div className="max-w-7xl mx-auto space-y-3">

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => router.push("/researcher-management")}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-cyan-300 hover:text-cyan-700 shadow-sm"
            >
              <ArrowLeft size={16} className="me-2" />
              ย้อนกลับ
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

            <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      ระบบบันทึกและตรวจสอบประวัติข้อมูล
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    ดูประวัติ ลิสต์รายการการเปลี่ยนแปลงข้อมูล และการทำธุรกรรมย้อนหลังทั้งหมดภายในระบบ
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  ทั้งหมด {filtered.length} รายการ
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_-25px_rgba(6,182,212,0.45)]">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    
                    <input
                      type="text"
                      placeholder="ค้นหารายชื่อผู้แก้ไข, การเปลี่ยนแปลง, ตาราง, ฟิลด์..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                    <Search className="absolute right-3 top-3.5 text-slate-400" size={16} />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={filterAction}
                      onChange={handleFilterAction}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-cyan-400 cursor-pointer h-full"
                    >
                      <option value="ALL">ทุก Action</option>
                      <option value="INSERT">INSERT — เพิ่ม</option>
                      <option value="UPDATE">UPDATE — แก้ไข</option>
                      <option value="DELETE">DELETE — ลบ</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filterTable}
                      onChange={handleFilterTable}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-cyan-400 cursor-pointer h-full"
                    >
                      <option value="ALL">ทุกตาราง</option>
                      {tables.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-4 sm:p-6 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        <th className="p-3.5 w-[50px]">#</th>
                        <th className="p-3.5">วันที่ / เวลา</th>
                        <th className="p-3.5">ผู้แก้ไข</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">ตาราง</th>
                        <th className="p-3.5">ฟิลด์</th>
                        <th className="p-3.5 text-center">Record ID</th>
                        <th className="p-3.5">การเปลี่ยนแปลง</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(8)].map((_, j) => (
                              <td key={j} className="p-4">
                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : paginated.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400">
                            <Info size={36} className="mx-auto mb-3 text-slate-300" />
                            ไม่พบข้อมูล Audit Log
                          </td>
                        </tr>
                      ) : (
                        paginated.map((log, idx) => {
                          const actionStyle = ACTION_STYLE[log.action] ?? {
                            bg: "bg-slate-100", text: "text-slate-600", label: log.action,
                          };
                          return (
                            <tr key={log.id ?? idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3.5 text-slate-400 text-xs font-mono">
                                {(currentPage - 1) * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="p-3.5 text-slate-600 text-xs whitespace-nowrap">
                                {formatDate(log.created_at)}
                              </td>
                              {/* ── แสดงผลชื่อผู้แก้ไขพร้อม ID กำกับเล็กๆ ด้านล่าง ── */}
                              <td className="p-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-semibold text-slate-800">
                                    {log.user_edit 
                                      ? `${log.user_edit.prefix ?? ""} ${log.user_edit.user_fname} ${log.user_edit.user_lname}`.trim()
                                      : "ไม่ระบุผู้แก้ไข"}
                                  </span>
                                  <span className="inline-flex items-center w-max rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 mt-0.5">
                                    ID {log.user_edit_id ?? "—"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionStyle.bg} ${actionStyle.text}`}>
                                  {actionStyle.label}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-xs text-slate-500">
                                {log.table_name ?? "—"}
                              </td>
                              <td className="p-3.5 text-xs text-slate-500">
                                {log.field_name ?? "—"}
                              </td>
                              <td className="p-3.5 text-center font-mono text-xs text-slate-700">
                                {log.record_id ?? "—"}
                              </td>
                              <td className="p-3.5 max-w-[320px]">
                                <DiffViewer
                                  oldValue={log.old_value}
                                  newValue={log.new_value}
                                  action={log.action}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {!loading && filtered.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
                    <span className="text-xs text-slate-500">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition shadow-sm"
                      >
                        <ChevronLeft size={14} className="me-1" />
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition shadow-sm"
                      >
                        ถัดไป
                        <ChevronRight size={14} className="ms-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
