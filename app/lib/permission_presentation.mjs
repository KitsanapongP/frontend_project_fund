const normalizeKey = (value) => String(value || "").trim().toLowerCase();

export const PERMISSION_CATEGORIES = [
  {
    key: "portal_access",
    labelTh: "การเข้าถึงระบบ",
    descriptionTh: "กำหนดว่าสามารถเข้าสู่พื้นที่ของแต่ละบทบาทได้หรือไม่",
  },
  {
    key: "admin_pages",
    labelTh: "หน้าสำหรับผู้ดูแลระบบ",
    descriptionTh: "ควบคุมเมนูและหน้าที่ปรากฏในระบบผู้ดูแล",
  },
  {
    key: "member_pages",
    labelTh: "หน้าสำหรับบุคลากร",
    descriptionTh: "ควบคุมเมนูและหน้าที่บุคลากรหรือผู้พิจารณาเข้าถึงได้",
  },
  {
    key: "fund_requests",
    labelTh: "คำขอทุนและการพิจารณา",
    descriptionTh: "การสร้าง แก้ไข อ่าน และอนุมัติคำขอทุน",
  },
  {
    key: "publication_rewards",
    labelTh: "เงินรางวัลการตีพิมพ์",
    descriptionTh: "การยื่นคำขอ พิจารณา และตั้งค่าเงินรางวัลการตีพิมพ์",
  },
  {
    key: "department_review",
    labelTh: "การพิจารณาระดับภาควิชา",
    descriptionTh: "การให้ความเห็น ส่งกลับแก้ไข หรือไม่เห็นชอบโดยหัวหน้าภาควิชา",
  },
  {
    key: "research_data",
    labelTh: "ข้อมูลวิจัยและ Scopus",
    descriptionTh: "การอ่าน ค้นหา และส่งออกข้อมูลผลงานวิจัย",
  },
  {
    key: "content_reports",
    labelTh: "รายงาน ประกาศ และแบบฟอร์ม",
    descriptionTh: "การส่งออกรายงาน จัดการประกาศ และตั้งค่าแบบฟอร์ม",
  },
  {
    key: "access_control",
    labelTh: "การจัดการสิทธิ์",
    descriptionTh: "การดูหรือเปลี่ยนสิทธิ์ของบทบาทและผู้ใช้งาน",
  },
  {
    key: "system_integrations",
    labelTh: "ระบบและการเชื่อมต่อ",
    descriptionTh: "สิทธิ์ทางเทคนิคสำหรับผู้ใช้และการเชื่อมต่อ API",
  },
  {
    key: "other",
    labelTh: "สิทธิ์อื่น ๆ",
    descriptionTh: "สิทธิ์ที่ยังไม่ได้จัดหมวดหรือยังไม่มีคำแปลภาษาไทย",
  },
];

export const ROLE_PRESENTATION = {
  teacher: { labelTh: "อาจารย์", descriptionTh: "ยื่นคำขอและติดตามงานของตนเอง" },
  staff: { labelTh: "เจ้าหน้าที่", descriptionTh: "สนับสนุนงานและดำเนินการตามขอบเขตที่ได้รับ" },
  admin: { labelTh: "ผู้ดูแลระบบ", descriptionTh: "จัดการคำขอ การตั้งค่า และข้อมูลส่วนกลาง" },
  dept_head: { labelTh: "หัวหน้าภาควิชา", descriptionTh: "พิจารณาคำขอภายในภาควิชา" },
  executive: { labelTh: "ผู้บริหาร", descriptionTh: "ดูข้อมูลภาพรวมเพื่อการกำกับและตัดสินใจ" },
  academic_designer: { labelTh: "ผู้ดูแลข้อมูลวิชาการ", descriptionTh: "จัดเตรียมและดูแลข้อมูลผลงานวิชาการ" },
};

