export const PORTAL_FONT_SCALE_STORAGE_KEY = "cp-portal-font-scale";

export const PORTAL_FONT_SCALES = Object.freeze([
  Object.freeze({ id: "small", label: "เล็ก", shortLabel: "Aa", percent: 90 }),
  Object.freeze({ id: "medium", label: "กลาง", shortLabel: "Aa", percent: 100 }),
  Object.freeze({ id: "large", label: "ใหญ่", shortLabel: "Aa", percent: 115 }),
]);

export const DEFAULT_PORTAL_FONT_SCALE = "medium";

const VALID_SCALE_IDS = new Set(PORTAL_FONT_SCALES.map((scale) => scale.id));

export function normalizePortalFontScale(value) {
  return VALID_SCALE_IDS.has(value) ? value : DEFAULT_PORTAL_FONT_SCALE;
}

export function getPortalFontScalePercent(value) {
  const normalized = normalizePortalFontScale(value);
  return PORTAL_FONT_SCALES.find((scale) => scale.id === normalized)?.percent ?? 100;
}
