// app/components/AuthGuard.js
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import UnauthorizedPage from "./UnauthorizedPage";
import { hasAdminPortalAccess, hasMemberPortalAccess, normalizeRoleName } from "../lib/access_routing";
import { getLoginRedirect } from "../lib/auth_redirect.mjs";

const MEMBER_ALLOWED_ROLES = ['teacher', 'staff', 'dept_head'];

export const canAccess = (pathname, user) => {
  if (!pathname) {
    return true;
  }

  const roleValue = user?.role ?? user?.role_id ?? user;
  const normalizedRole = normalizeRoleName(roleValue);

  if (pathname.startsWith('/research-fund-system/admin') || pathname.startsWith('/admin')) {
    return hasAdminPortalAccess(user);
  }

  if (pathname.startsWith('/research-fund-system/executive') || pathname.startsWith('/executive')) {
    return normalizedRole === 'executive';
  }

  if (pathname.startsWith('/research-fund-system/member') || pathname.startsWith('/member')) {
    if (normalizedRole && MEMBER_ALLOWED_ROLES.includes(normalizedRole)) {
      return true;
    }
    return hasMemberPortalAccess(user);
  }

  return true;
};

export default function AuthGuard({
  children,
  allowedRoles = [], // [1, 2, 3] หรือ ['teacher', 'staff', 'admin']
  allowedPermissions = [],
  requireAuth = true,
  fallback = null
}) {
  const { isAuthenticated, isLoggingOut, user, isLoading, hasAnyRole, hasAnyPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    // รอให้ auth context โหลดเสร็จก่อน
    if (isLoading) return;

    // ถ้าต้องการ authentication แต่ยังไม่ได้ login
    if (requireAuth && !isAuthenticated) {
      const currentPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : pathname || '/';
      router.replace(getLoginRedirect({ isLoggingOut, currentPath }));
      return;
    }

    // ถ้า login แล้วแต่ไม่มีสิทธิ์ตาม role/permission ที่กำหนด
    if (isAuthenticated && (allowedRoles.length > 0 || allowedPermissions.length > 0)) {
      const roleMatched = allowedRoles.length > 0 ? hasAnyRole(allowedRoles) : false;
      const permissionMatched = allowedPermissions.length > 0 ? hasAnyPermission(allowedPermissions) : false;
      if (!roleMatched && !permissionMatched) {
        setShowUnauthorized(true);
        return;
      }
    }

    if (isAuthenticated) {
      if (!canAccess(pathname, user)) {
        setShowUnauthorized(true);
        return;
      }
    }

    // ถ้าผ่านการตรวจสอบทั้งหมด
    setShowUnauthorized(false);
  }, [
    isAuthenticated,
    isLoggingOut,
    user,
    isLoading,
    requireAuth,
    allowedRoles,
    allowedPermissions,
    hasAnyRole,
    hasAnyPermission,
    router,
    pathname,
  ]);

  // แสดง loading ขณะตรวจสอบ auth
  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-8 text-center" role="status" aria-live="polite">
          <Image
            src="/image_icon/fund_cpkku_logo.png"
            alt="โลโก้กองทุนวิจัย"
            width={96}
            height={96}
            className="h-20 w-auto object-contain"
            priority
          />
          <span className="mt-5 h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" aria-hidden="true" />
          <p className="mt-4 font-semibold text-slate-900">กำลังเตรียมหน้าให้คุณ</p>
          <p className="mt-1 text-sm text-slate-600">ระบบกำลังตรวจสอบบัญชีและสิทธิ์การใช้งาน</p>
        </div>
      </main>
    );
  }

  // ถ้าไม่มีสิทธิ์ ให้แสดงหน้า unauthorized
  if (showUnauthorized) {
    return fallback || <UnauthorizedPage />;
  }

  // ถ้าต้องการ auth แต่ยังไม่ได้ login (จะ redirect ใน useEffect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // ถ้าผ่านการตรวจสอบทั้งหมด ให้แสดง children
  return <>{children}</>;
}
