"use client";
import { Plus, X} from "lucide-react";
import api from "../../../lib/api";

export default function ResearcherExpertise({ formData, handleInputChange }) {
  const expertises = formData.expertises || [];

  const handleAddExpertise = () => {
  handleInputChange("expertises", [...expertises, { expertise: "" }]); // object ไม่ใช่ ""
};

  const handleExpertiseChange = (index, value) => {
  const newList = [...expertises];
  newList[index] = typeof newList[index] === "object"
    ? { ...newList[index], expertise: value }
    : { expertise: value };
  handleInputChange("expertises", newList);
};

  const handleRemoveExpertise = async (index) => {
    const target = expertises[index];
    const targetId = typeof target === "object" ? target.id : null;

    if (targetId && targetId !== 0) {
      const isConfirmed = window.confirm("คุณต้องการลบความเชี่ยวชาญนี้ออกจากระบบใช่หรือไม่?");
      if (!isConfirmed) return;

      try {
        await api.delete(`/admin/instructor-expertises/${targetId}`);
        alert("ลบข้อมูลจากฐานข้อมูลสำเร็จ");
      } catch (err) {
        console.error("Error deleting expertise:", err);
        alert(`เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`);
        return;
      }
    }

    handleInputChange("expertises", expertises.filter((_, i) => i !== index));
  };

  const getExpertiseValue = (exp) => typeof exp === "object" ? (exp.expertise || "") : exp;


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700">รายการความเชี่ยวชาญ</h3>
        <button onClick={handleAddExpertise} className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100">
          <Plus size={16} /> เพิ่มความเชี่ยวชาญ
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {expertises.length > 0 ? (
          expertises.map((exp, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">{index + 1}.</div>
                <input
                  type="text"
                  value={getExpertiseValue(exp)}
                  onChange={(e) => handleExpertiseChange(index, e.target.value)}
                  placeholder="เช่น Software Engineering, AI, Machine Learning..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-gray-700"
                />
              </div>
              <button onClick={() => handleRemoveExpertise(index)} className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100">
                <X size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm border-2 border-dashed rounded-3xl bg-gray-50/50">
            ยังไม่มีข้อมูลความเชี่ยวชาญ กรุณากดปุ่มเพิ่มเพื่อเริ่มระบุข้อมูล
          </div>
        )}
      </div>
    </div>
  );
}