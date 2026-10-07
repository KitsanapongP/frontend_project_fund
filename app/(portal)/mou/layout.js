"use client";

import AuthGuard from "../../components/AuthGuard";
import { usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import UnauthorizedPage from "../../components/UnauthorizedPage";

export default function MouLayout({ children }) {
  const pathname = usePathname();
  const { hasPermission, hasRole, isLoading } = useAuth();
  const managePage = pathname === "/mou/add_mou" ||
    pathname === "/mou/add_activity_mou" ||
    pathname.startsWith("/mou/admin_edit_mou/");
  const adminPage = pathname.startsWith("/mou/admin_manage_type") ||
    pathname === "/mou/admin_notification_settings";

  return (
    <AuthGuard allowedPermissions={["mou.read"]}>
      {!isLoading && managePage && !hasPermission("mou.manage") ? <UnauthorizedPage /> :
        !isLoading && adminPage && !hasRole("admin") ? <UnauthorizedPage /> : children}
    </AuthGuard>
  );
}
