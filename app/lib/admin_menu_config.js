export const ADMIN_BASE_MENU_ITEMS = [
  {
    id: "dashboard",
    label: "แดชบอร์ดผู้ดูแลระบบ",
    route: "/research-fund-system/admin/dashboard",
    requiredPermissions: ["ui.page.admin.dashboard.view", "dashboard.view.admin"],
  },
  {
    id: "research-dashboard",
    label: "แดชบอร์ดงานวิจัย",
    route: "/research-fund-system/admin/research-dashboard",
    requiredPermissions: ["ui.page.admin.research_dashboard.view"],
  },
  {
    id: "research-fund",
    label: "ทุนส่งเสริมงานวิจัย",
    route: "/research-fund-system/admin/research-fund",
    requiredPermissions: ["ui.page.admin.research_fund.view"],
  },
  {
    id: "promotion-fund",
    label: "ทุนอุดหนุนกิจกรรม",
    route: "/research-fund-system/admin/promotion-fund",
    requiredPermissions: ["ui.page.admin.promotion_fund.view"],
  },
  {
    id: "applications-list",
    label: "รายการการขอทุน",
    route: "/research-fund-system/admin/applications-list",
    requiredPermissions: ["ui.page.admin.applications.view"],
  },
  {
    id: "scopus-research-search",
    label: "ค้นหางานวิจัย",
    route: "/research-fund-system/admin/scopus-research-search",
    requiredPermissions: ["ui.page.admin.scopus.view", "scopus.publications.read"],
  },
  {
    id: "fund-settings",
    label: "ตั้งค่าทุน",
    route: "/research-fund-system/admin/fund-settings",
    requiredPermissions: ["ui.page.admin.fund_settings.view"],
  },
  {
    id: "projects",
    label: "จัดการโครงการ",
    route: "/research-fund-system/admin/projects",
    requiredPermissions: ["ui.page.admin.projects.view"],
  },
  {
    id: "approval-records",
    label: "บันทึกข้อมูลการอนุมัติทุน",
    route: "/research-fund-system/admin/approval-records",
    requiredPermissions: ["ui.page.admin.approval_records.view"],
  },
  {
    id: "import-export",
    label: "นำเข้า/ส่งออก",
    route: "/research-fund-system/admin/import-export",
    requiredPermissions: ["ui.page.admin.import_export.view"],
  },
  {
    id: "academic-imports",
    label: "ข้อมูลผลงานวิชาการ / Academic Data Import",
    route: "/research-fund-system/admin/academic-imports",
    requiredPermissions: ["ui.page.admin.academic_imports.view"],
  },
  {
    id: "access-control",
    label: "จัดการสิทธิ์การเข้าถึง",
    route: "/research-fund-system/admin/access-control",
    requiredPermissions: ["ui.page.admin.access_control.view", "access.manage"],
  },
];
