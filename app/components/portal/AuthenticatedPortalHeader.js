"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import NotificationBell from "@/app/components/notifications/NotificationBell";
import {
  PortalBrandLogo,
  PortalFontSizeControl,
} from "./PortalChrome";

function getDisplayName(user) {
  if (!user) return "กำลังโหลด...";
  const fullName = [
    user.prefix || user.position,
    user.user_fname || user.first_name,
    user.user_lname || user.last_name,
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return fullName || user.email || "ผู้ใช้งาน";
}

function getInitials(user) {
  const parts = [user?.user_fname || user?.first_name, user?.user_lname || user?.last_name]
    .filter(Boolean).map((part) => String(part).trim()).filter(Boolean);
  if (parts.length === 0) return "CP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AuthenticatedPortalHeader({
  isOpen,
  setIsOpen,
  Navigation,
  currentPageTitle,
  branding,
}) {
  const { user, logout, getUserRoleDisplay } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const menuOpen = typeof isOpen === "boolean" ? isOpen : localMenuOpen;
  const displayName = getDisplayName(user);
  const roleLabel = getUserRoleDisplay?.() || user?.role || "ผู้ใช้งานระบบ";
  const subtitles = branding?.subtitles || {};
  const updateMenuOpen = (nextValue) => {
    if (setIsOpen) {
      setIsOpen(nextValue);
      return;
    }
    setLocalMenuOpen(typeof nextValue === "function" ? nextValue(localMenuOpen) : nextValue);
  };
  const handleCloseMenu = () => updateMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  const renderNavigation = () => {
    if (!Navigation) return null;
    if (typeof Navigation === "function") return Navigation({ closeMenu: handleCloseMenu });
    return Navigation;
  };

  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        <div className="flex min-w-0 items-center gap-3">
          <PortalBrandLogo onNavigate={handleCloseMenu} />
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-base font-semibold text-slate-900 lg:text-lg">
              {subtitles.admin || "วิทยาลัยการคอมพิวเตอร์"}
            </h1>
            <p className="truncate text-xs leading-tight text-slate-600 lg:text-sm">
              {branding?.appName || "Fund Management"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500" title={currentPageTitle}>{currentPageTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
            onClick={() => updateMenuOpen((open) => !open)}
            aria-label={menuOpen ? "close-mobile-menu" : "open-mobile-menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <RxCross2 className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <PortalFontSizeControl />
            <NotificationBell />
            <div className="text-right">
              <p className="max-w-48 truncate text-sm font-medium text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((open) => !open)}
                className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">{getInitials(user)}</span>
                <ChevronDown size={16} className="text-slate-500" aria-hidden="true" />
              </button>
              {showUserMenu ? (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg" role="menu">
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); void handleLogout(); }}
                    className="portal-nav-item portal-nav-item--danger rounded-none px-4"
                    role="menuitem"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={handleCloseMenu}>
          <aside
            className="absolute right-0 top-0 z-50 h-screen w-[min(21rem,88vw)] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="เมนูหลัก"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">บัญชีและเมนู</span>
              <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={handleCloseMenu} aria-label="close-mobile-menu" title="ปิดเมนู">
                <RxCross2 className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:hidden">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">{getInitials(user)}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{displayName}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-3 text-sm text-slate-700"><NotificationBell /><span>การแจ้งเตือน</span></div>
              <button type="button" onClick={() => void handleLogout()} className="portal-nav-item portal-nav-item--danger px-0">
                <LogOut size={16} aria-hidden="true" /><span>ออกจากระบบ</span>
              </button>
            </div>

            <div className="mb-4 space-y-3 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-600">ขนาดตัวอักษร</p>
              <PortalFontSizeControl />
            </div>
            <div className="pb-6">{renderNavigation()}</div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
