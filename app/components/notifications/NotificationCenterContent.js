"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronDown, Inbox, RefreshCw } from "lucide-react";
import { notificationsAPI } from "@/app/lib/notifications_api";
import { systemAPI } from "@/app/lib/api";
import NotificationItem from "./NotificationItem";

const PAGE_SIZE = 10;

export default function NotificationCenterContent({ description }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedIds, setExpandedIds] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const isLoadingRef = useRef(false);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const list = Array.isArray(notifications) ? [...notifications] : [];
    const byYear = yearFilter === "all"
      ? list
      : list.filter((item) => {
          const date = new Date(item?.created_at);
          if (Number.isNaN(date.getTime())) return false;
          return date.getFullYear() === Number(yearFilter);
        });

    return byYear.sort((a, b) => {
      const aDate = new Date(a?.created_at).getTime();
      const bDate = new Date(b?.created_at).getTime();
      if (Number.isNaN(aDate) || Number.isNaN(bDate)) return 0;
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });
  }, [notifications, sortOrder, yearFilter]);

  const displayedNotifications = useMemo(
    () => filteredNotifications.slice(0, visibleCount),
    [filteredNotifications, visibleCount]
  );
  const hasMore = displayedNotifications.length < filteredNotifications.length;

  const loadNotifications = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const batchSize = 100;
      let offset = 0;
      const items = [];

      while (true) {
        const data = await notificationsAPI.list({ limit: batchSize, offset });
        const batch = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        if (batch.length === 0) break;
        items.push(...batch);
        offset += batch.length;
        if (batch.length < batchSize) break;
      }

      setNotifications(
        Array.from(new Map(items.map((item) => [item.notification_id, item])).values())
      );
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setErrorMessage("ไม่สามารถโหลดการแจ้งเตือนได้");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const loadYears = useCallback(async () => {
    try {
      const yearRes = await systemAPI.getYears();
      const rawYears = Array.isArray(yearRes?.years)
        ? yearRes.years
        : Array.isArray(yearRes?.data)
          ? yearRes.data
          : Array.isArray(yearRes)
            ? yearRes
            : [];

      const normalizedYears = rawYears
        .map((item) => Number(item?.year ?? item?.year_id ?? item))
        .filter((value) => Number.isFinite(value));
      setAvailableYears(Array.from(new Set(normalizedYears)).sort((a, b) => b - a));
    } catch (error) {
      console.error("Failed to load years for notifications", error);
      setAvailableYears([]);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadYears();
  }, [loadNotifications, loadYears]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortOrder, yearFilter]);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const toggleNotification = async (id) => {
    const notification = notifications.find((item) => item.notification_id === id);
    if (notification && !notification.is_read) await markAsRead(id);
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((existingId) => existingId !== id) : [...current, id]
    );
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">รายการแจ้งเตือนทั้งหมด</h2>
                <p className="mt-0.5 text-sm text-slate-600">{description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700">
              <Inbox className="h-4 w-4" aria-hidden="true" />
              ทั้งหมด {notifications.length}
            </span>
            <span className="inline-flex min-h-10 items-center rounded-lg bg-amber-50 px-3 text-sm font-semibold text-amber-800">
              ยังไม่อ่าน {unreadCount}
            </span>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              อ่านทั้งหมด
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            กรองตามปี
            <span className="relative">
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">ทุกปี</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
            </span>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            เรียงลำดับ
            <span className="relative">
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="desc">ล่าสุดไปเก่า</option>
                <option value="asc">เก่าไปใหม่</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
            </span>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-live="polite">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden="true" />
            กำลังโหลดการแจ้งเตือน...
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-medium text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              ลองอีกครั้ง
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Bell className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="font-semibold text-slate-800">
              {notifications.length === 0 ? "ยังไม่มีการแจ้งเตือน" : "ไม่พบการแจ้งเตือนในปีที่เลือก"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {notifications.length === 0 ? "รายการใหม่จะแสดงที่นี่เมื่อมีการอัปเดต" : "ลองเลือกปีอื่นเพื่อดูรายการเพิ่มเติม"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                isExpanded={expandedIds.includes(notification.notification_id)}
                onToggle={toggleNotification}
              />
            ))}
          </div>
        )}

        {!isLoading && !errorMessage && filteredNotifications.length > 0 ? (
          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-500">แสดง {displayedNotifications.length} จาก {filteredNotifications.length} รายการ</p>
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredNotifications.length))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                แสดงเพิ่มเติม
              </button>
            ) : null}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
