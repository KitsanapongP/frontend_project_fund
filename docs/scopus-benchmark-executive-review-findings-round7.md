# Scopus Benchmark — Review รอบ 7

2026-09-17 · Verdict: ผ่านการแก้ print pagination ในขอบเขตที่ตรวจ ไม่พบ blocker ใหม่. ยังไม่มี merge/push/deploy.

## P1–P4

- P1 ผ่าน: หัวข้อสัดส่วนและกราฟอยู่ด้วยกันบนหน้า 2.
- P2 ผ่าน: หัวข้อ citation, ตารางและคำอธิบายอยู่ครบหน้า 3.
- P3 ผ่าน: ภาคผนวกคุณภาพไหลต่อบนหน้า 3 ไม่ถูกบังคับไปหน้าใหม่จนเว้นว่างแบบไฟล์เดิม. ตารางประเภทผลงาน/นิยามต่อหน้า 4. พื้นที่ว่างท้ายหน้าสุดท้ายยอมรับได้.
- P4 ผ่านจาก code inspection และหลักฐาน PDF autoexpand: รายปี/คุณภาพ/นิยามรวมใน PDF แม้เริ่มจากรายละเอียดพับ. effect เก็บ details ที่เดิมพับและคืนสถานะหลังพิมพ์; การทดสอบ event ใน browser เป็นผลที่ implementer รายงาน ไม่ใช่ reviewer รันซ้ำรอบนี้.

## Verification

Reviewer render และตรวจครบทุกหน้าของ print-normal-paginated-open.pdf (4), print-normal-paginated-collapsed.pdf (3) และ print-normal-autoexpand-button.pdf (4). ไม่พบข้อความตัดหาย ตารางล้นแนวนอน หรือหน้าว่างทั้งหน้า. ตรวจ CSS print scope และ effect beforeprint/afterprint; FE node --test 51/51 ผ่าน. ไม่ได้ rerun build หรือพิมพ์ authenticated portal รอบนี้.

ไฟล์ collapsed 3 หน้าแสดงผลก่อน/โดยไม่ใช้ autoexpand จึงไม่ใช่หลักฐานพฤติกรรมสุดท้าย P4; ใช้ autoexpand-button 4 หน้าเป็นหลักฐานล่าสุด. รายงานควรระบุสถานะนี้ให้ชัด. ถ้อยคำต้นรายงานที่ว่าแก้ CSS อย่างเดียวถูกขยายโดย P4 ซึ่งเพิ่ม effect ใน component แล้ว.

## Acceptance และขั้นถัดไป

ผู้ใช้ยืนยัน keyboard ผ่านทุกข้อแล้ว และ reviewer ตรวจ CSV/PDF ที่ผู้ใช้ดาวน์โหลดจริงในรอบก่อนผ่าน. ไม่ถือ keyboard/export เป็นข้อค้างอีก แม้ prompt ของ implementer ยังมีข้อความเก่า. หลักฐานรอบนี้เป็น fixture ผ่าน component จริง ไม่อ้างว่า reviewer พิมพ์ข้อมูลจริงใหม่.

พร้อมเข้าสู่ขั้นเตรียม commits และ push feature branches เมื่อผู้ใช้สั่ง ตาม workflow ใหม่: push feature ให้ผู้ใช้ตรวจ commits ก่อน แล้วจึงขอคำสั่ง sync/merge main แยกขั้น. ห้ามถือ review นี้เป็นคำสั่ง Git. .claude/launch.json ที่ unresolved ต้องไม่ถูกรวมโดยไม่ตรวจ.
