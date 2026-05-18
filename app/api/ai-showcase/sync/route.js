import { NextResponse } from 'next/server';
import pool from '../../../lib/db-connection';

const EXTERNAL_API_URL = 'https://ai-dday.computing.kku.ac.th/project/__data.json';
const CURRENT_YEAR = 2026;

function parseSvelteKitData(raw) {
  const json = JSON.parse(raw);
  const data = json.nodes[1].data;

  function resolve(idx) {
    if (idx === 0 || idx === null || idx === undefined) return null;
    const entry = data[idx];
    if (entry === null || entry === undefined) return null;
    if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') return entry;
    if (Array.isArray(entry)) {
      return entry.map(item => {
        if (typeof item === 'number') return resolve(item);
        return item;
      });
    }
    if (typeof entry === 'object') {
      if (entry.type === 'data') return entry.data;
      const result = {};
      for (const [key, val] of Object.entries(entry)) {
        if (typeof val === 'number') result[key] = resolve(val);
        else result[key] = val;
      }
      return result;
    }
    return entry;
  }

  const entryIndices = data[1];
  const projects = [];

  for (const entryIdx of entryIndices) {
    const schema = data[entryIdx];
    if (!schema || typeof schema !== 'object') continue;
    const project = {};
    for (const [field, valIdx] of Object.entries(schema)) {
      if (typeof valIdx === 'number') {
        project[field] = resolve(valIdx);
      }
    }
    projects.push(project);
  }

  return projects;
}

function mapProject(raw) {

  const publishedYear = raw.timestamp
    ? new Date(raw.timestamp).getFullYear()
    : new Date().getFullYear();

  return {
    title_th: (raw.name || '').trim(),
    title_en: (raw.name_en || '').trim(),
    abstract: raw.abstract || null,
    description: raw.quote || null,
    project_type: (raw.type || '').trim(),
    group_code: (raw.group || '').trim(),
    track_id: (raw.track?.id || '').trim(),

    published_year: publishedYear,

    ai_showcase_link: raw.id
      ? `https://ai-dday.computing.kku.ac.th/project/${raw.id}`
      : null,

    poster_url: raw.id
      ? `https://ai-dday.computing.kku.ac.th/project/${raw.id}.webp`
      : null,

    members: Array.isArray(raw.members)
      ? raw.members.map(m => ({
          student_id: (m?.id || '').trim(),
          name: (m?.name || '').trim(),
        }))
      : [],
  };
}

const TRACK_MAP = {
  'ag': { name_th: 'คณะเกษตรศาสตร์', name_en: 'Faculty of Agriculture' },
  'cola': { name_th: 'วิทยาลัยการปกครองท้องถิ่น', name_en: 'College of Local Administration' },
  'cp': { name_th: 'วิทยาลัยการคอมพิวเตอร์', name_en: 'College of Computing' },
  'kkbs': { name_th: 'คณะบริหารธุรกิจและการบัญชี', name_en: 'Faculty of Business Administration and Accountancy' },
  'md': { name_th: 'คณะแพทยศาสตร์', name_en: 'Faculty of Medicine' },
};

async function ensureTracks(pool, projects) {
  const trackIds = [...new Set(projects.map(p => p.track_id).filter(Boolean))];
  const inserted = [];
  for (const tid of trackIds) {
    const info = TRACK_MAP[tid];
    if (!info) continue;
    await pool.execute(
      `INSERT IGNORE INTO ai_showcase_tracks (id, name_th, name_en) VALUES (?, ?, ?)`,
      [tid, info.name_th, info.name_en]
    );
    inserted.push(tid);
  }
  return inserted;
}

async function upsertProject(pool, project) {
  const [existing] = await pool.execute(
    `SELECT id FROM ai_showcase_projects WHERE group_code = ? AND published_year = ? LIMIT 1`,
    [project.group_code, project.published_year]
  );

  if (existing.length > 0) {
    const projectId = existing[0].id;
    await pool.execute(
      `UPDATE ai_showcase_projects SET
        title_th = ?, title_en = ?, abstract = ?, description = ?,
        project_type = ?, track_id = ?, ai_showcase_link = ?
      WHERE id = ?`,
      [
        project.title_th, project.title_en, project.abstract, project.description,
        project.project_type, project.track_id, project.ai_showcase_link,
        projectId,
      ]
    );
    return { action: 'updated', id: projectId };
  } else {
    const [result] = await pool.execute(
      `INSERT INTO ai_showcase_projects
        (title_th, title_en, abstract, description, project_type, group_code, published_year, track_id, ai_showcase_link, poster_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.title_th, project.title_en, project.abstract, project.description,
        project.project_type, project.group_code, project.published_year,
        project.track_id, project.ai_showcase_link, project.poster_url,
      ]
    );
    return { action: 'inserted', id: result.insertId };
  }
}

async function upsertMembers(pool, projectId, members) {
  await pool.execute(`DELETE FROM ai_showcase_project_members WHERE project_id = ?`, [projectId]);

  for (const member of members) {
    if (!member.name && !member.student_id) continue;
    await pool.execute(
      `INSERT INTO ai_showcase_project_members (project_id, student_id, name) VALUES (?, ?, ?)`,
      [projectId, member.student_id, member.name]
    );
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dry_run') === 'true';

    const res = await fetch(EXTERNAL_API_URL, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `API responded with status ${res.status}` }, { status: 502 });
    }

    const raw = await res.text();
    const rawProjects = parseSvelteKitData(raw);
    const projects = rawProjects.map(mapProject);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        total: projects.length,
        tracks: [...new Set(projects.map(p => p.track_id))],
        projects: projects.map(p => ({
          title_th: p.title_th,
          project_type: p.project_type,
          track_id: p.track_id,
          group_code: p.group_code,
          member_count: p.members.length,
        })),
      });
    }

    const stats = { inserted: 0, updated: 0, errors: 0, members_added: 0 };

    const insertedTracks = await ensureTracks(pool, projects);
    stats.tracks_added = insertedTracks.length;

    for (const project of projects) {
      try {
        const result = await upsertProject(pool, project);
        if (result.action === 'inserted') {
          stats.inserted++;
        } else {
          stats.updated++;
        }

        await upsertMembers(pool, result.id, project.members);
        stats.members_added += project.members.length;
      } catch (err) {
        console.error(`Error syncing project "${project.title_th}":`, err.message);
        stats.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${projects.length} projects from AI D-Day API`,
      stats: {
        total: projects.length,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
