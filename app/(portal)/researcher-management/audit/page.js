"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
} from "lucide-react";
import Header from "../component/layout/Header";
import { apiClient } from "../../../lib/api";

const PAGE_SIZE = 10;

const TABLE_MAP = {
  instructor_research_projects: "โครงการวิจัยอาจารย์",
  users: "ข้อมูลผู้ใช้งาน/บุคลากร",
  courses: "ข้อมูลหลักสูตร",
  instructors: "ข้อมูลอาจารย์",
  instructor_course_responsibility: "หลักสูตรที่รับผิดชอบ",
  instructor_expertises: "ความเชี่ยวชาญของอาจารย์",
  instructor_educations: "ประวัติการศึกษาของอาจารย์",
  instructor_courses: "หลักสูตรที่เปิดสอน",
  instructor_intellectual_properties: "ทรัพย์สินทางปัญญา",
  instructor_textbooks: "ตำรา หนังสือ และเอกสารประกอบการสอน",
  ranking_tier_weights: "ค่าน้ำหนักของเกณฑ์มาตรฐานผลงานวิชาการ",
  ranking_sources: "แหล่งข้อมูลเกณฑ์มาตรฐานผลงานวิชาการ",
  research_projects: "โครงการวิจัย",
};

const FIELD_MAP = {
  project_name_th: "ชื่อโครงการ (TH)",
  project_name_en: "ชื่อโครงการ (EN)",
  status: "สถานะ",
  course_id: "หลักสูตร",
  role: "สิทธิ์การใช้งาน",
};

const SKIP_KEYS = new Set(["id", "created_at", "updated_at", "deleted_at"]);

const ACTION_STYLE = {
  INSERT: { bg: "bg-emerald-100", text: "text-emerald-700", label: "เพิ่มข้อมูล" },
  UPDATE: { bg: "bg-amber-100", text: "text-amber-700", label: "แก้ไขข้อมูล" },
  DELETE: { bg: "bg-rose-100", text: "text-rose-700", label: "ลบข้อมูล" },
};

