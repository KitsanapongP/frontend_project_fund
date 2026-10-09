import { FACULTY_ROLES, insightRatio } from './scopus_faculty_insights.mjs';

// Rotate the whole distribution, keeping the role order and proportional spans.
export function facultyRoleArcLayout(roles, total) {
  let angle = total > 0 ? -(roles.first + roles.corresponding) / total * 180 : 0;
  return FACULTY_ROLES.map(role => {
    const count = roles[role.key], span = total > 0 ? count / total * 360 : 0;
    const start = angle; angle += span;
    return { ...role, count, start, end: angle, span, gap: span >= 359.999 ? 0 : Math.min(1.2, span / 4) };
  });
}

export function facultyRoleSelection(roles, total, selected) {
  const chosen = FACULTY_ROLES.filter(role => selected.includes(role.key));
  const count = chosen.length ? chosen.reduce((sum, role) => sum + roles[role.key], 0) : total;
  return { keys: chosen.map(role => role.key), labels: chosen.map(role => role.label), count, percent: insightRatio(count, total) };
}
