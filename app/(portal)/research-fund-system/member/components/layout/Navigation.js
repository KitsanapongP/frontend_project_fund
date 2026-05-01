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

export default function Navigation({
  currentPage,
  setCurrentPage,
  handleNavigate,
  submenuOpen,
  setSubmenuOpen,
  closeMenu,
}) {
  const ADMIN_BASE_PATH = "/research-fund-system/admin";
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRoute, setPendingRoute] = useState("");

  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;
  const isDeptHead = hasPermissionSnapshot
    ? hasPermission("ui.page.member.dept_review.view") || hasPermission("submission.read.department")
    : user?.role === "dept_head" || user?.user_role === "dept_head" || user?.role_id === 4;

  const canSwitchToAdminPortal = hasAdminPortalAccess(user);

  const adminShortcutItems = [
    {
      id: "admin-dashboard",
      label: "แดชบอร์ดผู้ดูแล",
      icon: LayoutDashboard,
      route: `${ADMIN_BASE_PATH}/dashboard`,
      required: ["ui.page.admin.dashboard.view", "dashboard.view.admin"],
    },
    {
      id: "admin-research-fund",
      label: "ทุนส่งเสริมงานวิจัย",
      icon: HandHelping,
      route: `${ADMIN_BASE_PATH}/research-fund`,
      required: ["ui.page.admin.research_fund.view"],
    },
    {
      id: "admin-promotion-fund",
      label: "ทุนอุดหนุนกิจกรรม",
      icon: DollarSign,
      route: `${ADMIN_BASE_PATH}/promotion-fund`,
      required: ["ui.page.admin.promotion_fund.view"],
    },
    {
      id: "admin-applications",
      label: "รายการการขอทุน",
      icon: FileText,
      route: `${ADMIN_BASE_PATH}/applications-list`,
      required: ["ui.page.admin.applications.view"],
    },
    {
      id: "admin-scopus",
      label: "ค้นหางานวิจัย",
      icon: Search,
      route: `${ADMIN_BASE_PATH}/scopus-research-search`,
      required: ["ui.page.admin.scopus.view", "scopus.publications.read"],
    },
    {
      id: "admin-fund-settings",
      label: "ตั้งค่าทุน",
      icon: Settings,
      route: `${ADMIN_BASE_PATH}/fund-settings`,
      required: ["ui.page.admin.fund_settings.view"],
    },
    {
      id: "admin-projects",
      label: "จัดการโครงการ",
      icon: Briefcase,
      route: `${ADMIN_BASE_PATH}/projects`,
      required: ["ui.page.admin.projects.view"],
    },
    {
      id: "admin-approval-records",
      label: "บันทึกข้อมูลการอนุมัติทุน",
      icon: FileCheck,
      route: `${ADMIN_BASE_PATH}/approval-records`,
      required: ["ui.page.admin.approval_records.view"],
    },
    {
      id: "admin-import-export",
      label: "นำเข้า/ส่งออก",
      icon: ArrowDownUp,
      route: `${ADMIN_BASE_PATH}/import-export`,
      required: ["ui.page.admin.import_export.view"],
    },
    {
      id: "admin-academic-imports",
      label: "ข้อมูลผลงานวิชาการ",
      icon: BookOpen,
      route: `${ADMIN_BASE_PATH}/academic-imports`,
      required: ["ui.page.admin.academic_imports.view"],
    },
    {
      id: "admin-access-control",
      label: "จัดการสิทธิ์การเข้าถึง",
      icon: ShieldCheck,
      route: `${ADMIN_BASE_PATH}/access-control`,
      required: ["ui.page.admin.access_control.view", "access.manage"],
    },
  ].filter((item) => item.required.some((code) => hasPermission(code)));

  const menuItems = [
    // {
    //   id: "dashboard",
    //   label: "แดชบอร์ด",
    //   icon: LayoutDashboard,
    //   hasSubmenu: false,
    // },
    {
      id: "profile",
      label: "ข้อมูลส่วนตัว",
      icon: User,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.profile.view",
    },
    {
      id: "research-fund",
      label: "ทุนส่งเสริมการวิจัย",
      icon: TrendingUp,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.research_fund.view",
    },
    {
      id: "promotion-fund",
      label: "ทุนอุดหนุนกิจกรรม",
      icon: DollarSign,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.promotion_fund.view",
    },
    {
      id: "applications",
      label: "คำร้องของฉัน",
      icon: ClipboardList,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.applications.view",
    },
    {
      id: "received-funds",
      label: "ทุนที่เคยได้รับ",
      icon: Gift,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.received_funds.view",
    },
    {
      id: "approval-records",
      label: "บันทึกข้อมูลการอนุมัติทุน",
      icon: FileCheck,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.applications.view",
    },
    {
      id: "announcements",
      label: "ประกาศกองทุนวิจัยและนวัตกรรม",
      icon: FileText,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.announcements.view",
    },
    {
      id: "projects",
      label: "โครงการ",
      icon: Briefcase,
      hasSubmenu: false,
      requiredPermission: "ui.page.member.projects.view",
    },
    ...(isDeptHead
      ? [
          {
            id: "dept-review",
            label: "พิจารณาคำร้องของหัวหน้าสาขา",
            icon: HandHelping,
            hasSubmenu: false,
            requiredPermission: "ui.page.member.dept_review.view",
          },
        ]
      : []),
  ];

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
    const routeItems = [
      ...menuItems.filter((item) => item.route).map((item) => item.route),
      ...adminShortcutItems.map((item) => item.route),
    ];
    routeItems.forEach((route) => {
      if (typeof router.prefetch === "function") {
        router.prefetch(route);
      }
    });
  }, [adminShortcutItems, menuItems, router]);

  const navigateToRoute = (route) => {
    if (!route || pendingRoute === route) {
      return;
    }

    setPendingRoute(route);
    if (typeof router.prefetch === "function") {
      router.prefetch(route);
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname : pathname;
    router.push(route);

    window.setTimeout(() => {
      const stillSamePath = typeof window !== "undefined" && window.location.pathname === currentPath;
      if (stillSamePath) {
        window.location.assign(route);
      }
      setPendingRoute("");
    }, 700);
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

      {canSwitchToAdminPortal && adminShortcutItems.length > 0 && (
        <>
          <div className="border-t border-gray-200 mt-6 pt-4 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">เมนูผู้ดูแล</p>
          </div>
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
        </>
      )}

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
