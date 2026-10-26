// An added/prepared year is never automatically the active application year.
export function resolveActiveBudgetYear(payload, years) {
  const root = payload?.data ?? payload;
  const id = Number(root?.year_id);
  const label = String(root?.current_year ?? '').trim();
  if (!Number.isInteger(id) || id <= 0 || !label) {
    throw new Error('ยังไม่ได้เปิดใช้ปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ');
  }
  const year = (Array.isArray(years) ? years : []).find(
    (entry) => Number(entry?.year_id) === id && String(entry?.year) === label
  );
  if (!year) {
    throw new Error('ไม่พบปีงบประมาณที่เปิดใช้ กรุณาติดต่อผู้ดูแลระบบ');
  }
  return { ...year, year_id: id, year: label };
}

export function selectApplicationBudgetYear(activeYear, savedYear) {
  return savedYear?.year_id ? savedYear : activeYear;
}
