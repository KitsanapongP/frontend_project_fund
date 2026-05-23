"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import {
  FileText, Plus, Edit3, Trash2, X, Tag, Target, ChevronLeft, Save, Building2
} from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import MouLayout from "../components/MouLayout";

export default function AdminManageTypeOkrPage() {
  const [types, setTypes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", title: "", description: "", category: "", name_th: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, okrsRes, ptRes] = await Promise.all([
        mouAPI.getActivityTypes(),
        mouAPI.getOkrs(),
        mouAPI.getMouPartnerTypes(),
      ]);
      setTypes(typesRes?.data || typesRes || []);
      setOkrs(okrsRes?.data || okrsRes || []);
      setPartnerTypes(ptRes?.data || ptRes || []);
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
        name_th: item.name_th || "",
      });
    } else {
      setForm({ name: "", title: "", description: "", category: "", name_th: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setForm({ name: "", title: "", description: "", category: "", name_th: "" });
  };

  const rawTrashSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
  const rawSaveSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
  const rawQuestionSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>';

  const makeSwalDelete = (label) => ({
    title: `ยืนยันการลบ${label}หรือไม่ ?`,
    text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
    iconHtml: rawTrashSvg,
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    customClass: { icon: 'swal-icon-trash' },
  });

  const makeSwalEdit = (titleText) => ({
    title: titleText,
    iconHtml: rawSaveSvg,
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    customClass: { icon: 'swal-icon-save' },
  });

  const handleSave = async () => {
    if (modalMode === "addType" || modalMode === "editType") {
      if (!form.name) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อประเภทกิจกรรม" });
        return;
      }
      const result = await Swal.fire(
        modalMode === "addType"
          ? { title: "ยืนยันการเพิ่มประเภทกิจกรรม?", iconHtml: rawQuestionSvg, showCancelButton: true, confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280", confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", reverseButtons: true, customClass: { icon: 'swal-icon-save' } }
          : makeSwalEdit("ยืนยันการแก้ไขประเภทกิจกรรมหรือไม่ ?")
      );
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
      const result = await Swal.fire(
        modalMode === "addOkr"
          ? { title: "ยืนยันการเพิ่ม OKR?", iconHtml: rawQuestionSvg, showCancelButton: true, confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280", confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", reverseButtons: true, customClass: { icon: 'swal-icon-save' } }
          : makeSwalEdit("ยืนยันการแก้ไข OKR หรือไม่ ?")
      );
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
    } else if (modalMode === "addPartnerType" || modalMode === "editPartnerType") {
      if (!form.name_th) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อประเภทคู่สัญญา" });
        return;
      }
      const result = await Swal.fire(
        modalMode === "addPartnerType"
          ? { title: "ยืนยันการเพิ่มประเภทคู่สัญญา?", iconHtml: rawQuestionSvg, showCancelButton: true, confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280", confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", reverseButtons: true, customClass: { icon: 'swal-icon-save' } }
          : makeSwalEdit("ยืนยันการแก้ไขประเภทคู่สัญญาหรือไม่ ?")
      );
      if (!result.isConfirmed) return;

      try {
        if (modalMode === "addPartnerType") {
          await mouAPI.createPartnerType({ name_th: form.name_th, description: form.description || null });
        } else {
          await mouAPI.updatePartnerType(editItem.id, { name_th: form.name_th, description: form.description || null });
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
    const labels = { type: "ประเภทกิจกรรม", okr: "OKR", partnerType: "ประเภทคู่สัญญา" };
    const label = labels[type] || "";
    const result = await Swal.fire(makeSwalDelete(label));
    if (!result.isConfirmed) return;

    try {
      if (type === "type") {
        await mouAPI.deleteActivityType(id);
      } else if (type === "okr") {
        await mouAPI.deleteOkr(id);
      } else if (type === "partnerType") {
        await mouAPI.deletePartnerType(id);
      }
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
      loadData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const renderCard = ({ title, icon, iconBg, iconColor, gradient, items, emptyText, addLabel, addMode, keyField, displayField }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{items.length} รายการ</span>
        <button
          onClick={() => openModal(addMode)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${gradient} px-3.5 py-2 text-xs font-medium text-white transition`}
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">{item[keyField]}</div>
                {item.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button onClick={() => openModal(`edit${addMode.replace("add", "")}`, item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition" title="แก้ไข">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(addMode === "addPartnerType" ? "partnerType" : addMode === "addType" ? "type" : "okr", item.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition" title="ลบ">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-gray-400">
          {icon && <div className="mb-1 opacity-50">{icon}</div>}
          <span className="text-sm">{emptyText}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        .swal-icon-trash { border-color: #dc2626 !important; }
        .swal-icon-save { border-color: #2563eb !important; }
        .swal2-title { font-size: 1.05rem !important; }
        .swal2-actions { width: 100% !important; justify-content: space-between !important; padding: 0 1rem !important; }
        .swal2-actions .swal2-cancel { order: -1 !important; }
        .swal2-actions .swal2-confirm { order: 0 !important; }
      `}</style>
      <MouLayout subtitle="การจัดการประเภทของข้อมูล">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
          <FileText size={22} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
          การจัดการประเภทของข้อมูล
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
          {renderCard({
            title: "ประเภทกิจกรรม",
            icon: <Tag size={16} className="text-blue-600" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            gradient: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            items: types,
            emptyText: "ไม่มีประเภทกิจกรรม",
            addLabel: "เพิ่มประเภท",
            addMode: "addType",
            keyField: "name",
          })}
          {renderCard({
            title: "OKRs",
            icon: <Target size={16} className="text-blue-600" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            gradient: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            items: okrs,
            emptyText: "ไม่มี OKR",
            addLabel: "เพิ่ม OKR",
            addMode: "addOkr",
            keyField: "title",
          })}
          {renderCard({
            title: "ประเภทคู่สัญญา",
            icon: <Building2 size={16} className="text-blue-600" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            gradient: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            items: partnerTypes,
            emptyText: "ไม่มีประเภทคู่สัญญา",
            addLabel: "เพิ่มประเภท",
            addMode: "addPartnerType",
            keyField: "name_th",
          })}
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
                 modalMode === "addOkr" ? "เพิ่ม OKR" :
                 modalMode === "editOkr" ? "แก้ไข OKR" :
                 modalMode === "addPartnerType" ? "เพิ่มประเภทคู่สัญญา" :
                 modalMode === "editPartnerType" ? "แก้ไขประเภทคู่สัญญา" : ""}
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
              {(modalMode === "addPartnerType" || modalMode === "editPartnerType") && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อประเภทคู่สัญญา <span className="text-red-500">*</span></label>
                    <input
                      value={form.name_th}
                      onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="เช่น มหาวิทยาลัย/สถาบันการศึกษา"
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
    </>
  );
}
