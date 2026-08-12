import apiClient from './api';

export const sdgAPI = {
  async listActive() {
    const response = await apiClient.get('/sdgs');
    return Array.isArray(response?.sdgs) ? response.sdgs : [];
  },

  async getForSubmission(submissionId) {
    const response = await apiClient.get(`/submissions/${submissionId}/sdgs`);
    return Array.isArray(response?.sdgs) ? response.sdgs : [];
  },

  async replaceForSubmission(submissionId, sdgIds) {
    const response = await apiClient.put(`/submissions/${submissionId}/sdgs`, { sdg_ids: sdgIds });
    return Array.isArray(response?.sdgs) ? response.sdgs : [];
  },
};

export default sdgAPI;
