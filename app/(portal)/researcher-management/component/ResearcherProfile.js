"use client";
import { useState, useEffect } from "react";
import ResearcherLinks from "./ResearcherLinks";
import { apiClient } from "../../../lib/api";

const InstructorPrefix = [
  { id: "นาย", label: "นาย" },
  { id: "นาง", label: "นาง" },
  { id: "นางสาว", label: "นางสาว" },
  { id: "ดร.", label: "ดร." },
  { id: "ผศ.", label: "ผศ." },
  { id: "รศ.", label: "รศ." },
  { id: "ศ.", label: "ศ." },
  { id: "ผศ. ดร.", label: "ผศ. ดร." },
  { id: "รศ. ดร.", label: "รศ. ดร." },
  { id: "ศ. ดร.", label: "ศ. ดร." },
  { id: "อ.", label: "อ." },
];

const InstructorPosition = [
  { id: "ผู้ช่วยศาสตราจารย์", label: "ผู้ช่วยศาสตราจารย์" },
  { id: "รองศาสตราจารย์", label: "รองศาสตราจารย์" },
  { id: "ศาสตราจารย์", label: "ศาสตราจารย์" },
  { id: "อาจารย์", label: "อาจารย์" },
  { id: "นักวิจัย", label: "นักวิจัย" },
  { id: "อื่นๆ", label: "อื่นๆ" },
];

const DEGREE_LABELS = { 1: "ระดับปริญญาตรี", 2: "ระดับปริญญาโท", 3: "ระดับปริญญาเอก" };

export default function ResearcherProfile({ formData, handleInputChange, targetUserId, setFormData }) {
  const [courseList, setCourseList] = useState([]);   // raw list จาก API
  const [courseLoading, setCourseLoading] = useState(true);
  
  // State สำหรับเก็บข้อความแจ้งเตือนให้ตรวจสอบอีกฟิลด์หนึ่ง
  const [noticeMessage, setNoticeMessage] = useState("");

  // ดึงหลักสูตรจาก DB 
  useEffect(() => {
    apiClient.get("/researcher-management/courses")
      .then((data) => setCourseList(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setCourseList([]))
      .finally(() => setCourseLoading(false));
  }, []);

  // จัดกลุ่มตาม degree_id
  const groupedCourses = [1, 2, 3].map((degId) => ({
    degreeId: degId,
    label: DEGREE_LABELS[degId],
    courses: courseList.filter((c) => Number(c.degree_id) === degId),
  })).filter((g) => g.courses.length > 0);

  return (
    <div className="space-y-8">

      {/*ข้อมูลส่วนตัวพื้นฐาน */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4">ข้อมูลส่วนตัวทั่วไป</h3>
        
        {/* กล่องแจ้งเตือนเมื่อมีการเปลี่ยน prefix หรือ position */}
        {noticeMessage && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{noticeMessage}</span>
            </div>
            <button
              onClick={() => setNoticeMessage("")}
              className="ml-4 text-amber-600 hover:text-amber-900 font-bold px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <EditableInfoItem 
            label="คำนำหน้าชื่อ" 
            value={formData.prefix || ""} 
            options={InstructorPrefix} 
            onChange={(val) => {
              handleInputChange("prefix", val);
              setNoticeMessage("คุณได้เปลี่ยนคำนำหน้าชื่อ กรุณาตรวจสอบ 'ตำแหน่งวิชาการ' ให้ถูกต้องและตรงกัน");
            }} 
          />
          <EditableInfoItem 
            label="ตำแหน่งวิชาการ " 
            value={formData.position_name || formData.position} 
            options={InstructorPosition} 
            onChange={(val) => {
              handleInputChange("position", val);
              setNoticeMessage("คุณได้เปลี่ยนตำแหน่งวิชาการ กรุณาตรวจสอบ 'คำนำหน้าชื่อ' ให้ถูกต้องและตรงกัน");
            }} 
          />
          <EditableInfoItem label="ชื่อภาษาไทย " value={formData.user_fname} onChange={(val) => handleInputChange("user_fname", val)} />
          <EditableInfoItem label="นามสกุลภาษาไทย" value={formData.user_lname} onChange={(val) => handleInputChange("user_lname", val)} />
          <EditableInfoItem label="ชื่อ-นามสกุลภาษาอังกฤษ" value={formData.Name_en || formData.name_en} onChange={(val) => handleInputChange("Name_en", val)} />
          <EditableInfoItem label="อีเมล " value={formData.email} onChange={(val) => handleInputChange("email", val)} />
          <EditableInfoItem
            label="เบอร์โทรศัพท์ "
            value={formData.tel}
            onChange={(val) => {
              const digits = val.replace(/\D/g, "").slice(0, 10);
              handleInputChange("tel", digits);
            }}
          />
          <EditableInfoItem label="วันที่บรรจุงาน " value={formData.date_of_employment} inputType="date" onChange={(val) => handleInputChange("date_of_employment", val)} />
        </div>
      </div>

      {/*เว็บไซต์และฐานข้อมูลวิจัย */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4">เว็บไซต์และฐานข้อมูลวิจัย</h3>
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <ResearcherLinks formData={formData} handleInputChange={handleInputChange} />
        </div>
      </div>

      {/*หลักสูตรที่รับผิดชอบ */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4">หลักสูตรที่รับผิดชอบ</h3>
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <select
            value={formData.instructor_course_responsibility?.[0]?.course_id || ""}
            disabled={courseLoading}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setFormData((prev) => ({ ...prev, instructor_course_responsibility: [] }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  instructor_course_responsibility: [{ user_id: Number(targetUserId), course_id: Number(val) }],
                }));
              }
            }}
            className="w-full bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded-xl px-4 py-2.5 outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50/50 cursor-pointer disabled:opacity-60"
          >
            <option value="">
              {courseLoading ? "กำลังโหลดหลักสูตร..." : "--- กรุณาเลือกหลักสูตร ---"}
            </option>
            {groupedCourses.map((group) => (
              <optgroup key={group.degreeId} label={group.label} className="font-bold">
                {group.courses.map((course) => (
                  <option key={course.course_id} value={course.course_id} className="font-normal">
                    {course.course_name_th}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}

function EditableInfoItem({ label, value, icon, onChange, options, inputType = "text" }) {
  // จัดการ Trim ค่า string เพื่อป้องกันปัญหาเว้นวรรคไม่ตรงกัน
  const rawValue = typeof value === "string" ? value.trim() : value;

  return (
    <div className="group border-b border-gray-100 pb-1 transition-all hover:border-cyan-500">
      <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1 transition-colors group-hover:text-cyan-600">
        {icon} {label}
      </label>
      {options ? (
        <select
          value={rawValue || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-gray-700 font-medium bg-transparent border-none outline-none focus:ring-0 px-1 py-1 rounded-lg cursor-pointer text-sm sm:text-base appearance-none"
        >
          {/* เอา disabled ออก เพื่อให้แสดงค่าว่างได้อย่างถูกต้องเมื่อไม่มีข้อมูล */}
          <option value="">-- เลือก{label} --</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-gray-700 font-medium bg-transparent border-none outline-none focus:ring-0 px-1 py-1 rounded-lg text-sm sm:text-base"
          placeholder={`ระบุ${label}...`}
        />
      )}
    </div>
  );
}