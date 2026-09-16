# Scopus Benchmark — Review รอบ 6

2026-09-16 · Verdict: คงผลผ่าน code review รอบ 5; ปิดข้อสังเกตหลักเรื่อง fixture count/cohort. ยังไม่รับรอง integration acceptance กับระบบจริง.

## ตรวจแล้ว

- อ่าน report รอบ 6, fixtures.mjs, harness page และ evidence generator.
- Reviewer รัน node --test: 51/51 ผ่าน.
- Reviewer รัน node scripts/gen-scopus-benchmark-evidence.mjs แบบ dry-run: FIXTURE FIDELITY PASS ทั้ง 7 scenarios ตาม assertions ในสคริปต์ ไม่เขียนทับ CSV หลักฐาน.
- insightsFor ใช้ count/year_meta จาก comparison dataset เดียวกัน; levelFromCount ผูก docs, citation cohort และการแจกประเภทเอกสารกับ observed count. ปิดข้อขัดแย้ง count 40 แต่ cohort 72 ของรอบก่อนในตัว fixture ใหม่ได้.
- mismatch ยังคง observed<count และ count readiness=false. CSV helper และ harness ใช้ fixture builder ร่วมกัน.
- ไม่พบ production-code blocker ใหม่จากไฟล์ที่ตรวจรอบนี้; R4-1 คงสถานะปิด.

## ขอบเขตของหลักฐาน

การเรียก CSV helper โดย generator ยืนยันสูตรและ dataset ที่ส่งให้ helper ได้ แต่ไม่เท่ากับทดสอบปุ่ม export, state ปีที่เลือก, ดาวน์โหลด และหน้าจอครบเส้นทาง. คำอ้างว่า “export ที่ปุ่ม = หน้าจอ” จึงควรจำกัดเป็นระดับ helper/data จนมี browser test จริง.

PNG/PDF เก่าถูกระบุ superseded อย่างตรงไปตรงมาใน report รอบ 6 แล้ว ห้ามใช้ภาพเหล่านั้นรับรองตัวเลข fixture ล่าสุด. Reviewer รอบนี้ไม่ได้เปิด browser ใหม่หรือ re-capture ภาพ จึงไม่รับรอง layout/print ใหม่จากข้อความผลทดสอบของ implementer เพียงอย่างเดียว.

## งานค้างก่อนรับรองใช้งานจริง

1. ตรวจ authenticated portal กับ response BE ปัจจุบัน: default year, เปลี่ยนปี, refresh, keyboard, export และ print.
2. ตรวจ live TEST DB sample ใหม่สำหรับ per-metric readiness/citation; sample รอบ 2 ยังไม่ยืนยัน contract ปัจจุบันทั้งหมด.
3. เก็บ screenshot/print ที่ตรงกับ fixture ล่าสุดเมื่อจะใช้เป็นหลักฐานตรวจรับภาพ. ไม่จำเป็นต้องเปิดรอบแก้ production logic เพื่อชดเชยภาพเก่า.
4. .claude/launch.json ยัง unresolved; ไม่ถือเป็นไฟล์ที่ได้รับอนุมัติให้รวมการเปลี่ยนแปลง.

ผลรอบนี้ไม่ใช่คำสั่ง merge/deploy. ไม่ได้แก้ application code หรือ findings รอบก่อน และไม่มี merge/deploy. ขั้นถัดไปควรเป็นการตรวจระบบจริงให้จบ ไม่ใช่แก้ fixture วนต่อโดยไม่มี integration evidence.

## Addendum — ตรวจ LIVE acceptance ที่ส่งเพิ่ม

อ่าน prompt/report ฉบับเพิ่มภาคผนวกและ parse live-be-sample-round6.json แล้ว. ผลข้างต้นที่ระบุว่ายังไม่มี live sample ใหม่ ถูกแทนที่ด้วยสถานะต่อไปนี้:

