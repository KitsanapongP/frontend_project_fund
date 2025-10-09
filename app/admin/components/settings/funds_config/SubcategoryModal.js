import React, { useEffect, useMemo, useRef, useState } from "react";
import { DollarSign, AlertCircle, ShieldCheck } from "lucide-react";

const SubcategoryModal = ({
  isOpen,
  onClose,
  onSave,
  editingSubcategory,
  selectedCategory,
}) => {
  const [subcategoryForm, setSubcategoryForm] = useState({
    subcategory_name: "",
    fund_condition: "",
    target_roles: [],
    status: "active",
  });

  const [overallPolicyForm, setOverallPolicyForm] = useState({
    subcategory_budget_id: null,
    allocated_amount: "",
    max_amount_per_year: "",
    max_amount_per_grant: "",
    max_grants: "",
    fund_description: "",
    comment: "",
    status: "active",
    remaining_budget: "",
  });

  const [overallPolicyEnabled, setOverallPolicyEnabled] = useState(false);

  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);

  const roleOptions = useMemo(
    () => [
      { value: "1", label: "อาจารย์" },
      { value: "2", label: "เจ้าหน้าที่" },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingSubcategory) {
      setSubcategoryForm({
        subcategory_name: editingSubcategory.subcategory_name || "",
        fund_condition: editingSubcategory.fund_condition || "",
        target_roles: Array.isArray(editingSubcategory.target_roles)
          ? editingSubcategory.target_roles.map((role) => role?.toString?.() ?? "")
          : [],
        status: editingSubcategory.status || "active",
      });

      const existingOverall = editingSubcategory.budgets?.find(
        (budget) => String(budget.record_scope || "").toLowerCase() === "overall"
      );

      if (existingOverall) {
        setOverallPolicyForm({
          subcategory_budget_id: existingOverall.subcategory_budget_id ?? null,
          allocated_amount: existingOverall.allocated_amount?.toString() || "",
          max_amount_per_year: existingOverall.max_amount_per_year?.toString() || "",
          max_amount_per_grant:
            existingOverall.max_amount_per_grant?.toString() || "",
          max_grants: existingOverall.max_grants?.toString() || "",
          fund_description: existingOverall.fund_description || "",
          comment: existingOverall.comment || "",
          status: existingOverall.status || "active",
          remaining_budget: existingOverall.remaining_budget?.toString() || "",
        });
        setOverallPolicyEnabled(true);
      } else {
        setOverallPolicyForm({
          subcategory_budget_id: null,
          allocated_amount: "",
          max_amount_per_year: "",
          max_amount_per_grant: "",
          max_grants: "",
          fund_description: "",
          comment: "",
          status: "active",
          remaining_budget: "",
        });
        setOverallPolicyEnabled(false);
      }
    } else {
      setSubcategoryForm({
        subcategory_name: "",
        fund_condition: "",
        target_roles: [],
        status: "active",
      });
      setOverallPolicyForm({
        subcategory_budget_id: null,
        allocated_amount: "",
        max_amount_per_year: "",
        max_amount_per_grant: "",
        max_grants: "",
        fund_description: "",
        comment: "",
        status: "active",
        remaining_budget: "",
      });
      setOverallPolicyEnabled(false);
    }
  }, [editingSubcategory, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      firstFieldRef.current?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleTargetRoleChange = (roleId, checked) => {
    setSubcategoryForm((prev) => {
      const current = Array.isArray(prev.target_roles) ? prev.target_roles : [];
      if (checked) {
        if (current.includes(roleId)) {
          return prev;
        }
        return {
          ...prev,
          target_roles: [...current, roleId],
        };
      }
      return {
        ...prev,
        target_roles: current.filter((role) => role !== roleId),
      };
    });
  };

  const handleOverallPolicyChange = (field, value) => {
    setOverallPolicyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const sanitizedName = subcategoryForm.subcategory_name.trim();
    if (!sanitizedName) {
      setSubcategoryForm((prev) => ({
        ...prev,
        subcategory_name: "",
      }));
      return;
    }

    const { remaining_budget, ...policyToSave } = overallPolicyForm;

    onSave({
      subcategory: {
        ...subcategoryForm,
        subcategory_name: sanitizedName,
      },
      overallPolicy: overallPolicyEnabled ? policyToSave : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={editingSubcategory ? "แก้ไขทุนย่อย" : "เพิ่มทุนย่อยใหม่"}
        tabIndex={-1}
        className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex flex-col gap-2 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingSubcategory ? "แก้ไขทุนย่อย" : "เพิ่มทุนย่อยใหม่"}
          </h3>
          <p className="text-sm text-gray-500">
            จัดการข้อมูลทุนย่อยและนโยบายภาพรวมให้ตรงกับหน้าแสดงผลหลักของระบบผู้ดูแล
          </p>
        </div>

        {selectedCategory && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              หมวดหมู่: <span className="font-semibold">{selectedCategory.category_name}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck size={18} className="text-blue-600" />
              <h4 className="text-base font-semibold">ข้อมูลทุนย่อย</h4>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">ชื่อทุนย่อย</label>
                <input
                  type="text"
                  required
                  value={subcategoryForm.subcategory_name}
                  onChange={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      subcategory_name: e.target.value,
                    }))
                  }
                  onBlur={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      subcategory_name: e.target.value.trim(),
                    }))
                  }
                  ref={firstFieldRef}
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="ระบุชื่อทุนย่อย"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">เงื่อนไขทุน (แสดงในหน้าแรก)</label>
                <textarea
                  value={subcategoryForm.fund_condition}
                  onChange={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      fund_condition: e.target.value,
                    }))
                  }
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder="ระบุเงื่อนไขของทุน (ถ้ามี)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">บทบาทที่เห็นทุนนี้</label>
                <div className="space-y-2">
                  {roleOptions.map((role) => {
                    const checked = subcategoryForm.target_roles.includes(role.value);
                    return (
                      <label key={role.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleTargetRoleChange(role.value, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">สถานะทุนย่อย</label>
                <select
                  value={subcategoryForm.status}
                  onChange={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="active">เปิดใช้งาน</option>
                  <option value="disable">ปิดใช้งาน</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign size={18} className="text-emerald-600" />
                <h4 className="text-base font-semibold">นโยบายภาพรวม</h4>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overallPolicyEnabled}
                  onChange={(e) => setOverallPolicyEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>{overallPolicyEnabled ? "กำลังตั้งค่านโยบายภาพรวม" : "ยังไม่ตั้งค่านโยบายภาพรวม"}</span>
              </label>
            </div>

            {overallPolicyEnabled ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">งบประมาณที่จัดสรร (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={overallPolicyForm.allocated_amount}
                      onChange={(e) => handleOverallPolicyChange("allocated_amount", e.target.value)}
                      className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">วงเงินรวมต่อปี (บาท)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={overallPolicyForm.max_amount_per_year}
                      onChange={(e) => handleOverallPolicyChange("max_amount_per_year", e.target.value)}
                      className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0 (ไม่จำกัด)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">จำนวนครั้งรวมต่อปี</label>
                    <input
                      type="number"
                      min="0"
                      value={overallPolicyForm.max_grants}
                      onChange={(e) => handleOverallPolicyChange("max_grants", e.target.value)}
                      className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0 (ไม่จำกัด)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">วงเงินต่อครั้ง (ค่าเริ่มต้น)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={overallPolicyForm.max_amount_per_grant}
                      onChange={(e) => handleOverallPolicyChange("max_amount_per_grant", e.target.value)}
                      className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0 (ไม่กำหนด)"
                    />
                  </div>
                  {overallPolicyForm.remaining_budget && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">งบประมาณคงเหลือ (บาท)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={overallPolicyForm.remaining_budget}
                          readOnly
                          className="w-full text-gray-700 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                          placeholder="คำนวณอัตโนมัติ"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <AlertCircle size={16} className="text-gray-400" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        * คำนวณจากการเบิกจ่ายจริงของระบบ
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">คำอธิบายนโยบาย</label>
                  <textarea
                    value={overallPolicyForm.fund_description}
                    onChange={(e) => handleOverallPolicyChange("fund_description", e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    placeholder="สรุปเงื่อนไขหรือรายละเอียดของนโยบายภาพรวม"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">หมายเหตุ (ภายใน)</label>
                  <textarea
                    value={overallPolicyForm.comment}
                    onChange={(e) => handleOverallPolicyChange("comment", e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={2}
                    placeholder="สำหรับบันทึกเพิ่มเติมของผู้ดูแล"
                  />
                </div>

                <div className="sm:w-60">
                  <label className="block text-sm font-medium mb-2 text-gray-700">สถานะนโยบายภาพรวม</label>
                  <select
                    value={overallPolicyForm.status}
                    onChange={(e) => handleOverallPolicyChange("status", e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="active">เปิดใช้งาน</option>
                    <option value="disable">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 bg-gray-50">
                ยังไม่กำหนดนโยบายภาพรวม ระบบจะแสดงผลเฉพาะข้อมูลทุนย่อย โดยสามารถเปิดใช้งานภายหลังได้
              </div>
            )}
          </section>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcategoryModal;