"use client";

import React, { useState, useEffect } from "react";
import { adminAPI } from "../../../lib/admin_api";
import apiClient from "../../../lib/api";
import { 
  Search, Plus, Filter, AlertCircle, Settings, Edit, Trash2, Save, X, 
  DollarSign, Eye, EyeOff 
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageLayout from "../common/PageLayout";
import Card from "../../components/common/Card";

// Modal Components
import CategoryModal from "./CategoryModal";
import SubcategoryModal from "./SubcategoryModal";
import BudgetModal from "./BudgetModal";

console.log('SubcategoryModal imported:', SubcategoryModal);

export default function FundSettingsContent({ onNavigate }) {
  // State Management
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Edit States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ 
    max_amount_per_grant: '', 
    status: 'active' 
  });

  // Modal States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadCategories();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const yearsResponse = await apiClient.get('/years');
      const yearsData = yearsResponse.years || [];
      setYears(yearsData);
      const currentYear = yearsData.find(y => y.is_current) || yearsData[0];
      if (currentYear) {
        setSelectedYear(currentYear);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllFundsWithStats(selectedYear.year_id);
      const updatedCategories = response.categories.map((cat, catIndex) => ({
        ...cat,
        subcategories: cat.subcategories.map((sub, subIndex) => ({
          ...sub,
          code: `${catIndex + 1}.${subIndex + 1}`
        }))
      }));
      setCategories(updatedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลทุน");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCategories = () => {
    let filtered = categories;
    if (filterStatus !== "all") {
      filtered = filtered.filter(cat => cat.status === filterStatus);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.category_name.toLowerCase().includes(search) ||
        cat.subcategories?.some(sub =>
          sub.subcategory_name.toLowerCase().includes(search)
        )
      );
    }
    return filtered;
  };

  // Category CRUD
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteTarget({
      type: 'category',
      id: category.category_id,
      name: category.category_name
    });
    setDeleteDialogOpen(true);
  };

  // Subcategory CRUD
  const handleCreateSubcategory = (category) => {
    setEditingSubcategory(null);
    setSelectedCategoryForSub(category);
    setSubcategoryModalOpen(true);
  };

  const handleEditSubcategory = (subcategory, category) => {
    console.log('Edit subcategory clicked:', subcategory);
    console.log('Category:', category);
    console.log('Current subcategoryModalOpen:', subcategoryModalOpen);
    
    setEditingSubcategory(subcategory);
    setSelectedCategoryForSub(category);
    setSubcategoryModalOpen(true);
    
    console.log('After setting subcategoryModalOpen to true');
  };

  const handleDeleteSubcategory = (subcategory) => {
    setDeleteTarget({
      type: 'subcategory',
      id: subcategory.subcategory_id,
      name: subcategory.subcategory_name
    });
    setDeleteDialogOpen(true);
  };

  // Budget CRUD
  const handleCreateBudget = (subcategory) => {
    setEditingBudget(null);
    setSelectedCategoryForSub(subcategory);
    setBudgetModalOpen(true);
  };
  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetForm({
      max_amount_per_grant: budget.max_amount_per_grant || '',
      status: budget.status || 'active'
    });
  };

  const handleSaveBudget = async (budgetId) => {
    try {
      // แปลงข้อมูลให้เป็น number ก่อนส่ง
      const updateData = {
        max_amount_per_grant: budgetForm.max_amount_per_grant ? parseFloat(budgetForm.max_amount_per_grant) : null,
        status: budgetForm.status
      };
      
      await adminAPI.updateSubcategoryBudget(budgetId, updateData);
      setEditingBudget(null);
      setBudgetForm({ max_amount_per_grant: '', status: 'active' });
      await loadCategories();
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDeleteBudget = (budget) => {
    setDeleteTarget({
      type: 'budget',
      id: budget.subcategory_budget_id,
      name: `งบประมาณ (จัดสรร: ${budget.allocated_amount})`
    });
    setDeleteDialogOpen(true);
  };

  const handleToggleBudgetStatus = async (budgetId, currentStatus) => {
    try {
      const updateData = {
        status: currentStatus === 'active' ? 'disable' : 'active'
      };
      await adminAPI.updateSubcategoryBudget(budgetId, updateData);
      await loadCategories();
    } catch (error) {
      console.error("Error toggling budget status:", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  // Modal CRUD Handlers
  const handleCategorySave = async (categoryData) => {
    try {
      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.category_id, categoryData);
      } else {
        await adminAPI.createCategory({
          ...categoryData,
          year_id: selectedYear.year_id
        });
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      await loadCategories();
      alert("บันทึกหมวดหมู่เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving category:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกหมวดหมู่");
    }
  };

  const handleSubcategorySave = async (subcategoryData) => {
    try {
      console.log('Saving subcategory:', subcategoryData);
      console.log('Editing subcategory:', editingSubcategory);
      
      if (editingSubcategory) {
        // แก้ไขทุนย่อย
        const updateData = {
          ...subcategoryData,
          target_roles: JSON.stringify(subcategoryData.target_roles)
        };
        await adminAPI.updateSubcategory(editingSubcategory.subcategory_id, updateData);
      } else {
        // สร้างทุนย่อยใหม่
        await adminAPI.createSubcategoryWithRoles({
          ...subcategoryData,
          category_id: selectedCategoryForSub.category_id,
          year_id: selectedYear.year_id,
          target_roles: JSON.stringify(subcategoryData.target_roles)
        });
      }
      setSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setSelectedCategoryForSub(null);
      await loadCategories();
      alert("บันทึกทุนย่อยเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving subcategory:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกทุนย่อย");
    }
  };

  const handleBudgetUpdate = async () => {
    await loadCategories();
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget.type === 'category') {
        await adminAPI.deleteCategory(deleteTarget.id);
        alert("ลบหมวดหมู่เรียบร้อยแล้ว");
      } else if (deleteTarget.type === 'subcategory') {
        await adminAPI.deleteSubcategory(deleteTarget.id);
        alert("ลบทุนย่อยเรียบร้อยแล้ว");
      } else if (deleteTarget.type === 'budget') {
        await adminAPI.deleteSubcategoryBudget(deleteTarget.id);
        alert("ลบงบประมาณเรียบร้อยแล้ว");
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await loadCategories();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };
  const getBudgetDisplayName = (subcategory, budget) => {
    let baseName = subcategory.subcategory_name;
    let suffix = '';
    
    // ถ้ามี fund_description ให้ใช้แทน
    if (budget.fund_description && budget.fund_description.trim()) {
      suffix = budget.fund_description;
    } 
    // ถ้าไม่มี fund_description แต่มี level ให้ใช้ level
    else if (budget.level && budget.level.trim()) {
      suffix = `ระดับ${budget.level}`;
    }
    
    // สร้างชื่อเต็ม
    let fullName = suffix ? `${baseName} - ${suffix}` : baseName;
    
    // ตัดให้สั้นลงถ้ายาวเกิน 60 ตัวอักษร
    if (fullName.length > 60) {
      fullName = fullName.substring(0, 57) + '...';
    }
    
    return fullName;
  };
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {status === 'active' ? (
        <>
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
          ใช้งาน
        </>
      ) : (
        <>
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1"></div>
          ปิดใช้งาน
        </>
      )}
    </span>
  );

  // Action Button Component
  const ActionButton = ({ onClick, variant, size = "sm", children, title }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      edit: "text-blue-700 hover:text-blue-900 hover:bg-blue-50",
      delete: "text-red-700 hover:text-red-900 hover:bg-red-50",
      save: "text-green-700 hover:text-green-900 hover:bg-green-50",
      cancel: "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
    };
    
    const sizes = {
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base"
    };
    
    return (
      <button
        onClick={onClick}
        title={title}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      >
        {children}
      </button>
    );
  };

  return (
    <PageLayout
      title="การจัดการทุน"
      subtitle="จัดการหมวดหมู่และประเภทย่อยของทุน"
      icon={Settings}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/admin" },
        { label: "การจัดการทุน" }
      ]}
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Header Controls Card */}
            <Card 
              title="ตัวกรองข้อมูล" 
              icon={Filter}
              collapsible={false}
              action={
                <button
                  onClick={handleCreateCategory}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={16} />
                  เพิ่มหมวดหมู่
                </button>
              }
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="ค้นหาหมวดหมู่หรือประเภทย่อย..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <select
                      value={selectedYear?.year_id || ""}
                      onChange={(e) => {
                        const year = years.find(y => y.year_id === parseInt(e.target.value));
                        setSelectedYear(year);
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">เลือกปีงบประมาณ</option>
                      {years.map(year => (
                        <option key={year.year_id} value={year.year_id}>
                          {year.year}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="active">ใช้งาน</option>
                      <option value="disable">ปิดใช้งาน</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Categories List */}
            {getFilteredCategories().length === 0 ? (
              <Card title="ไม่พบข้อมูล" icon={AlertCircle} collapsible={false}>
                <div className="text-center py-8">
                  <div className="max-w-sm mx-auto">
                    <AlertCircle className="mx-auto mb-4 text-gray-400" size={56} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลหมวดหมู่</h3>
                    <p className="text-gray-500">ลองปรับเปลี่ยนการค้นหาหรือตัวกรองของคุณ</p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {getFilteredCategories().map((category, categoryIndex) => (
                  <Card
                    key={category.category_id}
                    title={`${categoryIndex + 1}. ${category.category_name}`}
                    icon={Settings}
                    action={
                      <div className="flex items-center gap-2">
                        <StatusBadge status={category.status} />
                        <div className="flex items-center gap-1 ml-2">
                          <ActionButton
                            onClick={() => handleCreateSubcategory(category)}
                            variant="edit"
                            title="เพิ่มประเภทย่อย"
                          >
                            <Plus size={14} />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleEditCategory(category)}
                            variant="edit"
                            title="แก้ไขหมวดหมู่"
                          >
                            <Edit size={14} />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDeleteCategory(category)}
                            variant="delete"
                            title="ลบหมวดหมู่"
                          >
                            <Trash2 size={14} />
                          </ActionButton>
                        </div>
                      </div>
                    }
                  >
                    {/* Subcategories Table */}
                    {category.subcategories?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">ชื่อประเภทย่อย</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">สถานะ</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">งบประมาณรวม</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">การดำเนินการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {category.subcategories.map((subcategory, subIndex) => (
                              <React.Fragment key={subcategory.subcategory_id}>
                                {/* Subcategory Row */}
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 px-4">
                                    <div className="font-medium text-gray-900">
                                      {subcategory.subcategory_name}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <StatusBadge status={subcategory.status} />
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="text-sm">
                                      <div className="text-gray-900 font-medium">
                                        ฿{subcategory.budgets?.[0]?.allocated_amount?.toLocaleString() || '0'}
                                      </div>
                                      <div className="text-gray-500">
                                        {subcategory.budgets?.length || 0} รายการ
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-1">
                                      <ActionButton
                                        onClick={() => handleCreateBudget(subcategory)}
                                        variant="edit"
                                        title="เพิ่มงบประมาณ"
                                      >
                                        <Plus size={14} />
                                      </ActionButton>
                                      <ActionButton
                                        onClick={() => handleEditSubcategory(subcategory, category)}
                                        variant="edit"
                                        title="แก้ไข"
                                      >
                                        <Edit size={14} />
                                      </ActionButton>
                                      <ActionButton
                                        onClick={() => handleDeleteSubcategory(subcategory)}
                                        variant="delete"
                                        title="ลบ"
                                      >
                                        <Trash2 size={14} />
                                      </ActionButton>
                                    </div>
                                  </td>
                                </tr>

                                {/* Budget Rows */}
                                {subcategory.budgets?.map(budget => (
                                  <tr key={budget.subcategory_budget_id} className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2 ml-4">
                                        <DollarSign className="text-green-600" size={16} />
                                        <span className="text-sm text-gray-700" title={getBudgetDisplayName(subcategory, budget)}>
                                          {getBudgetDisplayName(subcategory, budget)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <button
                                        onClick={() => handleToggleBudgetStatus(budget.subcategory_budget_id, budget.status)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                          budget.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                            budget.status === 'active' ? 'translate-x-5' : 'translate-x-1'
                                          }`}
                                        />
                                      </button>
                                    </td>
                                    <td className="py-3 px-4">
                                      {editingBudget?.subcategory_budget_id === budget.subcategory_budget_id ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            placeholder="ขอได้สูงสุด"
                                            value={budgetForm.max_amount_per_grant}
                                            onChange={(e) => setBudgetForm({ ...budgetForm, max_amount_per_grant: e.target.value })}
                                            className="w-28 p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                          />
                                        </div>
                                      ) : (
                                        <div className="text-sm">
                                          <div className="text-gray-900 font-medium">
                                            ฿{budget.max_amount_per_grant?.toLocaleString() || '0'}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {editingBudget?.subcategory_budget_id === budget.subcategory_budget_id ? (
                                        <div className="flex items-center gap-1">
                                          <ActionButton
                                            onClick={() => handleSaveBudget(budget.subcategory_budget_id)}
                                            variant="save"
                                            title="บันทึก"
                                          >
                                            <Save size={14} />
                                          </ActionButton>
                                          <ActionButton
                                            onClick={() => setEditingBudget(null)}
                                            variant="cancel"
                                            title="ยกเลิก"
                                          >
                                            <X size={14} />
                                          </ActionButton>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <ActionButton
                                            onClick={() => handleEditBudget(budget)}
                                            variant="edit"
                                            title="แก้ไข"
                                          >
                                            <Edit size={14} />
                                          </ActionButton>
                                          <ActionButton
                                            onClick={() => handleDeleteBudget(budget)}
                                            variant="delete"
                                            title="ลบ"
                                          >
                                            <Trash2 size={14} />
                                          </ActionButton>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">ไม่มีประเภทย่อย</div>
                        <button
                          onClick={() => handleCreateSubcategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          เพิ่มประเภทย่อยแรก
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}