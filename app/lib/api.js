// lib/api.js - API Client Service for Backend Communication
class APIClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
  }

  // Get stored token
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user data
  getUser() {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Store token and user data
  setAuth(token, user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear stored auth data
  clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      this.clearAuth();
      return false;
    }
  }

  // Make HTTP request with automatic auth headers
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Default options
    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        this.clearAuth();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new AuthError('Session expired. Please login again.');
      }

      // Handle other auth errors
      if (response.status === 401) {
        this.clearAuth();
        throw new AuthError(data.error || 'Authentication failed');
      }

      // Handle forbidden access
      if (response.status === 403) {
        throw new PermissionError(data.error || 'Access denied');
      }

      // Handle other errors
      if (!response.ok) {
        throw new APIError(data.error || 'Request failed', response.status, data.code);
      }

      return data;
    } catch (error) {
      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // File upload
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = this.getToken();
    const headers = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }
}

// Custom Error Classes
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

class AuthError extends APIError {
  constructor(message) {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

class PermissionError extends APIError {
  constructor(message) {
    super(message, 403, 'PERMISSION_ERROR');
    this.name = 'PermissionError';
  }
}

class NetworkError extends APIError {
  constructor(message) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Auth API methods
export const authAPI = {
  async login(email, password) {
    const response = await apiClient.post('/login', { email, password });
    
    if (response.token && response.user) {
      apiClient.setAuth(response.token, response.user);
    }
    
    return response;
  },

  async logout() {
    // Clear local storage
    apiClient.clearAuth();
    
    // Optional: Call logout endpoint if it exists
    try {
      await apiClient.post('/logout');
    } catch (error) {
      // Ignore logout endpoint errors
      console.warn('Logout endpoint error:', error);
    }
  },

  async getProfile() {
    return apiClient.get('/profile');
  },

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return apiClient.put('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  },

  async refreshToken() {
    return apiClient.post('/refresh-token');
  },

  // Get current user from storage
  getCurrentUser() {
    return apiClient.getUser();
  },

  // Check if authenticated
  isAuthenticated() {
    return apiClient.isAuthenticated();
  },
};

// Applications API methods
export const applicationsAPI = {
  async getAll(filters = {}) {
    return apiClient.get('/applications', filters);
  },

  async getById(id) {
    return apiClient.get(`/applications/${id}`);
  },

  async create(applicationData) {
    return apiClient.post('/applications', applicationData);
  },

  async update(id, applicationData) {
    return apiClient.put(`/applications/${id}`, applicationData);
  },

  async delete(id) {
    return apiClient.delete(`/applications/${id}`);
  },

  async approve(id, approvedAmount, comment) {
    return apiClient.post(`/applications/${id}/approve`, {
      approved_amount: approvedAmount,
      comment,
    });
  },

  async reject(id, comment) {
    return apiClient.post(`/applications/${id}/reject`, { comment });
  },
};

// Dashboard API methods
export const dashboardAPI = {
  async getStats() {
    return apiClient.get('/dashboard/stats');
  },

  async getBudgetSummary(yearId = null) {
    const params = yearId ? { year_id: yearId } : {};
    return apiClient.get('/dashboard/budget-summary', params);
  },

  async getApplicationsSummary(filters = {}) {
    return apiClient.get('/dashboard/applications-summary', filters);
  },
};

// System data API methods
export const systemAPI = {
  async getYears() {
    return apiClient.get('/years');
  },

  async getCategories(yearId = null) {
    const params = yearId ? { year_id: yearId } : {};
    return apiClient.get('/categories', params);
  },

  async getSubcategories(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {};
    return apiClient.get('/subcategories', params);
  },

  async getDocumentTypes() {
    return apiClient.get('/documents/types');
  },
};

// Documents API methods
export const documentsAPI = {
  async upload(applicationId, file, documentTypeId) {
    return apiClient.uploadFile(`/documents/upload/${applicationId}`, file, {
      document_type_id: documentTypeId,
    });
  },

  async getByApplication(applicationId) {
    return apiClient.get(`/documents/application/${applicationId}`);
  },

  async download(documentId) {
    const token = apiClient.getToken();
    const url = `${apiClient.baseURL}/documents/download/${documentId}`;
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('target', '_blank');
    
    if (token) {
      // For file downloads, we might need to handle this differently
      // This is a simplified version - you might need to use a different approach
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => response.blob())
        .then(blob => {
          const downloadUrl = window.URL.createObjectURL(blob);
          link.href = downloadUrl;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        });
    } else {
      link.click();
    }
  },

  async delete(documentId) {
    return apiClient.delete(`/documents/${documentId}`);
  },
};

// Health check
export const healthAPI = {
  async check() {
    return apiClient.get('/health');
  },

  async getInfo() {
    return apiClient.get('/info');
  },
};

// Export error classes for error handling in components
export { APIError, AuthError, PermissionError, NetworkError };

// Export the main client for advanced usage
export default apiClient;