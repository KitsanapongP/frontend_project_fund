"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import NotificationList from "./NotificationList";
import { notificationsAPI } from "../../lib/notifications_api";

export default function NotificationBell({ onViewAll }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsAPI.list({ limit: 20 }),
        notificationsAPI.count(),
      ]);

      const items = Array.isArray(listRes?.items)
        ? listRes.items
        : Array.isArray(listRes)
          ? listRes
          : [];

      setNotifications(items);
      const unread = typeof countRes?.unread === "number"
        ? countRes.unread
        : items.filter((item) => !item.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setErrorMessage("ไม่สามารถโหลดการแจ้งเตือนได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!showDropdown) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowDropdown(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === id ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const handleViewAll = () => {
    if (onViewAll) onViewAll();
    setShowDropdown(false);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setShowDropdown((open) => !open)}
        className={`relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          showDropdown
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : unreadCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
        aria-label={unreadCount > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unreadCount} รายการ` : "การแจ้งเตือน"}
        aria-haspopup="dialog"
        aria-expanded={showDropdown}
        title="การแจ้งเตือน"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-md bg-amber-400 px-1 text-xs font-semibold leading-none text-amber-950 ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {showDropdown ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setShowDropdown(false)}
            aria-label="ปิดการแจ้งเตือน"
            tabIndex={-1}
          />
          <div className="fixed inset-x-3 top-[calc(var(--portal-header-height)+0.5rem)] z-50 lg:absolute lg:inset-auto lg:right-0 lg:top-auto lg:mt-2 lg:w-[30rem]" role="dialog" aria-label="การแจ้งเตือนล่าสุด">
            <NotificationList
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClose={() => setShowDropdown(false)}
              onViewAll={onViewAll ? handleViewAll : undefined}
              onRetry={loadNotifications}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
