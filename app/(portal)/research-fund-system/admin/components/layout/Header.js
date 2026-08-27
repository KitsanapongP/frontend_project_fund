"use client";

import AuthenticatedPortalHeader from "@/app/components/portal/AuthenticatedPortalHeader";
import { BRANDING } from "@/app/config/branding";

export default function Header(props) {
  return (
    <AuthenticatedPortalHeader
      {...props}
      branding={BRANDING}
      currentPageTitle={props.currentPageTitle || "แดชบอร์ดผู้ดูแลระบบ"}
    />
  );
}
