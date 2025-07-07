// app/lib/teacher_api.js - Teacher specific API methods

import apiClient from '../lib/api';
import { targetRolesUtils } from '../lib/target_roles_utils';

// Teacher API methods for role-based fund access
export const teacherAPI = {
  
  // Get all categories and subcategories visible to teacher
  async getVisibleFundsStructure(year = '2568') {
    try {
      console.log('Getting teacher funds structure for year:', year);

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

      // Step 3: Get subcategories for each category - Teacher specific endpoint
      const categoriesWithSubs = await Promise.all(
        categoriesResponse.categories.map(async (category) => {
          try {
            console.log(`Getting teacher subcategories for category ${category.category_id}`);
            
            // เรียก Teacher specific endpoint
            const subResponse = await apiClient.get('/teacher/subcategories', {
              category_id: category.category_id,
              year_id: targetYear.year_id
            });
            
            console.log(`Teacher subcategories for category ${category.category_id}:`, subResponse);
            
            return {
              ...category,
              subcategories: subResponse.subcategories || []
            };
          } catch (error) {
            console.error(`Error fetching teacher subcategories for category ${category.category_id}:`, error);
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

      console.log('Final teacher result:', filteredCategories);

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

  // Get subcategories visible to teacher role
  async getVisibleSubcategories(categoryId = null, yearId = null) {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (yearId) params.year_id = yearId;
      
      console.log('Getting teacher subcategories with params:', params);
      
      // เรียก Teacher specific endpoint
      const response = await apiClient.get('/teacher/subcategories', params);
      console.log('Teacher subcategories response:', response);
      
      return response;
    } catch (error) {
      console.error('Error fetching teacher subcategories:', error);
      throw error;
    }
  },

  // Check if a specific fund is visible to teacher
  async checkFundVisibility(subcategoryId) {
    try {
      const response = await apiClient.get('/teacher/subcategories', {
        subcategory_id: subcategoryId
      });
      
      return response.subcategories && response.subcategories.length > 0;
    } catch (error) {
      console.error('Error checking teacher fund visibility:', error);
      return false;
    }
  },

  // Get teacher dashboard stats
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/teacher/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching teacher dashboard stats:', error);
      throw error;
    }
  },

  // Get teacher's applications
  async getMyApplications(params = {}) {
    try {
      const response = await apiClient.get('/teacher/applications', params);
      return response;
    } catch (error) {
      console.error('Error fetching teacher applications:', error);
      throw error;
    }
  },

  // Submit new application
  async submitApplication(applicationData) {
    try {
      const response = await apiClient.post('/applications', applicationData);
      return response;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get current teacher profile
  async getProfile() {
    try {
      const response = await apiClient.get('/profile');
      return response;
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      throw error;
    }
  }
};

export default teacherAPI;