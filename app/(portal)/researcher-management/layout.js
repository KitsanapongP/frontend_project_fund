"use client";

import AuthGuard from "../../components/AuthGuard";

export default function ResearcherManagementLayout({ children }) {
  return <AuthGuard allowedRoles={["academic_designer"]}>{children}</AuthGuard>;
}
