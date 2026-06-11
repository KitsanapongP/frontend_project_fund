"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X, Loader2, Edit3 } from "lucide-react";
import Header from "../component/layout/Header";
import api from "../../../lib/api"; 

export default function RankingSourcesPage() {
  const router = useRouter();
  
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSavingSources, setIsSavingSources] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const sourcesRes = await api.get("/admin/ranking-sources");
      setSources(sourcesRes || []);
    } catch (err) {
      console.error("Error fetching sources:", err);
      alert("ไม่สามารถโหลดข้อมูลแหล่งอ้างอิงได้");
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
      // สำหรับช่อง Source Code บังคับล้างอักษรพิเศษและช่องว่างให้เป็นตัวพิมพ์เล็กหรืออันเดอร์สกอร์สอดคล้องกับรูปแบบ DB ตัวคีย์
      updatedSources[index][field] = value
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "");
    } else {
      updatedSources[index][field] = value;
    }

    // เจนเนอเรต Source Code อัตโนมัติจากชื่อเฉพาะเคสที่เป็นข้อมูลใหม่ และฟิลด์โค้ดยังไม่โดนแก้ไขแมนนวล
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

  // ถ้าเป็นข้อมูลที่มีอยู่แล้วใน DB (มี source_id ไม่ใช่ 0)
  if (targetSource.source_id !== 0) {
    const confirmDelete = confirm(`คุณต้องการลบแหล่งข้อมูล "${targetSource.source_name || targetSource.source_code}" ออกจากระบบถาวรใช่หรือไม่?`);
    if (!confirmDelete) return;

    try {
      // สั่งลบที่หลังบ้านทันที
      await api.delete(`/admin/ranking-sources/${targetSource.source_id}`);
      alert("ลบข้อมูลสำเร็จ");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบข้อมูลจากฐานข้อมูลได้");
      return;
    }
  }

  // ลบออกจากสถานะหน้าจอตัวแปร State
  setSources(prev => prev.filter((_, i) => i !== index));
};
  const handleSaveSources = async () => {
    // ดักตรวจสอบว่ากรอก Code ครบไหม
    const hasEmptyCode = sources.some(src => !src.source_code?.trim());
    if (hasEmptyCode) {
      alert("กรุณาระบุรหัสย่อระบบ (Source Code) ให้ครบถ้วนทุกช่อง");
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

      await api.put("/admin/ranking-sources", { sources: payload });
      alert("ปรับปรุงฐานข้อมูลแหล่งที่มา (Ranking Sources) สำเร็จ!");
      router.push("/researcher-management/weights"); 
    } catch (err) {
      console.error("Error saving sources:", err);
      alert(`เกิดข้อผิดพลาดในการบันทึกแหล่งข้อมูล: ${err.message}`);
    } finally {
      setIsSavingSources(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pb-12">
      <Header currentPageTitle="จัดการฐานข้อมูลแหล่งที่มาส่วนกลาง" />
      
      <main className="w-full mx-auto pt-32 px-6 space-y-4">
        
        {/* --- Control Bar ธีมสี Cyan --- */}
        <div className="flex items-center justify-between mb-2">
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
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {isSavingSources ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              บันทึกตารางแหล่งข้อมูล
            </button>
          </div>
        </div>

        {/* --- ตารางจัดการ Ranking Sources ธีมสี Cyan --- */}
        <div className="relative overflow-hidden rounded-[24px] border border-cyan-200 bg-white shadow-md p-6 sm:p-8 min-h-[500px]">
          <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h1 className="text-lg font-bold text-cyan-900 flex items-center gap-1.5">
              <Edit3 size={20} className="text-cyan-600"/> ตั้งค่าโครงสร้างตารางแหล่งข้อมูลฐานอ้างอิง (ranking_sources)
            </h1>
          </div>

          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-cyan-600 mb-4" size={40} />
                <p className="text-slate-500 animate-pulse text-sm">กำลังโหลดรายชื่อแหล่งข้อมูล...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    <tr>
                      
                      <th className="p-4 text-left min-w-[200px]">ชื่อแหล่งข้อมูล (Source Name)</th>
                      <th className="p-4 text-left min-w-[200px] bg-cyan-50/40 text-cyan-900 border-x border-cyan-100/70">รหัสย่อระบบ (Source Code)</th>
                      <th className="p-4 text-left min-w-[300px]">คำอธิบายเพิ่มเติม</th>
                      <th className="p-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sources.map((src, idx) => (
                      <tr key={idx} className="bg-white hover:bg-slate-50/60 transition-colors">
            
                        <td className="p-4">
                          <input 
                            type="text"
                            value={src.source_name || ""}
                            onChange={(e) => handleSourceChange(idx, "source_name", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-transparent p-2 text-slate-800 font-semibold text-xs focus:bg-slate-50 focus:border-cyan-400 outline-none"
                            placeholder="ตัวอย่าง: Scopus หรือ TCI"
                          />
                        </td>
                        
                        {/* ปลดล็อกอินพุตช่อง Source Code ให้กดแก้ไขพิมพ์เองได้ตลอดเวลาตามต้องการ */}
                        <td className="p-4 bg-cyan-50/5 border-x border-cyan-100/30">
                          <input 
                            type="text"
                            value={src.source_code || ""}
                            onChange={(e) => handleSourceChange(idx, "source_code", e.target.value)}
                            className="w-full rounded-lg border border-cyan-200 bg-white p-2 font-mono text-xs text-slate-800 focus:bg-slate-50 focus:border-cyan-500 font-bold outline-none shadow-sm"
                            placeholder="เช่น scopus, tci, patent"
                          />
                        </td>

                        <td className="p-4">
                          <input 
                            type="text"
                            value={src.description || ""}
                            onChange={(e) => handleSourceChange(idx, "description", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-transparent p-2 text-slate-600 text-xs focus:bg-slate-50 outline-none"
                            placeholder="คำอธิบายสั้นๆ..."
                          />
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveSource(idx)} 
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}