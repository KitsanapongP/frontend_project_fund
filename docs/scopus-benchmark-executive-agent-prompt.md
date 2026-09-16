# Prompt สำหรับ agent ที่ลงมือทำ

ปรับ UX/UI หน้า `/admin/scopus-benchmark` ใหม่เพื่อ “ติดตามผลงานและรายงานต่อที่ประชุม” โดยยึดคณะเป็นตัวหลัก ผู้ใช้อนุญาตให้ออกแบบหน้าใหม่ทั้งหมด ไม่ต้องรักษาเลย์เอาต์ dashboard เดิม

อ่านและทำตาม:
1. `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-handoff.md`
2. `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-preview.html`

FE: `G:/works-fund-project/frontend_project_fund` branch `feature/scopus-benchmark-dashboard`
BE: `G:/works-fund-project/fund-management-api` branch `feature/scopus-benchmark-insights`

ตรวจ AGENTS.md และสถานะงานที่มีอยู่ก่อนเริ่ม อย่าลบหรือรวมไฟล์ที่ไม่เกี่ยวข้อง ภาพร่างใช้ตัวเลขสมมติทั้งหมด ใช้อ้างอิง composition เท่านั้น ห้ามเอาตัวเลขไปใส่ production หรือยืนยันผลจริง หากข้อจำกัดและสถานะข้อมูลไม่ได้จำลองในภาพ ให้ทำตาม handoff ซึ่งเป็นข้อกำหนดที่ละเอียดกว่า

ต้องเปลี่ยน UX/UI ตามโครงรายงานใน handoff: header ปีเดียวทั้งหน้า, KPI strip ไม่ใช่การ์ดแยก, ประเด็นสำคัญที่มีหลักฐาน, กราฟจำนวนคณะและสัดส่วนแยกกัน, ตาราง benchmark ที่เห็นตัวชี้วัดพร้อมกัน, รายละเอียดเปิดดูได้ และรูปแบบพิมพ์ที่ใช้ประชุมได้จริง ห้ามใช้ layout เดิมแล้วเพียงปรับสี/ไอคอน และห้ามตัดข้อกำหนดด้าน design ออกเพราะ build ผ่านแล้ว

ข้อสรุปล่าสุดเรื่อง citation: เพิ่มส่วน “การอ้างอิงสะสมของผลงานที่ตีพิมพ์ปีที่เลือก” ให้เห็นได้ทันที ตาม handoff §5 E2 / §9 D เทียบยอดรวมและค่าเฉลี่ยของคณะ/KKU/ประเทศไทย พร้อมจำนวนเอกสารที่ใช้คำนวณและวันที่อัปเดตเท่าที่ทราบ ภาพร่าง HTML เก่ายังไม่มีส่วนเต็มนี้ ให้ handoff ล่าสุดเป็นหลัก ไม่สร้าง citation รายปีที่เกิดขึ้นจากยอดสะสม ไม่เพิ่ม snapshots/backfill หรือดึง Scopus เพิ่มเพื่อทำส่วนนี้

แก้ BE เฉพาะ benchmark ที่จำเป็นต่อข้อมูลรายงาน: verified faculty cohort ให้ตรงกัน, missing/zero, per-level/per-metric readiness และ denominator/coverage/source-time metadata รักษาความเข้ากันได้ของ contract เดิม ไม่เปลี่ยน ingest หรือเขียนตารางหลักของ Scopus Dashboard ไม่เริ่ม harvest/refresh Scopus อัตโนมัติ ไม่ deploy, migrate production หรือ merge main

ทำ implementation, meaningful tests, responsive/keyboard verification และตรวจ print preview ให้ครบตาม acceptance ใน handoff ใช้ข้อมูลจริงจาก test environment เมื่อเข้าถึงได้และระบุสิ่งที่ตรวจไม่ได้ตรงไปตรงมา ส่งกลับ: สรุปสิ่งที่เปลี่ยน, commits/diff, ผล tests/build, screenshots desktop/mobile/print, ตัวอย่าง response ที่ไม่มี sensitive data, known limitations และ deviations จากแผนพร้อมเหตุผล เพื่อให้ผู้วางแผน review ต่อ

ลงมือทำต่อได้ภายในขอบเขตนี้ ไม่ต้องถามเลือกดีไซน์ใหม่ทีละจุด ให้ใช้รายละเอียดใน handoff เป็นหลัก และแจ้งเมื่อมี blocker ที่ทำให้ข้อกำหนดสำคัญทำไม่ได้

## สิ่งที่ต้องส่งกลับเมื่อจบงาน

ทำตาม handoff §12 โดยสร้าง `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review.md` เป็นจุดเริ่ม review แห่งเดียว มี repo/worktree paths, branch/base/HEAD/commits และ uncommitted state, สรุปการเปลี่ยนแปลง, acceptance checklist พร้อมสถานะและหลักฐาน, tests/build logs, screenshots desktop/mobile/citation/states และ print/PDF, response samples ที่ไม่มี sensitive data, วิธีเปิด FE/BE ตรวจซ้ำและ URL, deviations/known limitations/blockers ทั้งหมดต้องเป็น absolute paths หรือ links ที่เปิดได้จาก workspace เดียวกัน แยกหลักฐาน fixture/live และสิ่งที่ยังไม่ตรวจชัดเจน

สร้าง `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-prompt.md` เป็น prompt สั้น 4–8 บรรทัดสำหรับผู้ใช้ส่งกลับให้ผู้วางแผน ระบุว่าให้ตรวจอะไร ที่ไหน พร้อม path รายงาน review, branch/HEAD จริงและ URL หรือสถานะ server ห้ามเหลือ placeholder ขอให้ review UX/UI ความถูกต้องของข้อมูลและ citation เทียบ handoff ล่าสุด และรายงาน findings ก่อนอนุมัติ โดยไม่ merge/deploy

ในคำตอบสุดท้ายให้แสดง prompt สั้นนี้พร้อมคัดลอกทันที รวมลิงก์รายงาน review และข้อที่ยังค้าง ไม่ใช่ให้ผู้ใช้เปิดหาและรวบรวมหลักฐานเอง ไม่ส่งข้อความไป task อื่นอัตโนมัติ ผู้ใช้จะเป็นคนส่ง prompt กลับให้ผู้วางแผน
