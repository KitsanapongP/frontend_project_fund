"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X, Loader2, Edit3, Database } from "lucide-react";
import Header from "../component/layout/Header";
import { apiClient } from "../../../lib/api"; 
import Swal from "sweetalert2";

export default function RankingSourcesPage() {
  const router = useRouter();
  
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSavingSources, setIsSavingSources] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const sourcesRes = await apiClient.get("/researcher-management/ranking-sources");
      setSources(sourcesRes || []);
    } catch (err) {
      console.error("Error fetching sources:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลแหล่งอ้างอิงได้",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAddSource = () => {
    const newSourceItem = {
      source_id: 0, 
      source_code: "",
      source_name: "",
      description: "",
      is_active: true
    };
    setSources(prev => [...prev, newSourceItem]);
  };

  const handleSourceChange = (index, field, value) => {
    const updatedSources = [...sources];
    
    if (field === "source_code") {
      updatedSources[index][field] = value
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "");
    } else {
      updatedSources[index][field] = value;
    }

    if (field === "source_name" && updatedSources[index].source_id === 0) {
      updatedSources[index].source_code = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_"); 
    }
    setSources(updatedSources);
  };

  const handleRemoveSource = async (index) => {
    const targetSource = sources[index];

    if (targetSource.source_id !== 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "ยืนยันการลบข้อมูล?",
        text: `คุณต้องการลบแหล่งข้อมูล "${targetSource.source_name || targetSource.source_code}" ออกจากระบบถาวรใช่หรือไม่?`,
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#cbd5e1",
        confirmButtonText: "ลบออก",
        cancelButtonText: "ยกเลิก",
      });

      if (!result.isConfirmed) return;

      try {
        await apiClient.delete(`/researcher-management/ranking-sources/${targetSource.source_id}`);
        
        await Swal.fire({
          icon: "success",
          title: "ลบข้อมูลสำเร็จ",
          text: "ลบแหล่งข้อมูลออกจากระบบเสร็จสิ้น",
          confirmButtonColor: "#0891b2",
          confirmButtonText: "ตกลง",
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบข้อมูลจากฐานข้อมูลได้",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "ตกลง",
        });
        return;
      }
    }

    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSources = async () => {
    const hasEmptyCode = sources.some(src => !src.source_code?.trim());
    if (hasEmptyCode) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุรหัสย่อระบบ (Source Code) ให้ครบถ้วนทุกช่อง",
        confirmButtonColor: "#0891b2",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsSavingSources(true);
    try {
      const payload = sources.map(src => ({
        source_id: Number(src.source_id) || 0,
        source_code: src.source_code.trim(),
        source_name: src.source_name?.trim() || "แหล่งข้อมูลใหม่",
        description: src.description || "",
        is_active: Boolean(src.is_active)
      }));

      await apiClient.put("/researcher-management/ranking-sources", { sources: payload });
      
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "ปรับปรุงฐานข้อมูลแหล่งที่มา (Ranking Sources) สำเร็จ!",
        confirmButtonColor: "#0891b2",
        confirmButtonText: "ตกลง",
      });

      router.push("/researcher-management/weights"); 
    } catch (err) {
      console.error("Error saving sources:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการบันทึก",
        text: `เกิดข้อผิดพลาดในการบันทึกแหล่งข้อมูล: ${err.message}`,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsSavingSources(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans w-full pb-12">
      {/* ── Header ── */}
      <Header currentPageTitle="จัดการฐานข้อมูลแหล่งที่มาส่วนกลาง" />
      
      {/* ── Main Layout Wrapper ── */}
      <main className="w-full pt-28 px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* ── Control Bar ปุ่มด้านบนสุด (กระจายซ้าย-ขวา) ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => router.push("/researcher-management/weights")}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-cyan-300 hover:text-cyan-700 shadow-sm"
            >
              <ArrowLeft size={16} className="me-2" />
              กลับไปหน้าน้ำหนักผลงาน
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddSource}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <Plus size={14}/>
                เพิ่มแหล่งข้อมูลใหม่
              </button>
              <button
                onClick={handleSaveSources}
                disabled={isSavingSources}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
              >
                {isSavingSources ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                บันทึกตารางแหล่งข้อมูล
              </button>
            </div>
          </div>

          {/* ── กรอบชุดคอนเทนเนอร์หลัก (Gradient & Shadow สไตล์โมเดิร์น) ── */}
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

            {/* ส่วนหัวภายในกรอบหลัก */}
            <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      ตั้งค่าโครงสร้างตารางหลักฐานอ้างอิง
                    </p>
                  </div>
                  <h1 className="mt-1 text-base sm:text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <Edit3 size={18} className="text-cyan-600 inline sm:hidden"/> ฐานข้อมูลแหล่งอ้างอิง (Ranking Sources)
                  </h1>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  ทั้งหมด {sources.length} แหล่งข้อมูล
                </span>
              </div>
            </div>

            {/* ส่วนตารางข้อมูล */}
            <div className="relative p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="animate-spin text-cyan-600 mb-4" size={40} />
                  <p className="text-slate-500 animate-pulse text-sm">กำลังโหลดรายชื่อแหล่งข้อมูล...</p>
                </div>
              ) : sources.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Database size={40} className="mx-auto mb-3 text-slate-300" />
                  ยังไม่มีข้อมูลในตาราง กรุณากดปุ่มเพิ่มแหล่งข้อมูลใหม่
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                          <th className="p-4 min-w-[220px]">ชื่อแหล่งข้อมูล (Source Name)</th>
                          <th className="p-4 min-w-[200px] bg-cyan-50/40 text-cyan-900 border-x border-slate-200/60">รหัสย่อระบบ (Source Code)</th>
                          <th className="p-4 min-w-[320px]">คำอธิบายเพิ่มเติม</th>
                          <th className="p-4 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sources.map((src, idx) => (
                          <tr key={idx} className="bg-white hover:bg-slate-50/70 transition-colors">
                            
                            {/* Input: ชื่อแหล่งข้อมูล */}
                            <td className="p-3.5">
                              <input 
                                type="text"
                                value={src.source_name || ""}
                                onChange={(e) => handleSourceChange(idx, "source_name", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-transparent py-2 px-3 text-slate-800 font-semibold text-xs focus:bg-slate-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 outline-none transition"
                                placeholder="ตัวอย่าง: Scopus หรือ TCI"
                              />
                            </td>
                            
                            {/* Input: รหัสย่อระบบ */}
                            <td className="p-3.5 bg-cyan-50/5 border-x border-slate-100">
                              <input 
                                type="text"
                                value={src.source_code || ""}
                                onChange={(e) => handleSourceChange(idx, "source_code", e.target.value)}
                                className="w-full rounded-xl border border-cyan-200 bg-white py-2 px-3 font-mono text-xs text-cyan-900 focus:bg-slate-50 focus:border-cyan-500 font-bold outline-none shadow-sm focus:ring-2 focus:ring-cyan-100 transition"
                                placeholder="เช่น scopus, tci, patent"
                              />
                            </td>

                            {/* Input: คำอธิบาย */}
                            <td className="p-3.5">
                              <input 
                                type="text"
                                value={src.description || ""}
                                onChange={(e) => handleSourceChange(idx, "description", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-transparent py-2 px-3 text-slate-600 text-xs focus:bg-slate-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 outline-none transition"
                                placeholder="คำอธิบายรายละเอียดเพิ่มเติม..."
                              />
                            </td>

                            {/* ปุ่มลบรายการ (ปรับเป็นสีแดงอ่อนเพื่อสื่อความหมาย UX ที่ถูกต้อง) */}
                            <td className="p-3.5 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveSource(idx)} 
                                className="inline-flex items-center justify-center rounded-xl p-2.5 text-rose-600 bg-rose-50 border border-rose-100 transition hover:bg-rose-100 active:scale-95"
                                title="ลบรายการนี้"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
