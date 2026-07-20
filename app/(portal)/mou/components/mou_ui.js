"use client";

import React from "react";
import "./mou.css";

const routes = {
  list: "/mou",
  userList: "/mou",
  detail: "/mou/show_detail_mou",
  add: "/mou/add_mou",
  activity: "/mou/add_activity_mou",
  dashboard: "/mou/admin_dashboard",
  edit: "/mou/admin_edit_mou",
  manage: "/mou/admin_manage_type_okr",
};

const mouRows = [
  ["MOU-67-001", "แลกเปลี่ยนนักศึกษาและอาจารย์", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "มหาวิทยาลัย", "ต่างประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "มีผลบังคับใช้"],
  ["MOU-67-002", "วิจัยและพัฒนา AI", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "คณะ", "ในประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "ใกล้หมดอายุ"],
  ["MOU-67-003", "พัฒนาหลักสูตร Data Science", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "คณะ", "ในประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "หมดอายุ"],
  ["MOU-67-001", "แลกเปลี่ยนนักศึกษาและอาจารย์", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "มหาวิทยาลัย", "ต่างประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "มีผลบังคับใช้"],
  ["MOU-67-002", "วิจัยและพัฒนา AI", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "คณะ", "ในประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "ใกล้หมดอายุ"],
  ["MOU-67-003", "พัฒนาหลักสูตร Data Science", "Khon Kaen University, Thailand", "แลกเปลี่ยน", "คณะ", "ในประเทศ", "รศ. ดร.สมชาย", "01/01/2567", "31/12/2569", "หมดอายุ"],
];

const activities = [
  ["15/02/2567", "แลกเปลี่ยนนักศึกษา ภาคการศึกษาที่ 2/2566", "การแลกเปลี่ยน", "สำเร็จ", "รศ. ดร.สมชาย", [["รายงานผลแลกเปลี่ยน.pdf", "512 KB"], ["รูปประกอบกิจกรรม.zip", "2.3 MB"]]],
  ["10/05/2567", "งานวิจัยร่วม เรื่อง AI for Healthcare", "การวิจัย", "สำเร็จ", "รศ. ดร.สมชาย", [["บทความวิจัย.pdf", "1.8 MB"]]],
  ["20/08/2567", "ประชุมติดตามความก้าวหน้าและแผนงานปี 2567", "การประชุม", "อยู่ระหว่างดำเนินการ", "รศ. ดร.สมชาย", [["รายงานการประชุม.docx", "256 KB"], ["รูปถ่ายประชุม.zip", "5.1 MB"], ["นัดหมายครั้งต่อไป.pdf", "180 KB"]]],
];

const documents = [
  ["ฉบับลงนาม.pdf", "512 KB"],
  ["ภาคผนวก.pdf", "368 KB"],
  ["รายงานสรุปกิจกรรม.pdf", "245 KB"],
];

function icon(name) {
  const paths = {
    bell: `<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    list: `<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/><rect x="3" y="3" width="18" height="18" rx="2"/>`,
    dashboard: `<rect x="3" y="12" width="5" height="8"/><rect x="10" y="8" width="5" height="12"/><rect x="17" y="4" width="4" height="16"/><path d="M3 20h18"/><path d="M4 8l4-4 4 3 5-5"/>`,
    activity: `<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9.5 8.5l5 5"/><path d="M14.5 8.5l-5 5"/>`,
    plus: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
    doc: `<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/>`,
    rows: `<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><path d="M7 3v18"/>`,
    gear: `<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M12 3v2"/><path d="M12 19v2"/>`,
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.doc}</svg>`;
}

function tagClass(value) {
  if (value.includes("ต่าง")) return "tagPink";
  if (value.includes("มหาวิทยาลัย") || value.includes("กำลัง")) return "tagPurple";
  if (value.includes("คณะ")) return "tagBlue";
  if (value.includes("ในประเทศ")) return "tagMint";
  if (value.includes("มีผล") || value.includes("สำเร็จ")) return "tagGreen";
  if (value.includes("ใกล้") || value.includes("ประชุม")) return "tagYellow";
  if (value.includes("หมดอายุ")) return "tagRed";
  return "tagGray";
}

function tag(value) {
  return `<span class="tag ${tagClass(value)}">${value}</span>`;
}

function field(label, control) {
  return `<div class="field"><label>${label}</label>${control}</div>`;
}

function link(href, label, cls = "btn") {
  return `<a class="${cls}" href="${href}">${label}</a>`;
}

function shell(content, { screen, role = "admin", crumb = "" }) {
  const user = role === "user";
  const compact = screen === "detail" || screen === "edit";
  const editClass = screen === "edit" ? "screenEdit" : "";
  return `
    <div class="mouRoot">
      <div class="appShell ${user ? "user" : "admin"} ${compact ? "compact" : ""} ${editClass}">
        ${sidebar(screen, role)}
        <main class="main">
          <header class="topbar">
            <div class="breadcrumb">${crumb}</div>
            <div class="profile">
              ${icon("bell")}
              <span class="avatar">${user ? "อจ" : "อด"}</span>
              <span class="roleName">${user ? "อาจารย์" : "แอดมิน"}</span>
            </div>
          </header>
          <section class="content">${content}</section>
        </main>
      </div>
    </div>
  `;
}

function sidebar(screen, role) {
  const user = role === "user";
  const items = user
    ? [
        ["list", "รายการ MOU ของฉัน", "list", routes.userList],
        ["activity", "กิจกรรมภายใต้ MOU", "activity", routes.activity],
      ]
    : [
        ["list", "รายการ MOU ทั้งหมด", "list", routes.list],
        ["manage", "จัดการประเภทกิจกรรม / OKR", "activity", routes.manage],
        ["dashboard", "รายงาน Dashboard", "dashboard", routes.dashboard],
      ];
  const isActive = (key) => screen === key || (screen === "add" && key === "list");
  return `
    <aside class="sidebar">
      <div class="brand"><div class="brandMark"><img src="/image_icon/MouLogo.png" alt="MOU Logo" /></div><div class="brandTitle">Memorandum of Understanding</div></div>
      <div class="navLabel">เมนูหลัก</div>
      <nav class="navList">
        ${items.map(([key, label, ico, href]) => `<a class="navItem ${isActive(key) ? "active" : ""}" href="${href}">${icon(ico)}<span>${label}</span></a>`).join("")}
      </nav>
    </aside>
  `;
}

function pageTitle(title, ico, action = "", isSmall = false) {
  const titleClass = isSmall ? "pageHeadSmall" : "";
  return `<div class="pageHead ${titleClass}"><div class="titleGroup"><div class="titleIcon">${icon(ico)}</div><h1>${title}</h1></div>${action}</div>`;
}

function stats(includeActivity = false) {
  const data = [
    ["30", "MOU ทั้งหมด", "blue"],
    ["20", "มีผลบังคับใช้", "green"],
    ["11", "ใกล้หมดอายุ (90 วัน)", "amber"],
    includeActivity ? ["50", "กิจกรรมทั้งหมด", "purpleText"] : ["10", "หมดอายุแล้ว", "red"],
  ];
  return `<div class="statsGrid">${data.map(([n, l, c]) => `<div class="statCard"><span class="statNumber ${c}">${n}</span><span class="statLabel">${l}</span></div>`).join("")}</div>`;
}

function filters(dropdowns = {}) {
  const statusData = dropdowns.status && dropdowns.status.length > 0
    ? dropdowns.status
    : [{ id: 1, name: "มีผลบังคับใช้" }, { id: 2, name: "ใกล้หมดอายุ" }, { id: 3, name: "หมดอายุ" }, { id: 4, name: "ยกเลิก" }, { id: 5, name: "กำลังดำเนินการ" }];

  const levelData = dropdowns.level && dropdowns.level.length > 0
    ? dropdowns.level
    : [{ id: 1, name_th: "มหาวิทยาลัย" }, { id: 2, name_th: "คณะ" }];

  const scopeData = dropdowns.scope && dropdowns.scope.length > 0
    ? dropdowns.scope
    : [{ id: 1, name_th: "ต่างประเทศ" }, { id: 2, name_th: "ในประเทศ" }];

  const statusOptions = statusData.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  const levelOptions = levelData.map((l) => `<option value="${l.id}">${l.name_th}</option>`).join("");
  const scopeOptions = scopeData.map((s) => `<option value="${s.id}">${s.name_th}</option>`).join("");

  return `
    <div class="panel searchPanel">
      <div class="filterGrid">
        ${field("ค้นหา", `<input placeholder="ชื่อ MOU" />`)}
        ${field("ค้นหา", `<input placeholder="รหัส MOU" />`)}
        ${field("ค้นหา", `<input placeholder="หน่วยงาน" />`)}
        ${field("ค้นหา", `<input placeholder="ประเทศ" />`)}
        <button class="btn soft">ค้นหา</button>
        <div class="filterBreak">
          ${field("สถานะ", `<select><option value="">ทั้งหมด</option>${statusOptions}</select>`)}
          ${field("ระดับ", `<select><option value="">ทั้งหมด</option>${levelOptions}</select>`)}
          ${field("ขอบเขตความร่วมมือ", `<select><option value="">ทั้งหมด</option>${scopeOptions}</select>`)}
        </div>
      </div>
    </div>
  `;
}

function mouTable(title, userOnly = false) {
  const rows = mouRows.map((r) => `
    <tr>
      <td><span class="mouCode">${r[0]}</span></td>
      <td><div class="mainLine">${r[1]}</div><div class="subLine">${r[2]}</div></td>
      <td>${tag(r[3])}</td>
      <td>${tag(r[4])}</td>
      ${userOnly ? "" : `<td>${tag(r[5])}</td>`}
      <td>${r[6]}</td>
      <td>${userOnly ? `${r[7]}<br>${r[8]}` : r[7]}</td>
      ${userOnly ? "" : `<td>${r[8]}</td>`}
      <td>${tag(r[9])}</td>
      <td><div class="rowActions">${link(routes.detail, "ดูรายละเอียด", "btn small")}${userOnly ? "" : link(routes.edit, "แก้ไข", "btn small")}</div></td>
    </tr>
  `).join("");
  return `
    <div class="card tableCard">
      <div class="tableTitle">${title}</div>
      <table>
        <thead><tr><th>รหัส MOU</th><th>ชื่อ MOU / หน่วยงาน</th><th>ประเภท</th><th>ระดับ</th>${userOnly ? "" : "<th>ขอบเขตความร่วมมือ</th>"}<th>ผู้ประสานงาน</th><th>วันเริ่ม - สิ้นสุด</th>${userOnly ? "" : "<th>วันสิ้นสุด</th>"}<th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="pagination"><span class="pageBtn active">1</span><span class="pageBtn">2</span><span class="pageBtn">3</span><span class="pageBtn">›</span></div>
    </div>
  `;
}

function listPage(role = "admin", dropdowns = {}) {
  const user = role === "user";
  return shell(`
    ${pageTitle("รายการ MOU", "list", link(routes.add, "+ เพิ่ม MOU ใหม่", "btn primary"), true)}
    ${stats(false)}
    ${filters(dropdowns)}
    ${mouTable("ผลลัพธ์การค้นหา: จำนวน x รายการ", user)}
  `, { screen: "list", role });
}

function dashboardPage() {
  return shell(`
    ${pageTitle("แดชบอร์ด MOU", "dashboard", `<button class="btn primary">export files</button>`)}
    ${stats(true)}
    <div class="card chartCard">
      <h3>MOU ตามสถานะ</h3>
      <div class="barChart">
        ${bar("barGreen", "มีผลบังคับใช้", "20")}
        ${bar("barAmber", "ใกล้หมดอายุ", "11")}
        ${bar("barRed", "หมดอายุ", "10")}
        ${bar("barGray", "ยกเลิก", "2")}
        ${bar("barBlue", "กำลังดำเนินการ", "15")}
      </div>
    </div>
    <div class="card tableCard">
      <div class="tableTitle">MOU ที่ต้องดำเนินการเร่งด่วน</div>
      <table><thead><tr><th>รหัส MOU</th><th>ชื่อ MOU / หน่วยงาน</th><th>ประเภท</th><th>ระดับ</th><th>ผู้ประสานงาน</th><th>วันเริ่ม - สิ้นสุด</th><th>สถานะ</th><th>วันก่อนหมดอายุ</th></tr></thead>
      <tbody>${mouRows.slice(0, 2).map((r, i) => `<tr><td><span class="mouCode">${r[0]}</span></td><td><div class="mainLine">${r[1]}</div><div class="subLine">${r[2]}</div></td><td>${tag(i ? "ในประเทศ" : "ต่างประเทศ")}</td><td>${tag(r[4])}</td><td>${r[6]}</td><td>${r[7]}<br>${r[8]}</td><td>${tag("ใกล้หมดอายุ")}</td><td>${i ? "40" : "60"} วัน</td></tr>`).join("")}</tbody></table>
    </div>
  `, { screen: "dashboard", role: "admin", crumb: "รายงาน Dashboard" });
}

function bar(cls, label, num) {
  return `<div class="barItem"><div class="bar ${cls}"></div><div class="barLabel">${label}<br>${num}</div></div>`;
}

function addPage() {
  return shell(`
    ${pageTitle("เพิ่ม MOU ใหม่", "plus", "", true)}
    ${mouForm(false)}
    <div class="footerActions">${link(routes.list, "ยกเลิก", "btn")}<button class="btn soft">บันทึกร่าง</button><button class="btn primary">บันทึก MOU</button></div>
  `, { screen: "list", role: "admin", crumb: "" });
}

function mouForm(withValues) {
  const v = (text) => (withValues ? `value="${text}"` : "");
  return `
    <div class="panel formSection">
      <div class="sectionHead"><span class="sectionIcon">${icon("doc")}</span><h3>ข้อมูลพื้นฐาน MOU</h3></div>
      <div class="formGrid">
        ${field(`รหัส MOU <span class="required">*</span>`, `<input ${v("MOU-67-001")} placeholder="ระบุรหัส MOU" />`)}
        ${field(`ชื่อ MOU <span class="required">*</span>`, `<input ${v("แลกเปลี่ยนนักศึกษาและอาจารย์")} placeholder="ระบุชื่อ MOU" />`)}
        ${field("รายละเอียด", `<textarea placeholder="ระบุรายละเอียด...">${withValues ? "เพื่อส่งเสริมความร่วมมือทางวิชาการ การแลกเปลี่ยนนักศึกษาและอาจารย์ การวิจัยร่วม และการพัฒนาหลักสูตรร่วม" : ""}</textarea>`)}
        ${field("ไฟล์แนบ", `<div class="dropzone">คลิกหรือลากไฟล์มาวาง<br />AI สรุปรายละเอียดอัตโนมัติเมื่ออัปโหลดไฟล์</div>`)}
        <div class="formGrid two span2">
          ${field(`ระดับ <span class="required">*</span>`, `<select><option>มหาวิทยาลัย</option><option>คณะ</option></select>`)}
          ${field(`ประเภท MOU <span class="required">*</span>`, `<select><option>การแลกเปลี่ยน</option><option>การวิจัย</option><option>การพัฒนาหลักสูตร</option><option>ใดๆ</option></select>`)}
        </div>
        <div class="formGrid two span2">
          ${field(`ขอบเขตความร่วมมือ <span class="required">*</span>`, `<select><option>ในประเทศ</option><option>ต่างประเทศ</option></select>`)}
          ${field("ประเทศ", `<select><option>ญี่ปุ่น</option><option>Thailand</option></select>`)}
        </div>
        <div class="formGrid two span2">
          ${field(`หน่วยงานคู่สัญญา <span class="required">*</span>`, `<input ${v("Khon Kaen University")} placeholder="ชื่อหน่วยงาน..." />`)}
          ${field("ประเภทคู่สัญญา", `<select><option>มหาวิทยาลัย</option><option>บริษัท</option></select>`)}
        </div>
        ${field(`ผู้ประสานงานหลัก <span class="required">*</span>`, `<input ${v("รศ. ดร.สมชาย")} placeholder="ระบุชื่อผู้ประสานงานหลัก" />`)}
        <div class="formGrid two">
          ${field(`วันที่เริ่มต้น <span class="required">*</span>`, `<input ${v("01/01/2567")} placeholder="01/01/2024" />`)}
          ${field(`วันที่สิ้นสุด <span class="required">*</span>`, `<input ${v("31/12/2569")} placeholder="01/01/2026" />`)}
        </div>
        <div class="alertFieldWrapper">${field("ตั้งค่าแจ้งเตือนก่อนวันสิ้นสุด MOU", `<div class="inputGroup"><input placeholder="ระบุจำนวนวัน" /><span class="inputSuffix">วัน</span></div>`)}</div>
      </div>
    </div>
  `;
}

function detailPage(role = "user") {
  const crumb = "";
  return shell(`
    <div class="detailHead">
      <div class="detailTitle"><div class="titleIcon">${icon("rows")}</div><h1>รายละเอียด MOU</h1></div>
      <div class="headActions">${link("#", "ดาวน์โหลดเอกสาร", "btn primary")}${link(role === "user" ? routes.userList : routes.list, "กลับไปรายการ", "btn")}</div>
    </div>
    <div class="detailLayout"><div class="detailMain">${infoCard()}</div><div class="detailSide">${docsCard(false)}${timeline()}</div></div>
    <div class="card tableCard" style="margin-top:20px">${activityTable()}</div>
  `, { screen: "list", role: "admin", crumb });
}

function infoCard() {
  const pairs = [
    ["รหัส MOU", "MOU-67-001"], ["ชื่อ MOU", "แลกเปลี่ยนนักศึกษาและอาจารย์"],
    ["วันที่เริ่มต้น", "01/01/2567"],
    ["หน่วยงานคู่ความร่วมมือ", "Khon Kaen University, Thailand"], ["วันที่สิ้นสุด", "31/12/2569"],
    ["ประเภท MOU", tag("การแลกเปลี่ยน")], ["สถานะ", tag("มีผลบังคับใช้")],
    ["ระดับ", tag("มหาวิทยาลัย")], ["ขอบเขตความร่วมมือ", tag("ต่างประเทศ")], ["ผู้ประสานงาน", "รศ. ดร.สมชาย"], ["วันที่จะหมดอายุ", "245 วัน"],
  ];
  return `<div class="panel infoCard"><h2>ข้อมูลทั่วไป</h2><div class="infoGrid">${pairs.map(([l, value]) => `<div class="infoPair"><span>${l}</span><span class="infoValue">${value}</span></div>`).join("")}</div><div class="detailCopy"><h3>รายละเอียด</h3><p>เพื่อส่งเสริมความร่วมมือทางวิชาการระหว่างสองสถาบันด้านการเรียนการสอน การวิจัย และการบริการวิชาการ รวมถึงการแลกเปลี่ยนนักศึกษาและอาจารย์ การจัดกิจกรรมร่วมกัน และการพัฒนาหลักสูตรร่วม เพื่อยกระดับคุณภาพการศึกษาและสร้างประโยชน์ร่วมกันอย่างยั่งยืน</p></div></div>`;
}

function activityTable() {
  return `<div class="tableTitle"><strong>กิจกรรมภายใต้ MOU</strong><span style="margin-left:auto;color:var(--mou-primary);font-size:14px">ดูทั้งหมด</span></div><table><thead><tr><th>วันที่</th><th>ชื่อกิจกรรม</th><th>ประเภท</th><th>ผลลัพธ์</th><th>ผู้บันทึก</th><th>จัดการ</th></tr></thead><tbody>${activities.map((a) => `<tr><td>${a[0]}</td><td>${a[1]}</td><td>${tag(a[2])}</td><td>${tag(a[3])}</td><td>${a[4]}</td><td><button class="btn small">ดูรายละเอียด</button></td></tr>`).join("")}</tbody></table>`;
}

function timeline() {
  return `<div class="panel infoCard"><h2>ประวัติสถานะ</h2><div class="timelineList">${[["สร้างรายการ MOU", "10/12/2566 09:30 น."], ["เริ่มมีผลบังคับใช้", "01/01/2567 00:00 น."], ["บันทึกกิจกรรมล่าสุด", "20/08/2567 14:25 น."]].map((t) => `<div class="timelineItem"><span>${t[0]}</span><br /><span class="muted">${t[1]}</span></div>`).join("")}</div></div>`;
}

function statusCard() {
  return `<div class="panel sideCard"><h2>สรุปสถานะ</h2><div class="statusGrid"><span>วันที่เริ่มต้น</span><strong>01/01/2567</strong><span>วันที่สิ้นสุด</span><strong>31/12/2569</strong><span>ระยะเวลาดำเนินการ 3 ปี</span><strong>1 ปี 3 เดือน ผ่านไป</strong><div class="progress"><div class="progressLine"><span></span></div><span>42%</span></div></div></div>`;
}

function alertsCard() {
  return `<div class="panel sideCard"><h2>การแจ้งเตือน</h2><div class="noticeList"><div class="notice noticeWarn">MOU นี้จะครบกำหนดภายใน 245 วัน</div><div class="notice noticeInfo">โปรดติดตามแผนต่ออายุ MOU ก่อนครบกำหนด</div></div></div>`;
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day = String(dt.getDate()).padStart(2, "0");
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${day} ${months[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}

function creatorName(c) {
  if (!c) return "-";
  return [c.prefix || "", c.user_fname || "", c.user_lname || ""].filter(Boolean).join(" ") || "-";
}

function detailPageWithData(mou, role = "user") {
  const crumb = "";
  return shell(`
    <div class="detailHead">
      <div class="detailTitle"><div class="titleIcon">${icon("rows")}</div><h1>รายละเอียด MOU</h1></div>
      <div class="headActions">${link("#", "ดาวน์โหลดเอกสาร", "btn primary")}${link(role === "user" ? routes.userList : routes.list, "กลับไปรายการ", "btn")}</div>
    </div>
    <div class="detailLayout"><div class="detailMain">${infoCardWithData(mou)}</div><div class="detailSide">${docsCardWithData(mou.attachments, false)}${timelineWithData(mou)}</div></div>
    <div class="card tableCard" style="margin-top:20px">${activityTableWithData(mou.activities)}</div>
  `, { screen: "list", role: "admin", crumb });
}

function infoCardWithData(mou) {
  const statusName = mou.status?.name || "-";
  const levelName = mou.level === "university" ? "มหาวิทยาลัย" : mou.level === "faculty" ? "คณะ" : mou.level || "-";
  const scope = mou.is_international ? "ต่างประเทศ" : "ในประเทศ";
  const partnerOrg = mou.partners?.[0]?.partner_org || "-";
  const coordinator = mou.coordinator ? [mou.coordinator.prefix || "", mou.coordinator.user_fname || "", mou.coordinator.user_lname || ""].filter(Boolean).join(" ") : "-";
  const endDate = mou.end_date ? fmtDate(mou.end_date) : "-";
  const daysLeft = mou.end_date ? Math.ceil((new Date(mou.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const daysText = daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} วัน` : "หมดอายุแล้ว") : "-";
  const pairs = [
    ["ชื่อ MOU", mou.title],
    ["วันที่เริ่มต้น", fmtDate(mou.start_date)],
    ["หน่วยงานคู่ความร่วมมือ", partnerOrg], ["วันที่สิ้นสุด", endDate],
    ["สถานะ", tag(statusName)],
    ["ระดับ", tag(levelName)], ["ขอบเขตความร่วมมือ", tag(scope)], ["ผู้ประสานงาน", coordinator], ["วันที่จะหมดอายุ", daysText],
  ];
  return `<div class="panel infoCard"><h2>ข้อมูลทั่วไป</h2><div class="infoGrid">${pairs.map(([l, value]) => `<div class="infoPair"><span>${l}</span><span class="infoValue">${value}</span></div>`).join("")}</div><div class="detailCopy"><h3>รายละเอียด</h3><p>${mou.description || "ไม่มีรายละเอียด"}</p></div></div>`;
}

function activityTableWithData(activities) {
  const rows = (activities || []).length > 0 ? activities : [];
  return `<div class="tableTitle"><strong>กิจกรรมภายใต้ MOU</strong><span style="margin-left:auto;color:var(--mou-primary);font-size:14px">ดูทั้งหมด</span></div><table><thead><tr><th>วันที่</th><th>ชื่อกิจกรรม</th><th>ประเภท</th><th>จำนวนผู้เข้าร่วม</th><th>ผู้บันทึก</th><th>จัดการ</th></tr></thead><tbody>${rows.length > 0 ? rows.map((a) => `<tr><td>${fmtDate(a.activity_date)}</td><td>${a.title}</td><td>${tag(a.activity_type?.name || "-")}</td><td>${a.participant_count || 0}</td><td>${creatorName(a.creator)}</td><td><button class="btn small">ดูรายละเอียด</button></td></tr>`).join("") : `<tr><td colspan="6" style="text-align:center;color:#6b7280">ไม่มีกิจกรรม</td></tr>`}</tbody></table>`;
}

function timelineWithData(mou) {
  const items = [];
  if (mou.created_at) items.push(["สร้างรายการ MOU", new Date(mou.created_at).toLocaleString("th-TH")]);
  if (mou.status?.name) items.push(["สถานะล่าสุด", mou.status.name]);
  items.push(["บันทึกกิจกรรมล่าสุด", mou.updated_at ? new Date(mou.updated_at).toLocaleString("th-TH") : "-"]);
  return `<div class="panel infoCard"><h2>ประวัติสถานะ</h2><div class="timelineList">${items.map((t) => `<div class="timelineItem"><span>${t[0]}</span><br /><span class="muted">${t[1]}</span></div>`).join("")}</div></div>`;
}

function docsCardWithData(attachments, withDelete = true) {
  const items = (attachments || []).length > 0 ? attachments : [];
  return `<div class="panel sideCard"><div class="miniHead"><h2>เอกสารแนบ mou</h2><span class="tag tagGray">${items.length} รายการ</span></div><div class="docList">${items.length > 0 ? items.map((d) => `<div class="docRow"><span class="pdfIcon">PDF</span><div><a href="${d.file_path || "#"}" class="docLink" target="_blank">${d.file_name}</a><br /><span class="muted">${d.mime_type || "-"}</span></div>${withDelete ? `<button class="btn small">ลบ</button>` : ""}</div>`).join("") : `<div style="text-align:center;padding:20px;color:#6b7280">ไม่มีเอกสารแนบ</div>`}</div></div>`;
}

function docsCard(withDelete = true) {
  return `<div class="panel sideCard"><div class="miniHead"><h2>เอกสารแนบ mou</h2><span class="tag tagGray">3 รายการ</span></div><div class="docList">${documents.map((d) => `<div class="docRow"><span class="pdfIcon">PDF</span><div><a href="${d[0]}" class="docLink" target="_blank">${d[0]}</a><br /><span class="muted">${d[1]}</span></div>${withDelete ? `<button class="btn small">ลบ</button>` : ""}</div>`).join("")}</div></div>`;
}

function editPage() {
  return shell(`
    ${pageTitle("แก้ไข MOU", "rows", "", true)}
    ${mouForm(true)}
    <div style="margin-top:32px;padding-top:32px;border-top:1px solid var(--mou-line)"><div class="panel formSection"><div class="miniHead"><h2>เอกสารแนบ MOU</h2><button class="btn small" style="margin-left:auto">เพิ่มเอกสาร</button><span class="tag tagGray">${documents.length} รายการ</span></div><div class="docList">${documents.map((d) => `<div class="docRow"><span class="pdfIcon">PDF</span><div><a href="${d[0]}" class="docLink" target="_blank">${d[0]}</a><br /><span class="muted">${d[1]}</span></div><button class="btn small">ลบ</button></div>`).join("")}</div></div></div>
    <div class="footerActions">${link(routes.list, "ยกเลิก", "btn")}<button class="btn primary">บันทึกการแก้ไข</button></div>
  `, { screen: "list", role: "admin", crumb: "" });
}

function editFields() {
  return `${field("รหัส MOU", `<input value="MOU-67-001" />`)}${field("ชื่อ MOU", `<input value="แลกเปลี่ยนนักศึกษาและอาจารย์" />`)}${field("หน่วยงานคู่ความร่วมมือ", `<input value="Khon Kaen University" />`)}${field("ประเทศ", `<input value="Thailand" />`)}${field("ประเภท MOU", `<input value="ต่างประเทศ" />`)}${field("ระดับ", `<input value="มหาวิทยาลัย" />`)}${field("สถานะ", `<input value="มีผลบังคับใช้" />`)}${field("วันที่เริ่มต้น", `<input value="01/01/2567" />`)}${field("วันที่สิ้นสุด", `<input value="31/12/2569" />`)}${field("ระยะเวลา", `<input value="3 ปี" />`)}${field("รายละเอียด / วัตถุประสงค์", `<textarea>เพื่อส่งเสริมความร่วมมือทางวิชาการ การแลกเปลี่ยนนักศึกษาและอาจารย์ การวิจัยร่วม</textarea>`)}`;
}

function miniActivityList() {
  return `<div>${activities.map((a) => `<div class="miniActivityRow"><span>${a[0]}</span><strong>${a[1]}</strong>${tag(a[3])}<button class="btn small">แก้ไข</button></div>`).join("")}</div>`;
}

function activityPage(role = "user") {
  return shell(`
    ${pageTitle("กิจกรรมภายใต้ MOU", "activity")}
    <div class="panel">
      <div class="sectionHead"><span class="sectionIcon">${icon("activity")}</span><h3>เพิ่มกิจกรรมใหม่</h3></div>
      <div class="activityGrid">
        ${field(`MOU ที่เชื่อมโยง <span class="required">*</span>`, `<select><option>ระบุรหัสหรือชื่อ MOU</option><option>MOU-67-001</option></select>`)}
        ${field(`ชื่อกิจกรรม <span class="required">*</span>`, `<input placeholder="ระบุชื่อกิจกรรม" />`)}
        ${field(`ประเภทกิจกรรม <span class="required">*</span>`, `<select><option>การประชุม</option><option>การวิจัย</option><option>การแลกเปลี่ยน</option></select>`)}
        <div class="twoCol">${field(`วันที่จัดกิจกรรม <span class="required">*</span>`, `<input value="01/01/2024" />`)}${field("จำนวนผู้เข้าร่วม", `<div class="inputGroup"><input placeholder="ระบุจำนวน" /><span class="inputSuffix">คน</span></div>`)}</div>
        <div class="field wide"><label>รายละเอียดกิจกรรม</label><textarea placeholder="ระบุรายละเอียด..."></textarea></div>
        <div class="field wide"><label>หมายเหตุ</label><textarea placeholder="ระบุหมายเหตุ..."></textarea></div>
        <div class="field wide"><label>ไฟล์แนบ</label><div class="dropzone dropzoneLarge">คลิกหรือลากไฟล์มาวางที่นี่</div></div>
      </div>
    </div>
    <div class="footerActions">${link(role === "user" ? routes.userList : routes.list, "ยกเลิก", "btn")}<button class="btn primary">บันทึกกิจกรรม</button></div>
  `, { screen: "add", role: "admin", crumb: "" });
}

const mockActivityTypes = [
  { id: 1, name: "การแลกเปลี่ยน", description: "กิจกรรมแลกเปลี่ยนนักศึกษาและบุคลากร" },
  { id: 2, name: "การวิจัย", description: "กิจกรรมวิจัยร่วมกัน" },
  { id: 3, name: "การประชุม", description: "การประชุมวิชาการหรือสัมมนา" },
  { id: 4, name: "การพัฒนาหลักสูตร", description: "กิจกรรมพัฒนาหลักสูตรร่วม" },
];

const mockOKRs = [
  { id: 1, title: "OKR-01", description: "เพิ่มคุณภาพงานวิจัย" },
  { id: 2, title: "OKR-02", description: "เครือข่ายความร่วมมือ" },
  { id: 3, title: "OKR-03", description: "นักศึกษาแลกเปลี่ยน" },
  { id: 4, title: "OKR-04", description: "รายได้จากบริการ" },
];

function managePage() {
  const activityTypeRows = mockActivityTypes.map((t) => `
    <tr>
      <td>${t.id}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.description}</td>
      <td><div class="rowActions"><button class="btn small" onclick="editActivityType(${t.id})">แก้ไข</button><button class="btn small danger" onclick="deleteActivityType(${t.id})">ลบ</button></div></td>
    </tr>
  `).join("");

  const okrRows = mockOKRs.map((o) => `
    <tr>
      <td><span class="mouCode">${o.title}</span></td>
      <td><strong>${o.description}</strong></td>
      <td><div class="rowActions"><button class="btn small" onclick="editOKR(${o.id})">แก้ไข</button><button class="btn small danger" onclick="deleteOKR(${o.id})">ลบ</button></div></td>
    </tr>
  `).join("");

  return shell(`
    ${pageTitle("จัดการประเภทกิจกรรม / OKR", "gear", "", true)}
    <div class="manageGrid">
      <div class="panel manageCard">
        <div class="manageHead">
          <h2>ประเภทกิจกรรม</h2>
          <button class="btn primary" onclick="openAddActivityType()">+ เพิ่มประเภท</button>
        </div>
        <table>
          <thead><tr><th>รหัส</th><th>ชื่อประเภท</th><th>คำอธิบาย</th><th>จัดการ</th></tr></thead>
          <tbody>${activityTypeRows}</tbody>
        </table>
      </div>
      <div class="panel manageCard">
        <div class="manageHead">
          <h2>OKRs</h2>
          <button class="btn primary" onclick="openAddOKR()">+ เพิ่ม OKR</button>
        </div>
        <table>
          <thead><tr><th>รหัส OKR</th><th>รายละเอียด</th><th>จัดการ</th></tr></thead>
          <tbody>${okrRows}</tbody>
        </table>
      </div>
    </div>
    <div id="modalOverlay" class="modalOverlay" style="display:none" onclick="closeModal()">
      <div class="modalBox" onclick="event.stopPropagation()">
        <div class="modalHead"><h2 id="modalTitle">เพิ่มประเภทกิจกรรม</h2><button class="modalClose" onclick="closeModal()">&times;</button></div>
        <div id="modalBody"></div>
      </div>
    </div>
  `, { screen: "manage", role: "admin", crumb: "จัดการประเภทกิจกรรม / OKR" });
}

export default function MouUi({ screen = "list", role = "admin", dropdowns = {}, mouData = null, noShell = false, mouId = 1 }) {
  const htmlByScreen = {
    list: listPage(role, dropdowns),
    dashboard: dashboardPage(),
    add: addPage(),
    detail: mouData ? detailPageWithData(mouData, role) : detailPage(role),
    edit: editPage(),
    activity: activityPage(role),
    manage: managePage(),
  };

  let html = htmlByScreen[screen] || htmlByScreen.list;
  if (noShell) {
    const match = html.match(/<section class="content">([\s\S]*)<\/section>/);
    if (match) {
      html = match[1];
    }
  }

  React.useEffect(() => {
    if (screen !== "manage") return;

    window.openAddActivityType = () => {
      document.getElementById("modalTitle").textContent = "เพิ่มประเภทกิจกรรม";
      document.getElementById("modalBody").innerHTML = `
        <div class="formStack">
          ${field("ชื่อประเภท <span class='required'>*</span>", `<input id="actTypeName" placeholder="ระบุชื่อประเภทกิจกรรม" />`)}
          ${field("คำอธิบาย", `<textarea id="actTypeDesc" placeholder="ระบุคำอธิบาย..."></textarea>`)}
        </div>
        <div class="formActions">
          <button class="btn" onclick="closeModal()">ยกเลิก</button>
          <button class="btn primary" onclick="saveActivityType()">บันทึก</button>
        </div>
      `;
      document.getElementById("modalOverlay").style.display = "flex";
    };

    window.editActivityType = (id) => {
      const type = mockActivityTypes.find((t) => t.id === id);
      if (!type) return;
      document.getElementById("modalTitle").textContent = "แก้ไขประเภทกิจกรรม";
      document.getElementById("modalBody").innerHTML = `
        <input type="hidden" id="actTypeId" value="${id}" />
        <div class="formStack">
          ${field("ชื่อประเภท <span class='required'>*</span>", `<input id="actTypeName" value="${type.name}" />`)}
          ${field("คำอธิบาย", `<textarea id="actTypeDesc">${type.description}</textarea>`)}
        </div>
        <div class="formActions">
          <button class="btn" onclick="closeModal()">ยกเลิก</button>
          <button class="btn primary" onclick="updateActivityType()">บันทึก</button>
        </div>
      `;
      document.getElementById("modalOverlay").style.display = "flex";
    };

    window.deleteActivityType = (id) => {
      if (!confirm("ต้องการลบประเภทกิจกรรมนี้หรือไม่?")) return;
      const idx = mockActivityTypes.findIndex((t) => t.id === id);
      if (idx !== -1) mockActivityTypes.splice(idx, 1);
      location.reload();
    };

    window.openAddOKR = () => {
      document.getElementById("modalTitle").textContent = "เพิ่ม OKR";
      document.getElementById("modalBody").innerHTML = `
        <div class="formStack">
          ${field("รหัส OKR <span class='required'>*</span>", `<input id="okrCode" placeholder="เช่น OKR-05" />`)}
          ${field("รายละเอียด <span class='required'>*</span>", `<input id="okrDesc" placeholder="ระบุรายละเอียด OKR" />`)}
        </div>
        <div class="formActions">
          <button class="btn" onclick="closeModal()">ยกเลิก</button>
          <button class="btn primary" onclick="saveOKR()">บันทึก</button>
        </div>
      `;
      document.getElementById("modalOverlay").style.display = "flex";
    };

    window.editOKR = (id) => {
      const okr = mockOKRs.find((o) => o.id === id);
      if (!okr) return;
      document.getElementById("modalTitle").textContent = "แก้ไข OKR";
      document.getElementById("modalBody").innerHTML = `
        <input type="hidden" id="okrId" value="${id}" />
        <div class="formStack">
          ${field("รหัส OKR <span class='required'>*</span>", `<input id="okrCode" value="${okr.title}" />`)}
          ${field("รายละเอียด <span class='required'>*</span>", `<input id="okrDesc" value="${okr.description}" />`)}
        </div>
        <div class="formActions">
          <button class="btn" onclick="closeModal()">ยกเลิก</button>
          <button class="btn primary" onclick="updateOKR()">บันทึก</button>
        </div>
      `;
      document.getElementById("modalOverlay").style.display = "flex";
    };

    window.deleteOKR = (id) => {
      if (!confirm("ต้องการลบ OKR นี้หรือไม่?")) return;
      const idx = mockOKRs.findIndex((o) => o.id === id);
      if (idx !== -1) mockOKRs.splice(idx, 1);
      location.reload();
    };

    window.closeModal = () => {
      document.getElementById("modalOverlay").style.display = "none";
    };

    window.saveActivityType = () => {
      const name = document.getElementById("actTypeName").value;
      const desc = document.getElementById("actTypeDesc").value;
      if (!name) return alert("กรุณากรอกชื่อประเภทกิจกรรม");
      mockActivityTypes.push({ id: Date.now(), name, description: desc });
      closeModal();
      location.reload();
    };

    window.updateActivityType = () => {
      const id = parseInt(document.getElementById("actTypeId").value);
      const name = document.getElementById("actTypeName").value;
      const desc = document.getElementById("actTypeDesc").value;
      if (!name) return alert("กรุณากรอกชื่อประเภทกิจกรรม");
      const type = mockActivityTypes.find((t) => t.id === id);
      if (type) { type.name = name; type.description = desc; }
      closeModal();
      location.reload();
    };

    window.saveOKR = () => {
      const title = document.getElementById("okrCode").value;
      const desc = document.getElementById("okrDesc").value;
      if (!title || !desc) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      mockOKRs.push({ id: Date.now(), title, description: desc });
      closeModal();
      location.reload();
    };

    window.updateOKR = () => {
      const id = parseInt(document.getElementById("okrId").value);
      const title = document.getElementById("okrCode").value;
      const desc = document.getElementById("okrDesc").value;
      if (!title || !desc) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      const okr = mockOKRs.find((o) => o.id === id);
      if (okr) { okr.title = title; okr.description = desc; }
      closeModal();
      location.reload();
    };
  }, [screen]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
