"use client";

import Link from "next/link";
import AuthGuard from "../AuthGuard";
import { getPortalItemAccess } from "../../lib/portal_access";

function PortalPlaceholderPageContent({ title, description }) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-base text-gray-600">{description}</p>
        <p className="mt-2 text-sm text-gray-500">ส่วนนี้อยู่ระหว่างการเตรียมข้อมูลและฟังก์ชันการใช้งาน</p>

        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default function PortalPlaceholderPage({ title, description, accessKey }) {
  const accessRule = getPortalItemAccess(accessKey);

  if (!accessRule.requireAuth) {
    return <PortalPlaceholderPageContent title={title} description={description} />;
  }

  return (
    <AuthGuard
      requireAuth={true}
      allowedRoles={accessRule.allowedRoles || []}
      allowedPermissions={accessRule.allowedPermissions || []}
    >
      <PortalPlaceholderPageContent title={title} description={description} />
    </AuthGuard>
  );
}
