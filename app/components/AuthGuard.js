// app/components/AuthGuard.js
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import UnauthorizedPage from "./UnauthorizedPage";
import { hasAdminPortalAccess, hasMemberPortalAccess, normalizeRoleName } from "../lib/access_routing";

const MEMBER_ALLOWED_ROLES = ['teacher', 'staff', 'dept_head'];

export const canAccess = (pathname, user) => {
  if (!pathname) {
    return true;
  }

  const roleValue = user?.role ?? user?.role_id ?? user;
  const normalizedRole = normalizeRoleName(roleValue);

  if (pathname.startsWith('/admin')) {
    return hasAdminPortalAccess(user);
  }

  if (pathname.startsWith('/executive')) {
    return normalizedRole === 'executive';
  }

  if (pathname.startsWith('/member')) {
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
  const { isAuthenticated, user, isLoading, hasAnyRole, hasAnyPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    // รอให้ auth context โหลดเสร็จก่อน
    if (isLoading) return;

    // ถ้าต้องการ authentication แต่ยังไม่ได้ login
    if (requireAuth && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }

    // ถ้า login แล้วแต่ไม่มีสิทธิ์ตาม role/permission ที่กำหนด
    if (isAuthenticated && (allowedRoles.length > 0 || allowedPermissions.length > 0)) {
      const roleMatched = allowedRoles.length > 0 ? hasAnyRole(allowedRoles) : false;
      const permissionMatched = allowedPermissions.length > 0 ? hasAnyPermission(allowedPermissions) : false;
      const pathMatched = canAccess(pathname, user);
      if (!roleMatched && !permissionMatched && !pathMatched) {
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
