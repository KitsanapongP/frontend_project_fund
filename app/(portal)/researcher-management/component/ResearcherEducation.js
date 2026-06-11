"use client";
import { Plus, X } from "lucide-react";
import api from "../../../lib/api";

export default function ResearcherEducation({ data, setData, DEGREE_OPTIONS }) {
  
  const handleAddEducation = () => {
    const newEdu = { degree_id: "1", degree_title_th: "", university_th: "", grad_year: "" };
    setData(prev => ({ ...prev, educations: [...(prev.educations || []), newEdu] }));
  };

  const handleEduChange = (index, field, value) => {
    const updatedEdus = [...data.educations];
    updatedEdus[index] = { ...updatedEdus[index], [field]: value };
    setData(prev => ({ ...prev, educations: updatedEdus }));
  };

  const handleRemoveEdu = async (index) => {
    const target = data.educations[index];

    if (target.id && target.id !== 0) {
      const isConfirmed = window.confirm(`คุณต้องการลบประวัติการศึกษา "${target.degree_title_th || 'นี้'}" ออกจากระบบใช่หรือไม่?`);
      if (!isConfirmed) return;

      try {
        await api.delete(`/admin/instructor-educations/${target.id}`);
        alert("ลบข้อมูลจากฐานข้อมูลสำเร็จ");
      } catch (err) {
        console.error("Error deleting education:", err);
        alert(`เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`);
        return;
      }
    }

    setData(prev => ({ ...prev, educations: prev.educations.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">รายการประวัติการศึกษา</h3>
        <button 
          onClick={handleAddEducation} 
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
          <Plus size={16}/> เพิ่มประวัติ
        </button>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wide">
            <tr>
              <th className="p-4 text-left">ระดับ</th>
              <th className="p-4 text-left">ชื่อปริญญา / สาขา</th>
              <th className="p-4 text-left">ชื่อสถาบัน, ประเทศ</th>
              <th className="p-4 text-center">ปีที่จบ</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.educations?.map((edu, i) => (
              <tr key={i} className="bg-white hover:bg-slate-50/60 transition-colors">
                <td className="p-2">
                  <select 
                    value={edu.degree_id} 
                    onChange={(e) => handleEduChange(i, "degree_id", e.target.value)} 
                    className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none focus:text-cyan-600"
                  >
                    {DEGREE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <input 
                    value={edu.degree_title_th} 
                    onChange={(e) => handleEduChange(i, "degree_title_th", e.target.value)} 
                    className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300" 
                    placeholder="เช่น วท.บ. (วิทยาการคอมพิวเตอร์)"
                  />
                </td>
                <td className="p-2">
                  <input 
                    value={edu.university_th} 
                    onChange={(e) => handleEduChange(i, "university_th", e.target.value)} 
                    className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300" 
                    placeholder="มหาวิทยาลัย..."
                  />
                </td>
                <td className="p-2">
                  <select
                    value={edu.grad_year || ""}
                    onChange={(e) => handleEduChange(i, "grad_year", e.target.value)}
                    className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none focus:text-cyan-600 cursor-pointer"
                  >
                    <option value="">พ.ศ.</option>
                    {(() => {
                      const currentYear = new Date().getFullYear() + 543;
                      const years = [];
                      for (let y = currentYear; y >= currentYear - 80; y--) {
                        years.push(<option key={y} value={y}>{y}</option>);
                      }
                      return years;
                    })()}
                  </select>
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={() => handleRemoveEdu(i)} 
                    className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                >
                  <X size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}