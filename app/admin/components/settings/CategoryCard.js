// app/admin/components/settings/CategoryCard.js
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Power,
  Plus,
  Users,
  FileText,
  DollarSign,
  Wallet
} from "lucide-react";

export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreateSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onToggleSubcategoryStatus,
  selectedSubcategories,
  onSelectSubcategory,
  onManageBudgets
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRoleIcons = (targetRoles) => {
    if (!targetRoles) return null;
    
    // Check if targetRoles is already an array or needs to be parsed
    let roles;
    try {
      if (typeof targetRoles === 'string') {
        roles = JSON.parse(targetRoles);
      } else if (Array.isArray(targetRoles)) {
        roles = targetRoles;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error parsing target roles:', error);
      return null;
    }
    
    const icons = [];
    
    if (roles.includes("1")) {
      icons.push(
        <span key="teacher" className="text-blue-600" title="อาจารย์">
          👨‍🏫
        </span>
      );
    }
    if (roles.includes("2")) {
      icons.push(
        <span key="staff" className="text-green-600" title="เจ้าหน้าที่">
          👷
        </span>
      );
    }
    
    return <div className="flex gap-1">{icons}</div>;
  };

  const isSubcategorySelected = (subcategory) => {
    return selectedSubcategories.some(s => s.subcategory_id === subcategory.subcategory_id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Category Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {category.category_name}
                {category.status === 'disable' && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                    ปิดใช้งาน
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {category.subcategory_count || 0} ทุนย่อย
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {category.application_count || 0} คำร้อง
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatCurrency(category.total_approved || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="แก้ไข"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onToggleStatus(category.category_id)}
              className={`p-2 rounded transition-colors ${
                category.status === 'active'
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
              title={category.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            >
              <Power size={18} />
            </button>
            {category.subcategory_count === 0 && (
              <button
                onClick={() => onDelete(category)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="ลบ"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcategories List */}
      {isExpanded && (
        <div className="p-4 bg-gray-50">
          {category.subcategories && category.subcategories.length > 0 ? (
            <div className="space-y-2">
              {category.subcategories.map(subcategory => (
                <div
                  key={subcategory.subcategory_id}
                  className={`p-3 bg-white rounded-lg border ${
                    isSubcategorySelected(subcategory)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSubcategorySelected(subcategory)}
                        onChange={(e) => onSelectSubcategory(subcategory, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {subcategory.subcategory_name}
                          </span>
                          {subcategory.status === 'disable' && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                              ปิดใช้งาน
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">
                            กลุ่มเป้าหมาย:
                          </span>
                          {getRoleIcons(subcategory.target_roles)}
                          {subcategory.application_count > 0 && (
                            <span className="text-sm text-gray-500">
                              • {subcategory.application_count} คำร้อง
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subcategory Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onManageBudgets(subcategory, category)}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                        title="จัดการงบประมาณ"
                      >
                        <Wallet size={16} />
                      </button>
                      <button
                        onClick={() => onEditSubcategory(subcategory, category)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="แก้ไข"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onToggleSubcategoryStatus(subcategory.subcategory_id)}
                        className={`p-1.5 rounded transition-colors ${
                          subcategory.status === 'active'
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title={subcategory.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      >
                        <Power size={16} />
                      </button>
                      {(!subcategory.application_count || subcategory.application_count === 0) && (
                        <button
                          onClick={() => onDeleteSubcategory(subcategory)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fund Condition */}
                  {subcategory.fund_condition && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      <span className="font-medium">เงื่อนไข:</span> {subcategory.fund_condition}
                    </div>
                  )}

                  {/* Budgets for this subcategory */}
                  {subcategory.budgets && subcategory.budgets.length > 0 && (
                    <div className="mt-3 pl-4 space-y-2">
                      <div className="text-sm font-medium text-gray-700">งบประมาณ:</div>
                      {subcategory.budgets.map(budget => (
                        <div key={budget.subcategory_budget_id} className="p-2 bg-blue-50 rounded text-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              {budget.level && (
                                <span className="text-xs font-medium text-blue-900 mr-2">
                                  [{budget.level}]
                                </span>
                              )}
                              <span className="text-blue-700">
                                งบประมาณ: {formatCurrency(budget.allocated_amount)}
                              </span>
                            </div>
                            {budget.status === 'disable' && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-blue-600">
                            ใช้ไป: {formatCurrency(budget.used_amount)} | 
                            คงเหลือ: {formatCurrency(budget.remaining_budget)}
                            {budget.max_grants && ` | ทุนคงเหลือ: ${budget.remaining_grant}/${budget.max_grants}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              ยังไม่มีทุนย่อยในหมวดหมู่นี้
            </div>
          )}

          {/* Add Subcategory Button */}
          <button
            onClick={() => onCreateSubcategory(category)}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>เพิ่มทุนย่อย</span>
          </button>
        </div>
      )}
    </div>
  );
}