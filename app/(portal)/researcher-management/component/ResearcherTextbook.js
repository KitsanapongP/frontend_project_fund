"use client";
import { Plus, X } from "lucide-react";
import api from "../../../lib/api"; 
import Swal from "sweetalert2"; 

export default function ResearcherTextbook({ formData, handleInputChange }) {
  const textbooks = formData.textbooks || [];
  const currentYear = new Date().getFullYear(); 
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

  //ปรับปรุงฟังก์ชันการลบข้อมูล
  const handleRemoveTextbook = async (index) => {
    const targetTextbook = textbooks[index];

    // กรณีที่ 1: มี id อยู่ในตารางแล้ว (ต้องการลบจากฐานข้อมูล)
    if (targetTextbook.id && targetTextbook.id !== 0) {
      
      // แสดงกล่องยืนยันการลบแบบ SweetAlert2
      const result = await Swal.fire({
        title: "ยืนยันการลบข้อมูล?",
        text: `คุณต้องการลบตำราเรื่อง "${targetTextbook.title || 'นี้'}" ออกจากระบบใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0284c7", // สีฟ้าครามธีมเดียวกับปุ่มเพิ่ม (Tailwind: bg-cyan-600)
        cancelButtonColor: "#94a3b8",  // สีเทา (Tailwind: bg-slate-400)
        confirmButtonText: "ใช่, ต้องการลบ",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "rounded-2xl" // ปรับความโค้งของกล่องให้มนเหมือนสไตล์เว็บของคุณ
        }
      });

      // ถ้าผู้ใช้กด ยกเลิก (Cancel) ให้หยุดทำงาน
      if (!result.isConfirmed) return; 

      try {
        // เริ่มส่ง API ลบข้อมูล
        await api.delete(`/admin/instructor-textbooks/${targetTextbook.id}`);
        
        // แจ้งเตือนเมื่อลบสำเร็จ
        Swal.fire({
          title: "ลบสำเร็จ!",
          text: "ข้อมูลตำราถูกลบออกจากฐานข้อมูลเรียบร้อยแล้ว",
          icon: "success",
          timer: 2000, // ปิดอัตโนมัติภายใน 2 วินาที
          showConfirmButton: false
        });

      } catch (err) {
        console.error("Error deleting textbook:", err);
        
        // แจ้งเตือนเมื่อเกิดข้อผิดพลาด
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: `ไม่สามารถลบข้อมูลได้ (${err.message})`,
          icon: "error",
          confirmButtonColor: "#0284c7"
        });
        return; // ออกจากฟังก์ชัน ไม่ลบแถวบนหน้าจอ
      }
    }

    // กรณีที่ 2: ถ้าเป็นแถวเพิ่มใหม่ (ไม่มี id) หรือลบผ่าน API สำเร็จแล้ว ให้เอาออกจากหน้าจอ
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
                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.title || ""}
                      onChange={(e) => handleTextbookChange(index, "title", e.target.value)}
                      placeholder="ระบุชื่อตำรา..."
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

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

                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.publisher || ""}
                      onChange={(e) => handleTextbookChange(index, "publisher", e.target.value)}
                      placeholder="เช่น สำนักพิมพ์มหาวิทยาลัย..."
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      value={textbook.edition || ""}
                      onChange={(e) => handleTextbookChange(index, "edition", e.target.value)}
                      placeholder="เช่น พิมพ์ครั้งที่ 1"
                      className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveTextbook(index)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
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