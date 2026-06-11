import { NextResponse } from 'next/server';
import pool from '../../../lib/db-connection';

function parseCSV(text) {
  const lines = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(field.trim());
        field = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        if (char === '\r') i++;
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f)) {
          lines.push(current);
        }
        current = [];
        field = '';
      } else if (char === '\r') {
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f)) {
          lines.push(current);
        }
        current = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  if (field.trim() || current.length > 0) {
    current.push(field.trim());
    if (current.some(f => f)) {
      lines.push(current);
    }
  }

  return lines;
}

function findColumnIndex(headers, patterns) {
  for (const pat of patterns) {
    const idx = headers.findIndex(h => h.includes(pat));
    if (idx !== -1) return idx;
  }
  return -1;
}

function cleanName(raw) {
  return raw
    .replace(/^[\s,;.\n\r\-()]+|[\s,;.\n\r\-()]+$/g, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\b\d{7,12}(?:-\d+)?\b\s*/g, ' ')
    .trim();
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
  if (!val) return '';
  const v = val.trim().toLowerCase();
  return TRACK_ALIASES[v] || v;
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const csvUrl = searchParams.get('csv_url');
    const dryRun = searchParams.get('dry_run') === 'true';

    if (!csvUrl) {
      return NextResponse.json({ success: false, error: 'Missing csv_url parameter' }, { status: 400 });
    }

    const res = await fetch(csvUrl);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `CSV fetch failed: ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: 'CSV has no data rows' }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const colGroup = findColumnIndex(headers, ['ชื่อกลุ่ม', 'กลุ่ม', 'group']);
    const colMembers = findColumnIndex(headers, ['รหัสนักศึกษา', 'สมาชิก', 'member', 'student']);
    const colTrack = findColumnIndex(headers, ['Track', 'track']);
    const colTitleTh = findColumnIndex(headers, ['ชื่อโครงงาน (ภาษาไทย)', 'ชื่อโครงงานไทย', 'project_th', 'title_th']);
    const colTitleEn = findColumnIndex(headers, ['ชื่อโครงงาน (ภาษาอังกฤษ)', 'ชื่อโครงงานอังกฤษ', 'project_en', 'title_en']);
    const colType = findColumnIndex(headers, ['ประเภทของโครงงาน', 'ประเภท', 'type', 'project_type']);
    const colAbstract = findColumnIndex(headers, ['บทคัดย่อ', 'abstract']);
    const colLink = findColumnIndex(headers, ['ลิงก์', 'link', 'url', 'demo']);
    const colAdvisor = findColumnIndex(headers, ['อาจารย์ที่ปรึกษา', 'ที่ปรึกษา', 'advisor']);

    console.log('[CSV Sync] rows:', rows.length, 'dataRows:', dataRows.length);
    console.log('[CSV Sync] cols - group:', colGroup, 'members:', colMembers, 'track:', colTrack, 'title_th:', colTitleTh);
    console.log('[CSV Sync] first header:', JSON.stringify(headers[0]));

    const publishedYear = 2026;

    const stats = { inserted: 0, updated: 0, errors: 0, students_added: 0, advisors_added: 0 };
    const projects = [];

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

        if (dryRun) {
          projects.push({
            group_code: groupCode,
            title_th: titleTh,
            track_id: trackId,
            project_type: projectType,
            members: members.map(m => ({ name: m.name })),
            advisors: advisors.map(a => ({ name: a.name })),
          });
          continue;
        }

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
          stats.updated++;
        } else {
          const [result] = await pool.execute(
            `INSERT INTO ai_showcase_projects
              (title_th, title_en, abstract, project_type, group_code, published_year, track_id, ai_showcase_link, poster_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titleTh, titleEn, abstract, projectType, groupCode, publishedYear, trackId, link, posterUrl]
          );
          projectId = result.insertId;
          stats.inserted++;
        }

        await pool.execute(`DELETE FROM ai_showcase_project_members WHERE project_id = ?`, [projectId]);

        for (const m of members) {
          if (!m.name) continue;
          await pool.execute(
            `INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'student')`,
            [projectId, m.student_id, m.name]
          );
          stats.students_added++;
        }

        for (const a of advisors) {
          if (!a.name) continue;
          await pool.execute(
            `INSERT INTO ai_showcase_project_members (project_id, student_id, name, role) VALUES (?, ?, ?, 'advisor')`,
            [projectId, a.student_id, a.name]
          );
          stats.advisors_added++;
        }
      } catch (err) {
        console.error(`Error syncing row:`, err.message);
        stats.errors++;
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        total: projects.length,
        debug: {
          rows_total: rows.length,
          data_rows: dataRows.length,
          col_group: colGroup,
          col_members: colMembers,
          col_track: colTrack,
          col_title_th: colTitleTh,
          sample_header_3: headers[3] ? headers[3].slice(0, 40) : null,
        },
        projects: projects.map(p => ({
          group_code: p.group_code,
          title_th: p.title_th.slice(0, 60),
          track_id: p.track_id,
          project_type: p.project_type,
          members: p.members,
          advisors: p.advisors,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${stats.inserted + stats.updated} projects from CSV`,
      stats,
    });
  } catch (error) {
    console.error('CSV sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
