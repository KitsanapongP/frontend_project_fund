"use client";

import { useEffect, useState } from "react";
import { Globe2, Pencil, PlusCircle, RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";
import SettingsSectionCard from "../common/SettingsSectionCard";
import SettingsModal from "../common/SettingsModal";
import { adminAPI } from "@/app/lib/admin_api";

const emptyForm = { sdg_number: "", name_th: "", name_en: "", description_th: "", description_en: "" };
const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2800, timerProgressBar: true });

export default function SDGManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadSDGs = async () => {
    setLoading(true);
    try {
      const list = await adminAPI.getSDGs();
      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: error?.message || "โหลดข้อมูล SDG ไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSDGs(); }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      sdg_number: item?.sdg_number ?? "",
      name_th: item?.name_th ?? "",
      name_en: item?.name_en ?? "",
      description_th: item?.description_th ?? "",
      description_en: item?.description_en ?? "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.sdg_number || !form.name_th.trim() || !form.name_en.trim()) {
      Toast.fire({ icon: "warning", title: "กรุณากรอกเลข SDG และชื่อให้ครบ" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        sdg_number: Number(form.sdg_number),
        name_th: form.name_th.trim(),
        name_en: form.name_en.trim(),
      };

      if (editingItem) {
        await adminAPI.updateSDG(editingItem.sdg_id, payload);
        Toast.fire({ icon: "success", title: "แก้ไข SDG สำเร็จ" });
      } else {
        await adminAPI.createSDG(payload);
        Toast.fire({ icon: "success", title: "เพิ่ม SDG สำเร็จ" });
      }

      await loadSDGs();
      handleCloseModal();
    } catch (error) {
      if (error?.status === 409) {
        Toast.fire({ icon: "warning", title: "เลข SDG นี้มีอยู่แล้ว" });
      } else {
        console.error(error);
        Toast.fire({ icon: "error", title: error?.message || "บันทึก SDG ไม่สำเร็จ" });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderList = () => {
    if (loading) return <div className="py-6 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
    if (!items.length) return <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">ยังไม่มีข้อมูล SDG</div>;

    return <div className="space-y-3">
      {items.map((item) => (
        <div key={item.sdg_id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30">
          <div className="flex min-w-[240px] items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{item.sdg_number}</div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{item.name_th || "-"}</div>
              <div className="text-xs text-gray-500">{item.name_en || "ไม่มีชื่อภาษาอังกฤษ"}</div>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">SDG {item.sdg_number}</span>
            <button type="button" onClick={() => handleOpenEdit(item)} className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-800"><Pencil size={14} />แก้ไข</button>
          </div>
        </div>
      ))}
    </div>;
  };

  return <>
    <SettingsSectionCard
      icon={Globe2}
      iconBgClass="bg-purple-100"
      iconColorClass="text-purple-600"
      title="เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)"
      description="สร้างและแก้ไขข้อมูล SDGs"
      actions={<div className="flex items-center gap-3">
        <button type="button" onClick={loadSDGs} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"><RefreshCcw size={16} />รีเฟรช</button>
        <button type="button" onClick={handleOpenCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"><PlusCircle size={16} />เพิ่ม SDG</button>
      </div>}
      contentClassName="space-y-4"
    >
      {renderList()}
    </SettingsSectionCard>

    <SettingsModal
      open={showModal}
      onClose={handleCloseModal}
      title={editingItem ? "แก้ไข SDG" : "เพิ่ม SDG"}
      description="แก้ไขข้อมูลภาษาไทย ภาษาอังกฤษ และคำอธิบายของ SDGs"
      footer={<>
        <button type="button" onClick={handleCloseModal} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-60">ยกเลิก</button>
        <button form="sdg-form" type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
          {saving ? <RefreshCcw size={16} className="animate-spin" /> : <PlusCircle size={16} />}
          {saving ? "กำลังบันทึก..." : editingItem ? "อัปเดตข้อมูล" : "บันทึกข้อมูล"}
        </button>
      </>}
    >
      <form id="sdg-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">เลข SDG <span className="text-red-500">*</span></label>
          <input type="number" name="sdg_number" min="1" max="17" value={form.sdg_number} onChange={handleFormChange} disabled={Boolean(editingItem)} required className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อภาษาไทย <span className="text-red-500">*</span></label>
          <input type="text" name="name_th" value={form.name_th} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" placeholder="ระบุชื่อภาษาไทย" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อภาษาอังกฤษ <span className="text-red-500">*</span></label>
          <input type="text" name="name_en" value={form.name_en} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" placeholder="ระบุชื่อภาษาอังกฤษ" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">คำอธิบายภาษาไทย</label>
          <textarea name="description_th" value={form.description_th} onChange={handleFormChange} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" placeholder="ระบุคำอธิบายภาษาไทย" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">คำอธิบายภาษาอังกฤษ</label>
          <textarea name="description_en" value={form.description_en} onChange={handleFormChange} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" placeholder="ระบุคำอธิบายภาษาอังกฤษ" />
        </div>
      </form>
    </SettingsModal>
  </>;
}
