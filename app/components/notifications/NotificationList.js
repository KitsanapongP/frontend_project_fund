"use client";

import { useState } from "react";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import NotificationItem from "./NotificationItem";

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  onViewAll,
  onRetry,
  isLoading = false,
  errorMessage = "",
}) {
  const [expandedIds, setExpandedIds] = useState([]);
  const items = Array.isArray(notifications) ? notifications : [];
  const unreadCount = items.filter((item) => !item.is_read).length;

  const toggleNotification = (notificationId) => {
    const notification = items.find((item) => item.notification_id === notificationId);
    if (notification && !notification.is_read) {
      onMarkAsRead(notificationId);
    }
    setExpandedIds((current) =>
      current.includes(notificationId)
        ? current.filter((id) => id !== notificationId)
        : [...current, notificationId]
    );
  };

  return (
    <section
      className="flex max-h-[min(26rem,calc(100vh-7rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
      aria-label="รายการการแจ้งเตือน"
    >
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">การแจ้งเตือน</h2>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `ยังไม่อ่าน ${unreadCount} รายการ` : "อ่านครบแล้ว"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว"
            title="อ่านทั้งหมด"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden text-xs font-medium sm:inline">อ่านทั้งหมด</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex min-h-44 items-center justify-center gap-3 px-6 text-sm text-slate-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden="true" />
            กำลังโหลดการแจ้งเตือน...
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-medium text-red-700">{errorMessage}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                ลองอีกครั้ง
              </button>
            ) : null}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Bell className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="font-semibold text-slate-800">ยังไม่มีการแจ้งเตือน</p>
            <p className="mt-1 max-w-64 text-sm text-slate-500">รายการใหม่จะแสดงที่นี่เมื่อมีความคืบหน้าหรือข่าวสารสำคัญ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                isExpanded={expandedIds.includes(notification.notification_id)}
                onToggle={toggleNotification}
                compact
              />
            ))}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">แสดงล่าสุดไม่เกิน 20 รายการ</p>
        {onViewAll ? (
          <button
            type="button"
            className="text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline"
            onClick={onViewAll}
          >
            <span className="text-xs font-medium">ดูทั้งหมด</span>
          </button>
        ) : null}
      </footer>
    </section>
  );
}
