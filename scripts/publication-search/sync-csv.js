const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', '..', 'logs', 'sync-csv-error.log');
function logError(msg) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (_) {}
}

process.on('uncaughtException', e => logError(`UNCAUGHT: ${e.stack || e.message}`));
process.on('unhandledRejection', e => logError(`UNHANDLED: ${e?.stack || e?.message || e}`));

const envText = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf-8');
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
      else if (char === ',') { current.push(field); field = ''; }
      else if (char === '\r') { }
      else if (char === '\n') { current.push(field); lines.push(current); current = []; field = ''; }
      else field += char;
    }
  }
  if (field || current.length) { current.push(field); lines.push(current); }
  return lines;
}

function findColumnIndex(headers, names) {
  for (const name of names) {
    const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase() || h.trim().toLowerCase().startsWith(name.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseMembers(cellValue) {
  if (!cellValue) return [];
  const raw = String(cellValue).trim();
  const results = [];
  const seenNames = new Set();

  const parenGroups = raw.match(/\(([^)]+)\)/g);
  if (parenGroups && parenGroups.length > 0) {
    for (const g of parenGroups) {
      const content = g.slice(1, -1);
      const parts = content.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) continue;
      const idPart = parts[0];
      const ids = idPart.match(/\d{7,12}/);
      const sid = ids ? ids[0] : null;
      const name = parts.slice(1).join(', ').trim();
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        results.push({ student_id: sid, name });
      }
    }
    return results;
  }

  const segments = raw.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
  for (const segment of segments) {
    const seg = segment.replace(/^\d+[\.\)]\s*/, '');
    const ids = seg.match(/\d{7,12}/g);
    if (!ids) {
      const name = seg.replace(/\(?\d{7,12}\)?\s*/g, '').trim();
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        results.push({ student_id: null, name });
      }
      continue;
    }
    const namesOnly = seg.replace(/\d{7,12}[-–]?\d*\s*[-–]?\s*/g, '').trim();
    const rawName = namesOnly || null;
    for (const sid of ids) {
      results.push({ student_id: sid, name: rawName });
    }
  }
  return results;
}

function parseAdvisors(text) {
  if (!text || text.trim() === '-' || text.trim() === '') return [];
  return text.split(',').map(s => s.trim()).filter(Boolean).map(name => ({
    student_id: null,
    name,
  }));
}

const TRACK_MAP = {
  'ag': { name_th: 'คณะเกษตรศาสตร์', name_en: 'Faculty of Agriculture' },
  'cola': { name_th: 'วิทยาลัยการปกครองท้องถิ่น', name_en: 'College of Local Administration' },
  'cp': { name_th: 'วิทยาลัยการคอมพิวเตอร์', name_en: 'College of Computing' },
  'kkbs': { name_th: 'คณะบริหารธุรกิจและการบัญชี', name_en: 'Faculty of Business Administration and Accountancy' },
  'md': { name_th: 'คณะแพทยศาสตร์', name_en: 'Faculty of Medicine' },
};

const TRACK_ALIASES = {
  'ag': 'ag', 'agriculture': 'ag', 'คณะเกษตรศาสตร์': 'ag',
  'cola': 'cola', 'college of local administration': 'cola', 'วิทยาลัยการปกครองท้องถิ่น': 'cola',
  'cp': 'cp', 'college of computing': 'cp', 'วิทยาลัยการคอมพิวเตอร์': 'cp',
  'kkbs': 'kkbs', 'business administration': 'kkbs', 'คณะบริหารธุรกิจและการบัญชี': 'kkbs',
  'md': 'md', 'medicine': 'md', 'คณะแพทยศาสตร์': 'md',
};

