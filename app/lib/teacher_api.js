// app/lib/teacher_api.js - แก้ให้เรียก Go Backend

import apiClient from './api';

// Teacher API methods for role-based fund access
export const teacherAPI = {
  
  // Get all categories and subcategories - เรียก Go Backend
  async getVisibleFundsStructure(year = '2568') {
    try {
      console.log('Getting funds structure for year:', year);

      // Step 1: Get years to convert year to year_id
      const yearsResponse = await apiClient.get('/years');
      console.log('Years response:', yearsResponse);
      
      const targetYear = yearsResponse.years?.find(y => y.year === year);
      if (!targetYear) {
        throw new Error(`Year ${year} not found`);
      }

      // Step 2: Get categories for the year
      const categoriesResponse = await apiClient.get('/categories', { 
        year_id: targetYear.year_id 
      });
      console.log('Categories response:', categoriesResponse);

      if (!categoriesResponse.categories) {
        return { categories: [] };
      }

      // Step 3: Get subcategories for each category - เรียก Go Backend
      const categoriesWithSubs = await Promise.all(
        categoriesResponse.categories.map(async (category) => {
          try {
            console.log(`Getting subcategories for category ${category.category_id}`);
            
            // เรียก Go Backend /api/v1/teacher/subcategories
            const subResponse = await apiClient.get('/teacher/subcategories', {
              category_id: category.category_id,
              year_id: targetYear.year_id
            });
            
            console.log(`Subcategories for category ${category.category_id}:`, subResponse);
            
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

      // Filter out categories with no visible subcategories
      const filteredCategories = categoriesWithSubs.filter(
        cat => cat.subcategories && cat.subcategories.length > 0
      );

      console.log('Final result:', filteredCategories);

      return {
        categories: filteredCategories,
        year: year,
        year_id: targetYear.year_id
      };
    } catch (error) {
      console.error('Error fetching teacher funds structure:', error);
      throw error;
    }
  },

  // Get subcategories visible to teacher role - เรียก Go Backend
  async getVisibleSubcategories(categoryId = null, yearId = null) {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (yearId) params.year_id = yearId;
      
      console.log('Getting teacher subcategories with params:', params);
      
      // เรียก Go Backend /api/v1/teacher/subcategories
      const response = await apiClient.get('/teacher/subcategories', params);
      console.log('Teacher subcategories response:', response);
      
      return response;
    } catch (error) {
      console.error('Error fetching teacher subcategories:', error);
      throw error;
    }
  },

  // Check if a specific fund is visible to current user
  async checkFundVisibility(subcategoryId) {
    try {
      const response = await apiClient.get('/teacher/subcategories', {
        subcategory_id: subcategoryId
      });
      
      return response.subcategories && response.subcategories.length > 0;
    } catch (error) {
      console.error('Error checking fund visibility:', error);
      return false;
    }
  },

  // Get current user's role and permissions
  async getCurrentUserRole() {
    try {
      const user = apiClient.getUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      return {
        role_id: user.role_id,
        role_name: user.role?.role || 'unknown',
        can_see_all_funds: user.role_id === 3, // Admin
        is_teacher: user.role_id === 1,
        is_staff: user.role_id === 2,
        is_admin: user.role_id === 3
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  }
};

// Admin API methods for managing target_roles
export const adminFundAPI = {
  
  // Create new subcategory with target_roles (admin only)
  async createSubcategoryWithRoles(subcategoryData) {
    try {
      const response = await apiClient.post('/admin/subcategories', subcategoryData);
      return response;
    } catch (error) {
      console.error('Error creating subcategory with roles:', error);
      throw error;
    }
  },

  // Update target_roles for existing subcategory (admin only)
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

  // Get all subcategories (admin view - no filtering)
  async getAllSubcategories(categoryId = null) {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await apiClient.get('/admin/subcategories', params);
      return response;
    } catch (error) {
      console.error('Error fetching all subcategories:', error);
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
  }
};

// Staff API methods (similar to teacher but for staff role)
export const staffAPI = {
  
  // Get subcategories visible to staff role
  async getVisibleSubcategories(categoryId = null, yearId = null) {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (yearId) params.year_id = yearId;
      
      const response = await apiClient.get('/staff/subcategories', params);
      return response;
    } catch (error) {
      console.error('Error fetching staff subcategories:', error);
      throw error;
    }
  },

  // Get all categories and subcategories with staff role filtering
  async getVisibleFundsStructure(year = '2568') {
    // ใช้ logic เดียวกับ teacherAPI
    return teacherAPI.getVisibleFundsStructure(year);
  }
};

// Utility functions for working with target_roles
export const targetRolesUtils = {
  
  // Parse target_roles JSON string
  parseTargetRoles(targetRolesString) {
    if (!targetRolesString) {
      return [];
    }
    
    try {
      return JSON.parse(targetRolesString);
    } catch (error) {
      console.error('Error parsing target_roles:', error);
      return [];
    }
  },

  // Check if current user can see a fund based on target_roles
  canUserSeeFund(targetRoles, userRoleId) {
    // Admin sees everything
    if (userRoleId === 3) {
      return true;
    }
    
    // If no target_roles specified, everyone can see it
    if (!targetRoles || targetRoles.length === 0) {
      return true;
    }
    
    // Check if user's role is in target_roles
    return targetRoles.includes(userRoleId.toString());
  },

  // Format target_roles for display
  formatTargetRolesForDisplay(targetRoles) {
    if (!targetRoles || targetRoles.length === 0) {
      return 'ทุกบทบาท';
    }
    
    const roleNames = {
      '1': 'อาจารย์',
      '2': 'เจ้าหน้าที่', 
      '3': 'ผู้ดูแลระบบ'
    };
    
    return targetRoles.map(roleId => roleNames[roleId] || `Role ${roleId}`).join(', ');
  },

  // Validate target_roles array
  validateTargetRoles(targetRoles) {
    if (!Array.isArray(targetRoles)) {
      return { valid: false, error: 'target_roles must be an array' };
    }
    
    const validRoles = ['1', '2', '3'];
    const invalidRoles = targetRoles.filter(role => !validRoles.includes(role.toString()));
    
    if (invalidRoles.length > 0) {
      return { 
        valid: false, 
        error: `Invalid role IDs: ${invalidRoles.join(', ')}` 
      };
    }
    
    return { valid: true };
  }
};

// Export everything
export default {
  teacherAPI,
  adminFundAPI,
  staffAPI,
  targetRolesUtils
};