export const PERMISSION_PRESENTATION = {
  "portal.member.access": {
    titleTh: "เข้าสู่ระบบสำหรับบุคลากร",
    descriptionTh: "เปิดพื้นที่ใช้งานสำหรับอาจารย์ นักวิจัย และผู้พิจารณาระดับภาควิชา",
    category: "portal_access",
    kind: "access",
  },
  "portal.admin.access": {
    titleTh: "เข้าสู่ระบบผู้ดูแล",
    descriptionTh: "เปิดพื้นที่จัดการส่วนกลางและเมนูสำหรับผู้ดูแลระบบ",
    category: "portal_access",
    kind: "access",
    risk: "high",
  },
  "portal.executive.access": {
    titleTh: "เข้าสู่ระบบสำหรับผู้บริหาร",
    descriptionTh: "เปิดพื้นที่ดูข้อมูลภาพรวมสำหรับผู้บริหาร",
    category: "portal_access",
    kind: "access",
  },

  "ui.page.admin.dashboard.view": {
    titleTh: "เข้าถึงแดชบอร์ดผู้ดูแลระบบ",
    descriptionTh: "แสดงเมนูและเปิดหน้าแดชบอร์ดภาพรวมของผู้ดูแลระบบ",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.research_dashboard.view": {
    titleTh: "เข้าถึงแดชบอร์ดงานวิจัย",
    descriptionTh: "เปิดหน้าวิเคราะห์และสรุปข้อมูลผลงานวิจัย",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.research_fund.view": {
    titleTh: "เข้าถึงหน้าจัดการทุนส่งเสริมงานวิจัย",
    descriptionTh: "แสดงเมนูและเปิดหน้าจัดการทุนส่งเสริมงานวิจัย",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.promotion_fund.view": {
    titleTh: "เข้าถึงหน้าจัดการทุนอุดหนุนกิจกรรม",
    descriptionTh: "แสดงเมนูและเปิดหน้าจัดการทุนอุดหนุนกิจกรรม",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.applications.view": {
    titleTh: "เข้าถึงหน้ารายการคำขอทุน",
    descriptionTh: "เปิดหน้าตรวจสอบและดำเนินการกับรายการคำขอทุนทั้งหมด",
    category: "admin_pages",
    kind: "page",
    risk: "high",
  },
  "ui.page.admin.scopus.view": {
    titleTh: "เข้าถึงหน้าค้นหางานวิจัย",
    descriptionTh: "เปิดหน้าค้นหาและตรวจสอบข้อมูลผลงานจาก Scopus",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.fund_settings.view": {
    titleTh: "เข้าถึงหน้าตั้งค่าทุน",
    descriptionTh: "เปิดหน้าปีงบประมาณ ประเภททุน แบบฟอร์ม และค่าระบบที่เกี่ยวข้อง",
    category: "admin_pages",
    kind: "page",
    risk: "high",
  },
  "ui.page.admin.projects.view": {
    titleTh: "เข้าถึงหน้าจัดการโครงการ",
    descriptionTh: "เปิดหน้าจัดการข้อมูลโครงการวิจัย",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.approval_records.view": {
    titleTh: "เข้าถึงหน้าบันทึกการอนุมัติทุน",
    descriptionTh: "เปิดหน้าบันทึกและติดตามข้อมูลการอนุมัติทุน",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.import_export.view": {
    titleTh: "เข้าถึงหน้านำเข้าและส่งออก",
    descriptionTh: "เปิดหน้าสำหรับนำเข้าหรือส่งออกข้อมูลของระบบ",
    category: "admin_pages",
    kind: "page",
    risk: "high",
  },
  "ui.page.admin.academic_imports.view": {
    titleTh: "เข้าถึงหน้าข้อมูลผลงานวิชาการ",
    descriptionTh: "เปิดหน้าจัดการการนำเข้าข้อมูลผลงานวิชาการ",
    category: "admin_pages",
    kind: "page",
  },
  "ui.page.admin.access_control.view": {
    titleTh: "เข้าถึงหน้าจัดการสิทธิ์",
    descriptionTh: "เปิดหน้าตรวจสอบบทบาท สิทธิ์ และข้อยกเว้นรายบุคคล",
    category: "admin_pages",
    kind: "page",
    risk: "critical",
  },

  "ui.page.member.dashboard.view": {
    titleTh: "เข้าถึงแดชบอร์ดของบุคลากร",
    descriptionTh: "เปิดหน้าแรกและข้อมูลสรุปส่วนบุคคล",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.profile.view": {
    titleTh: "เข้าถึงข้อมูลส่วนตัว",
    descriptionTh: "เปิดหน้าตรวจสอบข้อมูลส่วนตัวและข้อมูลนักวิจัย",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.research_fund.view": {
    titleTh: "เข้าถึงหน้าทุนส่งเสริมงานวิจัย",
    descriptionTh: "เปิดหน้าดูรายละเอียดและยื่นคำขอทุนส่งเสริมงานวิจัย",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.promotion_fund.view": {
    titleTh: "เข้าถึงหน้าทุนอุดหนุนกิจกรรม",
    descriptionTh: "เปิดหน้าดูรายละเอียดและยื่นคำขอทุนอุดหนุนกิจกรรม",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.applications.view": {
    titleTh: "เข้าถึงหน้าคำขอของฉัน",
    descriptionTh: "เปิดหน้าติดตามและจัดการคำขอที่ผู้ใช้เป็นผู้ยื่น",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.received_funds.view": {
    titleTh: "เข้าถึงหน้าทุนที่ได้รับ",
    descriptionTh: "เปิดหน้าตรวจสอบรายการทุนที่ได้รับอนุมัติ",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.announcements.view": {
    titleTh: "เข้าถึงหน้าประกาศ",
    descriptionTh: "เปิดหน้าดูข่าวสารและประกาศที่เกี่ยวข้อง",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.projects.view": {
    titleTh: "เข้าถึงหน้าโครงการของฉัน",
    descriptionTh: "เปิดหน้าตรวจสอบโครงการวิจัยที่เกี่ยวข้องกับผู้ใช้",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.notifications.view": {
    titleTh: "เข้าถึงหน้าการแจ้งเตือน",
    descriptionTh: "เปิดหน้าดูรายการแจ้งเตือนทั้งหมดของผู้ใช้",
    category: "member_pages",
    kind: "page",
  },
  "ui.page.member.dept_review.view": {
    titleTh: "เข้าถึงหน้าพิจารณาระดับภาควิชา",
    descriptionTh: "เปิดหน้าตรวจสอบคำขอของบุคลากรในภาควิชา",
    category: "member_pages",
    kind: "page",
    risk: "high",
  },

  "dashboard.view.self": {
    titleTh: "ดูแดชบอร์ดของตนเอง",
    descriptionTh: "ดูข้อมูลสรุปและสถิติที่เกี่ยวข้องกับบัญชีของตนเอง",
    category: "member_pages",
    kind: "view",
  },
  "dashboard.view.admin": {
    titleTh: "ดูแดชบอร์ดภาพรวมองค์กร",
    descriptionTh: "ดูข้อมูลสรุปรวมที่ใช้ในแดชบอร์ดผู้ดูแลหรือผู้บริหาร",
    category: "admin_pages",
    kind: "view",
    risk: "high",
  },
  "fund.request.create": {
    titleTh: "สร้างคำขอทุน",
    descriptionTh: "เริ่มและส่งคำขอทุนรายการใหม่",
    category: "fund_requests",
    kind: "action",
  },
  "fund.request.update": {
    titleTh: "แก้ไขคำขอทุนของตนเอง",
    descriptionTh: "แก้ไขข้อมูลคำขอทุนที่ผู้ใช้เป็นผู้ยื่นและยังแก้ไขได้",
    category: "fund_requests",
    kind: "action",
  },
  "fund.request.delete": {
    titleTh: "ลบคำขอทุนของตนเอง",
    descriptionTh: "ลบคำขอทุนที่ผู้ใช้เป็นผู้ยื่นตามเงื่อนไขของระบบ",
    category: "fund_requests",
    kind: "action",
    risk: "high",
  },
  "fund.request.approve": {
    titleTh: "อนุมัติคำขอทุน",
    descriptionTh: "พิจารณาและอนุมัติคำขอทุนของผู้ใช้งาน",
    category: "fund_requests",
    kind: "approve",
    risk: "critical",
  },
  "submission.read.own": {
    titleTh: "ดูคำขอของตนเอง",
    descriptionTh: "อ่านรายละเอียดคำขอที่ผู้ใช้เป็นผู้ยื่น",
    category: "fund_requests",
    kind: "view",
  },
  "submission.read.department": {
    titleTh: "ดูคำขอภายในภาควิชา",
    descriptionTh: "อ่านคำขอของบุคลากรที่อยู่ในภาควิชาเดียวกัน",
    category: "fund_requests",
    kind: "view",
    risk: "high",
  },
  "submission.read.all": {
    titleTh: "ดูคำขอทั้งหมด",
    descriptionTh: "อ่านคำขอของผู้ใช้ทุกคนโดยไม่จำกัดภาควิชา",
    category: "fund_requests",
    kind: "view",
    risk: "critical",
  },
  "submission.approval_attachment.manage": {
    titleTh: "จัดการเอกสารประกอบการอนุมัติ",
    descriptionTh: "เพิ่ม แก้ไข หรือลบไฟล์เอกสารที่ใช้ประกอบการอนุมัติคำขอ",
    category: "fund_requests",
    kind: "manage",
    risk: "high",
  },

  "publication.reward.manage_own": {
    titleTh: "จัดการคำขอเงินรางวัลของตนเอง",
    descriptionTh: "สร้างและแก้ไขคำขอเงินรางวัลการตีพิมพ์ของผู้ใช้",
    category: "publication_rewards",
    kind: "action",
  },
  "publication.reward.approve": {
    titleTh: "อนุมัติคำขอเงินรางวัลการตีพิมพ์",
    descriptionTh: "พิจารณา อนุมัติ หรือไม่อนุมัติคำขอเงินรางวัลการตีพิมพ์",
    category: "publication_rewards",
    kind: "approve",
    risk: "critical",
  },
  "publication.reward.rate.manage": {
    titleTh: "จัดการอัตราเงินรางวัล",
    descriptionTh: "กำหนดและแก้ไขอัตราเงินรางวัลหรือเพดานค่าธรรมเนียม",
    category: "publication_rewards",
    kind: "manage",
    risk: "critical",
  },

  "dept_head.review.recommend": {
    titleTh: "เสนอแนะให้ดำเนินการต่อ",
    descriptionTh: "บันทึกความเห็นสนับสนุนคำขอในฐานะหัวหน้าภาควิชา",
    category: "department_review",
    kind: "approve",
    risk: "high",
  },
  "dept_head.review.reject": {
    titleTh: "ไม่เห็นชอบคำขอระดับภาควิชา",
    descriptionTh: "บันทึกผลไม่เห็นชอบคำขอในฐานะหัวหน้าภาควิชา",
    category: "department_review",
    kind: "approve",
    risk: "high",
  },
  "dept_head.review.request_revision": {
    titleTh: "ส่งคำขอกลับให้แก้ไข",
    descriptionTh: "ขอให้ผู้ยื่นปรับปรุงข้อมูลก่อนพิจารณาอีกครั้ง",
    category: "department_review",
    kind: "approve",
    risk: "high",
  },

  "scopus.publications.read": {
    titleTh: "ดูข้อมูลผลงานจาก Scopus",
    descriptionTh: "ค้นหาและอ่านรายละเอียดผลงานวิจัยที่นำเข้าจาก Scopus",
    category: "research_data",
    kind: "view",
  },
  "scopus.publications.read_by_user": {
    titleTh: "ดูผลงาน Scopus แยกตามบุคลากร",
    descriptionTh: "ดูข้อมูลผลงานวิจัยที่จัดกลุ่มตามเจ้าของผลงาน",
    category: "research_data",
    kind: "view",
  },
  "scopus.publications.export": {
    titleTh: "ส่งออกข้อมูลผลงาน Scopus",
    descriptionTh: "ดาวน์โหลดข้อมูลผลงานวิจัยจาก Scopus ออกจากระบบ",
    category: "research_data",
    kind: "export",
    risk: "high",
  },
  "scopus.publications.export_by_user": {
    titleTh: "ส่งออกผลงาน Scopus แยกตามบุคลากร",
    descriptionTh: "ดาวน์โหลดข้อมูลผลงานวิจัยที่จัดกลุ่มตามเจ้าของผลงาน",
    category: "research_data",
    kind: "export",
    risk: "high",
  },

  "report.export": {
    titleTh: "ส่งออกรายงาน",
    descriptionTh: "ดาวน์โหลดข้อมูลรายงานออกจากระบบเป็นไฟล์",
    category: "content_reports",
    kind: "export",
    risk: "high",
  },
  "announcement.manage": {
    titleTh: "จัดการประกาศ",
    descriptionTh: "สร้าง แก้ไข เผยแพร่ หรือปิดการใช้งานประกาศ",
    category: "content_reports",
    kind: "manage",
    risk: "high",
  },
  "fund.form.manage": {
    titleTh: "จัดการแบบฟอร์มทุน",
    descriptionTh: "เพิ่ม แก้ไข และกำหนดแบบฟอร์มที่ใช้ยื่นคำขอทุน",
    category: "content_reports",
    kind: "manage",
    risk: "high",
  },

  "access.view": {
    titleTh: "ดูข้อมูลสิทธิ์การเข้าถึง",
    descriptionTh: "ดู Role รายการ permission ข้อยกเว้น และสิทธิ์ที่มีผลจริง",
    category: "access_control",
    kind: "view",
    risk: "high",
  },
  "access.manage": {
    titleTh: "แก้ไขสิทธิ์การเข้าถึง",
    descriptionTh: "เปลี่ยนสิทธิ์ของ Role และกำหนดข้อยกเว้นรายบุคคล",
    category: "access_control",
    kind: "manage",
    risk: "critical",
  },
  "users.view": {
    titleTh: "ดูข้อมูลผู้ใช้งาน",
    descriptionTh: "เปิดดู ค้นหา และกรองข้อมูลบัญชีผู้ใช้งานในระบบ",
    category: "access_control",
    kind: "view",
    risk: "high",
  },
  "users.manage": {
    titleTh: "เพิ่มและแก้ไขผู้ใช้งาน",
    descriptionTh: "สร้างบัญชีผู้ใช้งานใหม่และแก้ไขข้อมูลประจำตัว บทบาท หรือตำแหน่ง",
    category: "access_control",
    kind: "action",
    risk: "critical",
  },

  "users.read": {
    titleTh: "ดูข้อมูลผู้ใช้งาน",
    descriptionTh: "ค้นหาและอ่านข้อมูลบัญชีผู้ใช้ที่จำเป็นต่อการดูแลระบบ",
    category: "system_integrations",
    kind: "view",
    risk: "high",
  },
  "api.clients.manage": {
    titleTh: "จัดการบัญชีเชื่อมต่อ API",
    descriptionTh: "สร้าง เปลี่ยนแปลง หรือยกเลิกสิทธิ์ของระบบภายนอกที่เชื่อมต่อผ่าน API",
    category: "system_integrations",
    kind: "manage",
    risk: "critical",
  },
};

