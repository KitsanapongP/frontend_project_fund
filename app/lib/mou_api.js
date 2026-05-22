// app/lib/mou_api.js - MOU (Memorandum of Understanding) API methods

import apiClient from './api';

export const mouAPI = {
  
  // ==================== MOU RECORDS ====================
  
  // Get all MOUs with filtering
  async getMous(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.mou_code) params.append('mou_code', filters.mou_code);
      if (filters.title) params.append('title', filters.title);
      if (filters.partner_name) params.append('partner_name', filters.partner_name);
      if (filters.country) params.append('country', filters.country);
      if (filters.status) params.append('status', filters.status);
      if (filters.mouType) params.append('mou_type', filters.mouType);
      if (filters.level) params.append('level', filters.level);
      if (filters.is_international) params.append('is_international', filters.is_international);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `/mou${params.toString() ? `?${params}` : ''}`;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching MOUs:', error);
      throw error;
    }
  },

  // Get single MOU detail
  async getMouDetail(id) {
    try {
      const response = await apiClient.get(`/mou/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching MOU ${id}:`, error);
      throw error;
    }
  },

  // Create new MOU
  async createMou(mouData) {
    try {
      const response = await apiClient.post('/mou', mouData);
      return response.data;
    } catch (error) {
      console.error('Error creating MOU:', error);
      throw error;
    }
  },

  // Update existing MOU
  async updateMou(id, mouData) {
    try {
      const response = await apiClient.put(`/mou/${id}`, mouData);
      return response.data;
    } catch (error) {
      console.error(`Error updating MOU ${id}:`, error);
      throw error;
    }
  },

  // Delete MOU (soft delete)
  async deleteMou(id) {
    try {
      const response = await apiClient.delete(`/mou/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting MOU ${id}:`, error);
      throw error;
    }
  },

  // ==================== REFERENCE DATA ====================
  
  // Get MOU statuses
  async getMouStatuses() {
    try {
      const response = await apiClient.get('/mou/statuses');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching MOU statuses:', error);
      throw error;
    }
  },

  // Get MOU types
  async getMouTypes() {
    try {
      const response = await apiClient.get('/mou/types');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching MOU types:', error);
      throw error;
    }
  },

  // Get MOU levels
  async getMouLevels() {
    try {
      const response = await apiClient.get('/mou/levels');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching MOU levels:', error);
      throw error;
    }
  },

  // Get countries
  async getCountries() {
    try {
      const response = await apiClient.get('/mou/countries');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  // Get faculties
  async getFaculties() {
    try {
      const response = await apiClient.get('/mou/faculties');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw error;
    }
  },

  // ==================== ACTIVITY TYPES ====================

  // Get activity types
  async getActivityTypes() {
    try {
      const response = await apiClient.get('/mou/activity-types');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching activity types:', error);
      throw error;
    }
  },

  // Get OKRs
  async getOkrs() {
    try {
      const response = await apiClient.get('/mou/okrs');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching OKRs:', error);
      throw error;
    }
  },

  // Create activity type
  async createActivityType(data) {
    try {
      const response = await apiClient.post('/mou/activity-types', data);
      return response.data;
    } catch (error) {
      console.error('Error creating activity type:', error);
      throw error;
    }
  },

  // Update activity type
  async updateActivityType(id, data) {
    try {
      const response = await apiClient.put(`/mou/activity-types/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating activity type:', error);
      throw error;
    }
  },

  // Delete activity type
  async deleteActivityType(id) {
    try {
      const response = await apiClient.delete(`/mou/activity-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity type:', error);
      throw error;
    }
  },

  // Create OKR
  async createOkr(data) {
    try {
      const response = await apiClient.post('/mou/okrs', data);
      return response.data;
    } catch (error) {
      console.error('Error creating OKR:', error);
      throw error;
    }
  },

  // Update OKR
  async updateOkr(id, data) {
    try {
      const response = await apiClient.put(`/mou/okrs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating OKR:', error);
      throw error;
    }
  },

  // Delete OKR
  async deleteOkr(id) {
    try {
      const response = await apiClient.delete(`/mou/okrs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting OKR:', error);
      throw error;
    }
  },

  // Get dashboard stats
  async getDashboard() {
    try {
      const response = await apiClient.get('/mou/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // ==================== ACTIVITIES ====================

  // Create new activity
  async createMouActivity(activityData) {
    try {
      const response = await apiClient.post('/mou/activities', activityData);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // Get activity detail
  async getMouActivity(activityId) {
    try {
      const response = await apiClient.get(`/mou/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting activity:', error);
      throw error;
    }
  },

  // Update activity
  async updateMouActivity(activityId, activityData) {
    try {
      const response = await apiClient.put(`/mou/activities/${activityId}`, activityData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete activity
  async deleteMouActivity(activityId) {
    try {
      const response = await apiClient.delete(`/mou/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  async deleteMouActivityAttachment(activityId, attachId) {
    try {
      const response = await apiClient.delete(`/mou/activities/${activityId}/attachments/${attachId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity attachment:', error);
      throw error;
    }
  },

};
