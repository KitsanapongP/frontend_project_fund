import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PORTAL_FONT_SCALE,
  getPortalFontScalePercent,
  normalizePortalFontScale,
  PORTAL_FONT_SCALES,
} from "../portal_font_scale.mjs";

test("portal font scale exposes the three approved levels", () => {
  assert.deepEqual(
    PORTAL_FONT_SCALES.map(({ id, percent }) => ({ id, percent })),
    [
      { id: "small", percent: 90 },
      { id: "medium", percent: 100 },
      { id: "large", percent: 115 },
    ]
  );
  assert.deepEqual(
    PORTAL_FONT_SCALES.map(({ shortLabel }) => shortLabel),
    ["Aa", "Aa", "Aa"]
  );
});

test("invalid or missing saved values fall back to medium", () => {
  assert.equal(normalizePortalFontScale(null), DEFAULT_PORTAL_FONT_SCALE);
  assert.equal(normalizePortalFontScale("huge"), DEFAULT_PORTAL_FONT_SCALE);
  assert.equal(getPortalFontScalePercent("huge"), 100);
});

test("valid saved values preserve their scale", () => {
  assert.equal(normalizePortalFontScale("small"), "small");
  assert.equal(normalizePortalFontScale("large"), "large");
  assert.equal(getPortalFontScalePercent("small"), 90);
  assert.equal(getPortalFontScalePercent("large"), 115);
});
