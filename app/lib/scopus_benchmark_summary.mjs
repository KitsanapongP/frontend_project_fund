export function defaultSummaryFilters(year = new Date().getFullYear()) {
  return { year_from: year - 1, year_to: year, types: 'Journal', category: 'classified', confidence: 'High,Medium,unknown', quartile_mode: 't1' };
}
export const qualityLabel = { T1: 'T1', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4', missing: 'ไม่มีข้อมูล Quartile', not_applicable: 'ไม่ถูกนำมาจัดอันดับ' };
export const confidenceLabel = { High: 'High / สูง', Medium: 'Medium / ปานกลาง', Low: 'Low / ต่ำ', unknown: 'ไม่ระบุ' };
export const yearStateLabel = { available: 'มีข้อมูล', partial: 'มีข้อมูลบางส่วน', missing: 'ไม่มีชุดข้อมูล', harvesting: 'กำลังดึงข้อมูล' };
export const summaryHints = {
  thailand: { title: 'Thailand', lines: ['นับผลงานจากชุด Thailand ใน benchmark ตามปีและตัวกรองที่เลือก', 'ผลงานหนึ่ง EID นับครั้งเดียว ไม่ใช้ยอด snapshot', 'ไม่รวมผลงานคณะที่อยู่นอกชุด Thailand'] },
  kku: { title: 'KKU', lines: ['เป็นผลงานในชุด Thailand ที่มีสังกัด KKU อย่างน้อยหนึ่งแห่ง', 'AF-ID: 60017165, 60280609, 60026046, 60277695 หรือ 109899034', 'ตรวจทุกสังกัดที่มี ไม่จำกัดสังกัดแรก'] },
  coc: { title: 'COC — วิทยาลัยการคอมพิวเตอร์', lines: ['เป็นผลงานใน KKU ที่มี Scopus ID ของอาจารย์ในทะเบียนคณะ', 'อาจารย์คนนั้นต้องมี AF-ID 60017165 หรือ 60280609 ในผลงาน', 'ทะเบียนคณะ: role 1/4/5 ไม่ถูกลบและไม่ใช่บัญชีทดสอบ', 'ไม่กรองวันเริ่มงาน'] },
  percentages: { title: 'สัดส่วน', lines: ['%KKU = KKU ÷ Thailand × 100', '%COC = COC ÷ KKU × 100', 'แถวรวมคำนวณจากยอดรวม ไม่เฉลี่ยเปอร์เซ็นต์แต่ละแถว', 'ตัวหารเป็นศูนย์แสดงขีด (—)'] },
  roles: { title: 'บทบาทผู้เขียน', lines: ['First และ Corresponding นับซ้อนกันได้ คนเดียวเป็นทั้งสองบทบาทได้', 'First หรือ Corresponding นับแต่ละผลงานครั้งเดียว', 'อ่านบทบาทจากผล XML ที่ตรวจไว้ ยังไม่แยก co-first / co-corresponding', 'บทบาทไม่ใช่คะแนนปริมาณงานที่ทำจริง'] },
  co: { title: 'Co-author', lines: ['รายบุคคล: ตรวจ XML แล้ว และไม่เป็นทั้ง First และ Corresponding', 'รวมกรณี XML ไม่ระบุ correspondence ตามกติกาที่ตกลงไว้', 'ภาพรวม “Co-author เท่านั้น”: อาจารย์ทุกคนที่เข้าเกณฑ์ในผลงานเป็น Co-author', 'ถ้ามีคนที่ยังระบุไม่ได้และไม่มี First / Corresponding ให้จัดเป็น “ยังสรุปไม่ได้”'] },
  unknown: { title: 'ยังระบุบทบาทไม่ได้', lines: ['เชื่อม EID / Author ID กับข้อมูล XML ไม่ได้ หรือยังตรวจไม่ผ่าน', 'รวมกรณีค่าบทบาทยังว่าง', 'XML ไม่ระบุ correspondence ไม่ได้ยืนยันว่าไม่มี Corresponding author'] },
  units: { title: 'หน่วยการนับ', lines: ['ภาพรวม: นับผลงานไม่ซ้ำตาม EID', 'รายอาจารย์: นับหนึ่งคนต่อหนึ่งผลงาน', 'ผลงานเดียวมีหลายอาจารย์ได้ ผลรวมรายคนจึงอาจมากกว่าภาพรวม', 'สัดส่วนรายคนหารด้วยผลงานทั้งหมดหลังกรอง รวมงานที่ยังไม่ทราบบทบาท'] },
  quartile: { title: 'Quartile และ T1', lines: ['ใช้ metric ปีตีพิมพ์ที่เป็น Complete และ doc_type = all', 'ถ้าไม่มี ใช้ปี Complete ล่าสุดก่อนปีตีพิมพ์ ไม่ใช้ปีในอนาคต', 'T1 คือ percentile 90–100; โหมดแยก T1 ไม่นับซ้ำใน Q1–Q4', 'โหมด Q1–Q4 รวม T1 กลับใน Quartile ของ metric เดิม', 'TH ในตารางย่อมาจาก Thailand'] },
  missingQuartile: { title: 'ไม่มีข้อมูล Quartile', lines: ['เป็น Journal แต่หา Quartile จาก metric ตามกติกาของรายงานไม่ได้', 'ต่างจาก “ไม่ถูกนำมาจัดอันดับ” ซึ่งเป็นผลงานประเภทอื่น'] },
  notApplicable: { title: 'ไม่ถูกนำมาจัดอันดับ', lines: ['ผลงานประเภทอื่นที่ไม่ใช่ Journal เช่น Conference Proceeding หรือ Book', 'รายงานนี้จัดอันดับ Quartile เฉพาะ Journal จึงแยกผลงานเหล่านี้ไว้', 'ถ้าเลือกเฉพาะ Journal กลุ่มนี้จะเป็น 0'] },
  unrankedVisibility: { title: 'การแสดงแถวที่ไม่ถูกนำมาจัดอันดับ', lines: ['เมื่อใช้ตัวกรองที่มีประเภทอื่นนอกจาก Journal ระบบจะแสดงแถวนี้อัตโนมัติ', 'หากต้องการซ่อน ระบบจะขอให้ยืนยันก่อน เพราะผลบวกของแถวที่มองเห็นอาจไม่เท่ากับแถว “รวมทุกประเภท”', 'การซ่อนไม่ตัดผลงานออกจากรายงาน ยอดรวมและ Excel ยังนับทุกประเภทที่เลือก', 'ถ้าเลือกเฉพาะ Journal จะซ่อนแถวนี้เป็นค่าเริ่มต้น ส่วน Journal ที่ไม่มี Quartile ยังอยู่ในแถว “ไม่มีข้อมูล”'] },
  zero: { title: 'ขีดกับศูนย์ต่างกันอย่างไร', lines: ['— หมายถึงไม่มีชุดข้อมูลปีนั้น หรือคำนวณสัดส่วนไม่ได้', '0 หมายถึงไม่พบผลงานหลังกรองในข้อมูลที่มี', 'ข้อมูล dev อาจไม่ครบ จึงไม่ยืนยันยอดของ production'] },
};

export function hasNonJournalTypes(types) {
  return String(types || '').split(',').some(type => type.trim() && type.trim() !== 'Journal');
}

// Derive all three ratios from the same row; null remains unavailable, not zero.
export function presentationRows(rows) {
  const ratio=(n,d)=>n==null||d==null||d===0?null:n/d*100;
  return rows.map(row=>({...row,kku_pct:ratio(row.kku,row.thailand),coc_thailand_pct:ratio(row.coc,row.thailand),coc_pct:ratio(row.coc,row.kku)}));
}

export function nextSummarySort(current, key) {
  return { key, direction: current?.key === key ? current.direction === 'asc' ? 'desc' : 'asc' : ['label', 'name', 'scopus_id', 'year', 'quartile'].includes(key) ? 'asc' : 'desc' };
}
export function sortSummaryRows(rows, sort) {
  if (!sort) return [...rows];
  const { key, direction } = sort;
  const order = { T1: 0, Q1: 1, Q2: 2, Q3: 3, Q4: 4, missing: 5, not_applicable: 6 };
  const value = row => row.linkable === false && !['name', 'scopus_id'].includes(key) ? null : row[key];
  return [...rows].sort((a, b) => {
    const x = value(a), y = value(b);
    const absent = v => v == null || v === '' || typeof v === 'number' && !Number.isFinite(v);
    if (absent(x) || absent(y)) return absent(x) === absent(y) ? 0 : absent(x) ? 1 : -1;
    const compare = key === 'quartile' ? (order[x] ?? 7) - (order[y] ?? 7) : typeof x === 'string' ? x.localeCompare(String(y), 'th', { numeric: true }) : Number(x) - Number(y);
    return direction === 'asc' ? compare : -compare;
  });
}

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
  const filtered = rows.filter((r) => (!hideEmpty || r.total > 0) && `${r.name} ${r.scopus_id}`.toLocaleLowerCase().includes(query))
    .sort((a,b) => a.name.localeCompare(b.name,'th'));
  return sortSummaryRows(filtered, typeof sort === 'string' ? { key: sort, direction: sort === 'name' ? 'asc' : 'desc' } : sort);
}
