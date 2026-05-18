export const MEMBER_BASE_MENU_ITEMS = [
  {
    id: "profile",
    label: "ข้อมูลส่วนตัว",
    requiredPermission: "ui.page.member.profile.view",
  },
  {
    id: "research-fund",
    label: "ทุนส่งเสริมการวิจัย",
    requiredPermission: "ui.page.member.research_fund.view",
  },
  {
    id: "promotion-fund",
    label: "ทุนอุดหนุนกิจกรรม",
    requiredPermission: "ui.page.member.promotion_fund.view",
  },
  {
    id: "applications",
    label: "คำร้องของฉัน",
    requiredPermission: "ui.page.member.applications.view",
  },
  {
    id: "received-funds",
    label: "ทุนที่เคยได้รับ",
    requiredPermission: "ui.page.member.received_funds.view",
  },
  {
    id: "approval-records",
    label: "บันทึกข้อมูลการอนุมัติทุน",
    requiredPermission: "ui.page.member.applications.view",
  },
  {
    id: "announcements",
    label: "ประกาศกองทุนวิจัยและนวัตกรรม",
    requiredPermission: "ui.page.member.announcements.view",
  },
  {
    id: "projects",
    label: "โครงการ",
    requiredPermission: "ui.page.member.projects.view",
  },
];

export const MEMBER_DEPT_REVIEW_ITEM = {
  id: "dept-review",
  label: "พิจารณาคำร้องของหัวหน้าสาขา",
  requiredPermission: "ui.page.member.dept_review.view",
};
