"use client";

import AuthGuard from "../../../../components/AuthGuard";
import { MemberPageContent } from "../page";

export default function DeptReviewPage() {
  return (
    <AuthGuard
      allowedRoles={[1, 2, 4, "teacher", "staff", "dept_head"]}
      requireAuth={true}
    >
      <MemberPageContent initialPage="dept-review" />
    </AuthGuard>
  );
}
