"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, X, Loader2, Database } from "lucide-react";
import Header from "../component/layout/Header";
import api from "../../../lib/api"; 

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
        
        // หากไม่มี tier_code มาจากระบบหลังบ้าน ให้ทำการ Gen จาก source_code รอไว้ก่อน (ยังคงเก็บไว้ใน State)
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
      alert("ไม่สามารถดึงข้อมูลค่าน้ำหนักได้");
    } finally {
      loading && setLoading(false);
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
      const confirmDelete = confirm(
        `คุณต้องการลบเกณฑ์ "${targetWeight.tier_name || targetWeight.tier_code}" ออกจากระบบใช่หรือไม่?`
      );
      if (!confirmDelete) return;

      try {
        await api.delete(`/admin/ranking-weights/${targetWeight.tier_weight_id}`);
        alert("ลบข้อมูลจากฐานข้อมูลสำเร็จ");
      } catch (err) {
        console.error("Error deleting weight:", err);
        alert(`เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้ (${err.message})`);
        return; 
      }
    }

    setWeights(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAllWeights = async () => {
    if (sources.length === 0) {
      alert("ไม่สามารถบันทึกได้ เนื่องจากไม่มีข้อมูลแหล่งอ้างอิงในระบบ กรุณาเพิ่มแหล่งข้อมูลก่อน");
      return;
    }

    const hasInvalidWeight = weights.some(item => item.weight === "" || isNaN(parseFloat(item.weight)));
    if (hasInvalidWeight) {
      alert("กรุณากรอกค่าน้ำหนักผลงานให้ถูกต้องครบถ้วนทุกช่อง");
      return;
    }

    setIsSaving(true);
    try {
      const payload = weights.map(item => ({
        tier_weight_id: Number(item.tier_weight_id) || 0,
        tier_code: item.tier_code?.trim(),
        tier_name: item.tier_name?.trim() || "ไม่ได้ระบุชื่อเกณฑ์",
        source_id: Number(item.source_id), 
        weight: parseFloat(item.weight),
        description: item.description || "",
        thai_description: item.thai_description || "",
        sort_order: item.sort_order ? Number(item.sort_order) : 1,
        is_active: Boolean(item.is_active)
      }));

      await api.put("/admin/ranking-weights", { weights: payload });
      alert("บันทึกข้อมูลเกณฑ์ค่าน้ำหนักผลงานสำเร็จ!");
      fetchData(); 
    } catch (err) {
      console.error("Error saving weights:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message || "เซิร์ฟเวอร์ขัดข้อง"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full pb-12">
      <Header currentPageTitle="จัดการค่าน้ำหนักส่วนกลาง" />
      
      <main className="w-full mx-auto pt-32 px-6 space-y-4">
        
        {/* --- Control Bar --- */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
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
              ตั้งค่าแหล่งข้อมูลฐานอ้างอิง
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
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              บันทึกข้อมูลค่าน้ำหนัก
            </button>
          </div>
        </div>

        {/* --- ตารางค่าน้ำหนักผลงาน --- */}
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-md p-6 sm:p-8 min-h-[500px]">
          <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h1 className="text-lg font-bold text-slate-800">
              เกณฑ์และค่าน้ำหนักผลงาน (Ranking Weights)
            </h1>
          </div>

          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-cyan-600 mb-4" size={40} />
                <p className="text-slate-500 animate-pulse text-sm">กำลังโหลดโครงสร้างข้อมูล...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    <tr>
                      {/* คอลัมน์ Tier Code ถูกเอาออกแล้ว */}
                      <th className="p-4 text-left min-w-[180px]">ชื่อเรียก (Tier Name)</th>
                      <th className="p-4 text-left min-w-[180px] bg-cyan-50/50 text-cyan-800 border-x border-cyan-100">แหล่งข้อมูล (Sources)</th>
                      <th className="p-4 text-center min-w-[100px] bg-cyan-50/30 text-cyan-900">Weight (น้ำหนัก)</th>
                      <th className="p-4 text-left min-w-[280px]">คำอธิบาย (EN)</th>
                      <th className="p-4 text-left min-w-[380px]">คำอธิบาย (TH)</th>
                      <th className="p-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weights.map((item, i) => (
                      <tr key={i} className="bg-white hover:bg-slate-50/60 transition-colors">
                        
                        {/* ส่วนแสดงผลอินพุต Tier Code ถูกเอาออกแล้ว ข้อมูลยังถูก map ไปยัง payload ปกติ */}

                        <td className="p-4">
                          <input 
                            type="text"
                            value={item.tier_name || ""} 
                            onChange={(e) => handleWeightChange(i, "tier_name", e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-transparent p-2 text-slate-700 outline-none text-xs font-semibold focus:bg-slate-100/70" 
                            placeholder="TCI Tier 1"
                          />
                        </td>
                        <td className="p-4 bg-cyan-50/10 border-x border-cyan-100/40">
                          <select
                            value={item.source_id || ""}
                            onChange={(e) => handleWeightChange(i, "source_id", e.target.value)}
                            className="w-full rounded-lg border border-cyan-200 bg-white p-2 text-cyan-900 font-bold text-xs outline-none shadow-sm cursor-pointer"
                          >
                            {sources.map((src) => (
                              <option key={src.source_id} value={src.source_id}>
                                {src.source_name} 
                              </option>
                            ))}
                          </select>
                        </td>
                        
                        <td className="p-4 bg-cyan-50/5 text-center font-semibold border-x border-cyan-100/30">
                          <input 
                            type="text"
                            value={item.weight} 
                            onChange={(e) => handleWeightChange(i, "weight", e.target.value)} 
                            onBlur={(e) => handleWeightBlur(i, e.target.value)}
                            className="w-full text-center rounded-lg border border-slate-200 bg-white p-2 text-slate-900 font-bold text-xs shadow-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none" 
                            placeholder="1.0"
                          />
                        </td>

                        <td className="p-4">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleWeightChange(i, "description", e.target.innerText)}
                            className="w-full rounded-lg p-2 text-slate-600 text-xs outline-none min-h-[36px] break-words empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
                            placeholder="English description..."
                          >
                            {item.description}
                          </div>
                        </td>
                        <td className="p-4">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleWeightChange(i, "thai_description", e.target.innerText)}
                            className="w-full rounded-lg p-2 text-slate-600 text-xs outline-none min-h-[36px] break-words empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
                            placeholder="คำอธิบายภาษาไทย..."
                          >
                            {item.thai_description}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveWeight(i)} 
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