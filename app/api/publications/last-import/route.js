import { NextResponse } from 'next/server';
import pool from '../../../lib/db-connection';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `(SELECT 'Scopus' AS source, finished_at FROM scopus_batch_import_runs WHERE status = 'success' ORDER BY finished_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'TCI-ThaiJO' AS source, finished_at FROM thaijo_batch_import_runs WHERE status = 'success' ORDER BY finished_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'AI Showcase' AS source, MAX(updated_at) AS finished_at FROM ai_showcase_projects)`
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ data: [] });
  }
}
