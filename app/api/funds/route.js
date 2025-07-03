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

// api/funds/route.js
// GET /api/funds
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2568';

    // Query หา year_id จาก year
    const [yearResult] = await pool.execute(
      'SELECT year_id FROM years WHERE year = ? AND delete_at IS NULL',
      [year]
    );

    if (yearResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Year not found'
      }, { status: 404 });
    }

    const yearId = yearResult[0].year_id;

    // Query ข้อมูลทุน
    const [categories] = await pool.execute(`
      SELECT 
        fc.category_id,
        fc.category_name,
        fc.status as category_status,
        fc.year_id,
        y.year
      FROM fund_categories fc
      JOIN years y ON fc.year_id = y.year_id
      WHERE fc.year_id = ? AND fc.delete_at IS NULL
      ORDER BY fc.category_id
    `, [yearId]);

    // Query subcategories พร้อม budget
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const [subcategories] = await pool.execute(`
          SELECT 
            fs.subcategorie_id,
            fs.subcategorie_name,
            fs.status,
            fs.fund_condition,
            sb.subcategorie_budget_id,
            sb.allocated_amount,
            sb.used_amount,
            sb.remaining_budget,
            sb.max_grants,
            sb.max_amount_per_grant,
            sb.remaining_grant,
            sb.level,
            sb.fund_description,
            sb.comment
          FROM fund_subcategorie fs
          LEFT JOIN subcategorie_budgets sb ON fs.subcategorie_id = sb.subcategorie_id
          WHERE fs.category_id = ? 
            AND fs.year_id = ?
            AND fs.delete_at IS NULL 
            AND (sb.delete_at IS NULL OR sb.delete_at IS NULL)
            AND fs.status = 'active'
            AND (sb.status = 'active' OR sb.status IS NULL)
          ORDER BY fs.subcategorie_id, 
            CASE 
              WHEN sb.level = 'ต้น' THEN 1
              WHEN sb.level = 'กลาง' THEN 2
              WHEN sb.level = 'สูง' THEN 3
              ELSE 4
            END
        `, [category.category_id, yearId]);

        // Group subcategories by ID to handle multiple levels
        const subcategoryMap = new Map();
        
        subcategories.forEach(sub => {
          // สำหรับทุนอุดหนุนกิจกรรม (category_id = 2) - แต่ละ budget row คือ 1 ทุนย่อย
          if (category.category_id === 2 && sub.subcategorie_budget_id) {
            // สร้าง unique ID สำหรับแต่ละ budget entry
            const uniqueId = `${sub.subcategorie_id}_budget_${sub.subcategorie_budget_id}`;
            
            // ใช้ fund_description หรือ comment เป็นชื่อทุนย่อย
            let subName = sub.subcategorie_name;
            if (sub.fund_description) {
              subName = `${sub.subcategorie_name} - ${sub.fund_description}`;
            } else if (sub.comment) {
              // ถ้ามี comment ที่ระบุรายละเอียด ให้ใช้เป็นส่วนหนึ่งของชื่อ
              const shortComment = sub.comment.length > 50 
                ? sub.comment.substring(0, 50) + '...' 
                : sub.comment;
              subName = `${sub.subcategorie_name} - ${shortComment}`;
            }
            
            subcategoryMap.set(uniqueId, {
              subcategorie_id: uniqueId,
              original_subcategorie_id: sub.subcategorie_id,
              subcategorie_name: subName,
              allocated_amount: parseFloat(sub.allocated_amount) || 0,
              used_amount: parseFloat(sub.used_amount) || 0,
              remaining_budget: parseFloat(sub.remaining_budget) || 0,
              max_grants: sub.max_grants === null ? null : (sub.max_grants || 0),
              max_amount_per_grant: parseFloat(sub.max_amount_per_grant) || 0,
              remaining_grant: sub.remaining_grant === null ? null : (sub.remaining_grant || 0),
              status: sub.status,
              fund_condition: sub.fund_condition,
              level: sub.level,
              fund_description: sub.fund_description,
              comment: sub.comment,
              subcategorie_budget_id: sub.subcategorie_budget_id,
              is_unlimited_grants: sub.max_grants === null
            });
          } else if (sub.level) {
            // กรณีมีระดับ (ต้น, กลาง, สูง) - สร้างเป็น entry แยก
            const uniqueId = `${sub.subcategorie_id}_${sub.level}`;
            const displayName = `${sub.subcategorie_name} (ระดับ${sub.level})`;
            
            subcategoryMap.set(uniqueId, {
              subcategorie_id: uniqueId,
              original_subcategorie_id: sub.subcategorie_id,
              subcategorie_name: displayName,
              allocated_amount: parseFloat(sub.allocated_amount) || 0,
              used_amount: parseFloat(sub.used_amount) || 0,
              remaining_budget: parseFloat(sub.remaining_budget) || 0,
              max_grants: sub.max_grants === null ? null : (sub.max_grants || 0),
              max_amount_per_grant: parseFloat(sub.max_amount_per_grant) || 0,
              remaining_grant: sub.remaining_grant === null ? null : (sub.remaining_grant || 0),
              status: sub.status,
              fund_condition: sub.fund_condition,
              level: sub.level,
              fund_description: sub.fund_description,
              comment: sub.comment,
              subcategorie_budget_id: sub.subcategorie_budget_id,
              is_unlimited_grants: sub.max_grants === null
            });
          } else {
            // กรณีไม่มีระดับ - ใช้ข้อมูลปกติ
            const key = sub.subcategorie_id.toString();
            if (!subcategoryMap.has(key)) {
              subcategoryMap.set(key, {
                subcategorie_id: sub.subcategorie_id,
                subcategorie_name: sub.subcategorie_name,
                allocated_amount: parseFloat(sub.allocated_amount) || 0,
                used_amount: parseFloat(sub.used_amount) || 0,
                remaining_budget: parseFloat(sub.remaining_budget) || 0,
                max_grants: sub.max_grants === null ? null : (sub.max_grants || 0),
                max_amount_per_grant: parseFloat(sub.max_amount_per_grant) || 0,
                remaining_grant: sub.remaining_grant === null ? null : (sub.remaining_grant || 0),
                status: sub.status,
                fund_condition: sub.fund_condition,
                level: sub.level,
                fund_description: sub.fund_description,
                comment: sub.comment,
                subcategorie_budget_id: sub.subcategorie_budget_id,
                is_unlimited_grants: sub.max_grants === null
              });
            }
          }
        });

        const transformedSubcategories = Array.from(subcategoryMap.values());

        return {
          category_id: category.category_id,
          category_name: category.category_name,
          year: category.year,
          subcategories: transformedSubcategories
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithSubs
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funds: ' + error.message },
      { status: 500 }
    );
  }
}