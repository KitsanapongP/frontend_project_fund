// lib/api.js - Updated API Client Service for Backend Communication
class APIClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    this.accessTokenKey = 'access_token';
    this.refreshTokenKey = 'refresh_token';
    this.userKey = 'user_data';
    this.sessionKey = 'session_id';
    
    // Keep old key for backward compatibility
    this.tokenKey = 'auth_token';
    
    this.refreshTimeout = null;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Get stored access token (try new key first, fallback to old)
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.accessTokenKey) || localStorage.getItem(this.tokenKey);
  }

  // Get stored refresh token
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user data
  getUser() {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Get session ID
  getSessionId() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.sessionKey);
  }

  // Store authentication data (updated for new system)
  setAuth(response) {
    if (typeof window === 'undefined') return;
    
    // Support both old and new response formats
    const accessToken = response.access_token || response.token;
    const refreshToken = response.refresh_token;
    const user = response.user;
    const sessionId = response.session_id;

    if (accessToken) {
      localStorage.setItem(this.accessTokenKey, accessToken);
      localStorage.setItem(this.tokenKey, accessToken); // Backward compatibility
    }
    
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    
    if (sessionId) {
      localStorage.setItem(this.sessionKey, sessionId.toString());
    }

    // Schedule token refresh if we have refresh token
    if (refreshToken && accessToken) {
      this.scheduleTokenRefresh(accessToken);
    }
  }

  // Legacy method for backward compatibility
  setAuthLegacy(token, user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.accessTokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear stored auth data
  clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.tokenKey); // Backward compatibility
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token expires within 5 minutes - should refresh
      if (payload.exp - currentTime < 300 && this.getRefreshToken()) {
        this.scheduleTokenRefresh(token, true); // immediate refresh
      }
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      this.clearAuth();
      return false;
    }
  }

  // Schedule automatic token refresh
  scheduleTokenRefresh(token, immediate = false) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!token || !this.getRefreshToken()) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh 2 minutes before expiry, or immediately if requested
      const refreshIn = immediate ? 100 : Math.max(0, (timeUntilExpiry - 120) * 1000);

      this.refreshTimeout = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Auto refresh failed:', error);
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }, refreshIn);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isRefreshing) {
      throw new AuthError('No refresh token available or refresh in progress');
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(data.error || 'Token refresh failed');
      }

      // Update stored access token
      localStorage.setItem(this.accessTokenKey, data.access_token);
      localStorage.setItem(this.tokenKey, data.access_token); // Backward compatibility
      
      // Update refresh token if provided (token rotation)
      if (data.refresh_token) {
        localStorage.setItem(this.refreshTokenKey, data.refresh_token);
      }

      // Schedule next refresh
      this.scheduleTokenRefresh(data.access_token);

      // Process failed requests queue
      this.processQueue(null, data.access_token);

      return data;
    } catch (error) {
      this.processQueue(error, null);
      this.clearAuth();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Process failed requests queue
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Make HTTP request with automatic auth headers and token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    return this.makeRequestWithRetry(url, options);
  }

  // Make request with automatic retry on token expiry
  async makeRequestWithRetry(url, options, retryCount = 0) {
    let token = this.getToken();

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

      // Handle token expiration with automatic refresh
      if (response.status === 401) {
        if ((data.code === 'TOKEN_EXPIRED' || data.code === 'SESSION_EXPIRED') && retryCount === 0) {
          // If currently refreshing, wait for it to complete
          if (this.isRefreshing) {
            try {
              const newToken = await new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              });
              
              // Retry with new token
              config.headers.Authorization = `Bearer ${newToken}`;
              return this.makeRequestWithRetry(url, config, retryCount + 1);
            } catch (refreshError) {
              throw new AuthError('Session expired. Please login again.');
            }
          }

          // Try to refresh token
          try {
            await this.refreshAccessToken();
            
            // Retry original request with new token
            const newToken = this.getToken();
            config.headers.Authorization = `Bearer ${newToken}`;
            
            return this.makeRequestWithRetry(url, config, retryCount + 1);
          } catch (refreshError) {
            // Refresh failed, clear auth and redirect
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new AuthError('Session expired. Please login again.');
          }
        } else {
          // Other auth errors or max retries reached
          this.clearAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new AuthError(data.error || 'Authentication failed');
        }
      }

      // Handle forbidden access
      if (response.status === 403) {
        throw new PermissionError(data.error || 'Access denied');
      }

      // Handle other errors
      if (!response.ok) {
        if (response.status >= 500) {
          throw new NetworkError(data.error || 'Server error occurred');
        } else {
          throw new APIError(data.error || 'Request failed', response.status, data.code);
        }
      }

      // Check for token expiry warning
      if (response.headers.get('X-Token-Expires-Soon') === 'true') {
        // Schedule refresh for soon-to-expire token
        this.scheduleTokenRefresh(token, true);
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError || error instanceof APIError || error instanceof NetworkError || error instanceof PermissionError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Unable to connect to server. Please check your connection.');
      }
      
      throw new NetworkError('Network error: ' + error.message);
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

// Custom Error Classes (unchanged)
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

// Updated Auth API methods
export const authAPI = {
  async login(email, password) {
    const response = await apiClient.post('/login', { email, password });
    
    // Support both old and new response formats
    if (response.access_token || response.token) {
      apiClient.setAuth(response);
    }
    
    return response;
  },

  async logout() {
    try {
      // Call logout endpoint to invalidate session
      await apiClient.post('/logout');
    } catch (error) {
      // Even if logout API fails, clear local storage
      console.warn('Logout endpoint error:', error);
    } finally {
      apiClient.clearAuth();
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

  // Legacy refresh token method (using current token)
  async refreshToken() {
    return apiClient.post('/refresh-token');
  },

  // New refresh token method (using refresh token)
  async refreshAccessToken() {
    return apiClient.refreshAccessToken();
  },

  // NEW: Session management methods
  async getSessions() {
    return apiClient.get('/sessions');
  },

  async revokeOtherSessions() {
    return apiClient.post('/sessions/revoke-others');
  },

  async revokeSession(sessionId) {
    return apiClient.delete(`/sessions/${sessionId}`);
  },

  async logoutAll() {
    try {
      await apiClient.post('/logout-all');
    } finally {
      apiClient.clearAuth();
    }
  },

  // Get current user from storage
  getCurrentUser() {
    return apiClient.getUser();
  },

  // Check if authenticated
  isAuthenticated() {
    return apiClient.isAuthenticated();
  },

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: apiClient.getSessionId(),
      hasRefreshToken: !!apiClient.getRefreshToken(),
    };
  },
};

// Applications API methods (unchanged)
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

// Dashboard API methods (unchanged)
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

// System data API methods (unchanged)
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

// Documents API methods (unchanged)
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

// Health check (unchanged)
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