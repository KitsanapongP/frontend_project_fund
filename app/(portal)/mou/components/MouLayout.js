"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Home,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { mouAPI } from "../../../lib/mou_api";
import "./mou.css";

const mouMenuItems = [
  { id: "list", label: "รายการ MOU ทั้งหมด", icon: ClipboardList, href: "/mou" },
  { id: "manage", label: "การจัดการประเภทของข้อมูล", icon: Settings, href: "/mou/admin_manage_type_okr" },
  { id: "dashboard", label: "รายงาน Dashboard", icon: LayoutDashboard, href: "/mou/admin_dashboard" },
];

function getDisplayName(user) {
  if (!user) return "Loading...";
  const prefix = user.prefix || user.prefix_name || "";
  const firstName = user.user_fname || user.first_name || "";
  const lastName = user.user_lname || user.last_name || "";
  const fullName = [prefix, firstName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return fullName || user.email || "ผู้ใช้งาน";
}

function getInitials(displayName) {
  if (!displayName) return "MB";
  const parts = displayName.split(" ").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "MB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || "MB";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const roleLabels = {
  teacher: "อาจารย์",
  staff: "เจ้าหน้าที่",
  admin: "ผู้ดูแลระบบ",
  dept_head: "หัวหน้าสาขา",
};

function resolveRoleLabel(user) {
  if (!user) return null;
  if (user.role && roleLabels[user.role]) return roleLabels[user.role];
  if (typeof user.role_id === "number") {
    switch (user.role_id) {
      case 1: return roleLabels.teacher;
      case 2: return roleLabels.staff;
      case 3: return roleLabels.admin;
      case 4: return roleLabels.dept_head;
    }
  }
  return null;
}

export default function MouLayout({ children, title, subtitle }) {
  const { user, logout, hasRole, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifData, setNotifData] = useState(null);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  const displayName = getDisplayName(user);
  const roleLabel = resolveRoleLabel(user);
  const initials = getInitials(displayName);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!isLoading && isAuthenticated && !hasRole(3) && !hasRole("admin")) {
      router.replace("/unauthorized");
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifs = async () => {
      try {
        const res = await mouAPI.getNotifications();
        if (res?.success) setNotifData(res.data);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-600 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!hasRole(3) && !hasRole("admin"))) return null;

  const isActive = (href) => {
    if (href === "/mou") {
      return pathname === "/mou" ||
        pathname.startsWith("/mou/show_detail_mou/") ||
        pathname.startsWith("/mou/add_mou") ||
        pathname.startsWith("/mou/admin_edit_mou/") ||
        pathname.startsWith("/mou/add_activity_mou") ||
        pathname.startsWith("/mou/show_detail_activity/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-start justify-between gap-3 px-4 py-3 sm:items-center sm:px-6">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="/image_icon/fund_cpkku_logo.png" alt="MOU Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-800 sm:text-xl">
                {title || "บันทึกข้อตกลงความร่วมมือ"}
              </h1>
              <p className="text-sm text-gray-700 leading-tight">
                ระบบจัดการ MOU
              </p>
              {subtitle && (
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-sm text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "close-mobile-menu" : "open-mobile-menu"}
            >
              {isMobileMenuOpen ? (
                <RxCross2 className="w-5 h-5 text-gray-700" />
              ) : (
                <HiMenu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            <div className="hidden items-center gap-4 md:flex">
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifMenu((v) => !v)}
                  className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 focus:outline-none"
                  aria-label="notifications"
                >
                  <Bell size={20} />
                  {notifData?.total > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                      {notifData.total > 99 ? "99+" : notifData.total}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50 max-h-[70vh] flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Bell size={15} />
                      การแจ้งเตือน
                      {notifData?.total > 0 && (
                        <span className="ml-auto text-xs text-gray-400">{notifData.total} รายการ</span>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {!notifData || (notifData.nearExpiry.count === 0 && notifData.expired.count === 0) ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">ไม่มีการแจ้งเตือน</div>
                      ) : (
                        <>
                          {notifData.expired.count > 0 && (
                            <div className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                              หมดอายุแล้ว ({notifData.expired.count})
                            </div>
                          )}
                          {notifData.expired.items?.map((m) => (
                            <Link
                              key={`exp-${m.id}`}
                              href={`/mou/show_detail_mou/${m.id}`}
                              onClick={() => setShowNotifMenu(false)}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-red-50 transition border-b border-gray-50 last:border-b-0"
                            >
                              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{m.mou_code} - {m.title}</div>
                                <div className="text-xs text-red-600 mt-0.5">หมดอายุแล้ว</div>
                              </div>
                              <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                            </Link>
                          ))}
                          {notifData.nearExpiry.count > 0 && (
                            <div className="px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                              ใกล้หมดอายุ ({notifData.nearExpiry.count})
                            </div>
                          )}
                          {notifData.nearExpiry.items?.map((m) => {
                            const days = Math.ceil((new Date(m.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                            return (
                              <Link
                                key={`near-${m.id}`}
                                href={`/mou/show_detail_mou/${m.id}`}
                                onClick={() => setShowNotifMenu(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition border-b border-gray-50 last:border-b-0"
                              >
                                <Clock size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{m.mou_code} - {m.title}</div>
                                  <div className="text-xs text-amber-600 mt-0.5">เหลืออีก {days} วัน</div>
                                </div>
                                <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                              </Link>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{displayName}</p>
                {roleLabel && <p className="text-xs text-gray-600">{roleLabel}</p>}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {initials}
                  </div>
                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg z-10">
                    <button
                      onClick={handleLogout}
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
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-200/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="absolute top-0 pt-5 right-0 h-screen z-50 w-64 bg-white shadow p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-3">
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="close-mobile-menu">
                <RxCross2 className="w-7 h-7 text-gray-600 hover:text-red-500" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg md:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{displayName}</div>
                  {roleLabel && <div className="text-xs text-gray-600">{roleLabel}</div>}
                </div>
              </div>
              <Link
                href="/"
                className="w-full text-left text-sm text-gray-700 hover:text-blue-600 flex items-center gap-2"
              >
                <Home size={14} />
                กลับหน้าหลัก
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-700 flex items-center gap-2"
              >
                <LogOut size={14} />
                ออกจากระบบ
              </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">เมนู MOU</p>
            <nav>
              {mouMenuItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors ${
                      isActive(item.href) ? "text-blue-500 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex mt-[72px] min-h-[calc(100vh-72px)] bg-gray-100">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 fixed h-[calc(100vh-72px)] overflow-y-auto">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">เมนู MOU</p>
            <nav>
              {mouMenuItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 mb-2.5 w-full hover:text-blue-500 transition-colors ${
                      isActive(item.href) ? "text-blue-500 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-6 pt-4 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-500 transition-colors w-full"
                >
                  <Home size={20} />
                  <span>กลับหน้าหลัก</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:ml-64 flex-1 min-w-0 overflow-x-auto">
          <div className="mouRoot" style={{ minWidth: 0, minHeight: 0, background: "transparent" }}>
            <div className="px-6 pb-8 pt-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
