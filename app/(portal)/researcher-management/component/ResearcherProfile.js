"use client";
import { useState, useEffect } from "react";
import ResearcherLinks from "./ResearcherLinks";

const InstructorPrefix = [
  { id: "1", label: "นาย" },
  { id: "2", label: "นาง" },
  { id: "3", label: "นางสาว" },
  { id: "4", label: "ดร." },
  { id: "5", label: "ผศ." },
  { id: "6", label: "รศ." },
  { id: "7", label: "ศ." },
  { id: "8", label: "ผศ.ดร." },
  { id: "9", label: "รศ.ดร." },
  { id: "10", label: "ศ.ดร." },
  { id: "11", label: "อ." },
];

const InstructorPosition = [
  { id: "1", label: "ผู้ช่วยศาสตราจารย์" },
  { id: "2", label: "รองศาสตราจารย์" },
  { id: "3", label: "ศาสตราจารย์" },
  { id: "4", label: "อาจารย์" },
  { id: "5", label: "นักวิจัย" },
  { id: "6", label: "อื่นๆ" },
];

const DEGREE_LABELS = { 1: "ระดับปริญญาตรี", 2: "ระดับปริญญาโท", 3: "ระดับปริญญาเอก" };

export default function ResearcherProfile({ formData, handleInputChange, targetUserId, setFormData }) {
  const [courseList, setCourseList] = useState([]);   // raw list จาก API
  const [courseLoading, setCourseLoading] = useState(true);

  // ดึงหลักสูตรจาก DB 
  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    fetch("http://localhost:8080/api/v1/researcher-management/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <EditableInfoItem label="คำนำหน้าชื่อ " value={formData.prefix} options={InstructorPrefix} onChange={(val) => handleInputChange("prefix", val)} />
          <EditableInfoItem label="ตำแหน่งวิชาการ " value={formData.position_name || formData.position} options={InstructorPosition} onChange={(val) => handleInputChange("position", val)} />
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
  return (
    <div className="group border-b border-gray-100 pb-1 transition-all hover:border-cyan-500">
      <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1 transition-colors group-hover:text-cyan-600">
        {icon} {label}
      </label>
      {options ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-gray-700 font-medium bg-transparent border-none outline-none focus:ring-0 px-1 py-1 rounded-lg cursor-pointer text-sm sm:text-base appearance-none"
        >
          <option value="" disabled>เลือก{label}</option>
          {options.map((opt) => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
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
