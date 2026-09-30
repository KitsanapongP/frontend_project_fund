export function defaultSummaryFilters(year = new Date().getFullYear()) {
  return { year_from: year - 1, year_to: year, types: 'Journal', category: 'classified', confidence: 'High,Medium,unknown', quartile_mode: 't1' };
}
export const qualityLabel = { T1: 'T1', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4', missing: 'ไม่มีข้อมูล Quartile', not_applicable: 'ไม่ใช้ Quartile' };
export const confidenceLabel = { High: 'High / สูง', Medium: 'Medium / ปานกลาง', Low: 'Low / ต่ำ', unknown: 'ไม่ระบุ' };
export const yearStateLabel = { available: 'มีข้อมูล', partial: 'มีข้อมูลบางส่วน', missing: 'ไม่มีชุดข้อมูล', harvesting: 'กำลังดึงข้อมูล' };
export const summaryHints = {
  thailand: 'นับ EID ไม่ซ้ำจากชุด Thailand ใน benchmark ตาม membership ปีและตัวกรองเดียวกันทั้งหมด ไม่ใช้ยอด snapshot และไม่รวมผลงานคณะที่อยู่นอกชุดฐาน',
  kku: 'ภายในชุด Thailand: ผลงานมี AF-ID 60017165, 60280609, 60026046, 60277695 หรือ 109899034 อย่างน้อยหนึ่งตัว ตรวจทุก affiliation ที่มี',
  coc: 'ภายใน KKU: ผู้เขียนตรงกับ Scopus ID อาจารย์ในทะเบียนคณะ (role 1/4/5 ไม่ถูกลบ ไม่ใช่บัญชีทดสอบ) และผู้เขียนคนนั้นมี AF-ID 60017165 หรือ 60280609 ไม่กรองวันเริ่มงาน',
  percentages: '%KKU = KKU ÷ Thailand × 100; %COC = COC ÷ KKU × 100; รวมจากยอดรวม ไม่เฉลี่ยเปอร์เซ็นต์; ตัวหารศูนย์แสดงขีด',
  roles: 'First และ corresponding นับซ้อนกันได้; first หรือ corresponding นับแต่ละผลงานครั้งเดียว บทบาทอ่านจาก XML เดิม ไม่ใช่คะแนนปริมาณงานที่ทำจริง ยังไม่แยก co-first/co-corresponding',
  co: 'รายบุคคล: สอง flags เป็น false บนสถานะ complete หรือ no_correspondence เท่านั้น ภาพรวม: ไม่มีอาจารย์ที่เข้าเกณฑ์เป็น first/corresponding และทุกคนทราบว่าเป็น co-author; หากมีคนที่ยังระบุไม่ได้ จะอยู่กลุ่มยังสรุปไม่ได้',
  unknown: 'ไม่พบ EID/Author ID ในข้อมูล XML เดิม หรือสถานะยังตรวจไม่ผ่าน หรือ flags ว่าง จึงยังระบุไม่ได้; XML ไม่มี correspondence ใช้กติกาที่ตกลงไว้ ไม่ใช่หลักฐานว่าไม่มี corresponding',
  units: 'ภาพรวมนับ EID ไม่ซ้ำ; รายบุคคลนับหนึ่งคู่ user_id/EID หลายอาจารย์ในผลงานเดียวกันทำให้รวมรายบุคคลมากกว่าภาพรวมได้ สัดส่วนแต่ละคนหารด้วยผลงานทั้งหมดหลังกรอง รวมรายการที่ยังระบุบทบาทไม่ได้',
  quartile: 'เลือก metric doc_type=all ที่ Complete ปีตีพิมพ์ หากไม่มีใช้ปี Complete ล่าสุดก่อนปีตีพิมพ์ ไม่ใช้ปีในอนาคต T1 คือ percentile 90–100 และไม่นับซ้ำใน Q1–Q4 เมื่อแยก T1; non-Journal แยกเป็นไม่ใช้ Quartile',
  zero: 'ขีดหมายถึงปีไม่มีชุดข้อมูลหรือคำนวณสัดส่วนไม่ได้ 0 หมายถึงไม่พบผลงานในข้อมูลที่สังเกตได้หลังกรอง ไม่ยืนยันว่าไม่มีผลงานใน production; ข้อมูล dev อาจไม่ครบ',
};

// One cache per view. Inactive views abort reads; cached successes survive tab
// switches. A generation prevents a stale response from overwriting new filters.
export function createSummaryLoader() {
  const cache = new Map(); let generation = 0; let controller;
  return {
    stop() { generation += 1; controller?.abort(); },
    clear() { cache.clear(); },
    async load(key, fetcher, receive, fail) {
      generation += 1; const current = generation; controller?.abort(); controller = new AbortController();
      if (cache.has(key)) { receive(cache.get(key)); return; }
      const signal = controller.signal;
      try {
        const value = await fetcher(signal);
        if (signal.aborted || current !== generation) return;
        cache.set(key, value); receive(value);
      } catch (error) { if (!signal.aborted && current === generation) fail(error); }
    },
  };
}
export function filterSummaryFaculty(rows, search, hideEmpty, sort) {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter((r) => (!hideEmpty || r.total > 0) && `${r.name} ${r.scopus_id}`.toLocaleLowerCase().includes(query))
    .sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name,'th') : (Number(b[sort]) || 0) - (Number(a[sort]) || 0) || a.name.localeCompare(b.name,'th'));
}
