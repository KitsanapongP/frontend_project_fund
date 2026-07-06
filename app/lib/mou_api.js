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

  // Get expired MOUs for renewal selection
  async getExpiredMous() {
    try {
      const response = await apiClient.get('/mou/expired');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching expired MOUs:', error);
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

  // Get partner types
  async getMouPartnerTypes() {
    try {
      const response = await apiClient.get('/mou/partner-types');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching partner types:', error);
      throw error;
    }
  },

  // Create partner type
  async createPartnerType(data) {
    try {
      const response = await apiClient.post('/mou/partner-types', data);
      return response.data;
    } catch (error) {
      console.error('Error creating partner type:', error);
      throw error;
    }
  },

  // Update partner type
  async updatePartnerType(id, data) {
    try {
      const response = await apiClient.put(`/mou/partner-types/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating partner type:', error);
      throw error;
    }
  },

  // Delete partner type
  async deletePartnerType(id) {
    try {
      const response = await apiClient.delete(`/mou/partner-types/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting partner type:', error);
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
  async getDashboard(year) {
    try {
      const response = await apiClient.get('/mou/dashboard', year ? { year } : {});
      return response;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // Get MOUs active in a given year
  async getActiveByYear(year) {
    try {
      const response = await apiClient.get(`/mou/active-by-year?year=${year}`);
      return response;
    } catch (error) {
      console.error('Error fetching active MOUs by year:', error);
      throw error;
    }
  },

  // Get notifications (near expiry & expired)
  async getNotifications() {
    try {
      const response = await apiClient.get('/mou/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Export MOU list as CSV
  async exportMouCsv(filters = {}) {
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.partner_name) params.append('partner_name', filters.partner_name);
    if (filters.country) params.append('country', filters.country);
    if (filters.status) params.append('status', filters.status);
    if (filters.level) params.append('level', filters.level);
    if (filters.is_international) params.append('is_international', filters.is_international);
    return `/mou/export${params.toString() ? `?${params}` : ''}`;
  },

  // Send pending email notifications for expiring MOUs
  async sendMouNotifications() {
    const response = await apiClient.post('/mou/send-notifications');
    return response.data;
  },

  // Renew an MOU with a new end date
  async renewMou(id, newEndDate) {
    const response = await apiClient.put(`/mou/${id}/renew`, { new_end_date: newEndDate });
    return response.data;
  },

  // Refresh MOU statuses based on dates
  async refreshStatuses() {
    const response = await apiClient.post('/mou/refresh-statuses');
    return response.data;
  },

  // ==================== NOTIFICATION SETTINGS ====================

  // Get notification settings
  async getNotificationSettings() {
    try {
      const response = await apiClient.get('/mou/notification-settings');
      return response;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  // Update notification settings
  async updateNotificationSettings(data) {
    try {
      const response = await apiClient.put('/mou/notification-settings', data);
      return response;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // List all potential notification recipients
  async listNotificationRecipients() {
    try {
      const response = await apiClient.get('/mou/notification-recipients');
      return response;
    } catch (error) {
      console.error('Error fetching notification recipients:', error);
      throw error;
    }
  },

  // Get notification email preview for a specific MOU
  async getNotificationPreview(mouId, settings = null) {
    try {
      let endpoint = `/mou/notification-preview?mou_id=${mouId}`;
      if (settings) {
        if (settings.include_mou_code !== undefined) endpoint += `&include_mou_code=${settings.include_mou_code}`;
        if (settings.include_title !== undefined) endpoint += `&include_title=${settings.include_title}`;
        if (settings.include_partner !== undefined) endpoint += `&include_partner=${settings.include_partner}`;
        if (settings.include_dates !== undefined) endpoint += `&include_dates=${settings.include_dates}`;
        if (settings.include_level !== undefined) endpoint += `&include_level=${settings.include_level}`;
        if (settings.include_status !== undefined) endpoint += `&include_status=${settings.include_status}`;
      }
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching notification preview:', error);
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
