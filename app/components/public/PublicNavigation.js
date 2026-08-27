"use client";

import { Home, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicNavigation({
  currentPage,
  onNavigate,
  closeMenu,
}) {
  const router = useRouter();

  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate("home");
    }
    if (closeMenu) {
      closeMenu();
    }
  };

  const handleLoginClick = () => {
    if (closeMenu) {
      closeMenu();
    }
    router.push("/login");
  };

  const isActive = (page) => currentPage === page;

  return (
    <nav className="space-y-1 pb-40" aria-label="เมนูสาธารณะ">
      <button
        onClick={handleHomeClick}
        className={`portal-nav-item ${isActive("home") ? "portal-nav-item--active" : ""}`}
      >
        <Home size={20} />
        <span className="flex-1 text-left">หน้าหลัก</span>
      </button>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <button
          onClick={handleLoginClick}
          className="portal-nav-item"
        >
          <LogIn size={20} />
          <span>เข้าสู่ระบบ</span>
        </button>
      </div>
    </nav>
  );
}
