"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Plus, Pencil, Trash2, X,
  Loader2, Search, GraduationCap, ChevronDown, Check,
} from "lucide-react";
import Header from "../component/layout/Header";
import Swal from "sweetalert2";

const DEGREE_LEVELS = [
  { id: 1, label: "ปริญญาตรี",  short: "ตรี" },
  { id: 2, label: "ปริญญาโท",  short: "โท" },
  { id: 3, label: "ปริญญาเอก", short: "เอก" },
];

const DEGREE_BADGE = {
  1: "bg-sky-100 text-sky-700 border-sky-200",
  2: "bg-violet-100 text-violet-700 border-violet-200",
  3: "bg-amber-100 text-amber-700 border-amber-200",
};

const DEGREE_GROUP_HEADER = {
  1: "bg-sky-50 border-sky-200 text-sky-700",
  2: "bg-violet-50 border-violet-200 text-violet-700",
  3: "bg-amber-50 border-amber-200 text-amber-700",
};

const EMPTY_ROW = {
  degree_id:       1,
  course_name_th:  "",
  course_name_en:  "",
  degree_full_th:  "",
  degree_short_th: "",
  degree_full_en:  "",
  degree_short_en: "",
};

const BASE = "http://localhost:8080/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(), ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function Cell({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded px-1 py-0.5 transition ${className}`}
    />
  );
}