const KIND_LABELS = {
  access: "เข้าสู่ระบบ",
  page: "เข้าถึงหน้า",
  view: "ดูข้อมูล",
  action: "ดำเนินการ",
  approve: "พิจารณา/อนุมัติ",
  manage: "จัดการระบบ",
  export: "ส่งออกข้อมูล",
  other: "สิทธิ์ทั่วไป",
};

export const getPermissionPresentation = (permissionOrCode) => {
  const permission = typeof permissionOrCode === "object" && permissionOrCode !== null
    ? permissionOrCode
    : { code: permissionOrCode };
  const code = normalizeKey(permission.code);
  const known = PERMISSION_PRESENTATION[code];
  const kind = known?.kind || "other";

  return {
    ...permission,
    code,
    titleTh: known?.titleTh || permission.description || code || "ไม่ทราบชื่อสิทธิ์",
    descriptionTh: known?.descriptionTh || "สิทธิ์นี้ยังไม่มีคำอธิบายภาษาไทย กรุณาตรวจสอบรหัสทางเทคนิคก่อนเปลี่ยนแปลง",
    category: known?.category || "other",
    kind,
    kindLabelTh: KIND_LABELS[kind] || KIND_LABELS.other,
    risk: known?.risk || "normal",
    translated: Boolean(known),
    englishDescription: String(permission.description || "").trim(),
  };
};

