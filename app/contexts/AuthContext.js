// contexts/AuthContext.js - Fixed Authentication Context
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Image from 'next/image';
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
  INIT_AUTH: 'INIT_AUTH',
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // เริ่มต้นเป็น true เพื่อรอการตรวจสอบ token
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_AUTH:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
      };

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
        isLoading: false, // ไม่ต้อง loading หลัง logout
        loginAttempts: state.loginAttempts,
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

  // ตรวจสอบ authentication ตอนเริ่มต้น
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
          try {
            let tokenNotExpired = true;

            if (token.includes('.')) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const currentTime = Date.now() / 1000;
              tokenNotExpired = payload.exp > currentTime;
            }

            if (tokenNotExpired) {
              let user = JSON.parse(userData);

              try {
                const profile = await authAPI.getProfileIfAuthenticated();
                if (profile?.user) {
                  user = profile.user;
                  localStorage.setItem('user_data', JSON.stringify(user));
                }
              } catch (profileError) {
                console.warn('Failed to sync profile on init, using cached user_data', profileError);
              }

              dispatch({
                type: AUTH_ACTIONS.INIT_AUTH,
                payload: {
                  user,
                  token,
                  isAuthenticated: true,
                },
              });
              return;
            }
          } catch (error) {
            console.warn('Cannot decode token expiry, fallback to profile check:', error);
          }
        }

        const profile = await authAPI.getProfileIfAuthenticated();
        if (profile?.user) {
          localStorage.setItem('user_data', JSON.stringify(profile.user));
          dispatch({
            type: AUTH_ACTIONS.INIT_AUTH,
            payload: {
              user: profile.user,
              token: null,
              isAuthenticated: true,
            },
          });
          return;
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        dispatch({
          type: AUTH_ACTIONS.INIT_AUTH,
          payload: {
            user: null,
            token: null,
            isAuthenticated: false,
          },
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        dispatch({
          type: AUTH_ACTIONS.INIT_AUTH,
          payload: {
            user: null,
            token: null,
            isAuthenticated: false,
          },
        });
      }
    };

    initAuth();
  }, []);

    // Login function
    const login = async (email, password) => {
    // Rate limiting
    if (state.loginAttempts >= 5) {
        const timeSinceLastAttempt = new Date() - state.lastLoginAttempt;
        if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
        throw new Error('มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที');
        }
    }

    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
        const response = await authAPI.login(email, password);
        
        // ตรวจสอบ response structure
        if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
        }
        
        // บันทึกลง localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        // ลบการเรียก authAPI.setAuth
        // authAPI.setAuth(response.token, response.user); // ลบบรรทัดนี้
        
        dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
            user: response.user,
            token: response.token,
        },
        });

        return response;
        
    } catch (error) {
        if (!(error instanceof AuthError)) {
        console.error('Login error:', error);
        }
        
        let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

        if (error instanceof AuthError) {
        errorMessage = error.message;
        } else if (error instanceof NetworkError) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        } else if (error.message) {
        errorMessage = error.message;
        }

        if (errorMessage === 'Invalid email or password') {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
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

    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_data');
    
    // ลบการเรียก authAPI.clearAuth
    // authAPI.clearAuth(); // ลบบรรทัดนี้
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
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
      
      // อัพเดท localStorage
      localStorage.setItem('auth_token', response.token);
      
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
    const currentToken = localStorage.getItem('auth_token');
    
    // อัพเดท localStorage
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: { user: updatedUser, token: currentToken },
    });
  };

  // Check user role
  const hasRole = (role) => {
    if (!state.user) return false;
    
    const userRoleRaw = state.user.role_id ?? state.user.role;
    const userRoleNumber = Number(userRoleRaw);
    const userRoleName = String(state.user.role ?? userRoleRaw ?? '').toLowerCase();
    
    if (typeof role === 'string') {
      return userRoleName === role.toLowerCase();
    }
    
    if (typeof role === 'number') {
      return userRoleRaw === role || userRoleNumber === role;
    }

    return false;
  };

  // Check multiple roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  const getPermissionSet = () => {
    const rawPermissions = state.user?.permissions;
    if (!Array.isArray(rawPermissions)) return new Set();
    return new Set(
      rawPermissions
        .map((perm) => String(perm || '').trim().toLowerCase())
        .filter(Boolean)
    );
  };

  const hasPermission = (permissionCode) => {
    if (!permissionCode) return false;
    const permissionSet = getPermissionSet();
    return permissionSet.has(String(permissionCode).trim().toLowerCase());
  };

  const hasAnyPermission = (permissionCodes = []) => {
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false;
    }
    const permissionSet = getPermissionSet();
    return permissionCodes.some((code) =>
      permissionSet.has(String(code || '').trim().toLowerCase())
    );
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!state.user) return '';

    const prefix =
      state.user.prefix ||
      state.user.prefix_name ||
      state.user.title ||
      '';
    const firstName = state.user.user_fname || state.user.first_name || '';
    const lastName = state.user.user_lname || state.user.last_name || '';

    return [prefix, firstName, lastName]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    if (!state.user) return '';
    
    const roleMap = {
      1: 'อาจารย์',
      2: 'เจ้าหน้าที่',
      3: 'ผู้ดูแลระบบ',
      4: 'หัวหน้าสาขา',
      5: 'ผู้บริหาร',
      teacher: 'อาจารย์',
      staff: 'เจ้าหน้าที่',
      admin: 'ผู้ดูแลระบบ',
      dept_head: 'หัวหน้าสาขา',
      executive: 'ผู้บริหาร',
    };

    const userRole = state.user.role_id || state.user.role;
    return roleMap[userRole] || state.user.position_name || 'ผู้ใช้';
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
    hasPermission,
    hasAnyPermission,
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
    const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

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
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4 text-center">
            <Image
              src="/image_icon/fund_cpkku_logo.png"
              alt="โลโก้กองทุนวิจัย"
              width={120}
              height={120}
              priority
            />
            <p className="text-gray-600">กำลังโหลดหน้า...</p>
            <p className="text-sm text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
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
