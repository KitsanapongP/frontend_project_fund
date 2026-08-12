"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, GraduationCap, Save, Loader2, BookOpen, Award, ArrowLeft, ExternalLink, Mail } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";
import { normalizeRoleName } from "../../../lib/access_routing";
import ResearcherExpertise from "./ResearcherExpertise";
import ResearcherProject from "./ResearcherProject";
import ResearcherResearch from "./ResearcherResearch";
import ResearcherProperty from "./ResearcherProperty";
import ResearcherProfile from "./ResearcherProfile";
import ResearcherEducation from "./ResearcherEducation";
import ResearcherTextbook from "./ResearcherTextbook";
import { exportToDocx } from "../utils/exportCHEDocx";
import { apiClient } from "../../../lib/api";
import Swal from "sweetalert2"; 

export default function Instructor({ currentPage, setCurrentPage, targetUserId }) {
  const [data, setData] = useState({ header: {}, educations: [] });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const router = useRouter();

  const TABS = [
    { id: "profile",    label: "ข้อมูลส่วนตัว",    icon: <User size={18} /> },
    { id: "education",  label: "ประวัติการศึกษา",    icon: <GraduationCap size={18} /> },
    { id: "expertise",  label: "ความเชี่ยวชาญ",      icon: <User size={18} /> },
    { id: "project",    label: "โครงการวิจัย",        icon: <BookOpen size={18} /> },
    { id: "research",   label: "งานวิจัย",            icon: <BookOpen size={18} /> },
    { id: "textbooks",  label: "ตำราและหนังสือ",      icon: <BookOpen size={18} /> },
    { id: "property",   label: "ทรัพย์สินทางปัญญา",  icon: <Award size={18} /> },
  ];

  const DEGREE_OPTIONS = [
    { id: "1", label: "ปริญญาตรี" },
    { id: "2", label: "ปริญญาโท" },
    { id: "3", label: "ปริญญาเอก" },
  ];

  const { user } = useAuth();
  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const computeDiff = (originalList, currentList) => {
    const safeOriginal = originalList || [];
    const safeCurrent  = currentList  || [];

    const added = safeCurrent.filter(item => !item.id);

    const updated = safeCurrent.filter(item => {
      if (!item.id) return false;
      const original = safeOriginal.find(o => o.id === item.id);
      if (!original) return false;
      const { id: _1, created_at: _2, updated_at: _3, deleted_at: _4, ...curr } = item;
      const { id: _5, created_at: _6, updated_at: _7, deleted_at: _8, ...orig } = original;
      return JSON.stringify(curr) !== JSON.stringify(orig);
    });

    const deleted = safeOriginal
      .filter(orig => orig.id && !safeCurrent.find(curr => curr.id === orig.id))
      .map(orig => ({ id: orig.id, updated_at: orig.updated_at }));

    return { added, updated, deleted };
  };

  const fetchData = useCallback(async () => {
    if (!targetUserId) { setLoading(false); return; }
    try {
      const res = await apiClient.get(`/researcher-management/instructors/${targetUserId}`);
      const profileData = res;
      setData(profileData);

      const merged = {
  ...(profileData.header || {}),
  date_of_employment: profileData.header?.date_of_employment
    ? profileData.header.date_of_employment.split("T")[0]
    : "",

  educations: profileData.educations || [],

  instructor_course_responsibility: (
    profileData.instructor_course_responsibility || []
  ).map(c => ({
    ...c,
    course_id: Number(c.course_id),
  })),

  expertises: profileData.expertises || [],

  instructor_research_projects: (
    profileData.instructor_research_projects || []
  ).map(p => ({
    ...p,
    start_date: p.start_date ? p.start_date.split("T")[0] : "",
    end_date: p.end_date ? p.end_date.split("T")[0] : "",
  })),

  instructor_intellectual_properties:
    profileData.instructor_intellectual_properties ||
    profileData.instructor_intelectual_properties || [],

  textbooks: profileData.instructor_textbooks || [],
};

      setFormData(merged);
      setOriginalData(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getChangedFields = (original, current) => {
    return Object.keys(current).reduce((diff, key) => {
      if (key === "position_name" || key === "role_name") return diff;
      const origVal = original[key] == null ? "" : String(original[key]);
      const currVal = current[key]  == null ? "" : String(current[key]);
      if (origVal !== currVal) diff[key] = current[key];
      return diff;
    }, {});
  };

  const handleSave = async () => {
    //ตรวจสอบสิทธิ์ผู้ดูแลระบบ
    if (normalizedRole !== "admin" && normalizedRole !== "academic_designer"){
      return Swal.fire({
        title: "สิทธิ์ไม่ถูกต้อง!",
        text: "คุณไม่มีสิทธิ์แก้ไขข้อมูลระบบนี้",
        icon: "error",
        confirmButtonColor: "#0284c7",
        customClass: { popup: "rounded-2xl" }
      });
    }

    //ตรวจสอบการเลือกอาจารย์
    if (!targetUserId) {
      return Swal.fire({
        title: "ไม่พบข้อมูลอาจารย์!",
        text: "กรุณาเลือกอาจารย์ที่ต้องการแก้ไขข้อมูล",
        icon: "warning",
        confirmButtonColor: "#0284c7",
        customClass: { popup: "rounded-2xl" }
      });
    }

    const {
      instructor_course_responsibility: _c, expertises: _e,
      instructor_research_projects: _r, instructor_intellectual_properties: _ip,
      textbooks: _t, ...formDataWithoutArrays
    } = formData;
    const {
      instructor_course_responsibility: __c, expertises: __e,
      instructor_research_projects: __r, instructor_intellectual_properties: __ip,
      textbooks: __t, ...originalWithoutArrays
    } = originalData;

    const changedFields = getChangedFields(originalWithoutArrays, formDataWithoutArrays);

    const expertisesDiff  = computeDiff(originalData.expertises, formData.expertises);
    const educationsDiff  = computeDiff(originalData.educations, data.educations);
    const projectsDiff    = computeDiff(originalData.instructor_research_projects, formData.instructor_research_projects);
    const textbooksDiff   = computeDiff(originalData.textbooks, formData.textbooks);
    const propertiesDiff  = computeDiff(originalData.instructor_intellectual_properties, formData.instructor_intellectual_properties);

    const noChange =
      Object.keys(changedFields).length === 0 &&
      JSON.stringify(formData.instructor_course_responsibility) === JSON.stringify(originalData.instructor_course_responsibility) &&
      expertisesDiff.added.length  === 0 && expertisesDiff.updated.length  === 0 && expertisesDiff.deleted.length  === 0 &&
      educationsDiff.added.length  === 0 && educationsDiff.updated.length  === 0 && educationsDiff.deleted.length  === 0 &&
      projectsDiff.added.length    === 0 && projectsDiff.updated.length    === 0 && projectsDiff.deleted.length    === 0 &&
      textbooksDiff.added.length   === 0 && textbooksDiff.updated.length   === 0 && textbooksDiff.deleted.length   === 0 &&
      propertiesDiff.added.length  === 0 && propertiesDiff.updated.length  === 0 && propertiesDiff.deleted.length  === 0;

    //กรณีไม่มีการแก้ไขฟิลด์ข้อมูลใดๆ เลย
    if (noChange) {
      return Swal.fire({
        title: "ไม่มีการเปลี่ยนแปลง",
        text: "คุณยังไม่ได้ทำการแก้ไขข้อมูลในส่วนใดเลย",
        icon: "info",
        confirmButtonColor: "#0284c7",
        customClass: { popup: "rounded-2xl" }
      });
    }

    const formatToBackendDate = (dateStr) => {
      if (!dateStr || dateStr === "") return null;
      if (dateStr.includes("T")) return dateStr;
      return `${dateStr}T00:00:00Z`;
    };

    setIsSaving(true);
    try {
      const payload = {
        header: { user_id: Number(targetUserId), ...changedFields },
        educations_diff: {
          added: educationsDiff.added.map(({ id, ID, ...rest }) => ({
            ...rest,
            user_id:   Number(targetUserId),
            degree_id: Number(rest.degree_id),
          })),
          updated: educationsDiff.updated.map(({ ID, ...rest }) => ({
            ...rest,
            user_id:    Number(targetUserId),
            degree_id:  Number(rest.degree_id),
          })),
          deleted: educationsDiff.deleted,
        },
        expertises_diff: {
          added: expertisesDiff.added.map(e => ({
            user_id:   Number(targetUserId),
            expertise: typeof e === "object" ? e.expertise : e,
          })),
          updated: expertisesDiff.updated.map(e => ({
            id:          e.id,
            updated_at: e.updated_at,
            user_id:    Number(targetUserId),
            expertise:  typeof e === "object" ? e.expertise : e,
          })),
          deleted: expertisesDiff.deleted,
        },
        projects_diff: {
          added: projectsDiff.added.map(({ id, ID, ...rest }) => ({
            ...rest,
            user_id:    Number(targetUserId),
            start_date: formatToBackendDate(rest.start_date),
            end_date:   formatToBackendDate(rest.end_date),
            budget:     rest.budget ? Number(rest.budget) : null,
          })),
          updated: projectsDiff.updated.map(({ ID, ...rest }) => ({
            ...rest,
            user_id:    Number(targetUserId),
            start_date: formatToBackendDate(rest.start_date),
            end_date:   formatToBackendDate(rest.end_date),
            budget:     rest.budget ? Number(rest.budget) : null,
          })),
          deleted: projectsDiff.deleted,
        },
        textbooks_diff: {
          added: textbooksDiff.added
            .filter(t => t.title?.trim())
            .map(({ id, ID, ...rest }) => ({
              ...rest,
              user_id: Number(targetUserId),
              year:    rest.year ? Number(rest.year) : new Date().getFullYear(),
            })),
          updated: textbooksDiff.updated
            .filter(t => t.title?.trim())
            .map(({ ID, ...rest }) => ({
              ...rest,
              user_id: Number(targetUserId),
              year:    rest.year ? Number(rest.year) : new Date().getFullYear(),
            })),
          deleted: textbooksDiff.deleted,
        },
        properties_diff: {
          added: propertiesDiff.added.map(({ id, ID, ...rest }) => ({
            ...rest,
            user_id:             Number(targetUserId),
            granted_year:        rest.granted_year ? Number(rest.granted_year) : null,
            registration_number: rest.registration_number || null,
          })),
          updated: propertiesDiff.updated.map(({ ID, ...rest }) => ({
            ...rest,
            user_id:             Number(targetUserId),
            granted_year:        rest.granted_year ? Number(rest.granted_year) : null,
            registration_number: rest.registration_number || null,
          })),
          deleted: propertiesDiff.deleted,
        },
        instructor_course_responsibility: (formData.instructor_course_responsibility || [])
          .filter(item => item.course_id)
          .map(item => ({
            user_id:   Number(targetUserId),
            course_id: Number(item.course_id),
          })),
      };

      await apiClient.put(`/researcher-management/instructors/${targetUserId}`, payload);

      //แจ้งเตือนบันทึกข้อมูลสำเร็จ
      Swal.fire({
        title: "บันทึกสำเร็จ!",
        text: "ข้อมูลอาจารย์ได้รับการอัปเดตเรียบร้อยแล้ว",
        icon: "success",
        timer: 2200,
        showConfirmButton: false,
        customClass: { popup: "rounded-2xl" }
      });

      fetchData();
    } catch (err) {
      //กรณีบันทึกข้อมูลไม่สำเร็จเนื่องจากข้อมูลมีการทับซ้อน (Conflict) หรือข้อผิดพลาดอื่นๆ
      const isConflict = err.message?.includes("แก้ไขโดยผู้ใช้อื่น") || err.message?.includes("refresh");
      
      Swal.fire({
        title: isConflict ? "ข้อมูลมีการเปลี่ยนแปลง!" : "เกิดข้อผิดพลาด!",
        text: isConflict ? `${err.message} ระบบจะทำการโหลดหน้าเว็บใหม่` : err.message,
        icon: isConflict ? "warning" : "error",
        confirmButtonColor: "#0284c7",
        confirmButtonText: "ตกลง",
        allowOutsideClick: !isConflict,
        customClass: { popup: "rounded-2xl" }
      }).then((result) => {
        if (isConflict && result.isConfirmed) {
          window.location.reload();
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full bg-gray-100">
        <div className="text-center p-6 sm:p-10">
          <Loader2 className="animate-spin mx-auto text-cyan-600 mb-4" size={40} />
          <p className="text-slate-500 animate-pulse text-sm sm:text-base">กำลังตรวจสอบสิทธิ์เข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans w-full">
      <div className="w-full max-w-5xl mx-auto space-y-4">

        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.back()} className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700">
            <ArrowLeft size={16} className="me-2" /> ย้อนกลับ
          </button>
          <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            บันทึกข้อมูล
          </button>
        </div>

        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 px-6 py-6 sm:px-8">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-2xl font-bold shadow-md shrink-0 mt-1">
              {formData.user_fname?.charAt(0) || "อ"}
            </div>
            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {formData.prefix}{formData.user_fname} {formData.user_lname}
                  </h2>
                  <span className="self-center inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {formData.position_name || formData.position || "อาจารย์"}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      let researchData = [];
                      if (targetUserId) {
                        const res = await apiClient.get(`/researcher-management/instructors/${targetUserId}/documents`);
                        researchData = res || [];
                      }
                      exportToDocx({
                        header: { ...formData },
                        educations: data.educations || [],
                        expertises: data.expertises || formData.expertises || [],
                        textbooks: formData.textbooks || [],
                        researches: researchData,
                        intellectualProperties: formData.instructor_intellectual_properties || [],
                        researchProjects: formData.instructor_research_projects || [],
                      });
                    } catch (error) {
                      console.error("Export error:", error);
                      
                      //แจ้งเตือนเมื่อเกิดข้อผิดพลาดในการ Export เอกสาร .docx
                      Swal.fire({
                        title: "ส่งออกข้อมูลไม่สำเร็จ!",
                        text: "เกิดข้อผิดพลาดในการเตรียมหรือดึงข้อมูลโครงสร้างเอกสาร",
                        icon: "error",
                        confirmButtonColor: "#0284c7",
                        customClass: { popup: "rounded-2xl" }
                      });
                    }
                  }}
                  className="self-center inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all duration-150 shrink-0"
                >
                  <BookOpen size={13} className="text-white/90" />
                  <span>Export CHE .docx</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                <Mail size={14} className="text-cyan-600" />
                <span>อีเมล (Email): {formData.email || "-"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex sm:grid sm:grid-cols-7 gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setCurrentPage(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap sm:w-full text-[13px] ${currentPage === tab.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-600 hover:text-cyan-600 hover:bg-slate-50"}`}>
              {tab.icon && <span className="shrink-0 flex items-center justify-center">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)] p-6 sm:p-8 min-h-[400px]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg border border-cyan-100">
                {TABS.find(t => t.id === currentPage)?.icon}
              </span>
              <span>{TABS.find(t => t.id === currentPage)?.label}</span>
            </h1>
          </div>
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {currentPage === "profile" && (
              <ResearcherProfile formData={formData} handleInputChange={handleInputChange} targetUserId={targetUserId} setFormData={setFormData} />
            )}
            {currentPage === "education" && (
              <ResearcherEducation data={data} setData={setData} DEGREE_OPTIONS={DEGREE_OPTIONS} />
            )}
            {currentPage === "project" && (
              <ResearcherProject formData={formData} handleInputChange={handleInputChange} />
            )}
            {currentPage === "textbooks" && (
              <ResearcherTextbook formData={formData} handleInputChange={handleInputChange} />
            )}
            {currentPage === "expertise" && (
              <ResearcherExpertise formData={formData} handleInputChange={handleInputChange} />
            )}
            {currentPage === "research" && (
              <ResearcherResearch targetUserId={targetUserId} />
            )}
            {currentPage === "property" && (
              <ResearcherProperty formData={formData} handleInputChange={handleInputChange} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
