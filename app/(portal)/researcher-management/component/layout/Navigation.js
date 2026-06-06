"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  User,
  Search,
  ShieldCheck,
  Briefcase,
  BookOpen,
  ClipboardCheck,
  LogOut,
  HandHelping,
  DollarSign,
  FileText,
  Gift,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext"; 
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
  const normalizedRole = normalizeRoleName(user?.role ?? user?.role_id);
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRoute, setPendingRoute] = useState("");

  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;

  // แก้ไขรายการเมนูให้ตรงตามรูปภาพ 6 รายการ
  const menuItems = [
  {
    id: 'edit-instructor-info',
    label: 'แก้ไขข้อมูลอาจารย์',
    icon: User,
    route: '/researcher-management', // เส้นทางหลัก
    hasSubmenu: false
  },
  {
    id: 'related-websites',
    label: 'เว็บไซต์ที่เกี่ยวข้อง',
    icon: Search,
    route: '/researcher-management/related-websites', // ตัวอย่าง URL ใหม่
    hasSubmenu: false
  },
  {
    id: 'expertise',
    label: 'ความเชี่ยวชาญ',
    icon: ShieldCheck,
    //route: '/researcher-management/expertise',
    hasSubmenu: false
  },
  {
    id: 'research-projects',
    label: 'โครงการวิจัย',
    icon: Briefcase,
   // route: '/researcher-management/projects',
    hasSubmenu: false
  },
  {
    id: 'academic-performance',
    label: 'ผลงานทางวิชาการ',
    icon: BookOpen,
    //route: '/researcher-management/academic',
    hasSubmenu: false
  },
  {
    id: 'verify-instructor-info',
    label: 'ตรวจสอบข้อมูลอาจารย์',
    icon: ClipboardCheck,
    //route: '/researcher-management/verify',
    hasSubmenu: false
  }
];

  const menuItemsWithPermissions = menuItems.map((item) => {
    if (item.requiredPermission) {
      return item;
    }

    // กำหนด Permission Key ให้สอดคล้องกับ ID ใหม่
    const permissionByPage = {
      'edit-instructor-info': 'ui.page.researcher.edit_info.view',
      'related-websites': 'ui.page.researcher.links.view',
      'expertise': 'ui.page.researcher.expertise.view',
      'research-projects': 'ui.page.researcher.projects.view',
      'academic-performance': 'ui.page.researcher.academic.view',
      'verify-instructor-info': 'ui.page.researcher.verify.view',
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

  // Navigation.js
const visibleMenuItems = isExecutive
    ? menuItemsWithPermissions.filter((item) => item.id === "dashboard")
    : menuItemsWithPermissions.filter((item) => {
        // 1. ตรวจสอบ Permission พื้นฐาน (canViewMenu)
        const hasBasePermission = canViewMenu(item);
        
        // 2. ถ้าเป็นเมนูในกลุ่ม researcher-management (ที่คุณสร้างใหม่ 6 รายการ)
        // ต้องตรวจสอบเพิ่มว่าเป็น Role 'teacher' จริงๆ
        const researcherMenuIds = [
          'edit-instructor-info', 'related-websites', 'expertise', 
          'research-projects', 'academic-performance', 'verify-instructor-info'
        ];
        
        if (researcherMenuIds.includes(item.id)) {
            return hasBasePermission && normalizedRole === "teacher";
        }

        return hasBasePermission;
    });

    // Navigation.js
  

  // แก้ไข: เอา staff และ dept_head ออก เพื่อให้เฉพาะอาจารย์เท่านั้นที่เข้าได้
  const canAccessMemberPortal = ["teacher"].includes(normalizedRole);
  const memberShortcutItems = canAccessMemberPortal
    ? [
          { id: 'edit-instructor-info', label: 'แก้ไขข้อมูลอาจารย์', icon: User, route: '/researcher-management' },
      { id: 'related-websites', label: 'เว็บไซต์ที่เกี่ยวข้อง', icon: Search,  route: '/researcher-management/related-websites' },
      { id: 'expertise', label: 'ความเชี่ยวชาญ', icon: ShieldCheck, /*route: '/researcher-management/expertise' */ },
      { id: 'research-projects', label: 'โครงการวิจัย', icon: Briefcase,/* route: '/researcher-management/projects' */ },
      { id: 'academic-performance', label: 'ผลงานทางวิชาการ', icon: BookOpen, /* route: '/researcher-management/academic' */ },
      { id: 'verify-instructor-info', label: 'ตรวจสอบข้อมูลอาจารย์', icon: ClipboardCheck, /* route: '/researcher-management/verify' */ },
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
    [...adminRoutes, ...memberRoutes]
  .filter(Boolean) // ✅ ตัด undefined ออก
  .forEach((route) => {
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
