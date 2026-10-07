import test from "node:test";
import assert from "node:assert/strict";

import {
  PERMISSION_PRESENTATION,
  getPermissionPresentation,
  getPreviewPermissionState,
  getRolePresentation,
  groupPermissionViews,
  resolvePreviewPermissions,
} from "../permission_presentation.mjs";

const CURRENT_PERMISSION_CODES = [
  "access.manage",
  "access.view",
  "announcement.manage",
  "api.clients.manage",
  "dashboard.view.admin",
  "dashboard.view.self",
  "dept_head.review.recommend",
  "dept_head.review.reject",
  "dept_head.review.request_revision",
  "fund.form.manage",
  "fund.request.approve",
  "fund.request.create",
  "fund.request.delete",
  "fund.request.update",
  "mou.manage",
  "mou.read",
  "portal.admin.access",
  "portal.card.external_fund.access",
  "portal.card.links.access",
  "portal.card.research_fund.access",
  "portal.card.researcher_management.access",
  "portal.executive.access",
  "portal.member.access",
  "publication.reward.approve",
  "publication.reward.manage_own",
  "publication.reward.rate.manage",
  "report.export",
  "scopus.publications.export",
  "scopus.publications.export_by_user",
  "scopus.publications.read",
  "scopus.publications.read_by_user",
  "submission.approval_attachment.manage",
  "submission.read.all",
  "submission.read.department",
  "submission.read.own",
  "ui.page.admin.academic_imports.view",
  "ui.page.admin.access_control.view",
  "ui.page.admin.applications.view",
  "ui.page.admin.approval_records.view",
  "ui.page.admin.dashboard.view",
  "ui.page.admin.fund_settings.view",
  "ui.page.admin.import_export.view",
  "ui.page.admin.projects.view",
  "ui.page.admin.promotion_fund.view",
  "ui.page.admin.research_dashboard.view",
  "ui.page.admin.research_fund.view",
  "ui.page.admin.scopus.view",
  "ui.page.member.announcements.view",
  "ui.page.member.applications.view",
  "ui.page.member.dashboard.view",
  "ui.page.member.dept_review.view",
  "ui.page.member.notifications.view",
  "ui.page.member.profile.view",
  "ui.page.member.projects.view",
  "ui.page.member.promotion_fund.view",
  "ui.page.member.received_funds.view",
  "ui.page.member.research_fund.view",
  "users.manage",
  "users.read",
  "users.view",
];

test("permission catalog has Thai presentation metadata for every current permission", () => {
  assert.deepEqual(
    Object.keys(PERMISSION_PRESENTATION).sort(),
    CURRENT_PERMISSION_CODES.sort(),
  );

  CURRENT_PERMISSION_CODES.forEach((code) => {
    const item = getPermissionPresentation({ code, description: "English fallback" });
    assert.equal(item.translated, true, code);
    assert.ok(item.titleTh.length > 0, code);
    assert.ok(item.descriptionTh.length > 0, code);
    assert.notEqual(item.category, "other", code);
  });
});

test("researcher management grant is presented as a high-risk management permission", () => {
  const permission = getPermissionPresentation("portal.card.researcher_management.access");
  assert.equal(permission.risk, "high");
  assert.match(permission.descriptionTh, /จัดการข้อมูลบุคลากร/);
});

test("unknown permissions remain visible with a safe fallback", () => {
  const item = getPermissionPresentation({
    code: "future.permission.read",
    description: "Read future records",
  });

  assert.equal(item.translated, false);
  assert.equal(item.titleTh, "Read future records");
  assert.equal(item.category, "other");
});

test("permission groups preserve every input permission", () => {
  const permissions = CURRENT_PERMISSION_CODES.map((code) => ({ code }));
  const groupedCount = groupPermissionViews(permissions)
    .reduce((total, group) => total + group.permissions.length, 0);

  assert.equal(groupedCount, permissions.length);
});

test("permission groups separate modules", () => {
  const groups = groupPermissionViews([
    { code: "mou.read", module: "mou" },
    { code: "portal.card.links.access", module: "portal" },
    { code: "dashboard.view.self", module: "research" },
  ]);
  assert.equal(groups.length, 3);
  assert.ok(groups.some((group) => group.labelTh.includes("MOU")));
  assert.ok(groups.some((group) => group.labelTh.includes("Portal")));
});

test("role labels use Thai first and preserve unknown roles", () => {
  assert.equal(getRolePresentation("admin").labelTh, "ผู้ดูแลระบบ");
  assert.equal(getRolePresentation("new_role").labelTh, "new_role");
});

test("override preview distinguishes role, allow, deny, and no access", () => {
  assert.deepEqual(
    getPreviewPermissionState({ code: "report.export", baselinePermissions: ["report.export"] }),
    { effective: true, source: "role", labelTh: "ได้รับจากบทบาท" },
  );
  assert.equal(getPreviewPermissionState({
    code: "report.export",
    baselinePermissions: [],
    overrides: { "report.export": "allow" },
  }).source, "allow");
  assert.equal(getPreviewPermissionState({
    code: "report.export",
    baselinePermissions: ["report.export"],
    overrides: { "report.export": "deny" },
  }).source, "deny");
  assert.equal(getPreviewPermissionState({ code: "report.export" }).source, "none");
});

test("preview applies backend implications without overriding an explicit deny", () => {
  const implications = {
    "ui.page.admin.import_export.view": ["report.export"],
  };
  const allowed = resolvePreviewPermissions({
    overrides: { "ui.page.admin.import_export.view": "allow" },
    implications,
  });
  assert.equal(allowed.has("report.export"), true);

  const denied = resolvePreviewPermissions({
    overrides: {
      "ui.page.admin.import_export.view": "allow",
      "report.export": "deny",
    },
    implications,
  });
  assert.equal(denied.has("report.export"), false);
});
