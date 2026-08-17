"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { BRANDING } from "../../config/branding";
import {
  PortalBrandLogo,
  PortalFontSizeControl,
} from "../portal/PortalChrome";

export default function PublicHeader({
  isOpen,
  setIsOpen,
  Navigation,
  currentPageTitle = "หน้าหลัก",
  loginHref,
  loginLabel = "เข้าสู่ระบบ",
  userLabel = "",
}) {
  const {
    appName,
    subtitles = {},
  } = BRANDING;

  const canToggleMenu = true;

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

  return (
    <header className="portal-header">
      <div className="portal-header__inner">
        <div className="flex min-w-0 items-center gap-3">
          <PortalBrandLogo onNavigate={handleCloseMenu} />
          <div className="hidden min-w-0 sm:block">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 lg:text-lg">
                {subtitles.public || "งานวิจัยและนวัตกรรม วิทยาลัยการคอมพิวเตอร์"}
              </h1>
              <p className="truncate text-xs leading-tight text-slate-600 lg:text-sm">
                {appName || "Fund Management"}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500" title={currentPageTitle}>
                {currentPageTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <PortalFontSizeControl />
          </div>

          {canToggleMenu ? (
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
          ) : null}

          {userLabel ? (
            <div className="hidden items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 lg:inline-flex">
              {userLabel}
            </div>
          ) : null}

          {loginHref ? (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-4"
            >
              <LogIn size={16} />
              <span>{loginLabel}</span>
            </Link>
          ) : null}
        </div>

      </div>

      {isOpen && canToggleMenu && (
        <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={handleCloseMenu}>
          <div
            className="absolute right-0 top-0 z-50 h-screen w-[min(21rem,88vw)] border-l border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">การแสดงผลและเมนู</span>
              <button className="rounded-lg p-2 hover:bg-slate-100" onClick={handleCloseMenu} aria-label="close-mobile-menu">
                <RxCross2 className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            <div className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
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

