"use client";
import { Plus, X } from "lucide-react";
import api from "../../../lib/api";

export default function ResearcherProject({ formData, handleInputChange }) {
  const researchProjects = formData.instructor_research_projects || [];

  const handleAddResearchProject = () => {
    handleInputChange("instructor_research_projects", [
      ...researchProjects,
      { 
        fiscal_year: "", 
        project_name_th: "", 
        project_name_en: "", 
        source_of_fund: "", 
        //ตั้งค่าเริ่มต้นเป็น "" เพื่อให้ HTML Input ขึ้น dd/mm/yyyy อัตโนมัติ
        start_date: "", 
        end_date: "",   
        budget: "" 
      }
    ]);
  };

  const handleProjectFieldChange = (index, field, value) => {
    const newList = [...researchProjects];
    newList[index] = { ...newList[index], [field]: value };
    handleInputChange("instructor_research_projects", newList);
  };

  const handleRemoveResearchProject = async (index) => {
    const target = researchProjects[index];

    if (target.id && target.id !== 0) {
      const isConfirmed = window.confirm(`คุณต้องการลบโครงการวิจัย "${target.project_name_th || 'นี้'}" ออกจากระบบใช่หรือไม่?`);
      if (!isConfirmed) return;

      try {
        await api.delete(`/admin/instructor-research-projects/${target.id}`);
        alert("ลบข้อมูลจากฐานข้อมูลสำเร็จ");
      } catch (err) {
        console.error("Error deleting research project:", err);
        alert(`เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`);
        return;
      }
    }

    handleInputChange("instructor_research_projects", researchProjects.filter((_, i) => i !== index));
  };

  // ฟังก์ชันจัดฟอร์แมตข้อมูลก่อนใส่ลง Input (เพื่อตัดส่วนพ่วงของเวลา T00:00:00Z ออก ถ้ามาจากหลังบ้าน)
  const formatDateForInput = (dateValue) => {
    if (!dateValue || dateValue.startsWith("0001")) return "";
    return dateValue.split("T")[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">รายการโครงการวิจัย</h3>
        <button 
          onClick={handleAddResearchProject}
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
          <Plus size={16} /> เพิ่มโครงการวิจัย
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wide">
            <tr>
              <th className="p-4 text-left w-32">ปีงบประมาณ</th>
              <th className="p-4 text-left min-w-[200px]">ชื่อโครงการ (TH / EN)</th>
              <th className="p-4 text-left w-48">แหล่งทุน</th>
              <th className="p-4 text-left w-64">ระยะเวลาโครงการ</th>
              <th className="p-4 text-left w-40">งบประมาณ (บาท)</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {researchProjects.length > 0 ? (
              researchProjects.map((project, index) => (
                <tr key={index} className="bg-white hover:bg-slate-50/60 transition-colors">
                  
                  {/* 1. ปีงบประมาณ */}
                  <td className="p-2 align-top">
                    <select
                      value={project.fiscal_year || ""}
                      onChange={(e) => handleProjectFieldChange(index, "fiscal_year", e.target.value)}
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none focus:text-cyan-600 cursor-pointer text-sm"
                    >
                      <option value="">เลือก พ.ศ.</option>
                      {(() => {
                        const currentYear = new Date().getFullYear() + 543;
                        const years = [];
                        for (let y = currentYear + 3; y >= currentYear - 15; y--) {
                          years.push(<option key={y} value={y}>{y}</option>);
                        }
                        return years;
                      })()}
                    </select>
                  </td>

                  {/* 2. ชื่อโครงการ */}
                  <td className="p-2 align-top space-y-2">
                    <input 
                      type="text" 
                      value={project.project_name_th || project.project_th || ""} 
                      onChange={(e) => handleProjectFieldChange(index, "project_name_th", e.target.value)} 
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300 text-sm" 
                      placeholder="ชื่อโครงการภาษาไทย"
                    />
                    <input 
                      type="text" 
                      value={project.project_name_en || project.project_en || ""} 
                      onChange={(e) => handleProjectFieldChange(index, "project_name_en", e.target.value)} 
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300 text-sm border-t border-dashed border-slate-100 pt-2" 
                      placeholder="Project Name (English)"
                    />
                  </td>

                  {/* 3. แหล่งทุน */}
                  <td className="p-2 align-top">
                    <input 
                      type="text" 
                      value={project.source_of_fund || ""} 
                      onChange={(e) => handleProjectFieldChange(index, "source_of_fund", e.target.value)} 
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300 text-sm" 
                      placeholder="ระบุแหล่งทุน..."
                    />
                  </td>

                  {/* 4. วันเริ่มต้น - วันสิ้นสุดโครงการ */}
                  <td className="p-2 align-top space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 w-8">เริ่ม:</span>
                      <input 
                        type="date" 
                        //ปรับตรงนี้: ใช้ฟังก์ชันครอบค่า เพื่อให้มั่นใจว่าค่าว่างจะเป็น "" จริงๆ
                        value={formatDateForInput(project.start_date)} 
                        onChange={(e) => handleProjectFieldChange(index, "start_date", e.target.value)} 
                        className="w-full rounded-lg border-0 bg-transparent p-1 text-slate-700 outline-none text-sm cursor-pointer focus:text-cyan-600" 
                      />
                    </div>
                    <div className="flex items-center gap-1 border-t border-dashed border-slate-100 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 w-8">สิ้นสุด:</span>
                      <input 
                        type="date" 
                        // ปรับตรงนี้เช่นกัน
                        value={formatDateForInput(project.end_date)} 
                        onChange={(e) => handleProjectFieldChange(index, "end_date", e.target.value)} 
                        className="w-full rounded-lg border-0 bg-transparent p-1 text-slate-700 outline-none text-sm cursor-pointer focus:text-cyan-600" 
                      />
                    </div>
                  </td>

                  {/* 5. งบประมาณ */}
                  <td className="p-2 align-top">
                    <input 
                      type="number" 
                      min="0" 
                      value={project.budget || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "" && Number(val) < 0) return; 
                        handleProjectFieldChange(index, "budget", val);
                      }} 
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300 text-sm focus:text-cyan-600" 
                      placeholder="0"
                    />
                  </td>

                  {/* 6. ปุ่มลบแถว */}
                  <td className="p-2 align-middle text-center">
                    <button 
                      onClick={() => handleRemoveResearchProject(index)} 
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
                    >
                      <X size={16} />
                    </button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400 text-sm bg-gray-50/50">
                  ยังไม่มีข้อมูลโครงการวิจัย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}