export const getRolePresentation = (role) => {
  const roleKey = normalizeKey(role?.role || role?.role_key || role);
  const known = ROLE_PRESENTATION[roleKey];
  return {
    roleKey,
    labelTh: known?.labelTh || roleKey || "ไม่ทราบบทบาท",
    descriptionTh: known?.descriptionTh || "บทบาทที่กำหนดไว้ในระบบ",
    translated: Boolean(known),
  };
};

export const getCategoryPresentation = (categoryKey) => {
  return PERMISSION_CATEGORIES.find((item) => item.key === categoryKey)
    || PERMISSION_CATEGORIES[PERMISSION_CATEGORIES.length - 1];
};

export const groupPermissionViews = (permissions = []) => {
  const views = permissions.map(getPermissionPresentation);
  return PERMISSION_CATEGORIES
    .map((category) => ({
      ...category,
      permissions: views
        .filter((permission) => permission.category === category.key)
        .sort((a, b) => a.titleTh.localeCompare(b.titleTh, "th")),
    }))
    .filter((category) => category.permissions.length > 0);
};

export const getPermissionSearchText = (permission) => {
  const view = getPermissionPresentation(permission);
  return normalizeKey([
    view.titleTh,
    view.descriptionTh,
    view.code,
    view.englishDescription,
    view.kindLabelTh,
    getCategoryPresentation(view.category).labelTh,
  ].join(" "));
};

