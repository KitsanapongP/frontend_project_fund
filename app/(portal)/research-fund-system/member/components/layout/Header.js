"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { BRANDING } from "../../../../../config/branding";
import NotificationBell from "@/app/components/notifications/NotificationBell";
import {
  PortalBrandLogo,
  PortalFontSizeControl,
} from "@/app/components/portal/PortalChrome";

const roleLabels = {
  teacher: "อาจารย์",
  staff: "เจ้าหน้าที่",
  admin: "ผู้ดูแลระบบ",
  dept_head: "หัวหน้าสาขา",
};

function resolveRoleLabel(user) {
  if (!user) return null;

  if (user.role && roleLabels[user.role]) {
    return roleLabels[user.role];
  }

  if (typeof user.role_id === "number") {
    switch (user.role_id) {
      case 1:
        return roleLabels.teacher;
      case 2:
        return roleLabels.staff;
      case 3:
        return roleLabels.admin;
      case 4:
        return roleLabels.dept_head;
      default:
        return null;
    }
  }

  return null;
}

function getDisplayName(user) {
  if (!user) return "Loading...";

  const prefix =
    user.prefix || user.prefix_name || user.title || user.position || "";
  const firstName =
    user.user_fname || user.first_name || user.firstname || user.name || "";
  const lastName = user.user_lname || user.last_name || user.lastname || "";

  const fullName = [prefix, firstName, lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email;
  }

  return "ผู้ใช้งาน";
}

function getInitials(displayName) {
  if (!displayName) return "MB";

  const parts = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "MB";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase() || "MB";
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Header({
  isOpen,
  setIsOpen,
  Navigation,
  currentPageTitle = "แดชบอร์ดบุคลากร",
  brandTitle,
  onNavigate,
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const {
    appName,
    subtitles = {},
  } = BRANDING;

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const roleLabel = useMemo(() => resolveRoleLabel(user), [user]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/login");
    }
  };

  const handleToggleMenu = () => {
    setIsOpen?.((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsOpen?.(false);
  };

  const renderNavigation = () => {
    if (!Navigation) return null;
    if (typeof Navigation === "function") {
      return Navigation({ closeMenu: handleCloseMenu });
    }
    return Navigation;
  };

  const goToNotifications = () => {
    if (onNavigate) {
      onNavigate("notifications");
    } else {
      router.push("/research-fund-system/member/notifications");
    }
    setShowUserMenu(false);
  };

  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        {/* Logo Section */}
        <div className="flex min-w-0 items-center gap-3">
            <PortalBrandLogo onNavigate={handleCloseMenu} />
            <div className="hidden min-w-0 sm:block">
              <h1 className="truncate text-base font-semibold text-slate-900 lg:text-lg">
                {brandTitle || subtitles.member || "กองทุนวิจัยฯ วิทยาลัยการคอมพิวเตอร์"}
              </h1>
              <p className="truncate text-xs leading-tight text-slate-600 lg:text-sm">
                {appName || "Fund Management"}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500" title={currentPageTitle}>
                {currentPageTitle}
              </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 p-2 text-sm text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
            onClick={handleToggleMenu}
            aria-label={isOpen ? "close-mobile-menu" : "open-mobile-menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <RxCross2 className="h-5 w-5 text-slate-700" />
            ) : (
              <HiMenu className="h-5 w-5 text-slate-700" />
            )}
          </button>

          {/* Desktop User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            <PortalFontSizeControl />
            <NotificationBell onViewAll={goToNotifications} />

            <div className="text-right">
              <p className="max-w-48 truncate text-sm font-medium text-slate-800">{displayName}</p>
              {roleLabel ? (
                <p className="text-xs text-slate-500">{roleLabel}</p>
              ) : null}
            </div>

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                  {initials}
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                  <button
                    onClick={() => {
                      goToNotifications();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                  >
                    <BellIcon size={16} />
                    <span>การแจ้งเตือน</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={handleCloseMenu}>
          <div
            className="absolute right-0 top-0 z-50 h-screen w-[min(21rem,88vw)] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">บัญชีและเมนู</span>
              <button className="rounded-lg p-2 hover:bg-slate-100" onClick={handleCloseMenu} aria-label="close-mobile-menu">
                <RxCross2 className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                  {initials}
                </div>
                <div>
                  <div className="font-medium text-slate-800">{displayName}</div>
                  {roleLabel ? (
                    <div className="text-xs text-slate-500">{roleLabel}</div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <NotificationBell onViewAll={goToNotifications} />
                <span className="text-sm text-slate-700">การแจ้งเตือน</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-700 flex items-center gap-2"
              >
                <LogOut size={14} />
                ออกจากระบบ
              </button>
            </div>

            <div className="mb-4 space-y-3 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-600">ขนาดตัวอักษร</p>
              <PortalFontSizeControl />
            </div>

            {renderNavigation()}
          </div>
        </div>
      )}
    </header>
  );
}

function BellIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      {...props}
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
