"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ChevronDown,
  FileText,
  DollarSign,
  LogOut,
  HandHelping,
  ClipboardList,
  User,
  Gift,
  TrendingUp,
  Briefcase,
  Search,
  Settings,
  FileCheck,
  ArrowDownUp,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { hasAdminPortalAccess } from "@/app/lib/access_routing";
import { MEMBER_BASE_MENU_ITEMS, MEMBER_DEPT_REVIEW_ITEM } from "@/app/lib/member_menu_config";
import { ADMIN_BASE_MENU_ITEMS } from "@/app/lib/admin_menu_config";

export default function Navigation({
  currentPage,
  setCurrentPage,
  handleNavigate,
  submenuOpen,
  setSubmenuOpen,
  closeMenu,
}) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRoute, setPendingRoute] = useState("");

  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;
  const isDeptHead = hasPermissionSnapshot
    ? hasPermission("ui.page.member.dept_review.view") || hasPermission("submission.read.department")
    : user?.role === "dept_head" || user?.user_role === "dept_head" || user?.role_id === 4;

  const canSwitchToAdminPortal = hasAdminPortalAccess(user);

  const adminIconById = {
    dashboard: LayoutDashboard,
    "research-dashboard": Search,
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

  const adminShortcutItems = ADMIN_BASE_MENU_ITEMS.filter((item) => {
    if (!hasPermissionSnapshot) {
      return true;
    }
    return item.requiredPermissions.some((code) => hasPermission(code));
  }).map((item) => ({
    id: `admin-${item.id}`,
    label: item.label,
    icon: adminIconById[item.id] || LayoutDashboard,
    route: item.route,
  }));

  const iconByMemberMenuId = {
    profile: User,
    "research-fund": TrendingUp,
    "promotion-fund": DollarSign,
    applications: ClipboardList,
    "received-funds": Gift,
    "approval-records": FileCheck,
    announcements: FileText,
    projects: Briefcase,
    "dept-review": HandHelping,
  };

  const menuItems = [
    ...MEMBER_BASE_MENU_ITEMS,
    ...(isDeptHead ? [MEMBER_DEPT_REVIEW_ITEM] : []),
  ].map((item) => ({
    ...item,
    icon: iconByMemberMenuId[item.id] || FileText,
    hasSubmenu: false,
  }));

  const visibleMemberItems = menuItems.filter((item) => {
    if (!item.requiredPermission) {
      return true;
    }
    if (!hasPermissionSnapshot) {
      return true;
    }
    return hasPermission(item.requiredPermission);
  });

  const closeMobileMenu = () => {
    if (typeof closeMenu === "function") {
      closeMenu();
    }
  };

  useEffect(() => {
    const routeItems = [...adminShortcutItems.slice(0, 2).map((item) => item.route)];
    routeItems.forEach((route) => {
      if (typeof router.prefetch === "function") {
        router.prefetch(route);
      }
    });
  }, [adminShortcutItems, menuItems, router]);

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
        closeMobileMenu();
        return;
      }

      if (handleNavigate) {
        handleNavigate(item.id);
      } else {
        setCurrentPage(item.id);
      }
      closeMobileMenu();
    }
  };

  const handleSubmenuClick = (parentId, submenuItem) => {
    if (handleNavigate) {
      handleNavigate(submenuItem.id);
    } else {
      setCurrentPage(submenuItem.id);
    }
    closeMobileMenu();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/login");
    }
  };

  const isActive = (itemId) => {
    return (
      currentPage === itemId ||
      (itemId === "submit-request" &&
        ["generic-fund-application", "application-form", "draft"].includes(currentPage))
    );
  };

  return (
    <nav className="pb-40 md:ms-4">
      {canSwitchToAdminPortal && adminShortcutItems.length > 0 ? (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">เมนูผู้ดูแล</p>
          {adminShortcutItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick({ ...item, hasSubmenu: false })}
                disabled={pendingRoute === item.route}
                className="flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors text-gray-700 disabled:opacity-60"
              >
                <item.icon size={20} />
                <span className="flex-1 text-left">{pendingRoute === item.route ? "กำลังเปิด..." : item.label}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-2 border-t border-gray-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">เมนูบุคลากร</p>
      </div>

      {visibleMemberItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleMenuClick(item)}
            className={`flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors ${
              isActive(item.id) ? "text-blue-500 font-semibold" : "text-gray-700"
            }`}
          >
            <item.icon size={20} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.hasSubmenu && (
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  submenuOpen && item.id === "submit-request" ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {item.hasSubmenu && submenuOpen && item.id === "submit-request" && (
            <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2">
              {item.submenu.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => handleSubmenuClick(item.id, subItem)}
                  className={`flex items-center gap-2 mb-2.5 w-full transition-colors ${
                    currentPage === subItem.id
                      ? "text-blue-500 font-semibold"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  <subItem.icon size={16} />
                  <span>{subItem.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

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