function normalizeTrack(val) {
  if (!val) return null;
  const v = val.trim().toLowerCase();
  return TRACK_ALIASES[v] || null;
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'kku_fund',
    connectionLimit: 5,
    charset: 'utf8mb4',
  });

  console.log('[SYNC] Fetching CSV...');
  const res = await fetch(CSV_URL);
  if (!res.ok) { console.error(`[SYNC] CSV fetch failed: ${res.status}`); process.exit(1); }
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) { console.error('[SYNC] CSV has no data rows'); process.exit(1); }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  console.log(`[SYNC] ${dataRows.length} rows`);

  const colGroup = findColumnIndex(headers, ['ชื่อกลุ่ม', 'กลุ่ม', 'group']);
  const colMembers = findColumnIndex(headers, ['รหัสนักศึกษา', 'สมาชิก', 'member', 'student', 'รหัสนักศึกษา - ชื่อ-สกุล (สมาชิกทุกคน)', 'รหัสนักศึกษา - ชื่อ-สกุล']);
  const colTrack = findColumnIndex(headers, ['Track', 'track']);
  const colTitleTh = findColumnIndex(headers, ['ชื่อโครงงาน (ภาษาไทย)', 'ชื่อโครงงานไทย', 'project_th', 'title_th']);
  const colTitleEn = findColumnIndex(headers, ['ชื่อโครงงาน (ภาษาอังกฤษ)', 'ชื่อโครงงานอังกฤษ', 'project_en', 'title_en']);
  const colType = findColumnIndex(headers, ['ประเภทของโครงงาน', 'ประเภท', 'type', 'project_type']);
  const colAbstract = findColumnIndex(headers, ['บทคัดย่อ', 'abstract']);
  const colLink = findColumnIndex(headers, ['ลิงก์', 'link', 'url', 'demo']);
  const colAdvisor = findColumnIndex(headers, ['อาจารย์ที่ปรึกษา', 'ที่ปรึกษา', 'advisor']);

  const publishedYear = 2026;
  let inserted = 0, updated = 0, totalStudents = 0, totalAdvisors = 0, errors = 0;

  for (const row of dataRows) {
    try {
      const groupCode = (row[colGroup] || '').trim();
      const trackRaw = (row[colTrack] || '').trim();
      const trackId = normalizeTrack(trackRaw);
      const titleTh = (row[colTitleTh] || '').trim();
      const titleEn = (row[colTitleEn] || '').trim();
      const projectType = (row[colType] || '').trim();
      const abstract = (row[colAbstract] || '').trim();
      const link = (row[colLink] || '').trim();
      const membersRaw = row[colMembers] || '';
      const advisorsRaw = colAdvisor !== -1 ? (row[colAdvisor] || '') : '';

      if (!groupCode && !titleTh) continue;

      const members = parseMembers(membersRaw);
      const advisors = parseAdvisors(advisorsRaw);

      if (trackId && TRACK_MAP[trackId]) {
        const t = TRACK_MAP[trackId];
        await pool.execute(
          `INSERT IGNORE INTO ai_showcase_tracks (id, name_th, name_en) VALUES (?, ?, ?)`,
          [trackId, t.name_th, t.name_en]
        );
      }

      const [existing] = await pool.execute(
        `SELECT id FROM ai_showcase_projects WHERE group_code = ? AND title_th = ? AND published_year = ? LIMIT 1`,
        [groupCode, titleTh, publishedYear]
      );

      let projectId;
      const posterUrl = link && (link.includes('canva.com') || link.includes('drive.google.com') || link.match(/\.(png|jpg|jpeg|gif|webp)/i))
        ? link : null;

      if (existing.length > 0) {
        projectId = existing[0].id;
        await pool.execute(
          `UPDATE ai_showcase_projects SET
            title_th = ?, title_en = ?, abstract = ?, project_type = ?,
            track_id = ?, updated_at = NOW()
          WHERE id = ?`,
          [titleTh, titleEn, abstract, projectType, trackId, projectId]
        );
        updated++;
      } else {
        const [result] = await pool.execute(
          `INSERT INTO ai_showcase_projects
            (title_th, title_en, abstract, project_type, group_code, published_year, track_id, ai_showcase_link, poster_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [titleTh, titleEn, abstract, projectType, groupCode, publishedYear, trackId, link, posterUrl]
        );
        projectId = result.insertId;
        inserted++;
      }

      await pool.execute(`DELETE FROM ai_showcase_project_members WHERE project_id = ?`, [projectId]);

      for (const m of members) {
        if (!m.name) continue;
        await pool.execute(
          `INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'student')`,
          [projectId, m.student_id, m.name]
        );
        totalStudents++;
      }

      for (const a of advisors) {
        if (!a.name) continue;
        await pool.execute(
          `INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'advisor')`,
          [projectId, a.student_id, a.name]
        );
        totalAdvisors++;
      }
    } catch (err) {
      console.error(`[SYNC] Error processing row: ${err.message}`);
      errors++;
    }
  }

  console.log(`[SYNC] Done: ${inserted} inserted, ${updated} updated, ${totalStudents} students, ${totalAdvisors} advisors, ${errors} errors`);
  await pool.end();
}

main().catch(err => {
  logError(`MAIN_ERROR: ${err.stack || err.message || err}`);
  console.error(err);
  process.exit(1);
});