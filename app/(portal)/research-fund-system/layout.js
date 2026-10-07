"use client";

import AuthGuard from "../../components/AuthGuard";

export default function ResearchFundSystemLayout({ children }) {
  return <AuthGuard allowedPermissions={["portal.card.research_fund.access"]}>{children}</AuthGuard>;
}
