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
import { PortalBackLink, PortalNavIcon } from "@/app/components/portal/PortalChrome";

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

  const adminToneById = {
    dashboard: "blue",
    "research-dashboard": "violet",
    "research-fund": "emerald",
    "promotion-fund": "amber",
    "applications-list": "sky",
    "scopus-research-search": "violet",
    "fund-settings": "slate",
    projects: "teal",
    "approval-records": "emerald",
    "import-export": "sky",
    "academic-imports": "violet",
    "access-control": "rose",
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
    tone: adminToneById[item.id] || "blue",
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

  const toneByMemberMenuId = {
    profile: "indigo",
    "research-fund": "emerald",
    "promotion-fund": "amber",
    applications: "sky",
    "received-funds": "teal",
    "approval-records": "emerald",
    announcements: "amber",
    projects: "violet",
    "dept-review": "rose",
  };

  const menuItems = [
    ...MEMBER_BASE_MENU_ITEMS,
    ...(isDeptHead ? [MEMBER_DEPT_REVIEW_ITEM] : []),
  ].map((item) => ({
    ...item,
    icon: iconByMemberMenuId[item.id] || FileText,
    tone: toneByMemberMenuId[item.id] || "blue",
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
    <nav className="space-y-1 pb-40" aria-label="เมนูระบบกองทุน">
      {canSwitchToAdminPortal && adminShortcutItems.length > 0 ? (
        <div className="pt-1">
          <p className="portal-nav-section-label">เมนูผู้ดูแล</p>
          {adminShortcutItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick({ ...item, hasSubmenu: false })}
                disabled={pendingRoute === item.route}
                className="portal-nav-item group disabled:cursor-wait disabled:opacity-60"
              >
                <PortalNavIcon icon={item.icon} tone={item.tone} />
                <span className="flex-1 text-left">{pendingRoute === item.route ? "กำลังเปิด..." : item.label}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-slate-200 pt-4">
        <p className="portal-nav-section-label">เมนูบุคลากร</p>
      </div>

      {visibleMemberItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleMenuClick(item)}
            className={`portal-nav-item group ${isActive(item.id) ? "portal-nav-item--active" : ""}`}
          >
            <PortalNavIcon icon={item.icon} tone={item.tone} />
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
            <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-2 animate-in slide-in-from-top-2">
              {item.submenu.map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => handleSubmenuClick(item.id, subItem)}
                  className={`portal-nav-item group min-h-10 py-1.5 ${currentPage === subItem.id ? "portal-nav-item--active" : ""}`}
                >
                  <PortalNavIcon icon={subItem.icon} tone="sky" size={16} className="h-7 w-7" />
                  <span>{subItem.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="mt-5 border-t border-slate-200 pt-4">
        <PortalBackLink placement="nav" onNavigate={closeMobileMenu} />
        <button
          onClick={handleLogout}
          className="portal-nav-item portal-nav-item--danger group"
        >
          <PortalNavIcon icon={LogOut} tone="red" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
