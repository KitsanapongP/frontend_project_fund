"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { usePortalAccessibility } from "./PortalAccessibilityProvider";

const NAV_ICON_TONES = {
  blue: "border-blue-200 bg-blue-50 text-blue-700 group-hover:border-blue-600 group-hover:bg-blue-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:border-emerald-600 group-hover:bg-emerald-600",
  amber: "border-amber-200 bg-amber-50 text-amber-700 group-hover:border-amber-600 group-hover:bg-amber-600",
  violet: "border-violet-200 bg-violet-50 text-violet-700 group-hover:border-violet-600 group-hover:bg-violet-600",
  teal: "border-teal-200 bg-teal-50 text-teal-700 group-hover:border-teal-600 group-hover:bg-teal-600",
  sky: "border-sky-200 bg-sky-50 text-sky-700 group-hover:border-sky-600 group-hover:bg-sky-600",
  rose: "border-rose-200 bg-rose-50 text-rose-700 group-hover:border-rose-600 group-hover:bg-rose-600",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 group-hover:border-indigo-600 group-hover:bg-indigo-600",
  slate: "border-slate-200 bg-slate-50 text-slate-700 group-hover:border-slate-600 group-hover:bg-slate-600",
  red: "border-red-200 bg-red-50 text-red-700 group-hover:border-red-600 group-hover:bg-red-600",
};

export function PortalNavIcon({ icon: Icon, tone = "blue", size = 18, className = "" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors group-hover:text-white ${NAV_ICON_TONES[tone] || NAV_ICON_TONES.blue} ${className}`.trim()}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

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
        className={`portal-nav-item portal-nav-item--portal group ${className}`.trim()}
      >
        <PortalNavIcon icon={Home} tone="blue" />
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
