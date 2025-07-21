// app/admin/components/settings/BudgetModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, DollarSign, AlertCircle } from "lucide-react";
import { adminAPI } from "../../../lib/admin_api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function BudgetModal({ 
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
  
  // Form state
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
      // สมมุติว่า budgets มาจาก subcategory หรือ API call
      setBudgets(subcategory.budgets || []);
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
      allocated_amount: budget.allocated_amount ? budget.allocated_amount.toString() : "",
      max_grants: budget.max_grants ? budget.max_grants.toString() : "",
      max_amount_per_grant: budget.max_amount_per_grant ? budget.max_amount_per_grant.toString() : "",
      level: budget.level || "",
      fund_description: budget.fund_description || "",
      comment: budget.comment || ""
    });
    setErrors({});
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.allocated_amount) {
      newErrors.allocated_amount = "กรุณากรอกงบประมาณที่จัดสรร";
    }
    if (!formData.max_amount_per_grant) {
      newErrors.max_amount_per_grant = "กรุณากรอกขอได้สูงสุดต่อครั้ง";
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
        max_amount_per_grant: parseFloat(formData.max_amount_per_grant),
        level: formData.level || null,
        fund_description: formData.fund_description || null,
        comment: formData.comment || null,
        status: 'active'
      };

      if (editingBudget) {
        await adminAPI.updateSubcategoryBudget(editingBudget.subcategory_budget_id, submitData);
      } else {
        await adminAPI.createSubcategoryBudget(submitData);
      }

      setShowAddForm(false);
      setEditingBudget(null);
      await loadBudgets();
      if (onBudgetUpdate) onBudgetUpdate();
      alert("บันทึกงบประมาณเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (confirm("คุณต้องการลบงบประมาณนี้หรือไม่?")) {
      try {
        await adminAPI.deleteSubcategoryBudget(budgetId);
        await loadBudgets();
        if (onBudgetUpdate) onBudgetUpdate();
        alert("ลบงบประมาณเรียบร้อยแล้ว");
      } catch (error) {
        console.error("Error deleting budget:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
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
              {category?.category_name} - {subcategory?.subcategory_name}
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
                        งบประมาณที่จัดสรร <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.allocated_amount}
                        onChange={(e) => {
                          setFormData({ ...formData, allocated_amount: e.target.value });
                          setErrors({ ...errors, allocated_amount: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.allocated_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      {errors.allocated_amount && (
                        <p className="text-sm text-red-500 mt-1">{errors.allocated_amount}</p>
                      )}
                    </div>

                    {/* Max Amount Per Grant */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ขอได้สูงสุดต่อครั้ง <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.max_amount_per_grant}
                        onChange={(e) => {
                          setFormData({ ...formData, max_amount_per_grant: e.target.value });
                          setErrors({ ...errors, max_amount_per_grant: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.max_amount_per_grant ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      {errors.max_amount_per_grant && (
                        <p className="text-sm text-red-500 mt-1">{errors.max_amount_per_grant}</p>
                      )}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ไม่จำกัด"
                      />
                    </div>

                    {/* Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ระดับทุน
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {levels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fund Description */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รายละเอียดทุน
                    </label>
                    <input
                      type="text"
                      value={formData.fund_description}
                      onChange={(e) => setFormData({ ...formData, fund_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="เช่น Q1, Q2, ระดับต้น"
                    />
                  </div>

                  {/* Comment */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุ
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="หมายเหตุเพิ่มเติม"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingBudget(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingBudget ? 'บันทึกการแก้ไข' : 'เพิ่มงบประมาณ'}
                    </button>
                  </div>
                </form>
              )}

              {/* Budget List */}
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto mb-2" size={48} />
                    <p>ยังไม่มีงบประมาณ</p>
                  </div>
                ) : (
                  budgets.map((budget, index) => (
                    <div key={budget.subcategory_budget_id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-2">
                            งบประมาณ #{index + 1}
                            {budget.level && ` (ระดับ${budget.level})`}
                            {budget.fund_description && ` - ${budget.fund_description}`}
                          </h5>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">งบประมาณ:</span>
                              <div className="font-medium">{formatCurrency(budget.allocated_amount)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">ขอได้สูงสุด:</span>
                              <div className="font-medium">{formatCurrency(budget.max_amount_per_grant)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">จำนวนทุน:</span>
                              <div className="font-medium">
                                {budget.max_grants ? `${budget.max_grants} ทุน` : 'ไม่จำกัด'}
                              </div>
                            </div>
                          </div>

                          {budget.comment && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">หมายเหตุ:</span> {budget.comment}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.subcategory_budget_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}