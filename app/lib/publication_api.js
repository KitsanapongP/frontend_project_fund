// app/lib/publication_api.js - Publication Rewards API methods

import apiClient from './api';

export const publicationAPI = {
  // Get all publication rewards
  async getAll(filters = {}) {
    try {
      const response = await apiClient.get('/publication-rewards', filters);
      return response;
    } catch (error) {
      console.error('Error fetching publication rewards:', error);
      throw error;
    }
  },

  // Get single publication reward by ID
  async getById(id) {
    try {
      const response = await apiClient.get(`/publication-rewards/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching publication reward:', error);
      throw error;
    }
  },

  // Create new publication reward
  async create(formData) {
    try {
      // FormData is used for file uploads
      const response = await apiClient.postFormData('/publication-rewards', formData);
      return response;
    } catch (error) {
      console.error('Error creating publication reward:', error);
      throw error;
    }
  },

  // Update publication reward
  async update(id, data) {
    try {
      const response = await apiClient.put(`/publication-rewards/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating publication reward:', error);
      throw error;
    }
  },

  // Delete publication reward
  async delete(id) {
    try {
      const response = await apiClient.delete(`/publication-rewards/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting publication reward:', error);
      throw error;
    }
  },

  // Approve publication reward (admin only)
  async approve(id, comment = '') {
    try {
      const response = await apiClient.post(`/publication-rewards/${id}/approve`, { comment });
      return response;
    } catch (error) {
      console.error('Error approving publication reward:', error);
      throw error;
    }
  },

  // Reject publication reward (admin only)
  async reject(id, comment) {
    try {
      const response = await apiClient.post(`/publication-rewards/${id}/reject`, { comment });
      return response;
    } catch (error) {
      console.error('Error rejecting publication reward:', error);
      throw error;
    }
  },

  // Upload documents for publication reward
  async uploadDocuments(rewardId, formData) {
    try {
      const response = await apiClient.postFormData(`/publication-rewards/${rewardId}/documents`, formData);
      return response;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  },

  // Get documents for publication reward
  async getDocuments(rewardId) {
    try {
      const response = await apiClient.get(`/publication-rewards/${rewardId}/documents`);
      return response;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get reward rates configuration
  async getRewardRates(year = null) {
    try {
      const params = year ? { year } : {};
      const response = await apiClient.get('/publication-rewards/rates', params);
      return response;
    } catch (error) {
      console.error('Error fetching reward rates:', error);
      throw error;
    }
  },

  // Update reward rates (admin only)
  async updateRewardRates(rates) {
    try {
      const response = await apiClient.put('/publication-rewards/rates', rates);
      return response;
    } catch (error) {
      console.error('Error updating reward rates:', error);
      throw error;
    }
  }
};

// Helper API methods for form data
export const publicationFormAPI = {
  // Get users for co-author selection
  async getUsers(role = null) {
    try {
      const params = role ? { role } : {};
      const response = await apiClient.get('/users', params);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get document types for publication category
  async getDocumentTypes() {
    try {
      const response = await apiClient.get('/document-types', { category: 'publication' });
      return response;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  }
};

export default publicationAPI;