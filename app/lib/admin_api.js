// app/lib/admin_api.js - Admin specific API methods (Updated)

import apiClient from './api';
import { targetRolesUtils } from './target_roles_utils';

// Admin API methods for managing funds and roles
export const adminAPI = {
  
  // ==================== YEARS MANAGEMENT ====================
  
  // Get all years (Admin endpoint)
  async getYears() {
    try {
      const response = await apiClient.get('/admin/years');
      return response.years || [];
    } catch (error) {
      console.error('Error fetching admin years:', error);
      throw error;
    }
  },

  // Create new year
  async createYear(yearData) {
    try {
      const response = await apiClient.post('/admin/years', yearData);
      return response;
    } catch (error) {
      console.error('Error creating year:', error);
      throw error;
    }
  },

  // Update year
  async updateYear(yearId, yearData) {
    try {
      const response = await apiClient.put(`/admin/years/${yearId}`, yearData);
      return response;
    } catch (error) {
      console.error('Error updating year:', error);
      throw error;
    }
  },

  // Delete year
  async deleteYear(yearId) {
    try {
      const response = await apiClient.delete(`/admin/years/${yearId}`);
      return response;
    } catch (error) {
      console.error('Error deleting year:', error);
      throw error;
    }
  },

  // Toggle year status
  async toggleYearStatus(yearId) {
    try {
      const response = await apiClient.patch(`/admin/years/${yearId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling year status:', error);
      throw error;
    }
  },

  // Get year statistics
  async getYearStats(yearId) {
    try {
      const response = await apiClient.get(`/admin/years/${yearId}/stats`);
      return response.stats || {};
    } catch (error) {
      console.error('Error fetching year stats:', error);
      throw error;
    }
  },

  // ==================== CATEGORIES MANAGEMENT ====================
  
  // Get all categories (Admin endpoint)
  async getCategories(yearId = null) {
    try {
      const params = yearId ? { year_id: yearId } : {};
      const response = await apiClient.get('/admin/categories', params);
      return response.categories || [];
    } catch (error) {
      console.error('Error fetching admin categories:', error);
      throw error;
    }
  },

  // Create new category
  async createCategory(categoryData) {
    try {
      console.log('Creating category with data:', categoryData);
      
      // ตรวจสอบข้อมูลก่อนส่ง
      if (!categoryData.category_name || categoryData.category_name.trim() === '') {
        throw new Error('ชื่อหมวดหมู่ห้ามว่าง');
      }
      
      if (!categoryData.year_id) {
        throw new Error('year_id is required');
      }
      
      const response = await apiClient.post('/admin/categories', categoryData);
      console.log('Create category response:', response);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      
      // ตรวจสอบประเภทของ error
      if (error.name === 'NetworkError') {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else if (error.status === 401) {
        throw new Error('การยืนยันตัวตนหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else if (error.status === 403) {
        throw new Error('ไม่มีสิทธิ์ในการสร้างหมวดหมู่');
      } else if (error.status === 409) {
        throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
      } else if (error.status === 400) {
        throw new Error('ข้อมูลที่ส่งไม่ถูกต้อง: ' + (error.message || 'Bad Request'));
      }
      
      throw error;
    }
  },

  // เพิ่ม function ตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์
  async checkServerConnection() {
    try {
      const response = await apiClient.get('/health');
      return { status: 'connected', message: 'Server is accessible' };
    } catch (error) {
      return { 
        status: 'disconnected', 
        message: 'Cannot connect to server',
        error: error.message 
      };
    }
  },

  // Update category
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await apiClient.put(`/admin/categories/${categoryId}`, categoryData);
      return response;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(categoryId) {
    try {
      const response = await apiClient.delete(`/admin/categories/${categoryId}`);
      return response;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Toggle category status
  async toggleCategoryStatus(categoryId) {
    try {
      const response = await apiClient.patch(`/admin/categories/${categoryId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  },

  // ==================== SUBCATEGORIES MANAGEMENT ====================
  
  // Get all subcategories (admin view - no filtering)
  async getAllSubcategories(categoryId = null, yearId = null) {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (yearId) params.year_id = yearId;
      
      console.log('Getting all subcategories for admin with params:', params);
      
      const response = await apiClient.get('/admin/subcategories', params);
      console.log('Admin subcategories response:', response);
      
      return response;
    } catch (error) {
      console.error('Error fetching all subcategories:', error);
      throw error;
    }
  },

  // Get subcategories for admin (alias for getAllSubcategories)
  async getSubcategories(categoryId = null) {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await apiClient.get('/admin/subcategories', params);
      return response.subcategories || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  },

  // Create new subcategory with target_roles
  async createSubcategoryWithRoles(subcategoryData) {
    try {
      const response = await apiClient.post('/admin/subcategories', subcategoryData);
      return response;
    } catch (error) {
      console.error('Error creating subcategory with roles:', error);
      throw error;
    }
  },

  // Create subcategory (alias)
  async createSubcategory(subcategoryData) {
    try {
      // ไม่ต้อง convert เป็น JSON string แล้ว - ส่งเป็น array ตรงๆ
      const data = {
        ...subcategoryData,
        // เอา JSON.stringify ออก - ส่งเป็น array ตรงๆ
        target_roles: Array.isArray(subcategoryData.target_roles) 
          ? subcategoryData.target_roles  // ส่งเป็น array ตรงๆ
          : (subcategoryData.target_roles ? [subcategoryData.target_roles] : [])
      };
      
      console.log('Sending subcategory data:', data); // debug log
      
      const response = await apiClient.post('/admin/subcategories', data);
      return response;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  },

  // Update subcategory
  async updateSubcategory(subcategoryId, subcategoryData) {
    try {
      // เช่นเดียวกัน - ส่งเป็น array ตรงๆ
      const data = {
        ...subcategoryData,
        target_roles: Array.isArray(subcategoryData.target_roles) 
          ? subcategoryData.target_roles  // ส่งเป็น array ตรงๆ
          : (subcategoryData.target_roles ? [subcategoryData.target_roles] : [])
      };
      
      console.log('Updating subcategory data:', data); // debug log
      
      const response = await apiClient.put(`/admin/subcategories/${subcategoryId}`, data);
      return response;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  },

  // Delete subcategory
  async deleteSubcategory(subcategoryId) {
    try {
      const response = await apiClient.delete(`/admin/subcategories/${subcategoryId}`);
      return response;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  },

  // Toggle subcategory status
  async toggleSubcategoryStatus(subcategoryId) {
    try {
      const response = await apiClient.patch(`/admin/subcategories/${subcategoryId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling subcategory status:', error);
      throw error;
    }
  },

  // Update target roles for subcategory
  async updateTargetRoles(subcategoryId, targetRoles) {
    try {
      const response = await apiClient.put(`/admin/subcategories/${subcategoryId}/roles`, {
        target_roles: targetRoles
      });
      return response;
    } catch (error) {
      console.error('Error updating target roles:', error);
      throw error;
    }
  },

  // Bulk update target roles
  async bulkUpdateTargetRoles(updates) {
    try {
      const response = await apiClient.post('/admin/subcategories/bulk-roles', {
        updates: updates
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating target roles:', error);
      throw error;
    }
  },

  // ==================== BUDGETS MANAGEMENT ====================
  
  // Get all subcategory budgets
  async getSubcategoryBudgets(params = {}) {
    try {
      const response = await apiClient.get('/admin/budgets', params);
      return response;
    } catch (error) {
      console.error('Error fetching subcategory budgets:', error);
      throw error;
    }
  },

  // Get budgets (alias)
  async getBudgets(subcategoryId = null) {
    try {
      const params = subcategoryId ? { subcategory_id: subcategoryId } : {};
      const response = await apiClient.get('/admin/budgets', params);
      return response.budgets || [];
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  },

  // Get subcategory budget by ID
  async getSubcategoryBudget(budgetId) {
    try {
      const response = await apiClient.get(`/admin/budgets/${budgetId}`);
      return response;
    } catch (error) {
      console.error('Error fetching subcategory budget:', error);
      throw error;
    }
  },

  // Get budget by ID (alias)
  async getBudget(budgetId) {
    try {
      const response = await apiClient.get(`/admin/budgets/${budgetId}`);
      return response.budget || {};
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  },

  // Create new subcategory budget
  async createSubcategoryBudget(budgetData) {
    try {
      const response = await apiClient.post('/admin/budgets', budgetData);
      return response;
    } catch (error) {
      console.error('Error creating subcategory budget:', error);
      throw error;
    }
  },

  // Create budget (alias)
  async createBudget(budgetData) {
    try {
      const response = await apiClient.post('/admin/budgets', budgetData);
      return response;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  },

  // Update subcategory budget
  async updateSubcategoryBudget(budgetId, budgetData) {
    try {
      const response = await apiClient.put(`/admin/budgets/${budgetId}`, budgetData);
      return response;
    } catch (error) {
      console.error('Error updating subcategory budget:', error);
      throw error;
    }
  },

  // Update budget (alias)
  async updateBudget(budgetId, budgetData) {
    try {
      const response = await apiClient.put(`/admin/budgets/${budgetId}`, budgetData);
      return response;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  // Delete subcategory budget
  async deleteSubcategoryBudget(budgetId) {
    try {
      const response = await apiClient.delete(`/admin/budgets/${budgetId}`);
      return response;
    } catch (error) {
      console.error('Error deleting subcategory budget:', error);
      throw error;
    }
  },

  // Delete budget (alias)
  async deleteBudget(budgetId) {
    try {
      const response = await apiClient.delete(`/admin/budgets/${budgetId}`);
      return response;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  // Toggle subcategory budget status
  async toggleSubcategoryBudgetStatus(budgetId) {
    try {
      const response = await apiClient.patch(`/admin/budgets/${budgetId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling subcategory budget status:', error);
      throw error;
    }
  },

  // Toggle budget status (alias)
  async toggleBudgetStatus(budgetId) {
    try {
      const response = await apiClient.patch(`/admin/budgets/${budgetId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling budget status:', error);
      throw error;
    }
  },

  // ==================== COMBINED DATA FETCHING ====================
  
  // Get all categories and subcategories (no filtering for admin) - Legacy method
  async getAllFundsStructure(year = '2568') {
    try {
      console.log('Getting all funds structure for admin, year:', year);

      // Step 1: Get years to convert year to year_id
      const yearsResponse = await apiClient.get('/years');
      console.log('Years response:', yearsResponse);
      
      const targetYear = yearsResponse.years?.find(y => y.year === year);
      if (!targetYear) {
        throw new Error(`Year ${year} not found`);
      }

      // Step 2: Get all categories for the year
      const categoriesResponse = await apiClient.get('/categories', { 
        year_id: targetYear.year_id 
      });
      console.log('Categories response:', categoriesResponse);

      if (!categoriesResponse.categories) {
        return { categories: [] };
      }

      // Step 3: Get all subcategories for each category (admin sees all)
      const categoriesWithSubs = await Promise.all(
        categoriesResponse.categories.map(async (category) => {
          try {
            console.log(`Getting all subcategories for category ${category.category_id}`);
            
            // เรียก Admin endpoint ที่ได้ข้อมูลทั้งหมด
            const subResponse = await apiClient.get('/admin/subcategories', {
              category_id: category.category_id,
              year_id: targetYear.year_id
            });
            
            console.log(`All subcategories for category ${category.category_id}:`, subResponse);
            
            return {
              ...category,
              subcategories: subResponse.subcategories || []
            };
          } catch (error) {
            console.error(`Error fetching subcategories for category ${category.category_id}:`, error);
            return {
              ...category,
              subcategories: []
            };
          }
        })
      );

      console.log('Final admin result (all funds):', categoriesWithSubs);

      return {
        categories: categoriesWithSubs,
        year: year,
        year_id: targetYear.year_id
      };
    } catch (error) {
      console.error('Error fetching admin funds structure:', error);
      throw error;
    }
  },

  // Get categories with subcategories and budgets for a specific year
  async getCategoriesWithDetails(yearId) {
    try {
      // Get categories for the year
      const categories = await this.getCategories(yearId);
      
      // Get all subcategories and budgets for each category
      const categoriesWithDetails = await Promise.all(
        categories.map(async (category) => {
          try {
            // Get subcategories for this category
            const subcategories = await this.getSubcategories(category.category_id);
            
            // Get budgets for each subcategory
            const subcategoriesWithBudgets = await Promise.all(
              subcategories.map(async (subcategory) => {
                try {
                  const budgets = await this.getBudgets(subcategory.subcategory_id);
                  
                  // Parse target_roles if it's a JSON string
                  let targetRoles = [];
                  if (subcategory.target_roles) {
                    try {
                      targetRoles = JSON.parse(subcategory.target_roles);
                    } catch (e) {
                      console.warn('Failed to parse target_roles:', subcategory.target_roles);
                    }
                  }
                  
                  return {
                    ...subcategory,
                    target_roles: targetRoles,
                    budgets: budgets
                  };
                } catch (error) {
                  console.error(`Error fetching budgets for subcategory ${subcategory.subcategory_id}:`, error);
                  return {
                    ...subcategory,
                    budgets: []
                  };
                }
              })
            );
            
            return {
              ...category,
              subcategories: subcategoriesWithBudgets
            };
          } catch (error) {
            console.error(`Error fetching subcategories for category ${category.category_id}:`, error);
            return {
              ...category,
              subcategories: []
            };
          }
        })
      );
      
      return categoriesWithDetails;
    } catch (error) {
      console.error('Error fetching categories with details:', error);
      throw error;
    }
  },

  // ==================== STATISTICS & REPORTS ====================
  
  // Get category statistics
  async getCategoryStats() {
    try {
      const response = await apiClient.get('/admin/reports/categories');
      return response.stats || [];
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  },

  // Get system statistics
  async getSystemStats() {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  },

  // Get budget overview
  async getBudgetOverview(yearId) {
    try {
      const response = await apiClient.get('/admin/budget-overview', { year_id: yearId });
      return response;
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      throw error;
    }
  },

  // ==================== SEARCH & UTILITY ====================

  // Search funds
  async searchFunds(searchTerm, params = {}) {
    try {
      const [categoriesResponse, subcategoriesResponse] = await Promise.all([
        apiClient.get('/admin/categories', params),
        apiClient.get('/admin/subcategories', params)
      ]);
      
      return {
        categories: categoriesResponse.categories || [],
        subcategories: subcategoriesResponse.subcategories || []
      };
    } catch (error) {
      console.error('Error searching funds:', error);
      throw error;
    }
  },

  // ==================== USER MANAGEMENT ====================
  
  // Get all users
  async getAllUsers(params = {}) {
    try {
      const response = await apiClient.get('/admin/users', params);
      return response;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  // Create user
  async createUser(userData) {
    try {
      const response = await apiClient.post('/admin/users', userData);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // ==================== APPLICATION MANAGEMENT ====================
  
  // Get all applications (admin sees all)
  async getAllApplications(params = {}) {
    try {
      const response = await apiClient.get('/admin/applications', params);
      return response;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
  },

  // Approve application
  async approveApplication(applicationId, approvalData) {
    try {
      const response = await apiClient.post(`/applications/${applicationId}/approve`, approvalData);
      return response;
    } catch (error) {
      console.error('Error approving application:', error);
      throw error;
    }
  },

  // Reject application
  async rejectApplication(applicationId, rejectionData) {
    try {
      const response = await apiClient.post(`/applications/${applicationId}/reject`, rejectionData);
      return response;
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  },

  // ==================== VALIDATION UTILITIES ====================
  
  // Parse target roles from JSON string
  parseTargetRoles(targetRolesString) {
    if (!targetRolesString) return [];
    
    try {
      return JSON.parse(targetRolesString);
    } catch (error) {
      console.warn('Failed to parse target_roles:', targetRolesString);
      return [];
    }
  },

  // Format target roles for display
  formatTargetRoles(targetRoles) {
    const roleNames = {
      '1': 'อาจารย์',
      '2': 'เจ้าหน้าที่',
      '3': 'ผู้ดูแลระบบ'
    };
    
    if (!targetRoles || targetRoles.length === 0) {
      return 'ทุกบทบาท';
    }
    
    return targetRoles.map(roleId => roleNames[roleId] || `Role ${roleId}`).join(', ');
  },

  // Validate required fields for different operations
  validateYearData(yearData) {
    const required = ['year', 'budget'];
    const missing = required.filter(field => !yearData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (isNaN(parseFloat(yearData.budget)) || parseFloat(yearData.budget) <= 0) {
      throw new Error('Budget must be a positive number');
    }
  },

  validateCategoryData(categoryData) {
    if (!categoryData.category_name || categoryData.category_name.trim() === '') {
      throw new Error('Category name is required');
    }
    
    if (!categoryData.year_id) {
      throw new Error('Year ID is required');
    }
  },

  validateSubcategoryData(subcategoryData) {
    if (!subcategoryData.subcategory_name || subcategoryData.subcategory_name.trim() === '') {
      throw new Error('Subcategory name is required');
    }
    
    if (!subcategoryData.category_id) {
      throw new Error('Category ID is required');
    }
  },

  validateBudgetData(budgetData) {
    const required = ['subcategory_id', 'allocated_amount'];
    const missing = required.filter(field => !budgetData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (isNaN(parseFloat(budgetData.allocated_amount)) || parseFloat(budgetData.allocated_amount) <= 0) {
      throw new Error('Allocated amount must be a positive number');
    }
    
    if (budgetData.max_amount_per_grant && (isNaN(parseFloat(budgetData.max_amount_per_grant)) || parseFloat(budgetData.max_amount_per_grant) <= 0)) {
      throw new Error('Max amount per grant must be a positive number');
    }
    
    if (budgetData.max_grants && (isNaN(parseInt(budgetData.max_grants)) || parseInt(budgetData.max_grants) <= 0)) {
      throw new Error('Max grants must be a positive integer');
    }
  }
};

export default adminAPI;