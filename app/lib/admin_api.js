// app/lib/admin_api.js - Admin specific API methods

import apiClient from './api';
import { targetRolesUtils } from './target_roles_utils';

// Admin API methods for managing funds and roles
export const adminAPI = {
  
  // Get all categories and subcategories (no filtering for admin)
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

  // Create new category
  async createCategory(categoryData) {
    try {
      const response = await apiClient.post('/admin/categories', categoryData);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
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

  // Update subcategory
  async updateSubcategory(subcategoryId, subcategoryData) {
    try {
      const response = await apiClient.put(`/admin/subcategories/${subcategoryId}`, subcategoryData);
      return response;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  },

  // Update target_roles for existing subcategory
  async updateSubcategoryRoles(subcategoryId, targetRoles) {
    try {
      const response = await apiClient.put(`/admin/subcategories/${subcategoryId}/roles`, {
        target_roles: targetRoles
      });
      return response;
    } catch (error) {
      console.error('Error updating subcategory roles:', error);
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

  // Bulk update target_roles for multiple subcategories
  async bulkUpdateSubcategoryRoles(updates) {
    try {
      const promises = updates.map(update => 
        this.updateSubcategoryRoles(update.subcategory_id, update.target_roles)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return {
        success: true,
        successful_updates: successful,
        failed_updates: failed,
        total_updates: updates.length
      };
    } catch (error) {
      console.error('Error bulk updating subcategory roles:', error);
      throw error;
    }
  },

  // Get available roles for target_roles selection
  async getAvailableRoles() {
    try {
      const response = await apiClient.get('/admin/roles');
      return response;
    } catch (error) {
      console.error('Error fetching available roles:', error);
      // Fallback to static data
      return {
        roles: [
          { role_id: 1, role_name: 'teacher', display_name: 'อาจารย์' },
          { role_id: 2, role_name: 'staff', display_name: 'เจ้าหน้าที่' },
          { role_id: 3, role_name: 'admin', display_name: 'ผู้ดูแลระบบ' }
        ]
      };
    }
  },

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

  // Create new user
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

  // Export system report
  async exportSystemReport(params = {}) {
    try {
      const response = await apiClient.get('/admin/reports/export', params);
      return response;
    } catch (error) {
      console.error('Error exporting system report:', error);
      throw error;
    }
  },

  // Toggle category status (active/disable)
  async toggleCategoryStatus(categoryId) {
    try {
      const response = await apiClient.patch(`/admin/categories/${categoryId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  },

  // Toggle subcategory status (active/disable)
  async toggleSubcategoryStatus(subcategoryId) {
    try {
      const response = await apiClient.patch(`/admin/subcategories/${subcategoryId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling subcategory status:', error);
      throw error;
    }
  },

  // Get category statistics
  async getCategoryStatistics() {
    try {
      const response = await apiClient.get('/admin/reports/categories');
      return response;
    } catch (error) {
      console.error('Error fetching category statistics:', error);
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

  // Get all funds with full details (categories + subcategories + stats)
  async getAllFundsWithStats(yearId) {
    try {
      console.log('Getting all funds with statistics for year_id:', yearId);
      
      // Get categories
      const categoriesResponse = await apiClient.get('/admin/categories', { 
        year_id: yearId 
      });
      
      // Get statistics
      const statsResponse = await this.getCategoryStatistics();
      const statsMap = new Map(
        statsResponse.stats?.map(stat => [stat.category_id, stat]) || []
      );
      
      // Get subcategories and their budgets for each category
      const categoriesWithDetails = await Promise.all(
        (categoriesResponse.categories || []).map(async (category) => {
          try {
            // Get subcategories
            const subResponse = await apiClient.get('/admin/subcategories', {
              category_id: category.category_id
            });
            
            // Get budgets for this category
            const budgetsResponse = await apiClient.get('/admin/budgets', {
              category_id: category.category_id
            });
            
            // Map budgets to subcategories
            const budgetsMap = new Map();
            (budgetsResponse.budgets || []).forEach(budget => {
              if (!budgetsMap.has(budget.subcategory_id)) {
                budgetsMap.set(budget.subcategory_id, []);
              }
              budgetsMap.get(budget.subcategory_id).push(budget);
            });
            
            // Add budgets to each subcategory
            const subcategoriesWithBudgets = (subResponse.subcategories || []).map(sub => ({
              ...sub,
              budgets: budgetsMap.get(sub.subcategory_id) || []
            }));
            
            const categoryStats = statsMap.get(category.category_id) || {
              subcategory_count: 0,
              application_count: 0,
              total_requested: 0,
              total_approved: 0
            };
            
            return {
              ...category,
              ...categoryStats,
              subcategories: subcategoriesWithBudgets
            };
          } catch (error) {
            console.error(`Error fetching details for category ${category.category_id}:`, error);
            return {
              ...category,
              subcategory_count: 0,
              application_count: 0,
              total_requested: 0,
              total_approved: 0,
              subcategories: []
            };
          }
        })
      );
      
      return {
        success: true,
        categories: categoriesWithDetails,
        total: categoriesWithDetails.length
      };
    } catch (error) {
      console.error('Error fetching all funds with stats:', error);
      throw error;
    }
  },

  // Search funds by name
  async searchFunds(searchTerm, yearId = null) {
    try {
      const params = { search: searchTerm };
      if (yearId) params.year_id = yearId;
      
      // Search in both categories and subcategories
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

  // Toggle subcategory budget status
  async toggleSubcategoryBudgetStatus(budgetId) {
    try {
      const response = await apiClient.patch(`/admin/budgets/${budgetId}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling subcategory budget status:', error);
      throw error;
    }
  }
};

export default adminAPI;