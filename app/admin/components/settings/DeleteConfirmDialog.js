// app/admin/components/settings/DeleteConfirmDialog.js
"use client";

import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, target }) {
  if (!isOpen || !target) return null;

  const getWarningMessage = () => {
    if (target.type === 'category') {
      if (target.hasChildren) {
        return `ไม่สามารถลบหมวดหมู่ "${target.name}" ได้ เนื่องจากยังมีทุนย่อยอยู่ ${target.hasChildren} รายการ`;
      }
      return `คุณต้องการลบหมวดหมู่ "${target.name}" ใช่หรือไม่?`;
    } else {
      if (target.hasApplications) {
        return `ไม่สามารถลบทุน "${target.name}" ได้ เนื่องจากมีคำร้องขอทุนอยู่ ${target.hasApplications} รายการ`;
      }
      return `คุณต้องการลบทุน "${target.name}" ใช่หรือไม่?`;
    }
  };

  const canDelete = () => {
    if (target.type === 'category') {
      return !target.hasChildren;
    } else {
      return !target.hasApplications;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle 
              className={canDelete() ? "text-orange-500" : "text-red-500"} 
              size={24} 
            />
            <h3 className="text-xl font-semibold">
              {canDelete() ? 'ยืนยันการลบ' : 'ไม่สามารถลบได้'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700">
            {getWarningMessage()}
          </p>
          
          {canDelete() && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>คำเตือน:</strong> การลบนี้ไม่สามารถกู้คืนได้
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {canDelete() ? 'ยกเลิก' : 'ปิด'}
          </button>
          {canDelete() && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ลบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}