"use client";

import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import PublicHeader from "../../../components/public/PublicHeader";
import MemberHeader from "../../research-fund-system/member/components/layout/Header";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isAuthenticated) {
    return (
      <MemberHeader
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        currentPageTitle="สืบค้นผลงาน"
        brandTitle="ระบบบริหารจัดการทุนวิจัย"
      />
    );
  }

  return (
    <PublicHeader
      isOpen={isMenuOpen}
      setIsOpen={setIsMenuOpen}
      currentPageTitle="สืบค้นผลงาน"
      loginHref="/login"
    />
  );
}
