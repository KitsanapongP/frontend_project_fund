import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPortalRule, getAccessiblePortalItems, getPortalItemAccess } from "../portal_access.js";

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

const portalItems = [
  "researchFund", "externalFund", "publicationSearch", "mou", "links",
  "researcherMatching", "researcherManagement",
].map((id) => ({ id }));

const visibleItems = ({ permissions = [], roles = [], isAuthenticated = true } = {}) =>
  getAccessiblePortalItems(portalItems, {
    isAuthenticated,
    hasAnyPermission: (required) => required.some((code) => permissions.includes(code)),
    hasAnyRole: (required) => required.some((role) => roles.includes(role)),
  }).map((item) => item.id);

test("guests see every portal card while protected systems still require login", () => {
  assert.deepEqual(visibleItems({ isAuthenticated: false }), portalItems.map((item) => item.id));
  assert.deepEqual(visibleItems({ isAuthenticated: false, permissions: ["mou.read"] }), portalItems.map((item) => item.id));
  for (const id of ["researchFund", "externalFund", "mou", "links", "researcherManagement"]) {
    assert.equal(access(id, [], [], false), false);
  }
});

test("portal hides denied cards even for an admin role", () => {
  assert.deepEqual(visibleItems({ roles: ["admin"] }), [
    "publicationSearch", "researcherMatching",
  ]);
});

test("portal visibility follows effective grants and revocations in display order", () => {
  assert.deepEqual(visibleItems({ permissions: [
    "portal.card.research_fund.access", "mou.read", "portal.card.researcher_management.access",
  ] }), ["researchFund", "publicationSearch", "mou", "researcherMatching", "researcherManagement"]);
  assert.deepEqual(visibleItems({ permissions: ["mou.read"] }), [
    "publicationSearch", "mou", "researcherMatching",
  ]);
});

test("each protected card is only shown for its matching permission", () => {
  for (const [id, permission] of [
    ["researchFund", "portal.card.research_fund.access"],
    ["externalFund", "portal.card.external_fund.access"],
    ["mou", "mou.read"],
    ["links", "portal.card.links.access"],
    ["researcherManagement", "portal.card.researcher_management.access"],
  ]) {
    assert.deepEqual(visibleItems({ permissions: [permission] }), portalItems
      .filter((item) => [id, "publicationSearch", "researcherMatching"].includes(item.id))
      .map((item) => item.id));
  }
});
