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
  ClipboardCheck,
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

  const menuItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดผู้ดูแลระบบ',
      icon: LayoutDashboard,
      hasSubmenu: false
    },
    {
      id: 'research-dashboard',
      label: 'แดชบอร์ดงานวิจัย',
      icon: BarChart3,
      hasSubmenu: false
    },
    {
      id: 'research-fund',
      label: 'ทุนส่งเสริมงานวิจัย',
      icon: HandHelping,
      hasSubmenu: false
    },
    {
      id: 'promotion-fund',
      label: 'ทุนอุดหนุนกิจกรรม',
      icon: DollarSign,
      hasSubmenu: false
    },
    {
      id: 'applications-list',
      label: 'รายการการขอทุน',
      icon: FileText,
      hasSubmenu: false
    },
    {
      id: 'scopus-research-search',
      label: 'ค้นหางานวิจัย',
      icon: Search,
      hasSubmenu: false
    },
    // {
    //   id: 'legacy-submissions',
    //   label: 'จัดการคำร้อง (ข้อมูลเก่า)',
    //   icon: ClipboardCheck,
    //   hasSubmenu: false
    // },
    {
      id: 'fund-settings',
      label: 'ตั้งค่าทุน',
      icon: Settings,
      hasSubmenu: false
    },
    {
      id: 'projects',
      label: 'จัดการโครงการ',
      icon: Briefcase,
      hasSubmenu: false
    },
    {
      id: 'approval-records',
      label: 'บันทึกข้อมูลการอนุมัติทุน',
      icon: FileCheck,
      hasSubmenu: false
    },
    {
      id: 'import-export',
      label: 'นำเข้า/ส่งออก',
      icon: ArrowDownUp,
      hasSubmenu: false
    },
    // {
    //   id: 'notifications',
    //   label: 'การแจ้งเตือน',
    //   icon: Bell,
    //   hasSubmenu: false
    // },
    {
      id: 'academic-imports',
      label: 'ข้อมูลผลงานวิชาการ / Academic Data Import',
      icon: BookOpen,
      hasSubmenu: false,
      requiredPermission: 'ui.page.admin.academic_imports.view',
    },
    {
      id: 'access-control',
      label: 'จัดการสิทธิ์การเข้าถึง',
      icon: ShieldCheck,
      hasSubmenu: false,
      requiredPermission: 'ui.page.admin.access_control.view',
    }
  ];

  const menuItemsWithPermissions = menuItems.map((item) => {
    if (item.requiredPermission) {
      return item;
    }

    const permissionByPage = {
      dashboard: 'ui.page.admin.dashboard.view',
      'research-dashboard': 'ui.page.admin.research_dashboard.view',
      'research-fund': 'ui.page.admin.research_fund.view',
      'promotion-fund': 'ui.page.admin.promotion_fund.view',
      'applications-list': 'ui.page.admin.applications.view',
      'scopus-research-search': 'ui.page.admin.scopus.view',
      'fund-settings': 'ui.page.admin.fund_settings.view',
      projects: 'ui.page.admin.projects.view',
      'approval-records': 'ui.page.admin.approval_records.view',
      'import-export': 'ui.page.admin.import_export.view',
    };

    return {
      ...item,
      requiredPermission: permissionByPage[item.id] || null,
    };
  });

  const canViewMenu = (item) => {
    if (!item.requiredPermission) {
      return true;
    }
    if (!hasPermissionSnapshot) {
      return true;
    }
    return hasPermission(item.requiredPermission);
  };

  const visibleMenuItems = isExecutive
    ? menuItemsWithPermissions.filter((item) => item.id === "dashboard")
    : menuItemsWithPermissions.filter(canViewMenu);

  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);
  const canAccessMemberPortal = ["teacher", "staff", "dept_head"].includes(normalizedRole);

  const memberShortcutItems = canAccessMemberPortal
    ? [
        { id: "member-profile", label: "ข้อมูลส่วนตัว", icon: User, route: `${MEMBER_BASE_PATH}/profile` },
        { id: "member-research-fund", label: "ทุนส่งเสริมการวิจัย", icon: HandHelping, route: `${MEMBER_BASE_PATH}/research-fund` },
        { id: "member-promotion-fund", label: "ทุนอุดหนุนกิจกรรม", icon: DollarSign, route: `${MEMBER_BASE_PATH}/promotion-fund` },
        { id: "member-applications", label: "คำร้องของฉัน", icon: FileText, route: `${MEMBER_BASE_PATH}/applications` },
        { id: "member-received", label: "ทุนที่เคยได้รับ", icon: Gift, route: `${MEMBER_BASE_PATH}/received-funds` },
        { id: "member-projects", label: "โครงการ", icon: Briefcase, route: `${MEMBER_BASE_PATH}/projects` },
        ...(normalizedRole === "dept_head"
          ? [
              {
                id: "member-dept-review",
                label: "พิจารณาคำร้องของหัวหน้าสาขา",
                icon: ArrowLeftRight,
                route: `${MEMBER_BASE_PATH}/dept-review`,
              },
            ]
          : []),
      ]
    : [];

  useEffect(() => {
    const adminRoutes = visibleMenuItems.map((item) => `${ADMIN_BASE_PATH}/${item.id}`);
    const memberRoutes = memberShortcutItems.map((item) => item.route);
    [...adminRoutes, ...memberRoutes].forEach((route) => {
      if (typeof router.prefetch === "function") {
        router.prefetch(route);
      }
    });
  }, [memberShortcutItems, router, visibleMenuItems]);

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
      {visibleMenuItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleMenuClick(item)}
            disabled={pendingRoute === `${ADMIN_BASE_PATH}/${item.id}`}
            className={`flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors ${
              isActive(item.id) ? 'text-blue-500 font-semibold' : 'text-gray-700'
            }`}
          >
            <item.icon size={20} />
            <div className="flex-1 text-left">
              <span>{pendingRoute === `${ADMIN_BASE_PATH}/${item.id}` ? "กำลังเปิด..." : item.label}</span>
              {item.description && (
                <span className="text-xs text-gray-500 block">{item.description}</span>
              )}
            </div>
          </button>
        </div>
      ))}

      {memberShortcutItems.length > 0 && (
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
      )}

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
