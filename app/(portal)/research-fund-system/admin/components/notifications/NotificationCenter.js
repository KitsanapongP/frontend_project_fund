"use client";

import { Bell } from "lucide-react";
import NotificationCenterContent from "@/app/components/notifications/NotificationCenterContent";
import PageLayout from "../common/PageLayout";

export default function AdminNotificationCenter() {
  return (
    <PageLayout
      title="การแจ้งเตือน"
      subtitle="ติดตามการแจ้งเตือนทั้งหมดสำหรับผู้ดูแลระบบ"
      icon={Bell}
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/research-fund-system/admin" },
        { label: "การแจ้งเตือน" },
      ]}
    >
      <NotificationCenterContent description="ตรวจสอบเหตุการณ์และความคืบหน้าที่เกี่ยวข้องกับการดูแลระบบ" />
    </PageLayout>
  );
}
