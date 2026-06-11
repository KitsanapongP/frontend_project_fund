const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// parse .env manually
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  process.env[key] = val;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/19ZNOvY6vyIS8Vie77X6oWWjCN7k8wN1SuOwyB1kc0VM/export?format=csv&gid=909479246';

function parseCSV(text) {
  const lines = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i], next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else field += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { current.push(field.trim()); field = ''; }
      else if (char === '\n' || (char === '\r' && next === '\n')) {
        if (char === '\r') i++;
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f)) lines.push(current);
        current = []; field = '';
      } else if (char === '\r') {
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f)) lines.push(current);
        current = []; field = '';
      } else field += char;
    }
  }
  if (field.trim() || current.length > 0) { current.push(field.trim()); if (current.some(f => f)) lines.push(current); }
  return lines;
}

function findCol(headers, patterns) {
  for (const p of patterns) {
    const idx = headers.findIndex(h => h.includes(p));
    if (idx !== -1) return idx;
  }
  return -1;
}

function cleanName(raw) {
  return raw.replace(/^[\s,;.\n\r\-()]+|[\s,;.\n\r\-()]+$/g, '').replace(/^\d+\.\s*/, '').replace(/\b\d{7,12}(?:-\d+)?\b\s*/g, ' ').trim();
}

function parseMembers(text) {
  if (!text) return [];
  const segments = text.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
  const members = [];
  for (const seg of segments) {
    const ids = [...seg.matchAll(/\b(\d{7,12}(?:-\d+)?)\b/g)];
    if (ids.length === 0) { const n = cleanName(seg); if (n) members.push({ student_id: null, name: n }); continue; }
    for (let i = 0; i < ids.length; i++) {
      const m = ids[i];
      const prevEnd = i > 0 ? ids[i-1].index + ids[i-1][0].length : 0;
      const beforeText = seg.slice(prevEnd, m.index).trim();
      const nextStart = i < ids.length - 1 ? ids[i+1].index : seg.length;
      const afterText = seg.slice(m.index + m[0].length, nextStart).trim();
      if (i > 0 && beforeText && beforeText === seg.slice(ids[i-1].index + ids[i-1][0].length, ids[i].index).trim()) continue;
      const rawName = (beforeText && !afterText) ? beforeText : (afterText || beforeText);
      const name = cleanName(rawName);
      if (name) members.push({ student_id: m[1], name });
    }
  }
  return members;
}

function parseAdvisors(text) {
  if (!text || text.trim() === '-' || text.trim() === '') return [];
  return text.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ student_id: null, name }));
}

const TRACK_ALIASES = {
  'ag': 'ag', 'agriculture': 'ag', 'คณะเกษตรศาสตร์': 'ag',
  'cola': 'cola', 'college of local administration': 'cola', 'วิทยาลัยการปกครองท้องถิ่น': 'cola',
  'cp': 'cp', 'college of computing': 'cp', 'วิทยาลัยการคอมพิวเตอร์': 'cp',
  'kkbs': 'kkbs', 'business administration': 'kkbs', 'คณะบริหารธุรกิจและการบัญชี': 'kkbs',
  'md': 'md', 'medicine': 'md', 'คณะแพทยศาสตร์': 'md',
};
function normalizeTrack(val) {
  if (!val) return ''; const v = val.trim().toLowerCase(); return TRACK_ALIASES[v] || v;
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE, waitForConnections: true, connectionLimit: 5, charset: 'utf8mb4',
  });

  try {
    console.log('[SYNC] Fetching CSV...');
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('No data rows');
    console.log(`[SYNC] ${rows.length - 1} rows`);

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const colGroup = findCol(headers, ['ชื่อกลุ่ม', 'กลุ่ม', 'group']);
    const colMembers = findCol(headers, ['รหัสนักศึกษา', 'สมาชิก', 'member', 'student']);
    const colTrack = findCol(headers, ['Track', 'track']);
    const colTitleTh = findCol(headers, ['ชื่อโครงงาน (ภาษาไทย)', 'ชื่อโครงงานไทย', 'project_th', 'title_th']);
    const colTitleEn = findCol(headers, ['ชื่อโครงงาน (ภาษาอังกฤษ)', 'ชื่อโครงงานอังกฤษ', 'project_en', 'title_en']);
    const colType = findCol(headers, ['ประเภทของโครงงาน', 'ประเภท', 'type', 'project_type']);
    const colAbstract = findCol(headers, ['บทคัดย่อ', 'abstract']);
    const colLink = findCol(headers, ['ลิงก์', 'link', 'url', 'demo']);
    const colAdvisor = findCol(headers, ['อาจารย์ที่ปรึกษา', 'ที่ปรึกษา', 'advisor']);

    const publishedYear = 2026;
    const stats = { inserted: 0, updated: 0, errors: 0, students_added: 0, advisors_added: 0 };

    for (const row of dataRows) {
      try {
        const groupCode = (row[colGroup] || '').trim();
        const trackId = normalizeTrack((row[colTrack] || '').trim());
        const titleTh = (row[colTitleTh] || '').trim();
        const titleEn = (row[colTitleEn] || '').trim();
        const projectType = (row[colType] || '').trim();
        const abstract = (row[colAbstract] || '').trim();
        const link = (row[colLink] || '').trim();
        const members = parseMembers(row[colMembers] || '');
        const advisors = parseAdvisors(colAdvisor !== -1 ? (row[colAdvisor] || '') : '');

        if (!groupCode && !titleTh) continue;

        const [existing] = await pool.execute(
          `SELECT id FROM ai_showcase_projects WHERE group_code = ? AND title_th = ? AND published_year = ? LIMIT 1`,
          [groupCode, titleTh, publishedYear]
        );

        let projectId;
        const posterUrl = link && (link.includes('canva.com') || link.includes('drive.google.com') || link.match(/\.(png|jpg|jpeg|gif|webp)/i)) ? link : null;

        if (existing.length > 0) {
          projectId = existing[0].id;
          await pool.execute(
            `UPDATE ai_showcase_projects SET title_th=?, title_en=?, abstract=?, project_type=?, track_id=?, updated_at=NOW() WHERE id=?`,
            [titleTh, titleEn, abstract, projectType, trackId, projectId]
          );
          stats.updated++;
        } else {
          const [result] = await pool.execute(
            `INSERT INTO ai_showcase_projects (title_th, title_en, abstract, project_type, group_code, published_year, track_id, ai_showcase_link, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titleTh, titleEn, abstract, projectType, groupCode, publishedYear, trackId, link, posterUrl]
          );
          projectId = result.insertId;
          stats.inserted++;
        }

        await pool.execute(`DELETE FROM ai_showcase_project_members WHERE project_id = ?`, [projectId]);
        for (const m of members) {
          if (!m.name) continue;
          await pool.execute(`INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'student')`, [projectId, m.student_id, m.name]);
          stats.students_added++;
        }
        for (const a of advisors) {
          if (!a.name) continue;
          await pool.execute(`INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'advisor')`, [projectId, a.student_id, a.name]);
          stats.advisors_added++;
        }
      } catch (err) {
        console.error(`[SYNC] Row error: ${err.message}`);
        stats.errors++;
      }
    }

    console.log(`[SYNC] Done: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.students_added} students, ${stats.advisors_added} advisors, ${stats.errors} errors`);
    return stats;
  } finally {
    await pool.end();
  }
}

main().then(s => process.exit(s.errors > 0 ? 1 : 0)).catch(e => { console.error(e); process.exit(1); });
