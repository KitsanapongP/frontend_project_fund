// app/admin/components/settings/BudgetManagementModal.js
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { adminAPI } from "../../../lib/admin_api";
import apiClient from "../../../lib/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

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
  
  // Form state
  const [formData, setFormData] = useState({
    budget_name: "",
    total_budget: "",
    allocated_budget: "0",
    year_id: "",
    comment: ""
  });
  
  const [errors, setErrors] = useState({});
  const [years, setYears] = useState([]);

  useEffect(() => {
    if (isOpen && subcategory) {
      loadData();
    }
  }, [isOpen, subcategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load years
      const yearsResponse = await apiClient.get('/years');
      setYears(yearsResponse.years || []);
      
      // Set current year as default
      const currentYear = yearsResponse.years?.find(y => y.is_current);
      if (currentYear) {
        setFormData(prev => ({ ...prev, year_id: currentYear.year_id }));
      }
      
      // Load budgets for this subcategory
      const budgetsResponse = await adminAPI.getSubcategoryBudgets({
        subcategory_id: subcategory.subcategory_id
      });
      setBudgets(budgetsResponse.budgets || []);
    } catch (error) {
      console.error("Error loading data:", error);
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
      budget_name: "",
      total_budget: "",
      allocated_budget: "0",
      year_id: years.find(y => y.is_current)?.year_id || "",
      comment: ""
    });
    setErrors({});
    setShowAddForm(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setFormData({
      budget_name: budget.budget_name,
      total_budget: budget.total_budget.toString(),
      allocated_budget: budget.allocated_budget.toString(),
      year_id: budget.year_id,
      comment: budget.comment || ""
    });
    setErrors({});
    setShowAddForm(true);
  };

  const handleDeleteBudget = async (budget) => {
    if (budget.allocated_budget > 0) {
      alert("ไม่สามารถลบงบประมาณที่มีการใช้งานแล้วได้");
      return;
    }

    if (!confirm(`ต้องการลบงบประมาณ "${budget.budget_name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await adminAPI.deleteSubcategoryBudget(budget.budget_id);
      await loadData();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("เกิดข้อผิดพลาดในการลบงบประมาณ");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.budget_name.trim()) {
      newErrors.budget_name = "กรุณากรอกชื่องบประมาณ";
    }
    if (!formData.total_budget || parseFloat(formData.total_budget) <= 0) {
      newErrors.total_budget = "กรุณากรอกจำนวนงบประมาณที่ถูกต้อง";
    }
    if (!formData.year_id) {
      newErrors.year_id = "กรุณาเลือกปีงบประมาณ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const submitData = {
        ...formData,
        subcategory_id: subcategory.subcategory_id,
        category_id: category.category_id,
        total_budget: parseFloat(formData.total_budget),
        allocated_budget: parseFloat(formData.allocated_budget) || 0
      };

      if (editingBudget) {
        await adminAPI.updateSubcategoryBudget(editingBudget.budget_id, submitData);
      } else {
        await adminAPI.createSubcategoryBudget(submitData);
      }

      setShowAddForm(false);
      await loadData();
      if (onBudgetUpdate) onBudgetUpdate();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่องบประมาณ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.budget_name}
                        onChange={(e) => {
                          setFormData({ ...formData, budget_name: e.target.value });
                          setErrors({ ...errors, budget_name: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.budget_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.budget_name && (
                        <p className="text-sm text-red-500 mt-1">{errors.budget_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ปีงบประมาณ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.year_id}
                        onChange={(e) => {
                          setFormData({ ...formData, year_id: e.target.value });
                          setErrors({ ...errors, year_id: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.year_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-- เลือกปี --</option>
                        {years.map(year => (
                          <option key={year.year_id} value={year.year_id}>
                            {year.year}
                          </option>
                        ))}
                      </select>
                      {errors.year_id && (
                        <p className="text-sm text-red-500 mt-1">{errors.year_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        งบประมาณทั้งหมด <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.total_budget}
                        onChange={(e) => {
                          setFormData({ ...formData, total_budget: e.target.value });
                          setErrors({ ...errors, total_budget: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.total_budget ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                      {errors.total_budget && (
                        <p className="text-sm text-red-500 mt-1">{errors.total_budget}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุ
                      </label>
                      <input
                        type="text"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    <div key={budget.budget_id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{budget.budget_name}</h4>
                            <span className="text-sm text-gray-500">
                              <Calendar size={14} className="inline mr-1" />
                              ปี {years.find(y => y.year_id === budget.year_id)?.year}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">งบประมาณทั้งหมด</p>
                              <p className="text-sm font-semibold">{formatCurrency(budget.total_budget)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ใช้ไปแล้ว</p>
                              <p className="text-sm font-semibold text-blue-600">
                                {formatCurrency(budget.allocated_budget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">คงเหลือ</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(budget.remaining_budget)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((budget.allocated_budget / budget.total_budget) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                          {budget.allocated_budget === 0 && (
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