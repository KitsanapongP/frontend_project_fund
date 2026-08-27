"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Info,
  XCircle,
} from "lucide-react";
import {
  formatNotificationDateTime,
  formatRelativeNotificationDate,
  getNotificationType,
} from "./notificationPresentation";

const TYPE_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export default function NotificationItem({
  notification,
  isExpanded,
  onToggle,
  compact = false,
}) {
  const type = notification?.type || "info";
  const meta = getNotificationType(type);
  const TypeIcon = TYPE_ICONS[type] || TYPE_ICONS.info;
  const notificationId = notification?.notification_id;
  const detailsId = `notification-details-${notificationId}`;
  const dateLabel = compact
    ? formatRelativeNotificationDate(notification?.created_at)
    : formatNotificationDateTime(notification?.created_at);
  const iconSizeClass = compact ? "h-8 w-8" : "h-9 w-9";
  const itemPaddingClass = compact ? "px-4 py-3" : "px-4 py-4 sm:px-5";

  return (
    <button
      type="button"
      className={`group w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
        notification?.is_read ? "bg-white hover:bg-slate-50" : "bg-amber-50/70 hover:bg-amber-50"
      }`}
      onClick={() => onToggle(notificationId)}
      aria-expanded={isExpanded}
      aria-controls={detailsId}
    >
      <span className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2.5 ${itemPaddingClass}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-lg border ${iconSizeClass} ${meta.iconClass}`}>
          <TypeIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className={`${compact ? "text-sm leading-5" : "leading-snug"} font-semibold text-slate-900`}>
            {notification?.title || "การแจ้งเตือน"}
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {dateLabel}
            </span>
            <span className={`rounded-md border px-2 py-0.5 font-medium ${meta.badgeClass}`}>
              {meta.label}
            </span>
            {!notification?.is_read ? (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                ยังไม่อ่าน
              </span>
            ) : null}
            {notification?.related_submission_id ? (
              <span className="font-medium text-slate-600">
                คำร้อง #{notification.related_submission_id}
              </span>
            ) : null}
          </span>

          {!compact && !isExpanded && notification?.message ? (
            <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-slate-600">
              {notification.message}
            </span>
          ) : null}
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors group-hover:bg-white group-hover:text-slate-700">
          {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </span>

        {isExpanded ? (
          <span
            id={detailsId}
            className={`col-start-2 col-end-4 block text-sm leading-relaxed text-slate-700 ${
              compact
                ? "mt-2 border-t border-slate-200 pt-2.5"
                : "mt-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3"
            }`}
          >
            <span className="whitespace-pre-line">{notification?.message || "ไม่มีรายละเอียดเพิ่มเติม"}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
