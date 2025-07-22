// modals/SubcategoryModal.js
import React, { useState, useEffect } from "react";

const SubcategoryModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingSubcategory,
  selectedCategory 
}) => {
  const [subcategoryForm, setSubcategoryForm] = useState({
    subcategory_name: "",
    fund_condition: "",
    target_roles: [],
    status: "active"
  });

  useEffect(() => {
    if (editingSubcategory) {
      setSubcategoryForm({
        subcategory_name: editingSubcategory.subcategory_name || "",
        fund_condition: editingSubcategory.fund_condition || "",
        target_roles: editingSubcategory.target_roles || [],
        status: editingSubcategory.status || "active"
      });
    } else {
      setSubcategoryForm({
        subcategory_name: "",
        fund_condition: "",
        target_roles: [],
        status: "active"
      });
    }
  }, [editingSubcategory]);

  const handleTargetRoleChange = (roleId, checked) => {
    if (checked) {
      setSubcategoryForm({ 
        ...subcategoryForm, 
        target_roles: [...subcategoryForm.target_roles, roleId] 
      });
    } else {
      setSubcategoryForm({ 
        ...subcategoryForm, 
        target_roles: subcategoryForm.target_roles.filter(r => r !== roleId) 
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(subcategoryForm);
    setSubcategoryForm({
      subcategory_name: "",
      fund_condition: "",
      target_roles: [],
      status: "active"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {editingSubcategory ? 'แก้ไขทุนย่อย' : 'เพิ่มทุนย่อยใหม่'}
        </h3>
        
        {selectedCategory && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              หมวดหมู่: <span className="font-semibold">{selectedCategory.category_name}</span>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">ชื่อทุนย่อย</label>
              <input
                type="text"
                required
                value={subcategoryForm.subcategory_name}
                onChange={(e) => setSubcategoryForm({ 
                  ...subcategoryForm, 
                  subcategory_name: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="ระบุชื่อทุนย่อย"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">เงื่อนไขการรับทุน</label>
              <textarea
                value={subcategoryForm.fund_condition}
                onChange={(e) => setSubcategoryForm({ 
                  ...subcategoryForm, 
                  fund_condition: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={4}
                placeholder="ระบุเงื่อนไขการรับทุน"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">กลุ่มเป้าหมาย</label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subcategoryForm.target_roles.includes("1")}
                    onChange={(e) => handleTargetRoleChange("1", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm font-medium">อาจารย์</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subcategoryForm.target_roles.includes("2")}
                    onChange={(e) => handleTargetRoleChange("2", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm font-medium">เจ้าหน้าที่</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">สถานะ</label>
              <select
                value={subcategoryForm.status}
                onChange={(e) => setSubcategoryForm({ 
                  ...subcategoryForm, 
                  status: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="active">ใช้งาน</option>
                <option value="disable">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcategoryModal;