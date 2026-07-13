"use client";
import { Plus, X } from "lucide-react";
import { apiClient } from "../../../lib/api";
import Swal from "sweetalert2"; 

export default function ResearcherProject({ formData, handleInputChange }) {
  const researchProjects = formData.instructor_research_projects || [];
  const currentYear = new Date().getFullYear();

  const handleAddResearchProject = () => {
    handleInputChange("instructor_research_projects", [
      ...researchProjects,
      { 
        fiscal_year: String(currentYear + 543), // โดยปกติปีงบประมาณของไทยนิยมบันทึกเป็น พ.ศ.
        project_name_th: "", 
        project_name_en: "", 
        source_of_fund: "", 
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
      const result = await Swal.fire({
        title: "ยืนยันการลบโครงการวิจัย?",
        text: `คุณต้องการลบโครงการวิจัย "${target.project_name_th || 'นี้'}" ออกจากระบบใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0284c7",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "ใช่, ต้องการลบ",
        cancelButtonText: "ยกเลิก",
        customClass: { popup: "rounded-2xl" }
      });

    if (!result.isConfirmed) return;

      try {
        await apiClient.delete(`/researcher-management/instructor-research-projects/${target.id}`);
        Swal.fire({
          title: "ลบสำเร็จ!",
          text: "ลบข้อมูลโครงการวิจัยออกจากฐานข้อมูลเรียบร้อยแล้ว",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Error deleting research project:", err);
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: `ไม่สามารถลบข้อมูลได้ (${err.message})`,
          icon: "error",
          confirmButtonColor: "#0284c7"
        });
        return;
      }
    }

    handleInputChange("instructor_research_projects", researchProjects.filter((_, i) => i !== index));
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue || dateValue.startsWith("0001")) return "";
    return dateValue.split("T")[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">รายการโครงการวิจัย</h3>
        <button 
          type="button"
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
              {/* ปรับเพิ่มความกว้างของปีงบประมาณจาก w-36 เป็น w-48 */}
              <th className="p-4 text-left w-48">ปีงบประมาณ</th>
              <th className="p-4 text-left min-w-[200px]">ชื่อโครงการ (TH / EN)</th>
              <th className="p-4 text-left w-48">แหล่งทุน</th>
              <th className="p-4 text-left w-64">ระยะเวลาโครงการ</th>
              {/* ปรับลดความกว้างของงบประมาณจาก w-40 เป็น w-32 */}
              <th className="p-4 text-left w-32">งบประมาณ (บาท)</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {researchProjects.length > 0 ? (
              researchProjects.map((project, index) => (
                <tr key={index} className="bg-white hover:bg-slate-50/60 transition-colors">
                  <td className="p-2">
                    <select
                      value={project.fiscal_year || currentYear}
                      onChange={(e) => handleProjectFieldChange(index, "fiscal_year", e.target.value)}
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none focus:text-cyan-600 cursor-pointer text-center font-medium"
                    >
                      {(() => {
                        const options = [];
                        for (let y = currentYear; y >= currentYear - 50; y--) {
                          options.push(
                            <option key={y} value={y}>
                              {y} (พ.ศ. {y + 543})
                            </option>
                          );
                        }
                        return options;
                      })()}
                    </select>
                  </td>

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

                  <td className="p-2 align-top">
                    <input 
                      type="text" 
                      value={project.source_of_fund || ""} 
                      onChange={(e) => handleProjectFieldChange(index, "source_of_fund", e.target.value)} 
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300 text-sm" 
                      placeholder="ระบุแหล่งทุน..."
                    />
                  </td>

                  <td className="p-2 align-top space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 w-8">เริ่ม:</span>
                      <input 
                        type="date" 
                        value={formatDateForInput(project.start_date)} 
                        onChange={(e) => handleProjectFieldChange(index, "start_date", e.target.value)} 
                        className="w-full rounded-lg border-0 bg-transparent p-1 text-slate-700 outline-none text-sm cursor-pointer focus:text-cyan-600" 
                      />
                    </div>
                    <div className="flex items-center gap-1 border-t border-dashed border-slate-100 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 w-8">สิ้นสุด:</span>
                      <input 
                        type="date" 
                        value={formatDateForInput(project.end_date)} 
                        onChange={(e) => handleProjectFieldChange(index, "end_date", e.target.value)} 
                        className="w-full rounded-lg border-0 bg-transparent p-1 text-slate-700 outline-none text-sm cursor-pointer focus:text-cyan-600" 
                      />
                    </div>
                  </td>

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

                  <td className="p-2 align-middle text-center">
                    <button 
                      type="button"
                      onClick={() => handleRemoveResearchProject(index)} 
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
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
