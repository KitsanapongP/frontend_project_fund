// app/admin/components/settings/BudgetManagementModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, DollarSign, AlertCircle, Hash, Coins } from "lucide-react";
import { adminAPI } from "../../../lib/admin_api";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function BudgetManagementModal({ 
  isOpen, 
  onClose, 
  subcategory, 
  category,
  onBudgetUpdate 
}) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state - ตาม API structure
  const [formData, setFormData] = useState({
    allocated_amount: "",
    max_grants: "",
    max_amount_per_grant: "",
    level: "",
    fund_description: "",
    comment: ""
  });
  
  const [errors, setErrors] = useState({});

  const levels = [
    { value: "", label: "-- ไม่ระบุระดับ --" },
    { value: "ต้น", label: "ระดับต้น" },
    { value: "กลาง", label: "ระดับกลาง" },
    { value: "สูง", label: "ระดับสูง" }
  ];

  useEffect(() => {
    if (isOpen && subcategory) {
      loadBudgets();
    }
  }, [isOpen, subcategory]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      
      // Load budgets for this subcategory
      const budgetsResponse = await adminAPI.getSubcategoryBudgets({
        subcategory_id: subcategory.subcategory_id
      });
      setBudgets(budgetsResponse.budgets || []);
    } catch (error) {
      console.error("Error loading budgets:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setFormData({
      allocated_amount: "",
      max_grants: "",
      max_amount_per_grant: "",
      level: "",
      fund_description: "",
      comment: ""
    });
    setErrors({});
    setShowAddForm(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setFormData({
      allocated_amount: budget.allocated_amount.toString(),
      max_grants: budget.max_grants ? budget.max_grants.toString() : "",
      max_amount_per_grant: budget.max_amount_per_grant ? budget.max_amount_per_grant.toString() : "",
      level: budget.level || "",
      fund_description: budget.fund_description || "",
      comment: budget.comment || ""
    });
    setErrors({});
    setShowAddForm(true);
  };

  const handleDeleteBudget = async (budget) => {
    if (budget.used_amount > 0) {
      alert(`ไม่สามารถลบงบประมาณที่มีการใช้งานแล้วได้\n(ใช้ไปแล้ว: ${formatCurrency(budget.used_amount)})`);
      return;
    }

    if (!confirm(`ต้องการลบงบประมาณนี้ใช่หรือไม่?`)) {
      return;
    }

    try {
      await adminAPI.deleteSubcategoryBudget(budget.subcategory_budget_id);
      await loadBudgets();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("เกิดข้อผิดพลาดในการลบงบประมาณ");
    }
  };

  const handleToggleStatus = async (budget) => {
    try {
      await adminAPI.toggleSubcategoryBudgetStatus(budget.subcategory_budget_id);
      await loadBudgets();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.allocated_amount || parseFloat(formData.allocated_amount) <= 0) {
      newErrors.allocated_amount = "กรุณากรอกจำนวนงบประมาณที่ถูกต้อง";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const submitData = {
        subcategory_id: subcategory.subcategory_id,
        allocated_amount: parseFloat(formData.allocated_amount),
        max_grants: formData.max_grants ? parseInt(formData.max_grants) : null,
        max_amount_per_grant: formData.max_amount_per_grant ? parseFloat(formData.max_amount_per_grant) : null,
        level: formData.level || null,
        fund_description: formData.fund_description || null,
        comment: formData.comment || null
      };

      if (editingBudget) {
        // Update only includes fields that can be changed
        const updateData = {
          allocated_amount: submitData.allocated_amount,
          max_grants: submitData.max_grants,
          max_amount_per_grant: submitData.max_amount_per_grant,
          level: submitData.level,
          status: editingBudget.status,
          fund_description: submitData.fund_description,
          comment: submitData.comment
        };
        await adminAPI.updateSubcategoryBudget(editingBudget.subcategory_budget_id, updateData);
      } else {
        await adminAPI.createSubcategoryBudget(submitData);
      }

      setShowAddForm(false);
      await loadBudgets();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="text-green-600" />
              จัดการงบประมาณ
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {category.category_name} - {subcategory.subcategory_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Add Budget Button */}
              {!showAddForm && (
                <button
                  onClick={handleAddBudget}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>เพิ่มงบประมาณ</span>
                </button>
              )}

              {/* Budget Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-4">
                    {editingBudget ? 'แก้ไขงบประมาณ' : 'เพิ่มงบประมาณใหม่'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Allocated Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนเงินที่จัดสรร <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.allocated_amount}
                        onChange={(e) => {
                          setFormData({ ...formData, allocated_amount: e.target.value });
                          setErrors({ ...errors, allocated_amount: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.allocated_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {errors.allocated_amount && (
                        <p className="text-sm text-red-500 mt-1">{errors.allocated_amount}</p>
                      )}
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ระดับทุน
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {levels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Max Grants */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนทุนสูงสุด
                      </label>
                      <input
                        type="number"
                        value={formData.max_grants}
                        onChange={(e) => setFormData({ ...formData, max_grants: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        placeholder="ไม่จำกัด"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        เว้นว่างหากไม่จำกัดจำนวน
                      </p>
                    </div>

                    {/* Max Amount Per Grant */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนเงินสูงสุดต่อทุน
                      </label>
                      <input
                        type="number"
                        value={formData.max_amount_per_grant}
                        onChange={(e) => setFormData({ ...formData, max_amount_per_grant: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        step="0.01"
                        placeholder="ไม่จำกัด"
                      />
                    </div>

                    {/* Fund Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        คำอธิบายทุน
                      </label>
                      <textarea
                        value={formData.fund_description}
                        onChange={(e) => setFormData({ ...formData, fund_description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับทุน"
                      />
                    </div>

                    {/* Comment */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุ
                      </label>
                      <input
                        type="text"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="หมายเหตุเพิ่มเติม"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingBudget ? 'บันทึก' : 'เพิ่ม'}
                    </button>
                  </div>
                </form>
              )}

              {/* Budgets List */}
              {budgets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="mx-auto mb-2" size={48} />
                  <p>ยังไม่มีงบประมาณสำหรับทุนนี้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {budgets.map(budget => (
                    <div key={budget.subcategory_budget_id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {budget.level && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                {budget.level}
                              </span>
                            )}
                            {budget.status === 'disable' && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">งบประมาณที่จัดสรร</p>
                              <p className="text-sm font-semibold">{formatCurrency(budget.allocated_amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ใช้ไปแล้ว</p>
                              <p className="text-sm font-semibold text-blue-600">
                                {formatCurrency(budget.used_amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">คงเหลือ</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(budget.remaining_budget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">สถานะ</p>
                              <p className="text-sm font-semibold">
                                {budget.remaining_budget > 0 ? 'มีงบคงเหลือ' : 'งบหมด'}
                              </p>
                            </div>
                          </div>

                          {/* Grant Limits */}
                          {(budget.max_grants || budget.max_amount_per_grant) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                              {budget.max_grants && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Hash size={14} />
                                  <span>จำนวนทุน: {budget.remaining_grant}/{budget.max_grants}</span>
                                </div>
                              )}
                              {budget.max_amount_per_grant && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Coins size={14} />
                                  <span>สูงสุดต่อทุน: {formatCurrency(budget.max_amount_per_grant)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min((budget.used_amount / budget.allocated_amount) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ใช้ไป {((budget.used_amount / budget.allocated_amount) * 100).toFixed(1)}%
                            </p>
                          </div>

                          {/* Description */}
                          {budget.fund_description && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                              {budget.fund_description}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleToggleStatus(budget)}
                            className={`p-1.5 rounded ${
                              budget.status === 'active'
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={budget.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            {budget.status === 'active' ? '✓' : '✗'}
                          </button>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                          {budget.used_amount === 0 && (
                            <button
                              onClick={() => handleDeleteBudget(budget)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                              title="ลบ"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}