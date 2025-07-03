'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Lock, Mail, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { healthAPI, AuthError, NetworkError } from '../lib/api';

export default function LoginPage() {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [checkingServer, setCheckingServer] = useState(true);

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Get user from auth context and redirect based on role
      redirectBasedOnRole();
    }
  }, [isAuthenticated]);

  // Check server health
  const checkServerHealth = async () => {
    setCheckingServer(true);
    try {
      const health = await healthAPI.check();
      setServerStatus({ status: 'online', message: health.message });
    } catch (error) {
      setServerStatus({ 
        status: 'offline', 
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' 
      });
    } finally {
      setCheckingServer(false);
    }
  };

  // Redirect based on user role
  const redirectBasedOnRole = () => {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');
    const userRole = user.role || user.role_id;
    
    if (userRole === 'teacher' || userRole === 1) {
      window.location.href = '/teacher';
    } else if (userRole === 'admin' || userRole === 3) {
      window.location.href = '/admin';
    } else if (userRole === 'staff' || userRole === 2) {
      window.location.href = '/staff';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing errors
    clearError();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      const response = await login(formData.email, formData.password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('remember_login', 'true');
      } else {
        localStorage.removeItem('remember_login');
      }

      // Redirect will be handled by useEffect when isAuthenticated changes
      console.log('Login successful:', response.message);
      
    } catch (error) {
      console.error('Login error:', error);
      // Error is already handled by the auth context
    }
  };

  const quickLogin = async (email, password) => {
    setFormData({ email, password });
    clearError();
    
    try {
      await login(email, password);
    } catch (error) {
      console.error('Quick login error:', error);
    }
  };

  // Sample accounts with updated credentials
  const sampleAccounts = [
    {
      label: 'ผู้ดูแลระบบ (Admin)',
      email: 'admin@cpkku.ac.th',
      password: 'Admin123!',
      color: 'purple',
    },
    {
      label: 'อาจารย์ (Teacher)', 
      email: 'teacher@cpkku.ac.th',
      password: 'Teacher123!',
      color: 'blue',
    },
    {
      label: 'อาจารย์ 2 (Teacher)', 
      email: 'teacher2@cpkku.ac.th',
      password: 'Teacher123!',
      color: 'blue',
    },
    {
      label: 'เจ้าหน้าที่ (Staff)',
      email: 'staff@cpkku.ac.th', 
      password: 'Staff123!',
      color: 'green',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-600 hover:bg-purple-700',
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Server Status Indicator */}
        {!checkingServer && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
            serverStatus?.status === 'online' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {serverStatus?.status === 'online' ? (
              <Wifi className="text-green-600" size={16} />
            ) : (
              <WifiOff className="text-red-600" size={16} />
            )}
            <span className={`text-sm font-medium ${
              serverStatus?.status === 'online' ? 'text-green-800' : 'text-red-800'
            }`}>
              {serverStatus?.status === 'online' ? 'เชื่อมต่อเซิร์ฟเวอร์สำเร็จ' : serverStatus?.message}
            </span>
            {serverStatus?.status === 'offline' && (
              <button
                onClick={checkServerHealth}
                className="ml-auto text-red-600 hover:text-red-700 text-sm underline"
              >
                ลองใหม่
              </button>
            )}
          </div>
        )}

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                F
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ระบบบริหารจัดการทุนวิจัย
          </h1>
          <p className="text-gray-600">
            วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LogIn size={24} />
              เข้าสู่ระบบ
            </h2>
          </div>

          {/* Form Body */}
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <span className="text-red-700 text-sm">{error}</span>
                  <button
                    onClick={clearError}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm underline"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="กรอกอีเมลของคุณ"
                    required
                    disabled={isLoading || serverStatus?.status === 'offline'}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="กรอกรหัสผ่านของคุณ"
                    required
                    disabled={isLoading || serverStatus?.status === 'offline'}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-600">จดจำการเข้าสู่ระบบ</span>
                </label>
                <button 
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password || serverStatus?.status === 'offline'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">บัญชีสำหรับทดสอบ:</h3>
          <div className="space-y-2 text-sm">
            {sampleAccounts.map((account, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded border hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{account.label}</div>
                  <div className="text-xs text-gray-500 font-mono">{account.email}</div>
                </div>
                <button
                  onClick={() => quickLogin(account.email, account.password)}
                  className={`px-3 py-1 text-white text-xs rounded transition-colors ${getColorClasses(account.color)}`}
                  disabled={isLoading || serverStatus?.status === 'offline'}
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            ))}
          </div>
          
          {/* API Endpoint Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus?.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                API Endpoint: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น</p>
          <p className="mt-1">Fund Management System v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0'}</p>
        </div>
      </div>
    </div>
  );
}