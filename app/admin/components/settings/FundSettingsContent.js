// app/admin/components/settings/FundSettingsContent.js
"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../../../lib/admin_api";
import apiClient from "../../../lib/api";
import { Search, Plus, Filter, AlertCircle, Settings } from "lucide-react";
import CategoryCard from "./CategoryCard";
import CategoryModal from "./CategoryModal";
import SubcategoryModal from "./SubcategoryModal";
import BulkRoleModal from "./BulkRoleModal";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import BudgetManagementModal from "./BudgetManagementModal";
import PageHeader from "../common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function FundSettingsContent({ onNavigate }) {
  // State Management
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, disable
  
  // Modal States
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [bulkRoleModalOpen, setBulkRoleModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  
  // Edit States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type: 'category'|'subcategory', id, name}
  const [selectedSubcategoryForBudget, setSelectedSubcategoryForBudget] = useState(null);
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState(null);
  
  // Selection for bulk actions
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load categories when year changes
  useEffect(() => {
    if (selectedYear) {
      loadCategories();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Get years
      const yearsResponse = await apiClient.get('/years');
      const yearsData = yearsResponse.years || [];
      setYears(yearsData);
      
      // Set current year as default
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
      setCategories(response.categories || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลทุน");
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const getFilteredCategories = () => {
    let filtered = categories;
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(cat => cat.status === filterStatus);
    }
    
    // Filter by search term
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

  // Category CRUD handlers
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
      name: category.category_name,
      hasChildren: category.subcategory_count > 0
    });
    setDeleteDialogOpen(true);
  };

  const handleToggleCategoryStatus = async (categoryId) => {
    try {
      await adminAPI.toggleCategoryStatus(categoryId);
      await loadCategories();
    } catch (error) {
      console.error("Error toggling category status:", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  // Subcategory CRUD handlers
  const handleCreateSubcategory = (category) => {
    setEditingSubcategory(null);
    setSelectedCategoryForSub(category);
    setSubcategoryModalOpen(true);
  };

  const handleEditSubcategory = (subcategory, category) => {
    setEditingSubcategory(subcategory);
    setSelectedCategoryForSub(category);
    setSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = (subcategory) => {
    setDeleteTarget({
      type: 'subcategory',
      id: subcategory.subcategory_id,
      name: subcategory.subcategory_name,
      hasApplications: subcategory.application_count > 0
    });
    setDeleteDialogOpen(true);
  };

  const handleToggleSubcategoryStatus = async (subcategoryId) => {
    try {
      await adminAPI.toggleSubcategoryStatus(subcategoryId);
      await loadCategories();
    } catch (error) {
      console.error("Error toggling subcategory status:", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  // Bulk actions
  const handleBulkRoleUpdate = () => {
    if (selectedSubcategories.length === 0) {
      alert("กรุณาเลือกทุนที่ต้องการแก้ไข");
      return;
    }
    setBulkRoleModalOpen(true);
  };

  // Budget Management handler
  const handleManageBudgets = (subcategory, category) => {
    setSelectedSubcategoryForBudget(subcategory);
    setSelectedCategoryForBudget(category);
    setBudgetModalOpen(true);
  };

  // Modal handlers
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
      await loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleSubcategorySave = async (subcategoryData) => {
    try {
      if (editingSubcategory) {
        await adminAPI.updateSubcategory(editingSubcategory.subcategory_id, subcategoryData);
      } else {
        await adminAPI.createSubcategory({
          ...subcategoryData,
          category_id: selectedCategoryForSub.category_id
        });
      }
      setSubcategoryModalOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Error saving subcategory:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleBulkRoleSave = async (targetRoles) => {
    try {
      const updates = selectedSubcategories.map(sub => ({
        subcategory_id: sub.subcategory_id,
        target_roles: targetRoles
      }));
      
      await adminAPI.bulkUpdateTargetRoles(updates);
      setBulkRoleModalOpen(false);
      setSelectedSubcategories([]);
      await loadCategories();
    } catch (error) {
      console.error("Error bulk updating roles:", error);
      alert("เกิดข้อผิดพลาดในการอัพเดทกลุ่มเป้าหมาย");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget.type === 'category') {
        await adminAPI.deleteCategory(deleteTarget.id);
      } else {
        await adminAPI.deleteSubcategory(deleteTarget.id);
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await loadCategories();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  if (loading && categories.length === 0) {
    return <LoadingSpinner />;
  }

  const filteredCategories = getFilteredCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าทุน"
        subtitle="จัดการหมวดหมู่และประเภททุนในระบบ"
        icon={Settings}
        actions={
          <button
            onClick={handleCreateCategory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>เพิ่มหมวดหมู่</span>
          </button>
        }
      />

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Year Selector */}
          <select
            value={selectedYear?.year_id || ""}
            onChange={(e) => {
              const year = years.find(y => y.year_id === parseInt(e.target.value));
              setSelectedYear(year);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year.year_id} value={year.year_id}>
                ปีงบประมาณ {year.year}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อทุน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทั้งหมด</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="disable">ปิดใช้งาน</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedSubcategories.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              เลือกแล้ว {selectedSubcategories.length} รายการ
            </span>
            <button
              onClick={handleBulkRoleUpdate}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              แก้ไขกลุ่มเป้าหมาย
            </button>
            <button
              onClick={() => setSelectedSubcategories([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">ไม่พบข้อมูลทุนที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          filteredCategories.map(category => (
            <CategoryCard
              key={category.category_id}
              category={category}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onToggleStatus={handleToggleCategoryStatus}
              onCreateSubcategory={handleCreateSubcategory}
              onEditSubcategory={handleEditSubcategory}
              onDeleteSubcategory={handleDeleteSubcategory}
              onToggleSubcategoryStatus={handleToggleSubcategoryStatus}
              onManageBudgets={handleManageBudgets}
              selectedSubcategories={selectedSubcategories}
              onSelectSubcategory={(subcategory, isSelected) => {
                if (isSelected) {
                  setSelectedSubcategories([...selectedSubcategories, subcategory]);
                } else {
                  setSelectedSubcategories(
                    selectedSubcategories.filter(s => s.subcategory_id !== subcategory.subcategory_id)
                  );
                }
              }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {categoryModalOpen && (
        <CategoryModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onSave={handleCategorySave}
          category={editingCategory}
        />
      )}

      {subcategoryModalOpen && (
        <SubcategoryModal
          isOpen={subcategoryModalOpen}
          onClose={() => setSubcategoryModalOpen(false)}
          onSave={handleSubcategorySave}
          subcategory={editingSubcategory}
          category={selectedCategoryForSub}
        />
      )}

      {bulkRoleModalOpen && (
        <BulkRoleModal
          isOpen={bulkRoleModalOpen}
          onClose={() => setBulkRoleModalOpen(false)}
          onSave={handleBulkRoleSave}
          selectedItems={selectedSubcategories}
        />
      )}

      {deleteDialogOpen && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          target={deleteTarget}
        />
      )}

      {budgetModalOpen && (
        <BudgetManagementModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          subcategory={selectedSubcategoryForBudget}
          category={selectedCategoryForBudget}
          onBudgetUpdate={loadCategories}
        />
      )}
    </div>
  );
}