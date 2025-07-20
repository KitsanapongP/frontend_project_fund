// app/admin/components/settings/BulkRoleModal.js
"use client";

import { useState } from "react";
import { X, Users, AlertCircle } from "lucide-react";

export default function BulkRoleModal({ isOpen, onClose, onSave, selectedItems }) {
  const [targetRoles, setTargetRoles] = useState([]);
  const [error, setError] = useState("");

  const availableRoles = [
    { id: "1", name: "อาจารย์", icon: "👨‍🏫" },
    { id: "2", name: "เจ้าหน้าที่", icon: "👷" }
  ];

  const handleRoleToggle = (roleId) => {
    const newRoles = targetRoles.includes(roleId)
      ? targetRoles.filter(r => r !== roleId)
      : [...targetRoles, roleId];
    
    setTargetRoles(newRoles);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (targetRoles.length === 0) {
      setError("กรุณาเลือกกลุ่มเป้าหมายอย่างน้อย 1 กลุ่ม");
      return;
    }

    onSave(targetRoles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold">แก้ไขกลุ่มเป้าหมาย</h3>
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
          <div className="p-6 space-y-4">
            {/* Selected Items Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">
                  กำลังแก้ไขกลุ่มเป้าหมายของ {selectedItems.length} ทุน
                </p>
                <p className="mt-1">
                  การเปลี่ยนแปลงจะมีผลกับทุกทุนที่เลือกไว้
                </p>
              </div>
            </div>

            {/* Selected Funds List */}
            <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">รายการทุนที่เลือก:</p>
              <ul className="space-y-1">
                {selectedItems.map(item => (
                  <li key={item.subcategory_id} className="text-sm text-gray-600">
                    • {item.subcategory_name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Roles Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกกลุ่มเป้าหมายใหม่ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {availableRoles.map(role => (
                  <label
                    key={role.id}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                      targetRoles.includes(role.id)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={targetRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="sr-only"
                    />
                    <span className="text-lg">{role.icon}</span>
                    <span className="font-medium">{role.name}</span>
                  </label>
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
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
              อัพเดทกลุ่มเป้าหมาย
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}