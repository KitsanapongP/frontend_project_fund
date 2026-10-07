"use client";

import { useState } from "react";
import {
  User,
  Search,
  ShieldCheck,
  Briefcase,
  BookOpen,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { PortalBackLink, PortalNavIcon } from "@/app/components/portal/PortalChrome";

export default function Navigation({ 
  currentPage, 
  setCurrentPage,
  handleNavigate, 
  submenuOpen, 
  setSubmenuOpen,
  isExecutive = false
}) {
  const { logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRoute, setPendingRoute] = useState("");

  // แก้ไขรายการเมนูให้ตรงตามรูปภาพ 6 รายการ
  const menuItems = [
  {
    id: 'edit-instructor-info',
    label: 'แก้ไขข้อมูลอาจารย์',
    icon: User,
    tone: 'indigo',
    hasSubmenu: false
  },
  {
    id: 'related-websites',
    label: 'เว็บไซต์ที่เกี่ยวข้อง',
    icon: Search,
    tone: 'sky',
    hasSubmenu: false
  },
  {
    id: 'expertise',
    label: 'ความเชี่ยวชาญ',
    icon: ShieldCheck,
    tone: 'violet',
    //route: '/researcher-management/expertise',
    hasSubmenu: false
  },
  {
    id: 'research-projects',
    label: 'โครงการวิจัย',
    icon: Briefcase,
    tone: 'teal',
   // route: '/researcher-management/projects',
    hasSubmenu: false
  },
  {
    id: 'academic-performance',
    label: 'ผลงานทางวิชาการ',
    icon: BookOpen,
    tone: 'amber',
    //route: '/researcher-management/academic',
    hasSubmenu: false
  },
  {
    id: 'verify-instructor-info',
    label: 'ตรวจสอบข้อมูลอาจารย์',
    icon: ClipboardCheck,
    tone: 'emerald',
    //route: '/researcher-management/verify',
    hasSubmenu: false
  }
];

  const visibleMenuItems = !isExecutive && hasPermission("portal.card.researcher_management.access")
    ? menuItems
    : [];

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
    <nav className="space-y-1 pb-40" aria-label="เมนูจัดการบุคลากร">
      {visibleMenuItems.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => handleMenuClick(item)}
            disabled={Boolean(item.route) && pendingRoute === item.route}
            className={`portal-nav-item group disabled:cursor-wait disabled:opacity-60 ${isActive(item.id) ? "portal-nav-item--active" : ""}`}
          >
            <PortalNavIcon icon={item.icon} tone={item.tone} />
            <div className="flex-1 text-left">
              <span>{item.route && pendingRoute === item.route ? "กำลังเปิด..." : item.label}</span>
              {item.description && (
                <span className="block text-xs text-slate-500">{item.description}</span>
              )}
            </div>
          </button>
        </div>
      ))}

      {/* Logout Button */}
      <div className="mt-5 border-t border-slate-200 pt-4">
        <PortalBackLink placement="nav" />
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
