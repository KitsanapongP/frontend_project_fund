"use client";
import { Plus, X } from "lucide-react";
import api from "../../../lib/api";
import Swal from "sweetalert2"; 

export default function ResearcherExpertise({ formData, handleInputChange }) {
  const expertises = formData.expertises || [];

  const handleAddExpertise = () => {
    handleInputChange("expertises", [...expertises, { expertise: "" }]);
  };

  const handleExpertiseChange = (index, value) => {
    const newList = [...expertises];
    newList[index] = typeof newList[index] === "object"
      ? { ...newList[index], expertise: value }
      : { expertise: value };
    handleInputChange("expertises", newList);
  };

  //ปรับปรุงฟังก์ชันลบความเชี่ยวชาญด้วย SweetAlert2
  const handleRemoveExpertise = async (index) => {
    const target = expertises[index];
    const targetId = typeof target === "object" ? target.id : null;

    // กรณีข้อมูลเดิมที่มี ID อยู่ในฐานข้อมูลหลังบ้านอยู่แล้ว
    if (targetId && targetId !== 0) {
      const result = await Swal.fire({
        title: "ยืนยันการลบความเชี่ยวชาญ?",
        text: `คุณต้องการลบข้อมูลความเชี่ยวชาญนี้ออกจากระบบใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0284c7", // สีฟ้าครามธีมหลัก
        cancelButtonColor: "#94a3b8",  // สีเทา Slate
        confirmButtonText: "ใช่, ต้องการลบ",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "rounded-2xl"
        }
      });

      if (!result.isConfirmed) return;

      try {
        await api.delete(`/admin/instructor-expertises/${targetId}`);
        
        // แจ้งเตือนเมื่อลบสำเร็จแบบ Auto-close 1.5 วินาที
        Swal.fire({
          title: "ลบสำเร็จ!",
          text: "ลบข้อมูลความเชี่ยวชาญเรียบร้อยแล้ว",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: "rounded-2xl" }
        });

      } catch (err) {
        console.error("Error deleting expertise:", err);
        
        // แจ้งเตือนเมื่อลบไม่สำเร็จ
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: `ไม่สามารถลบข้อมูลได้ (${err.message})`,
          icon: "error",
          confirmButtonColor: "#0284c7",
          customClass: { popup: "rounded-2xl" }
        });
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
        <button 
          type="button"
          onClick={handleAddExpertise} 
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
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

              <button 
                type="button"
                onClick={() => handleRemoveExpertise(index)} 
                className="inline-flex items-center justify-center h-12 w-12 rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 shrink-0"
              >
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