export const getPreviewPermissionState = ({ code, baselinePermissions = [], overrides = {} }) => {
  const normalizedCode = normalizeKey(code);
  const normalizedBaseline = new Set(baselinePermissions.map(normalizeKey).filter(Boolean));
  const effect = normalizeKey(overrides[normalizedCode]);

  if (effect === "allow") {
    return { effective: true, source: "allow", labelTh: "อนุญาตเฉพาะบุคคล" };
  }
  if (effect === "deny") {
    return { effective: false, source: "deny", labelTh: "ปฏิเสธเฉพาะบุคคล" };
  }
  if (normalizedBaseline.has(normalizedCode)) {
    return { effective: true, source: "role", labelTh: "ได้รับจากบทบาท" };
  }
  return { effective: false, source: "none", labelTh: "บทบาทนี้ไม่มีสิทธิ์" };
};

export const resolvePreviewPermissions = ({
  baselinePermissions = [],
  overrides = {},
  implications = {},
}) => {
  const effective = new Set(baselinePermissions.map(normalizeKey).filter(Boolean));
  const denied = new Set();

  Object.entries(overrides).forEach(([rawCode, rawEffect]) => {
    const code = normalizeKey(rawCode);
    const effect = normalizeKey(rawEffect);
    if (!code) return;
    if (effect === "deny") {
      denied.add(code);
      effective.delete(code);
      return;
    }
    if (effect === "allow") {
      effective.add(code);
    }
  });

  let changed = true;
  while (changed) {
    changed = false;
    Object.entries(implications || {}).forEach(([rawSource, rawTargets]) => {
      const source = normalizeKey(rawSource);
      if (!effective.has(source)) return;
      (Array.isArray(rawTargets) ? rawTargets : []).forEach((rawTarget) => {
        const target = normalizeKey(rawTarget);
        if (!target || denied.has(target) || effective.has(target)) return;
        effective.add(target);
        changed = true;
      });
    });

    Array.from(effective).forEach((code) => {
      const portalCode = code.startsWith("ui.page.admin.")
        ? "portal.admin.access"
        : code.startsWith("ui.page.member.")
          ? "portal.member.access"
          : "";
      if (portalCode && !denied.has(portalCode) && !effective.has(portalCode)) {
        effective.add(portalCode);
        changed = true;
      }
    });
  }

  denied.forEach((code) => effective.delete(code));
  return effective;
};

export const normalizePermissionCode = normalizeKey;
