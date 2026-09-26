import apiClient from './api';

const root = '/admin/paper-ai/classification';

export const scopusClassificationAPI = {
  preview(params) { return apiClient.get(`${root}/preview`, params); },
  listRuns() { return apiClient.get(`${root}/runs`); },
  start(payload) { return apiClient.post(`${root}/runs`, payload); },
  getRun(id) { return apiClient.get(`${root}/runs/${id}`); },
  listItems(id, params) { return apiClient.get(`${root}/runs/${id}/items`, params); },
  stop(id) { return apiClient.post(`${root}/runs/${id}/stop`); },
  resume(id) { return apiClient.post(`${root}/runs/${id}/resume`); },
  retryFailed(id) { return apiClient.post(`${root}/runs/${id}/retry-failed`); },
};
