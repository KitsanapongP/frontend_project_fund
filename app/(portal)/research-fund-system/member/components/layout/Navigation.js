"use client";

import { useEffect, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { hasAdminPortalAccess } from "@/app/lib/access_routing";
import {
  MEMBER_BASE_MENU_ITEMS,
  MEMBER_DEPT_REVIEW_ITEM,
  MEMBER_MENU_GROUPS,
} from "@/app/lib/member_menu_config";
import { ADMIN_BASE_MENU_ITEMS, ADMIN_MENU_GROUPS } from "@/app/lib/admin_menu_config";
import {
  ADMIN_MENU_PRESENTATION,
  MEMBER_MENU_PRESENTATION,
  RESEARCH_FUND_PAGE_ICONS,
} from "@/app/lib/research_fund_menu_presentation";
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

  const adminShortcutItems = ADMIN_BASE_MENU_ITEMS.filter((item) => {
    if (!hasPermissionSnapshot) {
      return true;
    }
    return item.requiredPermissions.some((code) => hasPermission(code));
  }).map((item) => ({
    id: `admin-${item.id}`,
    label: item.label,
    icon: ADMIN_MENU_PRESENTATION[item.id]?.icon || RESEARCH_FUND_PAGE_ICONS.dashboard,
    tone: ADMIN_MENU_PRESENTATION[item.id]?.tone || "blue",
    route: item.route,
  }));

  const menuItems = [
    ...MEMBER_BASE_MENU_ITEMS,
    ...(isDeptHead ? [MEMBER_DEPT_REVIEW_ITEM] : []),
  ].map((item) => ({
    ...item,
    icon: MEMBER_MENU_PRESENTATION[item.id]?.icon || RESEARCH_FUND_PAGE_ICONS.applications,
    tone: MEMBER_MENU_PRESENTATION[item.id]?.tone || "blue",
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

  const adminShortcutGroups = ADMIN_MENU_GROUPS.map((group) => ({
    ...group,
    items: group.itemIds
      .map((itemId) => adminShortcutItems.find((item) => item.id === `admin-${itemId}`))
      .filter(Boolean),
  })).filter((group) => group.items.length > 0);

  const visibleMemberGroups = MEMBER_MENU_GROUPS.map((group) => ({
    ...group,
    items: group.itemIds
      .map((itemId) => visibleMemberItems.find((item) => item.id === itemId))
      .filter(Boolean),
  })).filter((group) => group.items.length > 0);

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
      {canSwitchToAdminPortal && adminShortcutGroups.length > 0 ? (
        <div className="pt-1">
          <p className="portal-nav-portal-label">เมนูผู้ดูแล</p>
          {adminShortcutGroups.map((group, groupIndex) => (
            <section key={group.id} className={groupIndex > 0 ? "pt-4" : ""} aria-label={group.label}>
              <p className="portal-nav-section-label">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick({ ...item, hasSubmenu: false })}
                    disabled={pendingRoute === item.route}
                    className="portal-nav-item group disabled:cursor-wait disabled:opacity-60"
                  >
                    <PortalNavIcon icon={item.icon} tone={item.tone} />
                    <span className="flex-1 text-left">{pendingRoute === item.route ? "กำลังเปิด..." : item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <div className={canSwitchToAdminPortal && adminShortcutGroups.length > 0 ? "mt-5 border-t border-slate-200 pt-4" : ""}>
        <p className="portal-nav-portal-label">เมนูบุคลากร</p>
        {visibleMemberGroups.map((group, groupIndex) => (
          <section key={group.id} className={groupIndex > 0 ? "pt-4" : ""} aria-label={group.label}>
            <p className="portal-nav-section-label">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
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
            </div>
          </section>
        ))}
      </div>

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
