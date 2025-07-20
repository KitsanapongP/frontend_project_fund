// app/admin/components/settings/CategoryModal.js
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CategoryModal({ isOpen, onClose, onSave, category }) {
  const [formData, setFormData] = useState({
    category_name: "",
    comment: "",
    status: "active"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category) {
      setFormData({
        category_name: category.category_name || "",
        comment: category.comment || "",
        status: category.status || "active"
      });
    } else {
      setFormData({
        category_name: "",
        comment: "",
        status: "active"
      });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.category_name.trim()) {
      newErrors.category_name = "กรุณากรอกชื่อหมวดหมู่";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">
            {category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อหมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => {
                  setFormData({ ...formData, category_name: e.target.value });
                  setErrors({ ...errors, category_name: "" });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="เช่น ทุนส่งเสริมการวิจัย"
              />
              {errors.category_name && (
                <p className="text-sm text-red-500 mt-1">{errors.category_name}</p>
              )}
            </div>

            {/* Status (only for edit) */}
            {category && (
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
              {category ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}