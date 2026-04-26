"use client";

import { use } from "react";
import AuthGuard from "../../../../components/AuthGuard";
import { AdminPageContent } from "../page";

export default function AdminDynamicPage({ params }) {
  const resolvedParams = use(params);
  const page = Array.isArray(resolvedParams?.page)
    ? resolvedParams.page[0]
    : resolvedParams?.page;

  return (
    <AuthGuard
      allowedRoles={[3, "admin"]}
      allowedPermissions={["ui.page.admin.dashboard.view", "dashboard.view.admin"]}
      requireAuth={true}
    >
      <AdminPageContent initialPage={page} />
    </AuthGuard>
  );
}
