import apiClient from './api';

export const paperAIAPI = {
  extract(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postFormData('/paper-ai/extract', formData);
  },

  match(payload) {
    return apiClient.post('/paper-ai/match', payload);
  },

  summarize(payload) {
    return apiClient.post('/paper-ai/summarize', payload);
  },

  classify(payload) {
    return apiClient.post('/paper-ai/classify', payload);
  },
};

export default paperAIAPI;
