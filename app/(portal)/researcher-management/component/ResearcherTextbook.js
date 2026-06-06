"use client";
import { Plus, X } from "lucide-react";
import api from "../../../lib/api"; 

export default function ResearcherTextbook({ formData, handleInputChange }) {
  // รองรับข้อมูลเดิมที่เป็นออบเจกต์ หรือสร้างเป็นอาเรย์ว่าง
  const textbooks = formData.textbooks || [];

  // สร้างรายการปีให้เลือก (ย้อนหลังจากปีปัจจุบัน 2026 ไป 60 ปี)
  const currentYear = new Date().getFullYear(); 

  // ตัวเลือก Dropdown จะนับถอยหลังย้อนกลับไป 60 ปีจากปีปัจจุบัน ณ ขณะนั้นเสมอ
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);
  const handleTextbookChange = (index, field, value) => {
  const updatedTextbooks = [...textbooks];

  updatedTextbooks[index] = {
    ...updatedTextbooks[index],
    [field]: value,
  };

  handleInputChange("textbooks", updatedTextbooks);
};


  const handleAddTextbook = () => {
    const newTextbook = {
      title: "",
      year: currentYear,
      publisher: "",
      edition: ""
    };
    handleInputChange("textbooks", [...textbooks, newTextbook]);
  };

  const handleRemoveTextbook = async (index) => {
  const targetTextbook = textbooks[index];

  // 1. เช็คว่ามี id อยู่ในตารางแล้วหรือไม่ (ถ้ามี แปลว่ามาจากฐานข้อมูล)
  if (targetTextbook.id && targetTextbook.id !== 0) {
    const isConfirmed = window.confirm(`คุณต้องการลบตำราเรื่อง "${targetTextbook.title || 'นี้'}" ออกจากระบบใช่หรือไม่?`);
    if (!isConfirmed) return; 

    try {
      await api.delete(`/admin/instructor-textbooks/${targetTextbook.id}`);
      alert("ลบข้อมูลจากฐานข้อมูลสำเร็จ");
    } catch (err) {
      console.error("Error deleting textbook:", err);
      alert(`เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`);
      return; // ออกจากฟังก์ชัน ไม่ลบแถวบนหน้าจอ
    }
  }

  // 2. ถ้าเป็นแถวเพิ่มใหม่ (ไม่มี id) หรือลบผ่าน API สำเร็จแล้ว ให้ลบออกจากหน้าจอทันที
  handleInputChange(
    "textbooks", 
    textbooks.filter((_, i) => i !== index)
  );
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">รายการตำราและหนังสือ</h3>
        <button
          type="button"
          onClick={handleAddTextbook}
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
          <Plus size={16} /> เพิ่มตำราและหนังสือ
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wide">
            <tr>
              <th className="p-4 text-left">ชื่อตำรา (Title)</th>
              <th className="p-4 text-left">ปีที่เผยแพร่ (Year)</th>
              <th className="p-4 text-left">สำนักพิมพ์ (Publisher)</th>
              <th className="p-4 text-left">ครั้งที่พิมพ์ (Edition)</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {textbooks.length > 0 ? (
              textbooks.map((textbook, index) => (
                <tr key={index} className="bg-white hover:bg-slate-50/60 transition-colors">
                  {/* ชื่อตำรา (Title) */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.title || ""}
                      onChange={(e) => handleTextbookChange(index, "title", e.target.value)}
                      placeholder="ระบุชื่อตำรา..."
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

                  {/* ปีที่เผยแพร่ (Year) */}
                  <td className="p-2">
                    <select
                      value={textbook.year || currentYear}
                      onChange={(e) => handleTextbookChange(index, "year", e.target.value)}
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none focus:text-cyan-600 cursor-pointer"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year} (พ.ศ. {year + 543})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* สำนักพิมพ์ (Publisher) */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.publisher || ""}
                      onChange={(e) => handleTextbookChange(index, "publisher", e.target.value)}
                      placeholder="เช่น สำนักพิมพ์มหาวิทยาลัย..."
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

                  {/* ครั้งที่พิมพ์ (Edition) */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.edition || ""}
                      onChange={(e) => handleTextbookChange(index, "edition", e.target.value)}
                      placeholder="เช่น พิมพ์ครั้งที่ 1"
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

                  {/* ปุ่มลบรายการ */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveTextbook(index)}
                      className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 text-sm bg-gray-50/50">
                  ยังไม่มีข้อมูลตำรา กรุณากดปุ่มเพิ่มเพื่อเริ่มระบุข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}