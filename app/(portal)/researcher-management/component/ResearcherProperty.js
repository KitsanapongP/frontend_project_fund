"use client";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function IntellectualPropertyTab({ formData, handleInputChange }) {
  const intellectualProperties = formData.instructor_intellectual_properties || [];
  const [weightMaster, setWeightMaster] = useState({});

  useEffect(() => {
  const fetchWeights = async () => {
    try {
      const res = await api.get("/admin/ranking-weights");
      const rawData = Array.isArray(res) ? res : (res?.data ?? []);

      if (rawData.length > 0) {
        const mapping = {};
        rawData.forEach(item => {
  if (item.source_id !== 1 && item.source_id !== 2) {
    mapping[item.tier_code] = item;
  }
});
        if (Object.keys(mapping).length > 0) {
          setWeightMaster(mapping);
          return;
        }
      }
    } catch (err) {
      console.error("โหลด ranking-weights ไม่ได้:", err);
    }
    // Fallback
    setWeightMaster({
      "patent":       { tier_code: "patent",      tier_name: "Patent",       weight: 1.0, source_id: 2 },
      "petty_patent": { tier_code: "petty_patent", tier_name: "Petty Patent", weight: 0.4, source_id: 2 },
    });
  };
  fetchWeights();
}, []);

  // 2. Sync type ที่โหลดจาก DB ให้ตรงกับ key ใน weightMaster
  useEffect(() => {
    if (Object.keys(weightMaster).length === 0) return;

    const needsSync = intellectualProperties.some(p => p.type && !weightMaster[p.type]);
    if (!needsSync) return;

    const synced = intellectualProperties.map(p => {
      if (!p.type || weightMaster[p.type]) return p;
      const matchedKey = Object.keys(weightMaster).find(
        k => k.toLowerCase().trim() === p.type.toLowerCase().trim()
      );
      if (matchedKey) {
        return { ...p, type: matchedKey, tier_details: weightMaster[matchedKey] };
      }
      return p;
    });

    handleInputChange("instructor_intellectual_properties", synced);
  }, [weightMaster]);

  // 3. เพิ่มรายการใหม่
  const handleAddProperty = () => {
    const availableTypes = Object.keys(weightMaster);
    if (availableTypes.length === 0) {
      alert("ยังไม่ได้โหลดข้อมูลเกณฑ์น้ำหนัก กรุณารอสักครู่");
      return;
    }
    const defaultType = availableTypes[0];
    const currentMaster = weightMaster[defaultType];
    handleInputChange("instructor_intellectual_properties", [
      ...intellectualProperties,
      {
        type: defaultType,
        title: "",
        registration_number: "",
        granted_year: null,
        tier_details: { tier_name: currentMaster.tier_name, weight: currentMaster.weight }
      }
    ]);
  };

  const handlePropertyFieldChange = (index, field, value) => {
    const newList = [...intellectualProperties];
    if (field === "granted_year") {
      newList[index] = { ...newList[index], [field]: value === "" ? null : Number(value) };
    } else if (field === "registration_number") {
      newList[index] = { ...newList[index], [field]: value === "" ? null : value };
    } else if (field === "type") {
      const matchedMaster = weightMaster[value];
      newList[index] = {
        ...newList[index],
        type: value,
        tier_details: matchedMaster ?? null
      };
    } else {
      newList[index] = { ...newList[index], [field]: value };
    }
    handleInputChange("instructor_intellectual_properties", newList);
  };

  const handleRemoveProperty = (index) => {
    if (!window.confirm("คุณต้องการลบรายการทรัพย์สินทางปัญญานี้ใช่หรือไม่?")) return;
    handleInputChange(
      "instructor_intellectual_properties",
      intellectualProperties.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="text-base font-bold text-gray-800">รายการผลงานทรัพย์สินทางปัญญา</h2>
        <button
          onClick={handleAddProperty}
          type="button"
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
        >
          <Plus size={16} /> เพิ่มผลงาน
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs uppercase">
            <tr>
              <th className="p-4 text-left w-1/4">ประเภท</th>
              <th className="p-4 text-left w-1/3">ชื่อผลงานวิชาการ / ทรัพย์สินทางปัญญา</th>
              <th className="p-4 text-left">เลขทะเบียน / เลขที่สิทธิบัตร</th>
              <th className="p-4 text-center w-32">ค่าน้ำหนัก</th>
              <th className="p-4 text-center w-36">ปีที่ได้รับอนุมัติ</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {intellectualProperties.length > 0 ? (
              intellectualProperties.map((property, index) => {
                const currentTypeKey = property.type && weightMaster[property.type]
                  ? property.type
                  : Object.keys(weightMaster)[0] || "";

                const matchedMaster = weightMaster[currentTypeKey];
                const displayWeight = property.tier_details?.weight
                  ? property.tier_details.weight.toFixed(1)
                  : (matchedMaster ? matchedMaster.weight.toFixed(1) : "0.0");

                return (
                  <tr key={property.id || index} className="bg-white hover:bg-slate-50/60">
                    <td className="p-2">
                      <select
                        value={currentTypeKey}
                        onChange={(e) => handlePropertyFieldChange(index, "type", e.target.value)}
                        className="w-full rounded-lg border-0 bg-transparent p-2 text-slate-700 outline-none font-medium cursor-pointer"
                      >
                        {Object.keys(weightMaster).map((key) => (
                          <option key={key} value={key}>
                            {weightMaster[key].tier_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={property.title || ""}
                        onChange={(e) => handlePropertyFieldChange(index, "title", e.target.value)}
                        placeholder="กรอกชื่อผลงาน"
                        className="w-full bg-transparent p-2 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={property.registration_number || ""}
                        onChange={(e) => handlePropertyFieldChange(index, "registration_number", e.target.value)}
                        placeholder="เช่น 123456"
                        className="w-full bg-transparent p-2 outline-none"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                        {displayWeight}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        value={property.granted_year || ""}
                        onChange={(e) => handlePropertyFieldChange(index, "granted_year", e.target.value)}
                        className="w-full bg-transparent p-2 outline-none text-center cursor-pointer"
                      >
                        <option value="">เลือกปี พ.ศ.</option>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let i = 0; i < 50; i++) {
                            const yearCE = currentYear - i;
                            years.push(<option key={yearCE} value={yearCE}>{yearCE + 543}</option>);
                          }
                          return years;
                        })()}
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveProperty(index)}
                        className="text-cyan-700 bg-cyan-50 p-2 rounded-xl border border-cyan-200 hover:bg-cyan-100"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-400 bg-slate-50/30">
                  ยังไม่มีข้อมูลผลงานทรัพย์สินทางปัญญา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}