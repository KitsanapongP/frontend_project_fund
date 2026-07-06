import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXTERNAL_API_URL = 'https://ai-dday.computing.kku.ac.th/project/__data.json';
const CURRENT_YEAR = new Date().getFullYear();;

const TRACK_MAP = {
  ag:    { name_th: 'คณะเกษตรศาสตร์',                name_en: 'Faculty of Agriculture' },
  cola:  { name_th: 'วิทยาลัยการปกครองท้องถิ่น',         name_en: 'College of Local Administration' },
  cp:    { name_th: 'วิทยาลัยการคอมพิวเตอร์',            name_en: 'College of Computing' },
  kkbs:  { name_th: 'คณะบริหารธุรกิจและการบัญชี',        name_en: 'Faculty of Business Administration and Accountancy' },
  md:    { name_th: 'คณะแพทยศาสตร์',                 name_en: 'Faculty of Medicine' },
  
};

function parseSvelteKitData(text) {
  const json = JSON.parse(text);
  const data = json.nodes[1].data;

  function resolve(idx) {
    if (idx === 0 || idx == null) return null;
    const entry = data[idx];
    if (entry === null || entry === undefined) return null;
    if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') return entry;
    if (Array.isArray(entry)) return entry.map(i => (typeof i === 'number' ? resolve(i) : i));
    if (typeof entry === 'object') {
      if (entry.type === 'data') return entry.data;
      const r = {};
      for (const [k, v] of Object.entries(entry)) r[k] = typeof v === 'number' ? resolve(v) : v;
      return r;
    }
    return entry;
  }

  const entryIndices = data[1];
  const projects = [];

  for (const idx of entryIndices) {
    const schema = data[idx];
    if (!schema || typeof schema !== 'object') continue;
    const p = {};
    for (const [field, valIdx] of Object.entries(schema)) {
      if (typeof valIdx === 'number') p[field] = resolve(valIdx);
    }
    projects.push(p);
  }

  return projects;
}

function mapProject(raw) {
  return {
    title_th:      (raw.name || '').trim(),
    title_en:      (raw.name_en || '').trim(),
    abstract:      raw.abstract || null,
    description:   raw.quote || null,
    project_type:  (raw.type || '').trim(),
    group_code:    (raw.group || '').trim(),
    track_id:      (raw.track?.id || '').trim(),

    published_year: raw.timestamp
      ? new Date(raw.timestamp).getFullYear()
      : CURRENT_YEAR,

    ai_showcase_link: raw.id ? `https://ai-dday.computing.kku.ac.th/project/${raw.id}` : null,
    poster_url:    null,
    members:       Array.isArray(raw.members)
      ? raw.members.map(m => ({ student_id: (m?.id || '').trim(), name: (m?.name || '').trim() }))
      : [],
  };
}

function loadEnv() {
  const envPath = resolve(__dirname, '..', '..', '..', '.env.local');
  const envPaths = [envPath, resolve(__dirname, '..', '..', '..', '.env')];
  for (const p of envPaths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key.startsWith('DB_') || key.startsWith('NEXT_PUBLIC_')) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  loadEnv();

  console.log(`[AI D-Day Sync] ${isDryRun ? 'DRY RUN' : 'LIVE RUN'}`);
  console.log(`  Fetching from: ${EXTERNAL_API_URL}`);

  const res = await fetch(EXTERNAL_API_URL);
  if (!res.ok) throw new Error(`API responded with ${res.status}`);
  const text = await res.text();

  const rawProjects = parseSvelteKitData(text);
  const projects = rawProjects.map(mapProject);
  console.log(`  Projects found: ${projects.length}`);

  if (isDryRun) {
    const byTrack = {};
    projects.forEach(p => {
      const t = TRACK_MAP[p.track_id]?.name_th || p.track_id || 'Unknown';
      if (!byTrack[t]) byTrack[t] = [];
      byTrack[t].push(p);
    });
    for (const [track, projs] of Object.entries(byTrack)) {
      console.log(`\n  ${track} (${projs.length}):`);
      projs.forEach(p => {
        const names = p.members.map(m => m.name).join(', ');
        console.log(`    [${p.group_code}] ${p.title_th.slice(0, 60)} (${p.project_type}) - ${names}`);
      });
    }
    console.log('\n  [DRY RUN - no changes made]');
    return;
  }

  const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset:  'utf8mb4',
  });

  const trackIds = [...new Set(projects.map(p => p.track_id).filter(Boolean))];
  for (const tid of trackIds) {
    const info = TRACK_MAP[tid];
    if (!info) continue;
    await pool.execute(
      `INSERT IGNORE INTO ai_showcase_tracks (id, name_th, name_en) VALUES (?, ?, ?)`,
      [tid, info.name_th, info.name_en]
    );
  }

  const stats = { inserted: 0, updated: 0, errors: 0, members_added: 0 };
  for (const project of projects) {
    try {
      const [existing] = await pool.execute(
        `SELECT id FROM ai_showcase_projects WHERE group_code = ? AND published_year = ? LIMIT 1`,
        [project.group_code, project.published_year]
      );

      let projectId;
      if (existing.length > 0) {
        projectId = existing[0].id;
        await pool.execute(
          `UPDATE ai_showcase_projects SET title_th = ?, title_en = ?, abstract = ?, description = ?,
            project_type = ?, track_id = ?, ai_showcase_link = ? WHERE id = ?`,
          [project.title_th, project.title_en, project.abstract, project.description,
           project.project_type, project.track_id, project.ai_showcase_link, projectId]
        );
        stats.updated++;
      } else {
        const [result] = await pool.execute(
          `INSERT INTO ai_showcase_projects (title_th, title_en, abstract, description, project_type, group_code, published_year, track_id, ai_showcase_link, poster_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [project.title_th, project.title_en, project.abstract, project.description,
           project.project_type, project.group_code, project.published_year,
           project.track_id, project.ai_showcase_link, project.poster_url]
        );
        projectId = result.insertId;
        stats.inserted++;
      }

      await pool.execute(`DELETE FROM ai_showcase_project_members WHERE project_id = ?`, [projectId]);
      for (const member of project.members) {
        if (!member.name && !member.student_id) continue;
        await pool.execute(
          `INSERT INTO ai_showcase_project_members (project_id, student_id, name) VALUES (?, ?, ?)`,
          [projectId, member.student_id, member.name]
        );
        stats.members_added++;
      }
    } catch (err) {
      console.error(`  Error syncing "${project.title_th}": ${err.message}`);
      stats.errors++;
    }
  }

  console.log(`\n  Results: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.errors} errors`);
  console.log(`  Members added: ${stats.members_added}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
