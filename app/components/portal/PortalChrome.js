"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { usePortalAccessibility } from "./PortalAccessibilityProvider";

export function PortalBrandLogo({ onNavigate, className = "" }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label="กลับหน้าหลัก"
      title="กลับหน้าหลัก"
      className={`portal-brand-logo ${className}`.trim()}
    >
      <Image
        src="/image_icon/iconcpkku.png"
        alt="College of Computing, Khon Kaen University"
        width={208}
        height={60}
        sizes="(max-width: 640px) 124px, 152px"
        className="h-auto w-[7.75rem] object-contain sm:w-[9.5rem]"
        priority
      />
    </Link>
  );
}

export function PortalFontSizeControl({ className = "" }) {
  const { fontScale, fontScales, setFontScale } = usePortalAccessibility();

  return (
    <div
      className={`portal-font-control ${className}`.trim()}
      role="group"
      aria-label="ปรับขนาดตัวอักษร"
    >
      {fontScales.map((scale) => {
        const isActive = fontScale === scale.id;
        return (
          <button
            key={scale.id}
            type="button"
            onClick={() => setFontScale(scale.id)}
            data-font-scale-option={scale.id}
            className={`portal-font-control__button${isActive ? " portal-font-control__button--active" : ""}`}
            aria-label={`ขนาดตัวอักษร${scale.label} ${scale.percent}%`}
            aria-pressed={isActive}
            title={`ตัวอักษร${scale.label} (${scale.percent}%)`}
          >
            {scale.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function PortalBackLink({
  placement = "header",
  onNavigate,
  alwaysShow = false,
  className = "",
}) {
  const pathname = usePathname();
  const isPortalHome = pathname === "/";

  if (isPortalHome && !alwaysShow) return null;

  if (placement === "nav") {
    return (
      <Link
        href="/"
        onClick={onNavigate}
        className={`portal-nav-item portal-nav-item--portal ${className}`.trim()}
      >
        <Home size={19} aria-hidden="true" />
        <span>กลับหน้าหลัก</span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={`portal-back-link ${className}`.trim()}
    >
      <ArrowLeft size={17} aria-hidden="true" />
      <span>กลับหน้าหลัก</span>
    </Link>
  );
}
