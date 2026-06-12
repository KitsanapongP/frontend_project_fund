"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X, Loader2, Database, Scale } from "lucide-react";
import Header from "../component/layout/Header";
import api from "../../../lib/api"; 
import Swal from "sweetalert2";

export default function RankingWeightsPage() {
  const router = useRouter();
  
  const [weights, setWeights] = useState([]);
  const [sources, setSources] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sourcesRes = await api.get("/admin/ranking-sources").catch(() => []);
      setSources(sourcesRes || []);

      const weightsRes = await api.get("/admin/ranking-weights");
      const sanitizedData = (weightsRes || []).map(item => {
        const defaultSourceId = item.source_id || (sourcesRes[0]?.source_id || 1);
        
        let currentCode = item.tier_code;
        if (!currentCode) {
          const matchedSrc = sourcesRes.find(s => Number(s.source_id) === Number(defaultSourceId));
          const srcCode = matchedSrc?.source_code || "code";
          currentCode = `${srcCode}_${item.tier_weight_id || Date.now()}`;
        }

        return {
          ...item,
          source_id: defaultSourceId,
          tier_code: currentCode,
          weight: item.weight !== undefined && item.weight !== null ? parseFloat(item.weight).toFixed(1) : "0.0"
        };
      });

      setWeights(sanitizedData);
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลค่าน้ำหนักได้",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "ตกลง",
      });
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWeight = () => {
    const defaultSource = sources[0];
    const defaultSourceId = defaultSource?.source_id || 1;
    const defaultSrcCode = defaultSource?.source_code || "code";
    const temporaryId = Date.now(); 

    const newWeightItem = {
      tier_weight_id: 0,
      source_id: defaultSourceId, 
      tier_code: `${defaultSrcCode}_${temporaryId}`, 
      tier_name: "",
      description: "",
      thai_description: "",
      weight: "0.0", 
      sort_order: weights.length + 1, 
      is_active: true
    };
    setWeights(prev => [...prev, newWeightItem]);
  };

  const handleWeightChange = (index, field, value) => {
    const updatedWeights = [...weights];
    
    if (field === "source_id") {
      const matchedSource = sources.find(src => Number(src.source_id) === Number(value));
      const sourceCodePrefix = matchedSource?.source_code || "code";
      
      const currentItemId = updatedWeights[index].tier_weight_id !== 0 
        ? updatedWeights[index].tier_weight_id 
        : "new";
        
      updatedWeights[index]["tier_code"] = `${sourceCodePrefix}_${currentItemId}`;
    }

    updatedWeights[index] = { ...updatedWeights[index], [field]: value };
    setWeights(updatedWeights);
  };

  const handleWeightBlur = (index, value) => {
    let parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      parsedValue = 0.0;
    }
    handleWeightChange(index, "weight", parsedValue.toFixed(1));
  };

  const handleRemoveWeight = async (index) => {
    const targetWeight = weights[index];

    if (targetWeight.tier_weight_id !== 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "ยืนยันการลบข้อมูล?",
        text: `คุณต้องการลบเกณฑ์ "${targetWeight.tier_name || targetWeight.tier_code}" ออกจากระบบใช่หรือไม่?`,
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#cbd5e1",
        confirmButtonText: "ลบออก",
        cancelButtonText: "ยกเลิก",
      });

      if (!result.isConfirmed) return;

      try {
        await api.delete(`/admin/ranking-weights/${targetWeight.tier_weight_id}`);
        
        await Swal.fire({
          icon: "success",
          title: "ลบข้อมูลสำเร็จ",
          text: "ลบเกณฑ์น้ำหนักออกจากระบบเรียบร้อยแล้ว",
          confirmButtonColor: "#0891b2",
          confirmButtonText: "ตกลง",
        });
      } catch (err) {
        console.error("Error deleting weight:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: `เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`,
          confirmButtonColor: "#dc2626",
          confirmButtonText: "ตกลง",
        });
        return; 
      }
    }

    setWeights(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAllWeights = async () => {
    if (sources.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "ไม่สามารถบันทึกได้",
        text: "เนื่องจากไม่มีข้อมูลแหล่งอ้างอิงในระบบ กรุณาเพิ่มแหล่งข้อมูลก่อน",
        confirmButtonColor: "#0891b2",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const hasInvalidWeight = weights.some(
      item => item.weight === "" || isNaN(parseFloat(item.weight))
    );
    if (hasInvalidWeight) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ถูกต้อง",
        text: "กรุณากรอกค่าน้ำหนักผลงานให้ถูกต้องครบถ้วนทุกช่อง",
        confirmButtonColor: "#0891b2",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = weights.map(item => ({
        tier_weight_id: Number(item.tier_weight_id) || 0,
        tier_code:      item.tier_code?.trim(),
        tier_name:      item.tier_name?.trim() || "ไม่ได้ระบุชื่อเกณฑ์",
        source_id:      Number(item.source_id),
        weight:         parseFloat(item.weight),
        description:    item.description || "",
        thai_description: item.thai_description || "",
        sort_order:     item.sort_order ? Number(item.sort_order) : 1,
        is_active:      Boolean(item.is_active)
      }));

      const updatedWeights = await api.put("/admin/ranking-weights", { weights: payload });

      if (updatedWeights && Array.isArray(updatedWeights)) {
        const sanitized = updatedWeights.map(item => ({
          ...item,
          weight: parseFloat(item.weight).toFixed(1)
        }));
        setWeights(sanitized);
      }

      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "บันทึกข้อมูลเกณฑ์ค่าน้ำหนักผลงานสำเร็จ!",
        confirmButtonColor: "#0891b2",
        confirmButtonText: "ตกลง",
        timer: 1500
      });

    } catch (err) {
      console.error("Error saving weights:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการบันทึก",
        text: `เกิดข้อผิดพลาด: ${err.message || "เซิร์ฟเวอร์ขัดข้อง"}`,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans w-full pb-12">
      {/* ── Header ── */}
      <Header currentPageTitle="จัดการค่าน้ำหนักส่วนกลาง" />
      
      {/* ── Main Layout Wrapper ── */}
      <main className="w-full pt-28 px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* ── Control Bar (ปุ่มย้อนกลับ / ตั้งค่า / คอนโทรลตาราง) ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push("/researcher-management")}
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-cyan-300 hover:text-cyan-700 shadow-sm"
              >
                <ArrowLeft size={16} className="me-2" />
                ย้อนกลับ
              </button>

              <button
                onClick={() => router.push("/researcher-management/sources")}
                className="inline-flex items-center rounded-full border border-slate-300 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 shadow-sm"
              >
                <Database size={16} className="me-2" /> 
                ตั้งค่าฐานข้อมูลแหล่งอ้างอิง
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddWeight} 
                disabled={loading || isSaving}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Plus size={14}/>
                เพิ่มเกณฑ์น้ำหนัก
              </button>
              <button
                onClick={handleSaveAllWeights}
                disabled={isSaving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                บันทึกข้อมูลค่าน้ำหนัก
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />

            {/* ส่วนหัวภายในกรอบหลัก */}
            <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      โครงสร้างค่าน้ำหนักผลงานวิจัยและการตีพิมพ์
                    </p>
                  </div>
                  <h1 className="mt-1 text-base sm:text-lg font-bold text-slate-800">
                    เกณฑ์และค่าน้ำหนักผลงาน (Ranking Weights)
                  </h1>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  ทั้งหมด {weights.length} เกณฑ์ย่อย
                </span>
              </div>
            </div>

            {/* ส่วนเนื้อหาตาราง */}
            <div className="relative p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="animate-spin text-cyan-600 mb-4" size={40} />
                  <p className="text-slate-500 animate-pulse text-sm">กำลังโหลดโครงสร้างข้อมูล...</p>
                </div>
              ) : weights.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Scale size={40} className="mx-auto mb-3 text-slate-300" />
                  ยังไม่มีเกณฑ์ค่าน้ำหนักในระบบ กรุณากดปุ่มเพิ่มเกณฑ์น้ำหนัก
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                          <th className="p-4 min-w-[200px]">ชื่อเรียก (Tier Name)</th>
                          <th className="p-4 min-w-[180px] bg-cyan-50/40 text-cyan-900 border-x border-slate-200/60">แหล่งข้อมูล (Sources)</th>
                          <th className="p-4 w-[110px] text-center bg-cyan-50/20 text-cyan-950">น้ำหนัก (Weight)</th>
                          <th className="p-4 min-w-[260px]">คำอธิบาย (EN)</th>
                          <th className="p-4 min-w-[340px]">คำอธิบาย (TH)</th>
                          <th className="p-4 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {weights.map((item, i) => (
                          <tr key={i} className="bg-white hover:bg-slate-50/70 transition-colors">
                            
                            {/* Input: ชื่อเรียกเกณฑ์ */}
                            <td className="p-3.5">
                              <input 
                                type="text"
                                value={item.tier_name || ""} 
                                onChange={(e) => handleWeightChange(i, "tier_name", e.target.value)} 
                                className="w-full rounded-xl border border-slate-200 bg-transparent py-2 px-3 text-slate-800 font-semibold text-xs focus:bg-slate-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 outline-none transition" 
                                placeholder="ตัวอย่าง: TCI Tier 1"
                              />
                            </td>

                            {/* Dropdown Select: แหล่งข้อมูลอ้างอิง */}
                            <td className="p-3.5 bg-cyan-50/5 border-x border-slate-100">
                              <select
                                value={item.source_id || ""}
                                onChange={(e) => handleWeightChange(i, "source_id", e.target.value)}
                                className="w-full rounded-xl border border-cyan-200 bg-white py-2 px-3 text-cyan-900 font-bold text-xs outline-none shadow-sm cursor-pointer focus:ring-2 focus:ring-cyan-100 transition"
                              >
                                {sources.map((src) => (
                                  <option key={src.source_id} value={src.source_id}>
                                    {src.source_name} 
                                  </option>
                                ))}
                              </select>
                            </td>
                            
                            {/* Input: ค่าน้ำหนัก (ตัวเลขจัดกึ่งกลาง) */}
                            <td className="p-3.5 bg-cyan-50/5 text-center border-r border-slate-100">
                              <input 
                                type="text"
                                value={item.weight} 
                                onChange={(e) => handleWeightChange(i, "weight", e.target.value)} 
                                onBlur={(e) => handleWeightBlur(i, e.target.value)}
                                className="w-full text-center rounded-xl border border-slate-200 bg-white py-2 px-2 text-slate-900 font-bold text-xs shadow-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 outline-none transition" 
                                placeholder="1.0"
                              />
                            </td>

                            {/* Editable Div: คำอธิบายภาษาอังกฤษ */}
                            <td className="p-3.5">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleWeightChange(i, "description", e.target.innerText)}
                                className="w-full rounded-xl border border-slate-100 bg-slate-50/30 py-2 px-3 text-slate-600 text-xs outline-none min-h-[38px] break-words empty:before:content-[attr(placeholder)] empty:before:text-slate-300 focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition"
                                placeholder="English description..."
                              >
                                {item.description}
                              </div>
                            </td>

                            {/* Editable Div: คำอธิบายภาษาไทย */}
                            <td className="p-3.5">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleWeightChange(i, "thai_description", e.target.innerText)}
                                className="w-full rounded-xl border border-slate-100 bg-slate-50/30 py-2 px-3 text-slate-600 text-xs outline-none min-h-[38px] break-words empty:before:content-[attr(placeholder)] empty:before:text-slate-300 focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-50 transition"
                                placeholder="คำอธิบายรายละเอียดภาษาไทย..."
                              >
                                {item.thai_description}
                              </div>
                            </td>

                            {/* ปุ่มลบรายการ */}
                            <td className="p-3.5 text-center">
                              <button 
                                type="button"
                                onClick={() => handleRemoveWeight(i)} 
                                className="inline-flex items-center justify-center rounded-xl p-2.5 text-rose-600 bg-rose-50 border border-rose-100 transition hover:bg-rose-100 active:scale-95"
                                title="ลบเกณฑ์นี้"
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