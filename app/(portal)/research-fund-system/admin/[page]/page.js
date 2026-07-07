"use client";

import { use } from "react";
import AuthGuard from "../../../../components/AuthGuard";
import { AdminPageContent } from "../page";

export default function AdminDynamicPage({ params }) {
  const resolvedParams = use(params);
  const page = Array.isArray(resolvedParams?.page)
    ? resolvedParams.page[0]
    : resolvedParams?.page;

  // Portal-level gate only: AuthGuard.canAccess allows anyone with admin-portal access
  // (hasAdminPortalAccess — includes members granted specific admin pages via
  // /access-control). Do NOT hardcode dashboard permission here, or delegated users whose
  // grant is a non-dashboard page get "unauthorized". The menu is permission-filtered and
  // each backend endpoint enforces its own permission.
  return (
    <AuthGuard requireAuth={true}>
      <AdminPageContent initialPage={page} />
    </AuthGuard>
  );
}
