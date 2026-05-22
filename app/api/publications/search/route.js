import { NextResponse } from 'next/server';
import pool from '../../../lib/db-connection';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const tab = searchParams.get('tab') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  const sources = searchParams.getAll('source');
  const yearStart = searchParams.get('year_start');
  const yearEnd = searchParams.get('year_end');
  
  const quartiles = searchParams.getAll('quartile');
  const aggTypes = searchParams.getAll('agg_type');
  const tciTiers = searchParams.getAll('tier');
  const projectTypes = searchParams.getAll('project_type');
  const tracks = searchParams.getAll('track'); // คณะ
  const sort = searchParams.get('sort') || 'published_at';
  const order = searchParams.get('order') || 'DESC';
  const searchField = searchParams.get('search_field') || 'all';
  const titleQuery = searchParams.get('title_query') || '';
  const authorQuery = searchParams.get('author_query') || '';
  const keywordsQuery = searchParams.get('keywords_query') || '';
  const abstractQuery = searchParams.get('abstract_query') || '';

  const conditions = [];
  const params = [];

  if (q) {
    const fieldConditions = {
      title: ['c.title LIKE ?'],
      abstract: ['c.abstract LIKE ?'],
      keywords: ['c.keywords LIKE ?'],
      author: [`c.id IN (
        SELECT unified_publication_id FROM unified_search_authors WHERE name LIKE ?
        UNION
        SELECT CONCAT('scopus_', sda.document_id)
        FROM scopus_document_authors sda
        JOIN scopus_authors sa ON sa.id = sda.author_id
        WHERE sa.given_name LIKE ? OR sa.surname LIKE ? OR CONCAT(sa.given_name, ' ', sa.surname) LIKE ?
      )`],
    };
    const allFields = [
      'c.title LIKE ?',
      'c.abstract LIKE ?',
      'c.keywords LIKE ?',
      `c.id IN (
        SELECT unified_publication_id FROM unified_search_authors WHERE name LIKE ?
        UNION
        SELECT CONCAT('scopus_', sda.document_id)
        FROM scopus_document_authors sda
        JOIN scopus_authors sa ON sa.id = sda.author_id
        WHERE sa.given_name LIKE ? OR sa.surname LIKE ? OR CONCAT(sa.given_name, ' ', sa.surname) LIKE ?
      )`
    ];
    const selected = fieldConditions[searchField] || allFields;
    conditions.push(`(${selected.join(' OR ')})`);
    selected.forEach(cond => {
      const qCount = (cond.match(/\?/g) || []).length;
      for (let i = 0; i < qCount; i++) params.push(`%${q}%`);
    });
  }

  if (titleQuery) { conditions.push('c.title LIKE ?'); params.push(`%${titleQuery}%`); }
  if (authorQuery) {
    conditions.push(`c.id IN (
      SELECT unified_publication_id FROM unified_search_authors WHERE name LIKE ?
      UNION
      SELECT CONCAT('scopus_', sda.document_id)
      FROM scopus_document_authors sda
      JOIN scopus_authors sa ON sa.id = sda.author_id
      WHERE sa.given_name LIKE ? OR sa.surname LIKE ? OR CONCAT(sa.given_name, ' ', sa.surname) LIKE ?
    )`);
    const like = `%${authorQuery}%`;
    params.push(like, like, like, like);
  }
  if (keywordsQuery) { conditions.push('c.keywords LIKE ?'); params.push(`%${keywordsQuery}%`); }
  if (abstractQuery) { conditions.push('c.abstract LIKE ?'); params.push(`%${abstractQuery}%`); }

  if (tab === 'teacher') conditions.push(`c.publication_type = 'faculty'`);
  if (tab === 'student') conditions.push(`c.publication_type = 'student'`);

  if (sources.length > 0) {
    conditions.push(`c.source_name IN (${sources.map(() => '?').join(',')})`);
    params.push(...sources);
  }

  if (yearStart || yearEnd) {
    const start = yearStart ? Number(yearStart) : 1900;
    const end = yearEnd ? Number(yearEnd) : new Date().getFullYear();
    conditions.push(`c.publication_year BETWEEN ? AND ?`);
    params.push(start, end);
  }

  const filterBlocks = [];

  // Build Scopus block: (aggTypes AND quartiles) if both present, or just one if only one present
  const scopusParts = [];
  if (aggTypes.length > 0) {
    scopusParts.push(`c.detail_type IN (${aggTypes.map(() => '?').join(',')})`);
    params.push(...aggTypes);
  }
  if (quartiles.length > 0) {
    const hasNA = quartiles.includes('N/A');
    const validQ = quartiles.filter(q => q !== 'N/A');

    const qConditions = [];
    if (validQ.length > 0) {
      qConditions.push(`c.journal_quartile IN (${validQ.map(() => '?').join(',')})`);
      params.push(...validQ);
    }
    if (hasNA) {
      qConditions.push(`(c.journal_quartile IS NULL OR c.journal_quartile = '')`);
    }

    if (qConditions.length > 0) {
      scopusParts.push(`(${qConditions.join(' OR ')})`);
    }
  }
  if (scopusParts.length > 0) {
    filterBlocks.push(`(${scopusParts.join(' AND ')})`);
  }

  // TCI Tiers block
  if (tciTiers.length > 0) {
    const hasNotIn = tciTiers.includes('not_in_tci');
    const validTiers = tciTiers.filter(t => t !== 'not_in_tci');

    const tierConditions = [];
    if (validTiers.length > 0) {
      tierConditions.push(`c.journal_tier IN (${validTiers.map(() => '?').join(',')})`);
      params.push(...validTiers.map(Number)); 
    }
    if (hasNotIn) {
      tierConditions.push(`c.journal_tier IS NULL`);
    }

    if (tierConditions.length > 0) {
      filterBlocks.push(`(${tierConditions.join(' OR ')})`);
    }
  }

  // Combine all filter blocks with OR
  if (filterBlocks.length > 0) {
    conditions.push(`(${filterBlocks.join(' OR ')})`);
  }

  if (projectTypes.length > 0) {
    conditions.push(`c.detail_type IN (${projectTypes.map(() => '?').join(',')})`);
    params.push(...projectTypes);
  }

  if (tracks.length > 0) {
    conditions.push(`c.track_id IN (${tracks.map(() => '?').join(',')})`);
    params.push(...tracks);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countSql = `SELECT COUNT(*) as total FROM unified_search_contents c ${whereClause}`;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    const yearConditions = [];
    if (tab === 'teacher') yearConditions.push(`publication_type = 'faculty'`);
    if (tab === 'student') yearConditions.push(`publication_type = 'student'`);
    const yearWhere = yearConditions.length > 0 ? `WHERE ${yearConditions.join(' AND ')}` : '';
    const [yearStats] = await pool.execute(
      `SELECT MIN(publication_year) as min_year, MAX(publication_year) as max_year FROM unified_search_contents ${yearWhere}`
    );

    const TRACK_ORDER = `CASE c.track_id WHEN 'ag' THEN 1 WHEN 'cola' THEN 2 WHEN 'cp' THEN 3 WHEN 'kkbs' THEN 4 WHEN 'md' THEN 5 ELSE 99 END`;
    const SORTABLE = { published_at: 'c.published_at', publication_year: 'c.publication_year', cited_by: 'c.cited_by', journal_quartile: 'c.journal_quartile', group_code: 'c.group_code', track_id: `CASE c.track_id WHEN 'ag' THEN 'คณะเกษตรศาสตร์' WHEN 'cola' THEN 'วิทยาลัยการปกครองท้องถิ่น' WHEN 'cp' THEN 'วิทยาลัยการคอมพิวเตอร์' WHEN 'kkbs' THEN 'คณะบริหารธุรกิจและการบัญชี' WHEN 'md' THEN 'คณะแพทยศาสตร์' ELSE c.track_id END` };
    let sortCol = SORTABLE[sort] || 'c.published_at';
    const sortDir = order === 'ASC' ? 'ASC' : 'DESC';
    let orderSql = `${sortCol} ${sortDir}`;
    if (sort === 'published_at' && sortDir === 'DESC') {
      orderSql = `${TRACK_ORDER} ASC, c.published_at DESC`;
    }
    const dataSql = `SELECT c.* FROM unified_search_contents c ${whereClause} ORDER BY ${orderSql} LIMIT ? OFFSET ?`;
    const [rows] = await pool.execute(dataSql, [...params, limit, offset]);

    const ids = rows.map(r => r.id);
    let authors = [];
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const [authorRows] = await pool.execute(
        `SELECT unified_publication_id, name, role FROM unified_search_authors WHERE unified_publication_id IN (${placeholders}) ORDER BY author_seq ASC`,
        ids
      );
      authors = authorRows;
    }

    const results = rows.map(row => ({
      ...row,
      authors: authors.filter(a => a.unified_publication_id === row.id && a.role !== 'advisor').map(a => a.name),
      advisors: authors.filter(a => a.unified_publication_id === row.id && a.role === 'advisor').map(a => a.name),
    }));

    return NextResponse.json({ success: true, data: results, total, page, limit, min_year: yearStats[0].min_year, max_year: yearStats[0].max_year });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}