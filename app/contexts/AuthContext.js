// contexts/AuthContext.js - Authentication Context for global state management
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, AuthError, NetworkError } from '../lib/api';

// Auth states
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLoginAttempt: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1,
        lastLoginAttempt: new Date(),
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loginAttempts: state.loginAttempts, // Keep login attempts
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        token: action.payload.token,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

// AuthProvider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const user = authAPI.getCurrentUser();
          const token = authAPI.getToken();
          
          if (user && token) {
            dispatch({
              type: AUTH_ACTIONS.SET_USER,
              payload: { user, token },
            });

            // Optionally verify token with server
            try {
              const profile = await authAPI.getProfile();
              if (profile.user) {
                dispatch({
                  type: AUTH_ACTIONS.SET_USER,
                  payload: { user: profile.user, token },
                });
              }
            } catch (error) {
              // If profile fetch fails, clear auth
              console.warn('Token validation failed:', error);
              handleLogout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleLogout();
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    // Check for rate limiting
    if (state.loginAttempts >= 5) {
      const timeSinceLastAttempt = new Date() - new Date(state.lastLoginAttempt);
      if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }
    }

    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(email, password);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.token,
        },
      });

      return response;
    } catch (error) {
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

      if (error instanceof AuthError) {
        errorMessage = error.message;
      } else if (error instanceof NetworkError) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });

      throw error;
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API error:', error);
    }

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Change password
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await authAPI.changePassword(currentPassword, newPassword, confirmPassword);
      return response;
    } catch (error) {
      throw error;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      
      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESH,
        payload: { token: response.token },
      });

      return response;
    } catch (error) {
      // If refresh fails, logout user
      handleLogout();
      throw error;
    }
  };

  // Update user profile
  const updateUser = (updatedUser) => {
    const currentToken = authAPI.getToken();
    authAPI.setAuth(currentToken, updatedUser);
    
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: { user: updatedUser, token: currentToken },
    });
  };

  // Check user role
  const hasRole = (role) => {
    if (!state.user) return false;
    
    if (typeof role === 'string') {
      return state.user.role === role;
    }
    
    if (typeof role === 'number') {
      return state.user.role_id === role;
    }

    return false;
  };

  // Check multiple roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!state.user) return '';
    return `${state.user.user_fname} ${state.user.user_lname}`;
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    if (!state.user) return '';
    
    const roleMap = {
      1: 'อาจารย์',
      2: 'เจ้าหน้าที่',
      3: 'ผู้ดูแลระบบ',
      teacher: 'อาจารย์',
      staff: 'เจ้าหน้าที่', 
      admin: 'ผู้ดูแลระบบ',
    };

    return roleMap[state.user.role_id] || roleMap[state.user.role] || state.user.position_name || 'ผู้ใช้';
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout: handleLogout,
    clearError,
    changePassword,
    refreshToken,
    updateUser,
    
    // Utilities
    hasRole,
    hasAnyRole,
    getUserDisplayName,
    getUserRoleDisplay,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for protecting routes
export function withAuth(Component, options = {}) {
  const { roles = [], redirectTo = '/login' } = options;

  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, hasAnyRole, user } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = redirectTo;
        return;
      }

      if (!isLoading && isAuthenticated && roles.length > 0) {
        if (!hasAnyRole(roles)) {
          window.location.href = '/unauthorized';
          return;
        }
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    if (roles.length > 0 && !hasAnyRole(roles)) {
      return null; // Will redirect in useEffect
    }

    return <Component {...props} />;
  };
}

export default AuthContext;