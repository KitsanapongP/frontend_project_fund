'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        // Basic JWT token validation
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          // Token is valid, redirect based on user role
          const user = JSON.parse(userData);
          const userRole = user.role || user.role_id;
          
          if (userRole === 'teacher' || userRole === 1) {
            router.replace('/teacher');
          } else if (userRole === 'admin' || userRole === 3) {
            router.replace('/admin');
          } else if (userRole === 'staff' || userRole === 2) {
            router.replace('/staff');
          } else {
            router.replace('/dashboard');
          }
          return;
        }
      } catch (error) {
        // Invalid token, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    
    // Not authenticated, redirect to login
    router.replace('/login');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              F
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ระบบบริหารจัดการทุนวิจัย
        </h1>
        
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span>กำลังตรวจสอบสิทธิ์...</span>
        </div>
      </div>
    </div>
  );
}