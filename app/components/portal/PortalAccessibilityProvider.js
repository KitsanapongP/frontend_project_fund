"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PORTAL_FONT_SCALE,
  normalizePortalFontScale,
  PORTAL_FONT_SCALE_STORAGE_KEY,
  PORTAL_FONT_SCALES,
} from "@/app/lib/portal_font_scale.mjs";

const PortalAccessibilityContext = createContext(null);

export function PortalAccessibilityProvider({ children }) {
  const [fontScale, setFontScaleState] = useState(DEFAULT_PORTAL_FONT_SCALE);

  useEffect(() => {
    let savedScale = DEFAULT_PORTAL_FONT_SCALE;

    try {
      savedScale = normalizePortalFontScale(
        window.localStorage.getItem(PORTAL_FONT_SCALE_STORAGE_KEY)
      );
    } catch {
      savedScale = DEFAULT_PORTAL_FONT_SCALE;
    }

    setFontScaleState(savedScale);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.portalFontScale = fontScale;

    try {
      window.localStorage.setItem(PORTAL_FONT_SCALE_STORAGE_KEY, fontScale);
    } catch {
      // Storage may be unavailable in privacy mode; the in-memory preference still works.
    }

    return () => {
      delete root.dataset.portalFontScale;
    };
  }, [fontScale]);

  const value = useMemo(
    () => ({
      fontScale,
      fontScales: PORTAL_FONT_SCALES,
      setFontScale: (nextScale) => setFontScaleState(normalizePortalFontScale(nextScale)),
    }),
    [fontScale]
  );

  return (
    <PortalAccessibilityContext.Provider value={value}>
      {children}
    </PortalAccessibilityContext.Provider>
  );
}

export function usePortalAccessibility() {
  const context = useContext(PortalAccessibilityContext);

  if (!context) {
    throw new Error("usePortalAccessibility must be used inside PortalAccessibilityProvider");
  }

  return context;
}
