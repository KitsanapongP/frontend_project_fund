export const NOTIFICATION_TYPES = {
  success: {
    label: "สำเร็จ",
    iconClass: "border-green-200 bg-green-50 text-green-700",
    badgeClass: "border-green-200 bg-green-50 text-green-700",
  },
  warning: {
    label: "แจ้งเตือน",
    iconClass: "border-amber-200 bg-amber-50 text-amber-700",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  error: {
    label: "ต้องดำเนินการ",
    iconClass: "border-red-200 bg-red-50 text-red-700",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
  },
  info: {
    label: "ทั่วไป",
    iconClass: "border-blue-200 bg-blue-50 text-blue-700",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
};

export function getNotificationType(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
}

export function formatRelativeNotificationDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return "เมื่อสักครู่";
  if (diffHours < 1) return `${diffMinutes} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffHours < 48) return "เมื่อวาน";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatNotificationDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