- มีหลักฐาน sample ใหม่จาก implementer ซึ่งระบุว่าเก็บจาก authenticated portal. Reviewer สอบทานไฟล์ ไม่ได้เรียก API/เปิด portal ยืนยันซ้ำด้วยตนเองใน addendum นี้.
- ปี 2025 faculty: docs=cohort=observed=expected=63, total citations=351, average=351/63 ถูกต้อง; KKU: docs=cohort=observed=expected=311, total=1002, average=1002/311 ถูกต้อง. KKU quality.ready=false พร้อมเหตุผล 113 journals missing CiteScore. Thailand unavailable, total/average=null, snapshot mismatch expected5597/observed0. รองรับการตรวจ contract citation/readiness บนข้อมูลจริงมากกว่าหลักฐานรอบ 2.
- รายงาน implementer ระบุว่า default=2025, เปลี่ยนไป 2020 และ refresh สำเร็จ. ถือเป็นผล smoke test ที่ implementer รายงาน ไม่ใช่ผลที่ reviewer เดิน UI เอง.
- ปี 2020 ใน JSON เป็นข้อมูลย่อ (เช่น KKU ใช้ cohort_docs/quality_ready ที่ระดับบน ต่างจาก response contract ปกติ) จึงใช้เป็นบันทึกตัวเลข/สิ่งที่สังเกต ไม่ใช่ raw response สำหรับยืนยัน field-by-field ทุกระดับ.
- ข้อความ `_note` ที่ว่า “never emits cohort>count” ไม่ถูกต้องและขัดกับตัวอย่าง 2020 ในไฟล์เอง: count=7, observed/cohort=32 เป็นไปได้เมื่อ snapshot กับ harvested cohort ต่างกัน. กฎที่ถูกต้องคือ cohort ผูกกับ observed และเปิดเผย mismatch; ไม่ใช่ห้าม cohort>snapshot count. ภาคผนวกรายงานอธิบายกฎหลังนี้ถูกแล้ว ควรแก้คำบรรยาย JSON ให้ตรงกัน โดยไม่แก้ค่าข้อมูล.

Verdict: คงผ่าน code review และยอมรับหลักฐาน live ปี 2025 สำหรับ contract/เลข citation ที่สอบทานได้. ไม่พบ production blocker ใหม่จาก sample. ข้อค้างก่อนรับรองครบเส้นทางลดเหลือดาวน์โหลด CSV จากปุ่มจริง, print/PDF จริง และ keyboard tab-through; ภาพเก่ายังไม่ใช้ยืนยัน fixture ใหม่. .claude/launch.json ยังไม่ถือว่ากู้คืน แม้ทราบแล้วว่าคำสั่ง backend ควรเป็น go run ./cmd/api. ไม่มี merge/deploy.

## User acceptance — ไฟล์ดาวน์โหลดจริง 2026-09-17

ผู้ใช้ยืนยันว่าทดสอบดาวน์โหลดได้ ไม่มีปัญหา และส่ง CSV รายปี 2022–2026, CSV เปรียบเทียบ 2026 และ PDF จาก portal จริงใน Downloads. Reviewer อ่าน CSV ทั้งสองและ render ตรวจ PDF ครบ 4 หน้า.

- ผ่าน functional export/print: ไฟล์อ่านได้ ภาษาไทยปกติ ไม่มีหน้าว่างทั้งหน้า/ตัวเลขตารางหาย. ปี 2026 counts=58/221/3344 ตรงกัน CSV/PDF; share58/221=26.2%; high-tier34/36=94.4%,65/77=84.4%,659/780=84.5%; citations49/119/1324 กับค่าเฉลี่ย0.8/0.5/0.4 ตรงตาม known denominators58/221/3344. รายปีตรงกราฟและ share ที่ปัดหนึ่งตำแหน่ง. PDF ระบุปีปัจจุบันเป็นข้อมูลสะสมและไม่สรุป YoY เต็มปี.
- PDF มี cosmetic pagination: หัวข้อกราฟสัดส่วนท้ายหน้า1 แต่กราฟหน้า2; หัวข้อ citation ท้ายหน้า2 แต่ข้อมูลหน้า3 และหน้า3มีพื้นที่ว่างมาก. เนื้อหาไม่สูญหาย จัดเป็นงานเก็บรายละเอียดการพิมพ์ ไม่เป็น blocker ต่อ local merge.
- ปิดข้อค้างดาวน์โหลด CSV จริงและ print/PDF จริงสำหรับไฟล์ชุดนี้. Keyboard ไม่สามารถพิสูจน์จากไฟล์แนบ และผู้ใช้ระบุชัดเฉพาะว่าโหลดได้ จึงไม่บันทึกว่า reviewer ทดสอบ keyboard ผ่านเอง.

Verdict: ผ่าน code review + functional export/print สำหรับชุดที่ส่งมา อนุมัติในขอบเขต review ให้ดำเนิน local merge ตาม prompt เดิมได้. ไม่ใช่การยืนยัน deploy หรือดำเนิน merge ใน turn นี้. .claude/launch.json ยังต้องแยกออกตามเดิม.
