"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, ChevronRight, UserCircle, Clock, ArrowLeft, Settings, Database, BookOpen, ClipboardList  } from "lucide-react";

export default function SearchInstructor() {
  const router = useRouter();

  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const handleBackToPortal = () => {
    window.location.href = "/";
  };

  const handleGoToWeightsPage = () => {
    router.push("/researcher-management/weights");
  };

  const renderContentWithBack = (content) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleBackToPortal}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft size={16} className="me-2" />
          กลับหน้าหลัก
        </button>

        <button
          onClick={handleGoToWeightsPage}
          className="inline-flex items-center rounded-full border border-slate-300 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 shadow-sm"
        >
          <Settings size={16} className="me-2" />
          ตั้งค่าค่าน้ำหนักผลงาน
        </button>

        <button
          onClick={() => router.push("/researcher-management/sources")}
          className="inline-flex items-center rounded-full border border-slate-300 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 shadow-sm"
        >
          <Database size={16} className="me-2" />
          ตั้งค่าฐานข้อมูลแหล่งอ้างอิง
        </button>

        {/* ── ปุ่มใหม่: จัดการหลักสูตร ── */}
        <button
          onClick={() => router.push("/researcher-management/courses")}
          className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 shadow-sm"
        >
          <BookOpen size={16} className="me-2" />
          จัดการฐานข้อมูลหลักสูตร
        </button>
        
        <button
          onClick={() => router.push("/researcher-management/audit")}
          className="inline-flex items-center rounded-full border border-violet-300 bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600 shadow-sm"
        >
          <ClipboardList size={16} className="me-2" />
          ประวัติการแก้ไข
        </button>

      </div>
      {content}
    </div>
  );

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8080/api/v1/admin/instructors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok) {
          if (Array.isArray(data)) {
            setInstructors(data);
          } else if (data && Array.isArray(data.data)) {
            setInstructors(data.data);
          } else {
            setInstructors([]);
          }
        } else {
          setInstructors([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  const filteredData = (Array.isArray(instructors) ? instructors : []).filter((item) => {
    if (!item) return false;
    const firstName = item.user_fname || "";
    const lastName = item.user_lname || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        {renderContentWithBack(
          <>
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />

              <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      จัดการข้อมูลบุคลากร
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      ค้นหาและเลือกรายชื่ออาจารย์เพื่อแก้ไขข้อมูลวิชาการและผลงาน
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    ทั้งหมด {filteredData.length} รายชื่อ
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_-25px_rgba(6,95,70,0.45)]">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อหรือนามสกุล..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 pr-12 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute right-4 top-3 text-slate-400" size={18} />
                    </div>
                    <button className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">
                      ค้นหา
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <UserCircle size={18} className="text-cyan-600" />
                    รายชื่ออาจารย์ในระบบ
                  </h3>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 w-full" />
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <div
                        key={item.user_id}
                        className="group flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_34px_-28px_rgba(14,116,144,0.45)]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold shadow-sm">
                            {item.user_fname?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-snug text-slate-900 sm:text-base group-hover:text-cyan-700 transition-colors">
                              {item.prefix}{item.user_fname} {item.user_lname}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.position || "อาจารย์ประจำวิทยาลัย"}
                              {(() => {
                                const responsibilities =
                                  item.instructor_course_responsibility ||
                                  item.InstructorCourseResponsibility ||
                                  item.header?.instructor_course_responsibility ||
                                  item.header?.InstructorCourseResponsibility ||
                                  item.courses_data;

                                const resp = Array.isArray(responsibilities) ? responsibilities[0] : null;

                                if (!resp) return " (ยังไม่ระบุหลักสูตร)";

                                const courseName = resp.course?.course_name_th || resp.Course?.course_name_th;

                                if (courseName) {
                                  return `, ${courseName}`;
                                } else if (resp.course_id) {
                                  return `, หลักสูตร ID: ${resp.course_id}`;
                                }

                                return " (ยังไม่ระบุหลักสูตร)";
                              })()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => (window.location.href = `/researcher-management/edit/${item.user_id}`)}
                          className="hidden sm:inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 transition group-hover:border-cyan-300 group-hover:bg-cyan-100"
                        >
                          จัดการข้อมูล
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform ms-1" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      <User size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">ไม่พบข้อมูลรายชื่ออาจารย์ที่ค้นหา</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative mx-4 mb-5 sm:mx-6 rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-800 flex items-center gap-2">
                <Clock size={15} />
                ข้อมูลบุคลากรถูกดึงมาจากระบบฐานข้อมูลส่วนกลางล่าสุด
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