// Component สำหรับเปรียบเทียบความแตกต่างข้อมูล
function DiffViewer({ oldValue, newValue, action, coursesMap, fieldName }) {
  const formatValue = (key, val) => {
    if (val == null || val === "" || val === "<nil>") return "-";

    // เคส nested object ของ InstructorCourse (key "course")
    if (key === "course" && val && typeof val === "object") {
      return (
        val.course_name_th ||
        val.course_name_en ||
        `หลักสูตร (ID: ${val.course_id ?? "-"})`
      );
    }

    // เคส course_id ที่เป็นแค่ตัวเลข ID เดี่ยวๆ
    if (key === "course_id" || key === "course_ids") {
      if (val && typeof val === "object") {
        return (
          val.course_name_th ||
          val.course_name_en ||
          `หลักสูตร (ID: ${val.course_id ?? "-"})`
        );
      }
      return coursesMap[String(val)] || `หลักสูตร (ID: ${val})`;
    }

    if (typeof val === "boolean") return val ? "ใช้งาน" : "ปิดใช้งาน";

    if (val && typeof val === "object") {
      return val.name || val.title || "-";
    }

    return String(val);
  };

  const parseVal = (v) => {
    if (!v || v === "" || v === "-") return null;
    try { return JSON.parse(v); } catch { return v; }
  };

  const oldObj = parseVal(oldValue);
  const newObj = parseVal(newValue);

  // เคส string ธรรมดา
  if (typeof oldObj === "string" || typeof newObj === "string") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        {oldObj && (
          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
            {formatValue(fieldName, oldObj)}
          </span>
        )}
        {oldObj && newObj && <span className="text-slate-400">→</span>}
        {newObj && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
            {formatValue(fieldName, newObj)}
          </span>
        )}
      </div>
    );
  }

  //เคส ARRAY (เช่น course_ids ที่เป็นหลายรายการ) — diff ทั้งชุด ไม่ตัดเหลือแค่ตัวแรก
  if (Array.isArray(oldObj) || Array.isArray(newObj)) {
    const oldArr = Array.isArray(oldObj) ? oldObj : (oldObj ? [oldObj] : []);
    const newArr = Array.isArray(newObj) ? newObj : (newObj ? [newObj] : []);

    // ใช้ course_id เป็น key จับคู่รายการเก่า/ใหม่ (กันกรณีลำดับ array สลับกัน)
    const keyOf = (item) => String(item?.course_id ?? item?.id ?? "");

    const oldMap = new Map(oldArr.map((it) => [keyOf(it), it]));
    const newMap = new Map(newArr.map((it) => [keyOf(it), it]));

    const addedItems   = newArr.filter((it) => !oldMap.has(keyOf(it)));
    const removedItems = oldArr.filter((it) => !newMap.has(keyOf(it)));

    if (addedItems.length === 0 && removedItems.length === 0) {
      return <span className="text-xs text-slate-400 italic">ไม่มีรายละเอียดการเปลี่ยนแปลง</span>;
    }

    return (
      <div className="flex flex-col gap-1.5">
        {removedItems.map((it, i) => (
          <div key={`del-${i}`} className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
              {formatValue("course", it.course || it)}
            </span>
          </div>
        ))}
        {addedItems.map((it, i) => (
          <div key={`add-${i}`} className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
              {formatValue("course", it.course || it)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // เคส object เดี่ยว (INSERT/UPDATE/DELETE record เดียว)
  const oldItem = oldObj;
  const newItem = newObj;

  const allKeys = [
    ...new Set([
      ...Object.keys(oldItem || {}),
      ...Object.keys(newItem || {}),
    ]),
  ].filter((k) => !SKIP_KEYS.has(k) && !k.endsWith("_id"));

  //ใช้ JSON.stringify เทียบค่า แทน String() เพราะ String({...}) ได้ "[object Object]" เท่ากันเสมอ
  const stable = (v) => (v && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""));

  let displayKeys = [];
  if (action === "INSERT") {
    displayKeys = allKeys.filter((k) => newItem?.[k] != null).slice(0, 3);
  } else if (action === "DELETE") {
    displayKeys = allKeys.filter((k) => oldItem?.[k] != null).slice(0, 3);
  } else {
    displayKeys = allKeys.filter((k) => stable(oldItem?.[k]) !== stable(newItem?.[k]));
  }

  if (displayKeys.length === 0)
    return <span className="text-xs text-slate-400 italic">ไม่มีรายละเอียดการเปลี่ยนแปลง</span>;

  return (
    <div className="flex flex-col gap-1.5">
      {displayKeys.map((k) => {
        const o = oldItem?.[k];
        const n = newItem?.[k];
        const labelThai = FIELD_MAP[k] || k;

        return (
          <div key={k} className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 font-medium min-w-[90px]">
              {labelThai}:
            </span>
            {action !== "INSERT" && o != null && (
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through">
                {formatValue(k, o)}
              </span>
            )}
            {action === "UPDATE" && <span className="text-slate-400">→</span>}
            {action !== "DELETE" && n != null && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                {formatValue(k, n)}
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

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterTable, setFilterTable] = useState("ALL");
  const [page, setPage] = useState(1);
  const [tables, setTables] = useState([]);

  // Dynamic Lookup Maps
  const [coursesMap, setCoursesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [coursesRes, usersRes] = await Promise.all([
          apiClient.get("/researcher-management/courses"), 
          apiClient.get("/researcher-management/instructors"),
        ]);

        const cList = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data ?? []);
        const uList = Array.isArray(usersRes) ? usersRes : (usersRes?.data ?? []);

        const cMap = {};
        cList.forEach((c) => {
          cMap[String(c.id)] = c.course_name_th || c.course_name_en || c.name;
        });

        const uMap = {};
        uList.forEach((u) => {
          const fullName = `${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.trim();
          uMap[String(u.id || u.user_id)] = fullName || u.username;
        });

        setCoursesMap(cMap);
        setUsersMap(uMap);
      } catch (err) {
        console.error("Fetch lookups error:", err);
      }
    };

    fetchLookups();
  }, []);

  const getRecordDisplayName = useCallback((log) => {
    if (!log) return "—";

    const parse = (v) => {
      if (!v) return null;
      try { return JSON.parse(v); } catch { return null; }
    };
    
    const oldObj = parse(log.old_value);
    const newObj = parse(log.new_value);
    const item = (Array.isArray(newObj) ? newObj[0] : newObj) || (Array.isArray(oldObj) ? oldObj[0] : oldObj);

    if (item && typeof item === "object") {
      const directName = 
        item.project_name_th || item.project_name_en || 
        item.course_name_th || item.course_name_en || 
        item.source_name || item.source_code || 
        item.title_th || item.title_en || item.name || item.title || item.tier_name;
      if (directName) return directName;

      if (item.user_fname) {
        return `${item.prefix || ''} ${item.user_fname} ${item.user_lname}`.trim();
      }

      const targetUserId = String(item.user_id || "");
      if (targetUserId && usersMap[targetUserId]) {
        return usersMap[targetUserId];
      }
    }

    if (log.user_target) {
      return `${log.user_target.prefix || ''} ${log.user_target.user_fname} ${log.user_target.user_lname}`.trim();
    }

    const targetId = String(log.record_id ?? item?.id ?? "");
    if (targetId) {
      if (log.table_name === "courses" && coursesMap[targetId]) {
        return coursesMap[targetId];
      }
      if (log.table_name === "users" && usersMap[targetId]) {
        return usersMap[targetId];
      }
      return `รายการ (ID: ${targetId})`;
    }

    return "—";
  }, [usersMap, coursesMap]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/researcher-management/audit-logs");
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setLogs(list);
      
      // กรองเอาตาราง instructor_profile ออกจากตัวเลือก Filter
      const uniqueTables = [...new Set(list.map((l) => l.table_name).filter((t) => t && t !== "instructor_profile"))];
      setTables(uniqueTables);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    // ซ่อนข้อมูลที่มาจากตาราง instructor_profile โดยอัตโนมัติ
    if (log.table_name === "instructor_profile") return false;

    const matchAction = filterAction === "ALL" || log.action === filterAction;
    const matchTable  = filterTable  === "ALL" || log.table_name === filterTable;
    
    const term = searchTerm.toLowerCase();
    if (!term) return matchAction && matchTable;

    const editorName = log.user_edit
      ? `${log.user_edit.prefix ?? ""} ${log.user_edit.user_fname} ${log.user_edit.user_lname}`.toLowerCase()
      : "ไม่ระบุผู้แก้ไข";

    const tableNameThai = TABLE_MAP[log.table_name] || log.table_name || "";
    const fieldNameThai = FIELD_MAP[log.field_name] || log.field_name || "";
    const recordName    = getRecordDisplayName(log) || "";

    const matchOldValue = (log.old_value || "").toLowerCase().includes(term);
    const matchNewValue = (log.new_value || "").toLowerCase().includes(term);

    const matchSearch =
      String(log.record_id).includes(term) ||
      tableNameThai.toLowerCase().includes(term) ||
      fieldNameThai.toLowerCase().includes(term) ||
      recordName.toLowerCase().includes(term) ||
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
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    ระบบบันทึกและตรวจสอบประวัติข้อมูล
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    ดูประวัติ รายการเปลี่ยนแปลงข้อมูล และการทำธุรกรรมย้อนหลังทั้งหมดในระบบ
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  ทั้งหมด {filtered.length} รายการ
                </span>
              </div>

              {/* ฟิลเตอร์และช่องค้นหา */}
              <div className="mt-4 rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_-25px_rgba(6,182,212,0.45)]">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อผู้แก้ไข, ชื่อโครงการ, หัวข้อ หรือรายละเอียดการเปลี่ยน..."
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
                      <option value="INSERT">เพิ่มข้อมูล</option>
                      <option value="UPDATE">แก้ไขข้อมูล</option>
                      <option value="DELETE">ลบข้อมูล</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filterTable}
                      onChange={handleFilterTable}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-cyan-400 cursor-pointer h-full"
                    >
                      <option value="ALL">ทุกหมวดหมู่ข้อมูล</option>
                      {tables.map((t) => (
                        <option key={t} value={t}>{TABLE_MAP[t] || t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ตารางแสดงข้อมูล */}
            <div className="relative p-4 sm:p-6 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        <th className="p-3.5 w-[50px]">#</th>
                        <th className="p-3.5">วันที่ / เวลา</th>
                        <th className="p-3.5">ผู้แก้ไข</th>
                        <th className="p-3.5">การกระทำ</th>
                        <th className="p-3.5">หมวดหมู่ข้อมูล</th>
                        <th className="p-3.5">รายการที่ถูกจัดการ</th>
                        <th className="p-3.5">หัวข้อที่เปลี่ยน</th>
                        <th className="p-3.5">รายละเอียดการเปลี่ยนแปลง</th>
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

                          const recordName = getRecordDisplayName(log);

                          return (
                            <tr key={log.id ?? idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3.5 text-slate-400 text-xs font-mono">
                                {(currentPage - 1) * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="p-3.5 text-slate-600 text-xs whitespace-nowrap">
                                {formatDate(log.created_at)}
                              </td>
                              
                              {/* ผู้แก้ไข */}
                              <td className="p-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-semibold text-slate-800">
                                    {log.user_edit 
                                      ? `${log.user_edit.prefix ?? ""} ${log.user_edit.user_fname} ${log.user_edit.user_lname}`.trim()
                                      : "ไม่ระบุผู้แก้ไข"}
                                  </span>
                                  <span className="inline-flex items-center w-max rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                                    ID {log.user_edit_id ?? "—"}
                                  </span>
                                </div>
                              </td>

                              {/* Action Badge */}
                              <td className="p-3.5">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionStyle.bg} ${actionStyle.text}`}>
                                  {actionStyle.label}
                                </span>
                              </td>

                              {/* ชื่อหมวดหมู่/ตาราง */}
                              <td className="p-3.5 text-xs text-slate-700 font-medium">
                                {TABLE_MAP[log.table_name] || log.table_name || "—"}
                              </td>

                              {/* รายการที่ถูกแก้ไข */}
                              <td className="p-3.5 max-w-[200px]">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-slate-800 truncate" title={recordName}>
                                    {recordName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    รหัสรายการ: {log.record_id ?? "—"}
                                  </span>
                                </div>
                              </td>

                              {/* หัวข้อที่เปลี่ยน */}
                              <td className="p-3.5 text-xs text-slate-600">
                                {FIELD_MAP[log.field_name] || log.field_name || "—"}
                              </td>

                              {/* รายละเอียด Diff */}
                              <td className="p-3.5 max-w-[320px]">
                                <DiffViewer
                                  oldValue={log.old_value}
                                  newValue={log.new_value}
                                  action={log.action}
                                  coursesMap={coursesMap}
                                  fieldName={log.field_name} // <--- เพิ่ม prop นี้
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
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