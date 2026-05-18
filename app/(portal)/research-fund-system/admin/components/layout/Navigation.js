// app/admin/components/layout/Navigation.js
"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  HandHelping,
  FileCheck,
  BookOpen,
  Briefcase,
  Bell,
  Search,
  ArrowDownUp,
  ShieldCheck,
  User,
  Gift,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { normalizeRoleName } from "@/app/lib/access_routing";
import { MEMBER_BASE_MENU_ITEMS, MEMBER_DEPT_REVIEW_ITEM } from "@/app/lib/member_menu_config";
import { ADMIN_BASE_MENU_ITEMS } from "@/app/lib/admin_menu_config";

export default function Navigation({ 
  currentPage, 
  setCurrentPage,
  handleNavigate, 
  submenuOpen, 
  setSubmenuOpen,
  isExecutive = false
}) {
  const ADMIN_BASE_PATH = "/research-fund-system/admin";
  const MEMBER_BASE_PATH = "/research-fund-system/member";
  const { logout, hasPermission, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRoute, setPendingRoute] = useState("");

  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;

  const adminIconById = {
    dashboard: LayoutDashboard,
    "research-dashboard": BarChart3,
    "research-fund": HandHelping,
    "promotion-fund": DollarSign,
    "applications-list": FileText,
    "scopus-research-search": Search,
    "fund-settings": Settings,
    projects: Briefcase,
    "approval-records": FileCheck,
    "import-export": ArrowDownUp,
    "academic-imports": BookOpen,
    "access-control": ShieldCheck,
  };

  const menuItemsWithPermissions = ADMIN_BASE_MENU_ITEMS.map((item) => ({
    ...item,
    icon: adminIconById[item.id] || LayoutDashboard,
    hasSubmenu: false,
  }));

  const canViewMenu = (item) => {
    if (!Array.isArray(item.requiredPermissions) || item.requiredPermissions.length === 0) {
      return true;
    }
    if (!hasPermissionSnapshot) {
      return true;
    }
    return item.requiredPermissions.some((code) => hasPermission(code));
  };

  const visibleMenuItems = isExecutive
    ? menuItemsWithPermissions.filter((item) => item.id === "dashboard")
    : menuItemsWithPermissions.filter(canViewMenu);

  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);
  const canAccessMemberPortal = ["teacher", "staff", "dept_head"].includes(normalizedRole);

  const memberShortcutIconById = {
    profile: User,
    "research-fund": HandHelping,
    "promotion-fund": DollarSign,
    applications: FileText,
    "received-funds": Gift,
    "approval-records": FileCheck,
    announcements: Bell,
    projects: Briefcase,
    "dept-review": ArrowLeftRight,
  };

  const memberShortcutBase = [...MEMBER_BASE_MENU_ITEMS, ...(normalizedRole === "dept_head" ? [MEMBER_DEPT_REVIEW_ITEM] : [])];

  const memberShortcutItems = canAccessMemberPortal
    ? memberShortcutBase.map((item) => ({
        id: `member-${item.id}`,
        label: item.label,
        icon: memberShortcutIconById[item.id] || User,
        route: `${MEMBER_BASE_PATH}/${item.id}`,
      }))
    : [];

  useEffect(() => {
    const adminRoutes = visibleMenuItems.slice(0, 4).map((item) => item.route || `${ADMIN_BASE_PATH}/${item.id}`);
    const memberRoutes = memberShortcutItems.slice(0, 2).map((item) => item.route);
    [...adminRoutes, ...memberRoutes].forEach((route) => {
      if (typeof router.prefetch === "function") {
        router.prefetch(route);
      }
    });
  }, [memberShortcutItems, router, visibleMenuItems]);

  useEffect(() => {
    if (!pendingRoute) {
      return;
    }
    if (pathname === pendingRoute) {
      setPendingRoute("");
    }
  }, [pathname, pendingRoute]);

  const navigateToRoute = (route) => {
    if (!route || pendingRoute === route) {
      return;
    }

    setPendingRoute(route);
    if (typeof router.prefetch === "function") {
      router.prefetch(route);
    }

    router.push(route);
  };

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setSubmenuOpen(!submenuOpen);
    } else {
      if (item.route) {
        navigateToRoute(item.route);
        return;
      }

      // ใช้ handleNavigate ถ้ามี ไม่งั้นใช้ setCurrentPage
      if (handleNavigate) {
        handleNavigate(item.id);
      } else {
        setCurrentPage(item.id);
      }
      // Close mobile menu if open
      const mobileMenuButton = document.querySelector('[aria-label="close-mobile-menu"]');
      if (mobileMenuButton) mobileMenuButton.click();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, still redirect to login
      router.replace('/login');
    }
  };

  const isActive = (itemId) => {
    return currentPage === itemId;
  };

  return (
    <nav className="pb-40 md:ms-4">
      <div className="mt-2"/>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">เมนูผู้ดูแล</p>
      {visibleMenuItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleMenuClick(item)}
            disabled={pendingRoute === (item.route || `${ADMIN_BASE_PATH}/${item.id}`)}
            className={`flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors ${
              isActive(item.id) ? 'text-blue-500 font-semibold' : 'text-gray-700'
            }`}
          >
            <item.icon size={20} />
            <div className="flex-1 text-left">
              <span>{pendingRoute === (item.route || `${ADMIN_BASE_PATH}/${item.id}`) ? "กำลังเปิด..." : item.label}</span>
              {item.description && (
                <span className="text-xs text-gray-500 block">{item.description}</span>
              )}
            </div>
          </button>
        </div>
      ))}

      {memberShortcutItems.length > 0 ? (
        <>
          <div className="mt-6 mb-3 border-t border-gray-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">เมนูบุคลากร</p>
          </div>
          {memberShortcutItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                disabled={pendingRoute === item.route}
                className="flex items-center gap-2 mb-2.5 w-full text-gray-700 hover:text-blue-500 transition-colors disabled:opacity-60"
              >
                <item.icon size={20} />
                <div className="flex-1 text-left">
                  <span>{pendingRoute === item.route ? "กำลังเปิด..." : item.label}</span>
                </div>
              </button>
            </div>
          ))}
        </>
      ) : null}

      {/* Logout Button */}
      <div className="border-t border-gray-200 mt-6 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
