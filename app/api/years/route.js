import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// สร้าง connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '147.50.230.213',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_DATABASE || 'fund_cpkku',
  user: process.env.DB_USERNAME || 'devuser',
  password: process.env.DB_PASSWORD || 'devpw',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET() {
  try {
    const [years] = await pool.execute(`
      SELECT 
        year_id, 
        year, 
        budget,
        status
      FROM years
      WHERE status = 'active' 
        AND (delete_at IS NULL OR delete_at = '')
      ORDER BY year DESC
    `);

    // Transform data to match frontend expectations
    const yearsData = years.map(y => ({
      year_id: y.year_id,
      year: y.year,
      budget: parseFloat(y.budget) || 0,
      status: y.status
    }));

    // Return array of years for compatibility with frontend
    const yearsList = yearsData.map(y => y.year);

    return NextResponse.json({
      success: true,
      data: yearsList,
      fullData: yearsData // ส่งข้อมูลเต็มด้วยเผื่อต้องการใช้
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch years: ' + error.message },
      { status: 500 }
    );
  }
}