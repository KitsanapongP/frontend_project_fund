"use client";

import AuthGuard from "../../components/AuthGuard";

export default function ResearcherManagementLayout({ children }) {
  return <AuthGuard allowedPermissions={["portal.card.researcher_management.access"]}>{children}</AuthGuard>;
}
