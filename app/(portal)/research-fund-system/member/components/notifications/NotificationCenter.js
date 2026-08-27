"use client";

import { Bell } from "lucide-react";
import NotificationCenterContent from "@/app/components/notifications/NotificationCenterContent";
import PageLayout from "../common/PageLayout";

export default function NotificationCenter() {
  return (
    <PageLayout
      title="การแจ้งเตือน"
      subtitle="ติดตามความคืบหน้าการยื่นคำร้องและข่าวสารสำคัญ"
      icon={Bell}
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/research-fund-system/member" },
        { label: "การแจ้งเตือน" },
      ]}
    >
      <NotificationCenterContent description="ติดตามสถานะคำร้องและข้อมูลที่เกี่ยวข้องกับบัญชีของคุณ" />
    </PageLayout>
  );
}
