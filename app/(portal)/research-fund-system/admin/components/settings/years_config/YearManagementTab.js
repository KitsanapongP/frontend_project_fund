// components/YearManagementTab.js
import React, { useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Save,
  Calendar,
  PlusCircle,
  Star,
  Clock4
} from "lucide-react";
import Swal from "sweetalert2";
import StatusBadge from "@/app/(portal)/research-fund-system/admin/components/settings/StatusBadge";
import SettingsSectionCard from "@/app/(portal)/research-fund-system/admin/components/settings/common/SettingsSectionCard";
import SettingsModal from "@/app/(portal)/research-fund-system/admin/components/settings/common/SettingsModal";

const YearManagementTab = ({
  years = [],
  selectedYear,
  systemCurrentYear,
  onSelectYear,
  onSaveYear /*, onDeleteYear */
}) => {
  // ====== Editing + Form state (keep original names) ======
  const [editingYear, setEditingYear] = useState(null);
  const [yearForm, setYearForm] = useState({
    year: "",
    status: "active",
  });

  // ====== Modal visibility (derive from editing) ======
  const [showForm, setShowForm] = useState(false);

  const sortedYears = useMemo(() => {
    const list = Array.isArray(years) ? [...years] : [];
    return list.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  }, [years]);

  const isSelectedYear = (year) => {
    if (!selectedYear || !year) return false;
    if (selectedYear.year_id !== undefined && year.year_id !== undefined) {
      return `${selectedYear.year_id}` === `${year.year_id}`;
    }
    if (selectedYear.year !== undefined && year.year !== undefined) {
      return `${selectedYear.year}` === `${year.year}`;
    }
    return false;
  };

  const isSystemCurrentYear = (year) => {
    if (!systemCurrentYear || !year) return false;
    const target = String(systemCurrentYear);
    if (year.year_id !== undefined && `${year.year_id}` === target) return true;
    if (year.year !== undefined && `${year.year}` === target) return true;
    return false;
  };

  // ====== Handlers (keep behavior semantics) ======
  const handleAddNew = () => {
    setEditingYear(null);
    setYearForm({ year: "", status: "active" });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingYear(item);
    setYearForm({
      year: item.year ?? "",
      status: item.status ?? "active",
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingYear(null);
    setYearForm({ year: "", status: "active" });
    setShowForm(false);
  };

  const handleSave = () => {
    // Validate minimal fields
    if (!yearForm.year || !/^\d{4}$/.test(String(yearForm.year))) {
      Swal.fire("ข้อมูลไม่ครบ", "กรุณาระบุปีงบประมาณเป็นตัวเลข 4 หลัก (พ.ศ.)", "warning");
      return;
    }
    const yearData = { ...yearForm };
    onSaveYear(yearData, editingYear);
    setEditingYear(null);
    setYearForm({ year: "", status: "active" });
    setShowForm(false);
    Swal.fire("สำเร็จ", "บันทึกปีงบประมาณเรียบร้อย", "success");
  };

  /*
  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `ต้องการลบปีงบประมาณ พ.ศ. ${item?.year || ""} หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await onDeleteYear(item);
    } catch (error) {
      if (error?.handled) {
        return;
      }
      console.error("Failed to delete year:", error);
      const message = error?.message || "เกิดข้อผิดพลาดในการลบปีงบประมาณ";
      Swal.fire("เกิดข้อผิดพลาด", message, "error");
    }
  };
  */

  // ====== UI ======
  return (
    <>
      <SettingsSectionCard
        icon={Calendar}
        iconBgClass="bg-blue-50"
        iconColorClass="text-blue-600"
        title="จัดการปีงบประมาณ"
        description="เลือกปีที่ต้องการทำงานและจัดการสถานะให้สอดคล้องกับการตั้งค่าทุนด้านล่าง"
        actions={
          <button
            onClick={handleAddNew}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PlusCircle size={16} />
            เพิ่มปีงบประมาณ
          </button>
        }
        contentClassName="space-y-4"
      >
        {sortedYears.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedYears.map((item) => {
              const isSelected = isSelectedYear(item);
              const isCurrent = isSystemCurrentYear(item);

              return (
                <article
                  key={item.year_id || item.year}
                  className={`rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectYear?.(item)}
                      aria-pressed={isSelected}
                      className="min-w-0 flex-1 space-y-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <div className={`flex items-center gap-2 text-xs font-medium ${isSelected ? "text-blue-700" : "text-slate-500"}`}>
                        <Calendar size={14} />
                        ปีงบประมาณ
                      </div>
                      <div className={`flex flex-wrap items-center gap-2 text-2xl font-semibold ${isSelected ? "text-blue-950" : "text-slate-900"}`}>
                        พ.ศ. {item.year}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            <Star size={12} /> ปีงบประมาณปัจจุบัน
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${isSelected ? "text-blue-800" : "text-slate-600"}`}>
                        <Clock4 size={14} />
                        {item.update_at ? (
                          <>อัปเดตล่าสุด {new Date(item.update_at).toLocaleDateString("th-TH")}</>
                        ) : (
                          "สร้างใหม่"
                        )}
                      </div>
                    </button>
                    <StatusBadge
                      status={item.status}
                      interactive
                      confirm
                      onChange={async (next) => {
                        await onSaveYear({ ...item, status: next ? "active" : "inactive" }, item);
                        Swal.fire("สำเร็จ", "เปลี่ยนสถานะเรียบร้อย", "success");
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit size={14} /> แก้ไขปีงบประมาณ
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
              <Plus size={20} />
            </div>
            <p className="mb-2 text-base font-semibold text-slate-900">ยังไม่มีปีงบประมาณ</p>
            <p className="mb-4 text-sm text-slate-600">เริ่มต้นโดยการเพิ่มปีงบประมาณใหม่ เพื่อใช้กับการตั้งค่าทุน</p>
            <button
              onClick={handleAddNew}
              className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              เพิ่มปีงบประมาณแรก
            </button>
          </div>
        )}
      </SettingsSectionCard>

      <SettingsModal
        open={showForm}
        onClose={handleCancelEdit}
        size="md"
        bodyClassName="max-h-[70vh] overflow-y-auto px-6 py-6"
        headerContent={
          <div className="flex items-center gap-3 text-slate-700">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
              <Calendar size={18} />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {editingYear ? "แก้ไขปีงบประมาณ" : "เพิ่มปีงบประมาณ"}
              </p>
              <p className="text-sm text-slate-500">กำหนดปีงบประมาณ และสถานะการใช้งาน</p>
            </div>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">ปีงบประมาณ (พ.ศ.)</label>
            <input
              aria-label="ปีงบประมาณ พ.ศ."
              type="number"
              placeholder="เช่น 2568"
              value={yearForm.year}
              onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">สถานะ</label>
            <select
              value={yearForm.status}
              onChange={(e) => setYearForm({ ...yearForm, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Save size={16} />
              บันทึก
            </button>
          </div>
        </form>
      </SettingsModal>
    </>
  );
};

export default YearManagementTab;
