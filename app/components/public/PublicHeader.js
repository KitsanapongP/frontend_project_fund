"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { LogIn } from "lucide-react";
import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { BRANDING } from "../../config/branding";

export default function PublicHeader({
  isOpen,
  setIsOpen,
  Navigation,
  currentPageTitle = "หน้าหลัก",
  loginHref,
  loginLabel = "เข้าสู่ระบบ",
  userLabel = "",
}) {
  const {
    appName,
    appAcronym,
    subtitles = {},
    logo: {
      text: logoText,
      imageSrc: logoImageSrc,
      imageAlt: logoImageAlt,
      backgroundClass: logoBackgroundClass,
      containerClassName,
      containerStyle,
      imageWidth,
      imageHeight,
      imageClassName,
      imageStyle,
      useFill,
      imageWrapperClassName,
      imageWrapperStyle,
    } = {},
  } = BRANDING;

  const canToggleMenu = Boolean(Navigation);

  const logoContainerClass = useMemo(() => {
    const baseSizeClass = containerClassName || "w-10 h-10";
    const sharedClasses = "rounded-lg flex items-center justify-center";
    const background = logoBackgroundClass ?? "bg-gradient-to-br from-blue-500 to-purple-600";

    return [baseSizeClass, sharedClasses, background].filter(Boolean).join(" ");
  }, [containerClassName, logoBackgroundClass]);

  const handleToggleMenu = () => {
    setIsOpen?.((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsOpen?.(false);
  };

  const renderLogoContent = () => {
    if (logoImageSrc) {
      if (useFill) {
        return (
          <div
            className={`relative w-full h-full ${imageWrapperClassName || ""}`}
            style={imageWrapperStyle || undefined}
          >
            <Image
              src={logoImageSrc}
              alt={logoImageAlt || appName || "Application logo"}
              fill
              className={imageClassName || "object-contain"}
              priority
              style={imageStyle || undefined}
            />
          </div>
        );
      }

      return (
        <Image
          src={logoImageSrc}
          alt={logoImageAlt || appName || "Application logo"}
          width={imageWidth || 32}
          height={imageHeight || 32}
          className={imageClassName || "w-8 h-8 object-contain"}
          priority
          style={imageStyle || undefined}
        />
      );
    }

    return (
      <span className="text-white font-bold text-xl">
        {logoText || appAcronym || "F"}
      </span>
    );
  };

  const renderNavigation = () => {
    if (!Navigation) return null;
    if (typeof Navigation === "function") {
      return Navigation({ closeMenu: handleCloseMenu });
    }
    return Navigation;
  };

  return (
    <header className="fixed top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-start justify-between gap-3 px-4 py-3 sm:items-center sm:px-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex items-start gap-3 sm:items-center">
            <div className={logoContainerClass} style={containerStyle || undefined}>
              {renderLogoContent()}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-800 sm:text-xl">
                {subtitles.public || "งานวิจัยและนวัตกรรม วิทยาลัยการคอมพิวเตอร์"}
              </h1>
              <p className="text-sm text-gray-700 leading-tight">
                {appName || "Fund Management"}
              </p>
              <p className="mt-1 text-xs text-gray-500 truncate" title={currentPageTitle}>
                {currentPageTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canToggleMenu ? (
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-sm text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 md:hidden"
              onClick={handleToggleMenu}
              aria-label={isOpen ? "close-mobile-menu" : "open-mobile-menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <RxCross2 className="w-5 h-5 text-gray-700" />
              ) : (
                <HiMenu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          ) : null}

          {userLabel ? (
            <div className="hidden sm:inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              {userLabel}
            </div>
          ) : null}

          {loginHref ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <LogIn size={16} />
              <span>{loginLabel}</span>
            </Link>
          ) : null}
        </div>

      </div>

      {isOpen && canToggleMenu && (
        <div className="fixed inset-0 bg-gray-200/50 z-40" onClick={handleCloseMenu}>
          <div
            className="absolute top-0 pt-5 right-0 h-screen z-50 w-64 bg-white shadow p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-3">
              <button onClick={handleCloseMenu} aria-label="close-mobile-menu">
                <RxCross2 className="w-7 h-7 text-gray-600 hover:text-red-500" />
              </button>
            </div>

            {renderNavigation()}
          </div>
        </div>
      )}
    </header>
  );
}

