// app/admin/components/settings/SubcategoryModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";

export default function SubcategoryModal({ isOpen, onClose, onSave, subcategory, category }) {
  console.log('SubcategoryModal rendered - isOpen:', isOpen);
  
  const [formData, setFormData] = useState({
    subcategory_name: "",
    fund_condition: "",
    target_roles: [],
    comment: "",
    status: "active"
  });

  const [errors, setErrors] = useState({});

  const availableRoles = [
    { id: "1", name: "อาจารย์", icon: "👨‍🏫" },
    { id: "2", name: "เจ้าหน้าที่", icon: "👷" }
  ];

  useEffect(() => {
    console.log('SubcategoryModal - subcategory changed:', subcategory);
    if (subcategory) {
      // Parse target_roles if it's a string
      let targetRoles = [];
      if (subcategory.target_roles) {
        try {
          targetRoles = typeof subcategory.target_roles === 'string' 
            ? JSON.parse(subcategory.target_roles) 
            : subcategory.target_roles;
        } catch (error) {
          console.error('Error parsing target_roles:', error);
          targetRoles = [];
        }
      }

      setFormData({
        subcategory_name: subcategory.subcategory_name || "",
        fund_condition: subcategory.fund_condition || "",
        target_roles: Array.isArray(targetRoles) ? targetRoles : [],
        comment: subcategory.comment || "",
        status: subcategory.status || "active"
      });
    } else {
      setFormData({
        subcategory_name: "",
        fund_condition: "",
        target_roles: [],
        comment: "",
        status: "active"
      });
    }
    setErrors({});
  }, [subcategory, isOpen]);

  const handleRoleToggle = (roleId) => {
    const newRoles = formData.target_roles.includes(roleId)
      ? formData.target_roles.filter(r => r !== roleId)
      : [...formData.target_roles, roleId];
    
    setFormData({ ...formData, target_roles: newRoles });
    setErrors({ ...errors, target_roles: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.subcategory_name.trim()) {
      newErrors.subcategory_name = "กรุณากรอกชื่อทุน";
    }
    if (!formData.fund_condition.trim()) {
      newErrors.fund_condition = "กรุณากรอกเงื่อนไขการรับทุน";
    }
    if (formData.target_roles.length === 0) {
      newErrors.target_roles = "กรุณาเลือกกลุ่มเป้าหมายอย่างน้อย 1 กลุ่ม";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  if (!isOpen) {
    console.log('SubcategoryModal not rendering - isOpen is false');
    return null;
  }

  console.log('SubcategoryModal rendering modal content');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold">
              {subcategory ? 'แก้ไขทุนย่อย' : 'เพิ่มทุนย่อยใหม่'}
            </h3>
            {category && (
              <p className="text-sm text-gray-600 mt-1">
                หมวดหมู่: {category.category_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Subcategory Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อทุน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subcategory_name}
                onChange={(e) => {
                  setFormData({ ...formData, subcategory_name: e.target.value });
                  setErrors({ ...errors, subcategory_name: "" });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.subcategory_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="เช่น ทุนสนับสนุนผู้เชี่ยวชาญต่างประเทศ"
              />
              {errors.subcategory_name && (
                <p className="text-sm text-red-500 mt-1">{errors.subcategory_name}</p>
              )}
            </div>

            {/* Fund Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เงื่อนไขการรับทุน <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.fund_condition}
                onChange={(e) => {
                  setFormData({ ...formData, fund_condition: e.target.value });
                  setErrors({ ...errors, fund_condition: "" });
                }}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.fund_condition ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ระบุเงื่อนไขและข้อกำหนดในการขอรับทุน"
              />
              {errors.fund_condition && (
                <p className="text-sm text-red-500 mt-1">{errors.fund_condition}</p>
              )}
            </div>

            {/* Target Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กลุ่มเป้าหมาย <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {availableRoles.map(role => (
                  <label
                    key={role.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.target_roles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-lg">{role.icon}</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">{role.name}</span>
                  </label>
                ))}
              </div>
              {errors.target_roles && (
                <p className="text-sm text-red-500 mt-1">{errors.target_roles}</p>
              )}
              <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  เลือกกลุ่มเป้าหมายที่สามารถเข้าถึงและยื่นขอทุนนี้ได้
                </p>
              </div>
            </div>

            {/* Status (only for edit) */}
            {subcategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">เปิดใช้งาน</option>
                  <option value="disable">ปิดใช้งาน</option>
                </select>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {subcategory ? 'บันทึกการแก้ไข' : 'เพิ่มทุนย่อย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}