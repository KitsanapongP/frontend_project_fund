'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  Send,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, passwordAPI, APIError, NetworkError } from '../../lib/api';
import { sanitizeNextPath } from '../../lib/portal_access';

export default function LoginPage() {
  const {
    login,
    isLoading,
    error,
    clearError,
    completeLogoutRedirect,
    isAuthenticated,
    user,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ssoErrorCode = searchParams?.get('error') || '';
  const nextPath = useMemo(() => sanitizeNextPath(searchParams?.get('next') || ''), [searchParams]);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  // Set true after a successful manual (email/password) login so the redirect effect is
  // not blocked by a stale ?error= param left over from a rejected SSO attempt.
  const [manualAuth, setManualAuth] = useState(false);
  const [mode, setMode] = useState('login');
  const [globalMessage, setGlobalMessage] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ message: '', error: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  const [resetForm, setResetForm] = useState({
    token: '',
    new_password: '',
    confirm_password: ''
  });
  const [resetStatus, setResetStatus] = useState({ message: '', error: '' });
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    completeLogoutRedirect();
  }, [completeLogoutRedirect]);

  // Redirect if already authenticated
  useEffect(() => {
    // An SSO error in the URL suppresses auto-redirect so the error stays visible — but
    // once the user has logged in manually, allow the redirect to proceed.
    if (ssoErrorCode && !manualAuth) {
      return;
    }

    if (isAuthenticated && user && !redirecting) {
      setRedirecting(true);
      const targetPath = nextPath || '/';
      setTimeout(() => {
        router.replace(targetPath);
      }, 100);
    }
  }, [isAuthenticated, user, redirecting, ssoErrorCode, manualAuth, nextPath, router]);

  useEffect(() => {
    if (!ssoErrorCode || typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_id');
  }, [ssoErrorCode]);

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

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Manual login succeeded — allow the redirect effect to run even if a stale SSO
      // ?error= is still present in the URL.
      setManualAuth(true);

      // เธญเธขเนเธฒเธ—เธณเธเธฒเธฃ redirect เธ—เธตเนเธเธตเน เนเธซเน useEffect เธเธฑเธ”เธเธฒเธฃ
      // เน€เธเธฃเธฒเธฐ login function เธเธฐ update isAuthenticated เนเธฅเธฐ user state
      
    } catch (error) {
      if (!error?.name || error?.name !== 'AuthError') {
        console.error('Login error:', error);
      }
      // Error เธเธฐเธ–เธนเธ handle เนเธ AuthContext เนเธฅเนเธง
    }
  };

  const handleSSOLogin = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.location.href = authAPI.getSSOLoginURL();
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === 'forgot') {
      router.push('/forgot-password');
      return;
    }

    if (nextMode === 'reset') {
      const tokenParam = searchParams?.get('token') || resetForm.token.trim();
      const target = tokenParam
        ? `/reset-password?token=${encodeURIComponent(tokenParam)}`
        : '/reset-password';
      router.push(target);
      return;
    }

    if (nextMode !== 'login' && error) {
      clearError();
    }

    if (nextMode === 'login') {
      setForgotEmail('');
      setForgotStatus({ message: '', error: '' });
      setResetStatus({ message: '', error: '' });
      setResetForm(prev => ({
        token: searchParams?.get('token') || prev.token,
        new_password: '',
        confirm_password: ''
      }));
      setMode('login');
    }
  };

  const handleForgotSubmit = async (event) => {
    event.preventDefault();

    setForgotStatus({ message: '', error: '' });

    const sanitizedEmail = forgotEmail.trim();
    if (!sanitizedEmail) {
      setForgotStatus({ message: '', error: 'กรุณากรอกอีเมลที่ใช้ลงทะเบียน' });
      return;
    }

    setForgotLoading(true);
    try {
      await passwordAPI.requestReset({ email: sanitizedEmail });
      setForgotStatus({
        message:
          'หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องอีเมลของคุณ',
        error: ''
      });
    } catch (err) {
      const message = err instanceof NetworkError || err instanceof APIError ? err.message : 'ไม่สามารถส่งคำขอได้ในขณะนี้';
      setForgotStatus({ message: '', error: message });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();

    setResetStatus({ message: '', error: '' });

    if (!resetForm.token.trim()) {
      setResetStatus({ message: '', error: 'กรุณากรอกโทเคนสำหรับตั้งรหัสผ่านใหม่' });
      return;
    }

    if (resetForm.new_password.length < 8) {
      setResetStatus({ message: '', error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
      return;
    }

    if (resetForm.new_password !== resetForm.confirm_password) {
      setResetStatus({ message: '', error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    setResetLoading(true);
    try {
      await passwordAPI.resetPassword({
        token: resetForm.token.trim(),
        new_password: resetForm.new_password,
        confirm_password: resetForm.confirm_password
      });

      setGlobalMessage('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ');
      setResetForm({ token: '', new_password: '', confirm_password: '' });
      handleModeChange('login');
      router.replace('/login');
    } catch (err) {
      const message = err instanceof NetworkError || err instanceof APIError ? err.message : 'ไม่สามารถตั้งรหัสผ่านใหม่ได้ในขณะนี้';
      setResetStatus({ message: '', error: message });
    } finally {
      setResetLoading(false);
    }
  };

  const modeTitle = useMemo(() => {
    switch (mode) {
      case 'forgot':
        return 'ลืมรหัสผ่าน';
      case 'reset':
        return 'ตั้งรหัสผ่านใหม่';
      default:
        return 'เข้าสู่ระบบ';
    }
  }, [mode]);

  const modeDescription = useMemo(() => {
    switch (mode) {
      case 'forgot':
        return 'กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่';
      case 'reset':
        return 'กรอกโทเคนและรหัสผ่านใหม่เพื่อเข้าใช้งานระบบอีกครั้ง';
      default:
        return 'เข้าสู่ระบบเพื่อใช้งานระบบกองทุนวิจัยฯ';
    }
  }, [mode]);

  const ssoErrorMessage = useMemo(() => {
    if (!ssoErrorCode) {
      return '';
    }

    const messageMap = {
      sso_missing_code: 'ไม่พบรหัสยืนยันจาก KKU SSO กรุณาลองใหม่อีกครั้ง',
      sso_failed: 'เข้าสู่ระบบผ่าน KKU SSO ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      sso_not_configured: 'ระบบยังไม่ได้ตั้งค่า KKU SSO สำหรับสภาพแวดล้อมนี้',
      sso_user_not_allowed: 'บัญชีอีเมลนี้ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ',
    };

    return messageMap[ssoErrorCode] || 'เกิดข้อผิดพลาดจาก KKU SSO';
  }, [ssoErrorCode]);

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      router.replace(`/reset-password?token=${encodeURIComponent(tokenParam)}`);
    }
  }, [searchParams, router]);

  // เนเธชเธ”เธ loading screen เธเธ“เธฐ redirecting
  if (redirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <Image
            src="/image_icon/fund_cpkku_logo.png"
            alt="ระบบกองทุนวิจัย วิทยาลัยการคอมพิวเตอร์"
            width={112}
            height={112}
            className="object-contain"
            priority
          />

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบสำเร็จ</h1>
            <p className="mt-1 text-sm text-slate-600">กำลังนำคุณไปยังหน้าที่ร้องขอ</p>
          </div>

          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" role="status" aria-label="กำลังเปลี่ยนหน้า" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="login-title">
        <aside className="hidden flex-col justify-between border-r border-blue-100 bg-blue-50 p-10 lg:flex">
          <div>
            <div className="flex items-center gap-5">
              <Image
                src="/image_icon/iconcpkku.png"
                alt="วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น"
                width={176}
                height={92}
                className="h-auto object-contain"
                priority
              />
              <span className="h-14 w-px bg-blue-200" aria-hidden="true" />
              <Image
                src="/image_icon/fund_cpkku_logo.png"
                alt="ระบบกองทุนวิจัย"
                width={82}
                height={82}
                className="object-contain"
                priority
              />
            </div>
            <div className="mt-12 max-w-sm">
              <h2 className="text-3xl font-semibold leading-tight text-slate-900">ระบบบริหารจัดการทุนวิจัย</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-blue-200 pt-6 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
            <p>เข้าสู่ระบบด้วยบัญชี หรือใช้บัญชี KKU SSO</p>
          </div>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-5 flex items-center justify-center gap-5 lg:hidden">
              <Image
                src="/image_icon/iconcpkku.png"
                alt="วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น"
                width={150}
                height={84}
                className="object-contain"
                priority
              />
              <Image
                src="/image_icon/fund_cpkku_logo.png"
                alt="ระบบกองทุนวิจัย"
                width={76}
                height={76}
                className="object-contain"
                priority
              />
            </div>

            <h1 id="login-title" className="text-2xl font-semibold text-slate-900">{modeTitle}</h1>

            <p className="mt-2 text-slate-600">{modeDescription}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              กลับหน้าหลัก
            </button>
          </div>

          {globalMessage && mode === 'login' && (
            <div className="mb-6 flex items-start rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <span className="ml-3">{globalMessage}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block min-h-12 w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder='กรุณากรอกอีเมล'
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block min-h-12 w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder='กรุณากรอกรหัสผ่าน'
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {ssoErrorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{ssoErrorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" aria-hidden="true"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-slate-500">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  onClick={handleSSOLogin}
                >
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                  Login with KKU SSO
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-6">
              {forgotStatus.error && (
                <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                  <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
                  <span className="ml-3">{forgotStatus.error}</span>
                </div>
              )}

              {forgotStatus.message && (
                <div className="flex items-start rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700" role="status">
                  <Send className="w-5 h-5 mt-0.5 text-blue-500" />
                  <span className="ml-3">{forgotStatus.message}</span>
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  อีเมลที่ใช้ลงทะเบียน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="forgot-email"
                    name="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={forgotEmail}
                    onChange={event => setForgotEmail(event.target.value)}
                    className="block min-h-12 w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {forgotLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      ส่งลิงก์ตั้งรหัสผ่านใหม่
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              {resetStatus.error && (
                <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                  <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
                  <span className="ml-3">{resetStatus.error}</span>
                </div>
              )}

              {resetStatus.message && (
                <div className="flex items-start rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700" role="status">
                  <ShieldCheck className="w-5 h-5 mt-0.5 text-green-500" />
                  <span className="ml-3">{resetStatus.message}</span>
                </div>
              )}

              <div>
                <label htmlFor="reset-token" className="mb-2 block text-sm font-semibold text-slate-700">
                  โทเคนสำหรับตั้งรหัสผ่านใหม่
                </label>
                <input
                  id="reset-token"
                  name="token"
                  type="text"
                  value={resetForm.token}
                  onChange={handleResetChange}
                  className="block min-h-12 w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder='วางโทเคนจากอีเมลที่ได้รับ'
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="new-password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={resetForm.new_password}
                    onChange={handleResetChange}
                    className="block min-h-12 w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder='กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)'
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={resetForm.confirm_password}
                    onChange={handleResetChange}
                    className="block min-h-12 w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder='ยืนยันรหัสผ่านใหม่'
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {resetLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังบันทึกรหัสผ่าน...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      ตั้งรหัสผ่านใหม่
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}