function CourseRow({ course, degreeId, editing, saving, onStartEdit, onCancelEdit, onSetField, onSave, onDelete }) {
  const id   = course.course_id;
  const isEd = !!editing[id];
  const row  = isEd ? editing[id] : course;

  return (
    <tr className={`border-b border-slate-100 transition-colors ${isEd ? "bg-emerald-50/60" : "hover:bg-slate-50/70"}`}>
      
      {/* ── คอลัมน์ระดับ: แสดงเป็น Dropdown เฉพาะตอนกดแก้ไขเท่านั้น ── */}
      {isEd ? (
        <td className="px-3 py-2.5 w-28">
          <select
            value={row.degree_id}
            onChange={(e) => onSetField(id, "degree_id", Number(e.target.value))}
            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none focus:border-emerald-400"
          >
            {DEGREE_LEVELS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </td>
      ) : (
        null // ตอนแสดงผลโหมดปกติ จะไม่เรนเดอร์คอลัมน์นี้ออกมาเลย
      )}

      <td className="px-3 py-2.5">
        {isEd ? <Cell value={row.course_name_th} onChange={(v) => onSetField(id, "course_name_th", v)} placeholder="ชื่อหลักสูตร (ไทย) *" />
               : <span className="text-sm font-medium text-slate-800">{course.course_name_th}</span>}
      </td>
      <td className="px-3 py-2.5">
        {isEd ? <Cell value={row.course_name_en} onChange={(v) => onSetField(id, "course_name_en", v)} placeholder="ชื่อหลักสูตร (EN) *" />
               : <span className="text-sm text-slate-600">{course.course_name_en}</span>}
      </td>
      <td className="px-3 py-2.5 hidden lg:table-cell">
        {isEd ? <Cell value={row.degree_full_th} onChange={(v) => onSetField(id, "degree_full_th", v)} placeholder="ชื่อปริญญาเต็ม (ไทย)" />
               : <span className="text-xs text-slate-500">{course.degree_full_th || <span className="text-slate-300">-</span>}</span>}
      </td>
      <td className="px-3 py-2.5 hidden xl:table-cell w-36">
        {isEd ? <Cell value={row.degree_short_th} onChange={(v) => onSetField(id, "degree_short_th", v)} placeholder="ย่อ (ไทย)" />
               : <span className="text-xs text-slate-500">{course.degree_short_th || <span className="text-slate-300">-</span>}</span>}
      </td>
      <td className="px-3 py-2.5 hidden xl:table-cell w-36">
        {isEd ? <Cell value={row.degree_short_en} onChange={(v) => onSetField(id, "degree_short_en", v)} placeholder="ย่อ (EN)" />
               : <span className="text-xs text-slate-500">{course.degree_short_en || <span className="text-slate-300">-</span>}</span>}
      </td>
      <td className="px-3 py-2.5 w-20">
        <div className="flex items-center gap-1.5 justify-end">
          {isEd ? (
            <>
              <button onClick={() => onSave(id)} disabled={saving[id]}
                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition" title="บันทึก">
                {saving[id] ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              </button>
              <button onClick={() => onCancelEdit(id)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition" title="ยกเลิก">
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onStartEdit(course)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 transition" title="แก้ไข">
                <Pencil size={13} />
              </button>
              <button onClick={() => onDelete(id)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition" title="ลบ">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function CoursesPage() {
  const router = useRouter();

  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearch]   = useState("");
  const [filterDeg, setFilterDeg] = useState(0);
  const [editing, setEditing]     = useState({});
  const [saving, setSaving]       = useState({});
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow]       = useState({ ...EMPTY_ROW });
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError]   = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/researcher-management/courses");
      setCourses(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = courses.filter((c) => {
    const matchS = !searchTerm ||
      c.course_name_th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_name_en?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchD = !filterDeg || Number(c.degree_id) === filterDeg;
    return matchS && matchD;
  });

  const grouped = DEGREE_LEVELS.map((d) => ({
    ...d,
    items: filtered.filter((c) => Number(c.degree_id) === d.id),
  })).filter((g) => g.items.length > 0);

  const startEdit    = (course) => setEditing((p) => ({ ...p, [course.course_id]: { ...course } }));
  const cancelEdit   = (id) => setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
  const setEditField = (id, field, val) => setEditing((p) => ({ ...p, [id]: { ...p[id], [field]: val } }));

  const saveEdit = async (id) => {
    const row = editing[id];
    if (!row.course_name_th?.trim() || !row.course_name_en?.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบถ้วน", text: "กรุณากรอกชื่อหลักสูตรทั้งภาษาไทยและอังกฤษ", confirmButtonColor: "#059669", confirmButtonText: "ตกลง" });
      return;
    }
    setSaving((p) => ({ ...p, [id]: true }));
    try {
      await apiFetch(`/researcher-management/courses/${id}`, { method: "PUT", body: JSON.stringify({ ...row, degree_id: Number(row.degree_id) }) });
      cancelEdit(id);
      fetchCourses();
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", text: "แก้ไขข้อมูลหลักสูตรเรียบร้อยแล้ว", confirmButtonColor: "#059669", confirmButtonText: "ตกลง" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message, confirmButtonColor: "#dc2626", confirmButtonText: "ตกลง" });
    } finally {
      setSaving((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const confirmDelete = async (id) => {
    const result = await Swal.fire({
      icon: "warning", title: "ยืนยันการลบหลักสูตร?",
      text: "หลักสูตรนี้จะถูกลบออกจากระบบ และอาจส่งผลต่อข้อมูลอาจารย์ที่ผูกไว้",
      showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#cbd5e1",
      confirmButtonText: "ลบออก", cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        await apiFetch(`/researcher-management/courses/${id}`, { method: "DELETE" });
        fetchCourses();
        Swal.fire({ icon: "success", title: "ลบข้อมูลสำเร็จ", confirmButtonColor: "#059669", confirmButtonText: "ตกลง" });
      } catch (err) {
        Swal.fire({ icon: "error", title: "ไม่สามารถลบข้อมูลได้", text: err.message, confirmButtonColor: "#dc2626", confirmButtonText: "ตกลง" });
      }
    }
  };

  const handleAddSave = async () => {
    if (!newRow.course_name_th?.trim() || !newRow.course_name_en?.trim()) {
      setNewError("กรุณากรอกชื่อหลักสูตรทั้งภาษาไทยและอังกฤษ");
      return;
    }
    setNewError("");
    setSavingNew(true);
    try {
      await apiFetch("/researcher-management/courses", { method: "POST", body: JSON.stringify({ ...newRow, degree_id: Number(newRow.degree_id) }) });
      setAddingRow(false);
      setNewRow({ ...EMPTY_ROW });
      fetchCourses();
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", text: "เพิ่มหลักสูตรใหม่เรียบร้อยแล้ว", confirmButtonColor: "#059669", confirmButtonText: "ตกลง" });
    } catch (err) {
      setNewError(err.message);
    } finally {
      setSavingNew(false);
    }
  };

  const newRowJSX = addingRow ? (
    <tr className="bg-emerald-50/80 border-b border-emerald-200">
      <td className="px-3 py-2.5 w-28">
        <select value={newRow.degree_id} onChange={(e) => setNewRow((p) => ({ ...p, degree_id: Number(e.target.value) }))}
          className="w-full text-xs rounded-lg border border-emerald-300 bg-white px-2 py-1 outline-none focus:border-emerald-500">
          {DEGREE_LEVELS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </td>
      {[
        { key: "course_name_th",  ph: "ชื่อหลักสูตร (ไทย) *", cls: "" },
        { key: "course_name_en",  ph: "Course name (EN) *",    cls: "" },
        { key: "degree_full_th",  ph: "ชื่อปริญญาเต็ม (ไทย)", cls: "hidden lg:table-cell" },
        { key: "degree_short_th", ph: "ย่อ (ไทย)",             cls: "hidden xl:table-cell" },
        { key: "degree_short_en", ph: "Short (EN)",             cls: "hidden xl:table-cell" },
      ].map(({ key, ph, cls }) => (
        <td key={key} className={`px-3 py-2.5 ${cls}`}>
          <input type="text" value={newRow[key]}
            onChange={(e) => setNewRow((p) => ({ ...p, [key]: e.target.value }))}
            placeholder={ph}
            className="w-full bg-white border border-emerald-200 rounded outline-none text-sm text-slate-800 placeholder:text-slate-300 focus:ring-1 focus:ring-emerald-300 px-2 py-1 transition"
          />
        </td>
      ))}
      <td className="px-3 py-2.5 w-20">
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={handleAddSave} disabled={savingNew}
            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition" title="บันทึก">
            {savingNew ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button onClick={() => { setAddingRow(false); setNewRow({ ...EMPTY_ROW }); setNewError(""); }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition" title="ยกเลิก">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  ) : null;

  // ── ย้ายตำแหน่งการประกาศตัวแปรมาไว้ตรงนี้ เพื่อให้ทุกจุดในบล็อก return เรียกใช้ได้ถูกต้อง ──
  const isUserInteracting = addingRow || Object.keys(editing).length > 0;
  const currentCols = isUserInteracting ? 7 : 6;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-12">
      {/* ── Header ── */}
      <Header currentPageTitle="จัดการฐานข้อมูลหลักสูตร" />

      {/* ── Main Layout Wrapper ── */}
      <main className="w-full pt-28 px-6">
        <div className="max-w-5xl mx-auto space-y-3">
          
          {/* ── ส่วนกลุ่มปุ่มด้านบนสุด ── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => router.push("/researcher-management")}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-cyan-300 hover:text-cyan-700 shadow-sm"
            >
              <ArrowLeft size={16} className="me-2" />
              ย้อนกลับ
            </button>

            <button
              disabled={addingRow}
              onClick={() => { setAddingRow(true); setNewRow({ ...EMPTY_ROW }); }}
              className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 shadow-sm disabled:opacity-50"
            >
              <Plus size={16} className="me-2" />
              เพิ่มหลักสูตรใหม่
            </button>
          </div>

          {/* ── กรอบชุดคอนเทนเนอร์หลัก ── */}
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

            {/* ส่วนหัวภายในกรอบหลัก */}
            <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50 px-4 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    จัดการฐานข้อมูลหลักสูตร
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    ดูรายการ ค้นหา และปรับปรุงข้อมูลหลักสูตรระดับต่าง ๆ ภายในระบบ
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  ทั้งหมด {filtered.length} หลักสูตร
                </span>
              </div>

              {/* กล่องค้นหาและคัดกรองระดับ (Search & Filter) */}
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_-25px_rgba(6,95,70,0.45)]">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อหลักสูตร..."
                      value={searchTerm}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                    <Search className="absolute right-3 top-3.5 text-slate-400" size={16} />
                  </div>
                  <div className="relative">
                    <select 
                      value={filterDeg} 
                      onChange={(e) => setFilterDeg(Number(e.target.value))}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-400 cursor-pointer h-full"
                    >
                      <option value={0}>ทุกระดับ</option>
                      {DEGREE_LEVELS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* เนื้อหาภายในกรอบหลัก */}
            <div className="relative p-4 sm:p-6 space-y-4">
              
              {/* Error Alert */}
              {newError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {newError}
                </div>
              )}

              {/* ตารางแสดงข้อมูลหลักสูตร */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="p-6 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-xl border border-slate-100 bg-slate-100/80" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {/* ซ่อน/แสดง คอลัมน์หัวตาราง "ระดับ" ตามสถานะการแก้ไขหรือเพิ่มข้อมูล */}
                          {isUserInteracting && (
                            <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-28">ระดับ</th>
                          )}
                          <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">ชื่อหลักสูตร (ไทย)</th>
                          <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">ชื่อหลักสูตร (EN)</th>
                          <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">ชื่อปริญญาเต็ม (ไทย)</th>
                          <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell w-36">ชื่อปริญญาย่อ (ไทย)</th>
                          <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell w-36">Short (EN)</th>
                          <th className="px-3 py-3 w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {newRowJSX}
                        {grouped.length === 0 && !addingRow ? (
                          <tr>
                            <td colSpan={currentCols} className="px-6 py-12 text-center">
                              <GraduationCap size={36} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-sm text-slate-400">ไม่พบหลักสูตรที่ค้นหา</p>
                            </td>
                          </tr>
                        ) : (
                          grouped.map((group) => (
                            <React.Fragment key={group.id}>
                              <tr className={`border-b ${DEGREE_GROUP_HEADER[group.id]}`}>
                                <td colSpan={currentCols} className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap size={13} />
                                    <span className="text-xs font-bold">ระดับ{group.label}</span>
                                    <span className="text-xs opacity-60">{group.items.length} หลักสูตร</span>
                                  </div>
                                </td>
                              </tr>
                              {group.items.map((course) => (
                                <CourseRow
                                  key={course.course_id}
                                  course={course}
                                  degreeId={group.id}
                                  editing={editing}
                                  saving={saving}
                                  onStartEdit={startEdit}
                                  onCancelEdit={cancelEdit}
                                  onSetField={setEditField}
                                  onSave={saveEdit}
                                  onDelete={confirmDelete}
                                />
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ส่วนท้ายสุดในชุดคอนเทนเนอร์ (Footer Info Bar) */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                <BookOpen size={15} />
                <span>
                  ดึงข้อมูลจากตาราง <code className="font-mono text-xs bg-emerald-100 px-1.5 py-0.5 rounded">instructor_courses</code> · ทั้งหมด {courses.length} หลักสูตร
                </span>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
