import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPortalRule, getPortalItemAccess } from "../portal_access.js";

const access = (item, permissions = [], roles = [], isAuthenticated = true) =>
  canAccessPortalRule(getPortalItemAccess(item), {
    isAuthenticated,
    hasAnyPermission: (required) => required.some((code) => permissions.includes(code)),
    hasAnyRole: (required) => required.some((role) => roles.includes(role)),
  });

test("MOU portal access follows the effective read permission", () => {
  assert.equal(access("mou", [], ["admin"]), false);
  assert.equal(access("mou", ["mou.read"], ["teacher"]), true);
  assert.equal(access("mou", ["mou.read"], ["teacher"], false), false);
});

test("researcher management accepts a delegated portal permission regardless of role", () => {
  assert.equal(access("researcherManagement", ["portal.card.researcher_management.access"], ["teacher"]), true);
  assert.equal(access("researcherManagement", [], ["admin"]), false);
  assert.equal(access("researcherManagement", ["portal.card.researcher_management.access"], ["academic_designer"]), true);
  assert.equal(access("researcherManagement", ["portal.card.researcher_management.access"], ["teacher"], false), false);
});

test("public portal cards remain available without login", () => {
  assert.equal(access("publicationSearch", [], [], false), true);
  assert.equal(access("researcherMatching", [], [], false), true);
});
