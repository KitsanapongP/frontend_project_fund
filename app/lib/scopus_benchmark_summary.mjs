import { hintLead as lead } from './scopus_explanation_hints.mjs';

export function defaultSummaryFilters(year = new Date().getFullYear()) {
  return { year_from: year - 1, year_to: year, types: 'Journal', category: 'classified', confidence: 'High,Medium,unknown', quartile_mode: 't1' };
}
export const qualityLabel = { T1: 'T1', Q1: 'Q1', Q2: 'Q2', Q3: 'Q3', Q4: 'Q4', missing: 'ไม่มีข้อมูล Quartile', not_applicable: 'ไม่ถูกนำมาจัดอันดับ' };
export const confidenceLabel = { High: 'High / สูง', Medium: 'Medium / ปานกลาง', Low: 'Low / ต่ำ', unknown: 'ไม่ระบุ' };
export const yearStateLabel = { available: 'มีข้อมูล', partial: 'มีข้อมูลบางส่วน', missing: 'ไม่มีชุดข้อมูล', harvesting: 'กำลังดึงข้อมูล' };
export const summaryHints = {
  thailand: { title: 'Thailand — ประเทศไทย', lines: [lead('นับจากเอกสารที่เก็บไว้ ', 'ในชุดข้อมูลประเทศไทย ตามปีและเงื่อนไขที่เลือก'), 'หนึ่งผลงานนับครั้งเดียวตามรหัสผลงาน Scopus ไม่ใช้ยอดจากชุดสรุปการนับ', 'ไม่รวมผลงานคณะที่อยู่นอกชุดข้อมูลประเทศไทย'] },
  kku: { title: 'KKU — มหาวิทยาลัยขอนแก่น', lines: [lead('เป็นส่วนหนึ่งของชุดประเทศไทย ', 'ที่มีสังกัด KKU อย่างน้อยหนึ่งแห่ง'), 'รหัสสังกัดที่ใช้คือ 60017165, 60280609, 60026046, 60277695 หรือ 109899034', 'ตรวจทุกสังกัดในผลงาน ไม่จำกัดเฉพาะสังกัดแรก'] },
  coc: { title: 'COC — วิทยาลัยการคอมพิวเตอร์', lines: [lead('เป็นส่วนหนึ่งของชุด KKU ', 'ที่มี Scopus ID ของอาจารย์ในทะเบียนคณะ'), 'อาจารย์คนนั้นต้องมีรหัสสังกัด 60017165 หรือ 60280609 ในผลงาน', 'ทะเบียนคณะรวมอาจารย์ หัวหน้าสาขา และผู้บริหาร ไม่รวมบัญชีที่ถูกลบหรือบัญชีทดสอบ', lead('ไม่ใช้วันเริ่มงานกรอง ', 'ในรายงานสรุปผลงานและบทบาทอาจารย์นี้')] },
  percentages: { title: 'สัดส่วน', lines: [lead('%KKU ', '= ผลงาน KKU ÷ ผลงานประเทศไทย × 100'), lead('%COC ', '= ผลงานคณะ ÷ ผลงาน KKU × 100'), 'แถวรวมคิดจากยอดรวม ไม่เฉลี่ยร้อยละของแต่ละแถว', 'หากตัวหารเป็นศูนย์จะแสดงขีด (—)'] },
  roles: { title: 'บทบาทผู้เขียน', lines: [lead('First และ Corresponding นับซ้อนกันได้ ', 'คนเดียวอาจเป็นทั้งผู้เขียนชื่อแรกและผู้เขียนที่ติดต่อประสานงาน'), 'กลุ่ม First หรือ Corresponding นับแต่ละผลงานครั้งเดียว แม้เป็นทั้งสองบทบาท', 'ใช้ข้อมูลผู้เขียนจาก Scopus ที่ตรวจแล้ว ยังไม่แยกผู้เขียนชื่อแรกร่วมหรือผู้เขียนที่ติดต่อประสานงานร่วม', 'บทบาทเป็นหน้าที่ในข้อมูลผลงาน ไม่ใช่คะแนนปริมาณงานที่ทำจริง'] },
  co: { title: 'Co-author — ผู้เขียนร่วม', lines: [lead('รายบุคคล ', 'ตรวจข้อมูลผู้เขียนแล้ว และไม่เป็นทั้ง First และ Corresponding'), 'รวมกรณีข้อมูลที่ตรวจแล้วไม่ระบุผู้เขียนที่ติดต่อประสานงาน ตามเกณฑ์ของรายงานนี้', lead('ภาพรวม “Co-author เท่านั้น” ', 'อาจารย์ทุกคนที่เข้าเกณฑ์ในผลงานต้องเป็น Co-author'), 'หากมีผู้เขียนที่ยังระบุบทบาทไม่ได้และไม่มี First หรือ Corresponding จะอยู่ในกลุ่ม “ยังสรุปไม่ได้”'] },
  unknown: { title: 'ยังระบุบทบาทไม่ได้', lines: [lead('หลักฐานยังไม่พอ ', 'เชื่อมรหัสผลงานหรือรหัสผู้เขียนกับข้อมูล Scopus ไม่ได้ ยังตรวจไม่ผ่าน หรือค่าบทบาทยังว่าง'), 'การไม่ระบุผู้เขียนที่ติดต่อประสานงาน ไม่ได้ยืนยันว่าผลงานนั้นไม่มี Corresponding author'] },
  units: { title: 'หน่วยการนับ', lines: [lead('ภาพรวม ', 'หนึ่งผลงานนับครั้งเดียวตามรหัสผลงาน Scopus'), lead('รายอาจารย์ ', 'หนึ่งคนต่อหนึ่งผลงาน ผลงานเดียวมีหลายอาจารย์ได้ ผลรวมรายคนจึงอาจมากกว่าภาพรวม'), 'ร้อยละรายคนหารด้วยผลงานทั้งหมดของคนนั้นตามเงื่อนไขที่เลือก รวมงานที่ยังไม่ทราบบทบาท'] },
  quartile: { title: 'Quartile และ T1', lines: [lead('ใช้ค่าของปีตีพิมพ์ ', 'จากชุดตัวชี้วัดวารสารที่มีข้อมูลครบและครอบคลุมผลงานทุกประเภท'), 'หากไม่มี ใช้ปีล่าสุดที่มีข้อมูลครบก่อนปีตีพิมพ์ ไม่ใช้ค่าจากปีในอนาคต', lead('T1 คือเปอร์เซ็นไทล์ 90–100 ', 'โหมดแยก T1 จะไม่นับซ้ำใน Q1–Q4'), 'โหมด Q1–Q4 รวม T1 กลับใน Quartile ของตัวชี้วัดเดิม', 'TH ในตารางย่อมาจาก Thailand หรือประเทศไทย'] },
  missingQuartile: { title: 'ไม่มีข้อมูล Quartile', lines: [lead('เป็นผลงานวารสาร ', 'แต่หา Quartile จากตัวชี้วัดตามเกณฑ์ของรายงานไม่ได้'), 'ต่างจาก “ไม่ถูกนำมาจัดอันดับ” ซึ่งเป็นผลงานประเภทอื่น'] },
  notApplicable: { title: 'ไม่ถูกนำมาจัดอันดับ', lines: [lead('ไม่ใช่ผลงานวารสาร ', 'เช่น บทความประชุมวิชาการหรือหนังสือ'), 'รายงานนี้จัดอันดับ Quartile เฉพาะผลงานวารสาร จึงแยกประเภทอื่นไว้', 'หากเลือกเฉพาะ Journal กลุ่มนี้จะเป็นศูนย์'] },
  unrankedVisibility: { title: 'การแสดงแถวที่ไม่ถูกนำมาจัดอันดับ', lines: [lead('แสดงอัตโนมัติ ', 'เมื่อเงื่อนไขมีประเภทอื่นนอกจาก Journal'), 'การซ่อนต้องยืนยันก่อน เพราะผลบวกของแถวที่เห็นอาจไม่เท่ากับแถว “รวมทุกประเภท”', lead('ซ่อนได้โดยไม่ตัดผลงาน ', 'ยอดรวมและไฟล์ Excel ยังนับทุกประเภทที่เลือก'), 'เมื่อเลือกเฉพาะ Journal จะซ่อนแถวนี้เป็นค่าเริ่มต้น วารสารที่ไม่มี Quartile ยังอยู่ในแถว “ไม่มีข้อมูล”'] },
  zero: { title: 'ขีดกับศูนย์ต่างกันอย่างไร', lines: [lead('ขีด (—) ', 'หมายถึงไม่มีชุดข้อมูลปีนั้น หรือคำนวณสัดส่วนไม่ได้'), lead('ศูนย์ (0) ', 'หมายถึงไม่พบผลงานตามเงื่อนไขที่เลือกในข้อมูลที่มี'), 'ชุดข้อมูลของแต่ละระบบอาจเก็บไม่ครบเท่ากัน จึงไม่ใช้ยอดในระบบทดสอบยืนยันยอดของระบบใช้งานจริง'] },
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

// One cache per mounted view. Visibility never cancels a started read. Rejoining
// the same pending key updates the receiver without starting another request.
// Context changes/refresh/unmount explicitly stop obsolete reads.
export function createSummaryLoader() {
  const cache = new Map(); let generation = 0; let pending;
  const loader = {
    stop() { generation += 1; pending?.controller.abort(); pending = null; },
    clear() { cache.clear(); },
    load(key, fetcher, receive, fail) {
      if (pending?.key === key) {
        pending.receive = receive; pending.fail = fail;
        return pending.promise;
      }
      loader.stop();
      if (cache.has(key)) { receive(cache.get(key)); return Promise.resolve(); }
      const request = { key, generation, controller: new AbortController(), receive, fail };
      pending = request;
      request.promise = (async () => {
        try {
          const value = await fetcher(request.controller.signal);
          if (request.controller.signal.aborted || request.generation !== generation) return;
          cache.set(key, value); request.receive(value);
        } catch (error) {
          if (!request.controller.signal.aborted && request.generation === generation) request.fail(error);
        } finally { if (pending === request) pending = null; }
      })();
      return request.promise;
    },
  };
  return loader;
}
export function filterSummaryFaculty(rows, search, hideEmpty, sort) {
  const query = search.trim().toLocaleLowerCase();
  const filtered = rows.filter((r) => (!hideEmpty || r.total > 0) && `${r.name} ${r.scopus_id}`.toLocaleLowerCase().includes(query))
    .sort((a,b) => a.name.localeCompare(b.name,'th'));
  return sortSummaryRows(filtered, typeof sort === 'string' ? { key: sort, direction: sort === 'name' ? 'asc' : 'desc' } : sort);
}
