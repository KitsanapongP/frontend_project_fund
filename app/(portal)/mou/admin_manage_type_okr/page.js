"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import {
  FileText, Plus, Edit3, Trash2, X, Tag, Target, ChevronLeft, Save
} from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import { useAuth } from "../../../contexts/AuthContext";
import MouLayout from "../components/MouLayout";

export default function AdminManageTypeOkrPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(""); // "addType" | "editType" | "addOkr" | "editOkr"
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", title: "", description: "", category: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const typesRes = await mouAPI.getActivityTypes();
      setTypes(typesRes?.data || typesRes || []);
      const okrsRes = await mouAPI.getOkrs();
      setOkrs(okrsRes?.data || okrsRes || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    setEditItem(item);
    if (item) {
      setForm({
        name: item.name || "",
        title: item.title || "",
        description: item.description || "",
        category: item.category || "",
      });
    } else {
      setForm({ name: "", title: "", description: "", category: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setForm({ name: "", title: "", description: "", category: "" });
  };

  const handleSave = async () => {
    if (modalMode === "addType" || modalMode === "editType") {
      if (!form.name) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อประเภทกิจกรรม" });
        return;
      }
      const result = await Swal.fire({
        title: modalMode === "addType" ? "ยืนยันการเพิ่มประเภทกิจกรรม?" : "ยืนยันการแก้ไขประเภทกิจกรรม?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "ยืนยัน",
          cancelButtonText: "ยกเลิก",
          reverseButtons: false,
      });
      if (!result.isConfirmed) return;

      try {
        if (modalMode === "addType") {
          await mouAPI.createActivityType({ name: form.name, description: form.description });
        } else {
          await mouAPI.updateActivityType(editItem.id, { name: form.name, description: form.description });
        }
        Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
        closeModal();
        loadData();
      } catch (err) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }
    } else if (modalMode === "addOkr" || modalMode === "editOkr") {
      if (!form.title) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกรหัส OKR" });
        return;
      }
      const result = await Swal.fire({
        title: modalMode === "addOkr" ? "ยืนยันการเพิ่ม OKR?" : "ยืนยันการแก้ไข OKR?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "ยืนยัน",
          cancelButtonText: "ยกเลิก",
          reverseButtons: false,
      });
      if (!result.isConfirmed) return;

      try {
        if (modalMode === "addOkr") {
          await mouAPI.createOkr({ title: form.title, description: form.description, category: form.category });
        } else {
          await mouAPI.updateOkr(editItem.id, { title: form.title, description: form.description, category: form.category });
        }
        Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
        closeModal();
        loadData();
      } catch (err) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
      }
    }
  };

  const handleDelete = async (type, id) => {
    const isType = type === "type";
    const label = isType ? "ประเภทกิจกรรม" : "OKR";
    const result = await Swal.fire({
      title: `ยืนยันการลบ${label}?`,
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      reverseButtons: false,
    });
    if (!result.isConfirmed) return;

    try {
      if (isType) {
        await mouAPI.deleteActivityType(id);
      } else {
        await mouAPI.deleteOkr(id);
      }
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
      loadData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <MouLayout subtitle="จัดการประเภทกิจกรรม / OKR">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
          <FileText size={22} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
          จัดการประเภทกิจกรรม / OKR
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activity Types Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Tag size={16} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">ประเภทกิจกรรม</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{types.length} รายการ</span>
              <button
                onClick={() => openModal("addType")}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition"
              >
                <Plus size={14} /> เพิ่มประเภท
              </button>
            </div>
            {types.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {types.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">{t.name}</div>
                      {t.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button onClick={() => openModal("editType", t)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition" title="แก้ไข">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete("type", t.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition" title="ลบ">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Tag size={28} className="mb-1 opacity-50" />
                <span className="text-sm">ไม่มีประเภทกิจกรรม</span>
              </div>
            )}
          </div>

          {/* OKRs Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Target size={16} className="text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">OKRs</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{okrs.length} รายการ</span>
              <button
                onClick={() => openModal("addOkr")}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3.5 py-2 text-xs font-medium text-white hover:from-violet-700 hover:to-purple-700 transition"
              >
                <Plus size={14} /> เพิ่ม OKR
              </button>
            </div>
            {okrs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {okrs.map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">{o.title}</div>
                      {o.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{o.description}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button onClick={() => openModal("editOkr", o)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition" title="แก้ไข">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete("okr", o.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition" title="ลบ">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Target size={28} className="mb-1 opacity-50" />
                <span className="text-sm">ไม่มี OKR</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {modalMode === "addType" ? "เพิ่มประเภทกิจกรรม" :
                 modalMode === "editType" ? "แก้ไขประเภทกิจกรรม" :
                 modalMode === "addOkr" ? "เพิ่ม OKR" : "แก้ไข OKR"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {(modalMode === "addType" || modalMode === "editType") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อประเภท <span className="text-red-500">*</span></label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="ระบุชื่อประเภทกิจกรรม"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 min-h-[80px] resize-y"
                      placeholder="ระบุคำอธิบาย..."
                    />
                  </div>
                </>
              )}
              {(modalMode === "addOkr" || modalMode === "editOkr") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">รหัส OKR <span className="text-red-500">*</span></label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="เช่น OKR-05"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">รายละเอียด</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="ระบุรายละเอียด OKR"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button onClick={closeModal} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <X size={15} /> ยกเลิก
              </button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition">
                <Save size={15} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </MouLayout>
  );
}
