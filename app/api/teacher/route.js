// app/api/teacher/route.js
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

// Helper function to get user role from JWT token
function getUserRoleFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    // In a real app, you'd verify the JWT token here
    // For now, we'll extract role from the token payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role_id || null;
  } catch (error) {
    console.error('Error extracting role from token:', error);
    return null;
  }
}

// GET /api/teacher - Get funds visible to teacher role
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2568';
    const roleId = getUserRoleFromRequest(request);

    // Validate role (this should be called by authenticated teachers)
    if (!roleId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get year_id from year
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

    // Query categories
    const [categories] = await pool.execute(`
      SELECT 
        fc.category_id,
        fc.category_name,
        fc.status as category_status,
        fc.year_id,
        y.year
      FROM fund_categories fc
      JOIN years y ON fc.year_id = y.year_id
      WHERE fc.year_id = ? AND fc.delete_at IS NULL AND fc.status = 'active'
      ORDER BY fc.category_id
    `, [yearId]);

    // Query subcategories with role-based filtering
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const [subcategories] = await pool.execute(`
          SELECT 
            fs.subcategorie_id,
            fs.subcategorie_name,
            fs.status,
            fs.fund_condition,
            fs.target_roles,
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
            AND fs.status = 'active'
            AND (sb.delete_at IS NULL OR sb.delete_at IS NULL)
            AND (sb.status = 'active' OR sb.status IS NULL)
            AND (
              fs.target_roles IS NULL 
              OR JSON_CONTAINS(fs.target_roles, ?)
              OR ? = 3
            )
          ORDER BY fs.subcategorie_id, 
            CASE 
              WHEN sb.level = 'ต้น' THEN 1
              WHEN sb.level = 'กลาง' THEN 2
              WHEN sb.level = 'สูง' THEN 3
              ELSE 4
            END
        `, [category.category_id, yearId, JSON.stringify(roleId.toString()), roleId]);

        // Group subcategories by ID to handle multiple levels
        const subcategoryMap = new Map();
        
        subcategories.forEach(sub => {
          // Parse target_roles to check visibility
          let isVisible = true;
          if (sub.target_roles) {
            try {
              const targetRoles = JSON.parse(sub.target_roles);
              // Admin (role_id = 3) sees everything
              if (roleId !== 3) {
                isVisible = targetRoles.includes(roleId.toString());
              }
            } catch (error) {
              console.error('Error parsing target_roles:', error);
              isVisible = true; // Default to visible if parsing fails
            }
          }

          if (!isVisible) {
            return; // Skip this subcategory if not visible to current role
          }

          // Handle different subcategory types like in the original funds API
          if (category.category_id === 2 && sub.subcategorie_budget_id) {
            // สำหรับทุนอุดหนุนกิจกรรม - แต่ละ budget row คือ 1 ทุนย่อย
            const uniqueId = `${sub.subcategorie_id}_budget_${sub.subcategorie_budget_id}`;
            
            let subName = sub.subcategorie_name;
            if (sub.fund_description) {
              subName = `${sub.subcategorie_name} - ${sub.fund_description}`;
            } else if (sub.comment) {
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
              is_unlimited_grants: sub.max_grants === null,
              target_roles: sub.target_roles,
              visible_to_role: roleId
            });
          } else if (sub.level) {
            // กรณีมีระดับ (ต้น, กลาง, สูง)
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
              is_unlimited_grants: sub.max_grants === null,
              target_roles: sub.target_roles,
              visible_to_role: roleId
            });
          } else {
            // กรณีไม่มีระดับ
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
                is_unlimited_grants: sub.max_grants === null,
                target_roles: sub.target_roles,
                visible_to_role: roleId
              });
            }
          }
        });

        const transformedSubcategories = Array.from(subcategoryMap.values());

        // Only return category if it has visible subcategories
        if (transformedSubcategories.length > 0) {
          return {
            category_id: category.category_id,
            category_name: category.category_name,
            year: category.year,
            subcategories: transformedSubcategories
          };
        }
        return null;
      })
    );

    // Filter out null categories (those with no visible subcategories)
    const filteredCategories = categoriesWithSubs.filter(cat => cat !== null);

    return NextResponse.json({
      success: true,
      data: filteredCategories,
      role_id: roleId,
      message: `Funds visible to role ${roleId}`
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funds: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/teacher - Create new fund subcategory (admin only)
export async function POST(request) {
  try {
    const roleId = getUserRoleFromRequest(request);
    
    // Only admin can create
    if (roleId !== 3) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      category_id,
      subcategorie_name,
      year_id,
      fund_condition,
      target_roles, // Array of role IDs that can see this fund
      comment
    } = body;

    // Validate required fields
    if (!category_id || !subcategorie_name || !year_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: category_id, subcategorie_name, year_id'
      }, { status: 400 });
    }

    // Validate target_roles format
    if (target_roles && (!Array.isArray(target_roles) || !target_roles.every(role => typeof role === 'string' || typeof role === 'number'))) {
      return NextResponse.json({
        success: false,
        error: 'target_roles must be an array of role IDs'
      }, { status: 400 });
    }

    // Convert target_roles to JSON string
    const targetRolesJson = target_roles ? JSON.stringify(target_roles.map(role => role.toString())) : null;

    // Insert new subcategory
    const [result] = await pool.execute(`
      INSERT INTO fund_subcategorie (
        category_id, subcategorie_name, year_id, fund_condition, 
        target_roles, comment, status, create_at, update_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `, [category_id, subcategorie_name, year_id, fund_condition, targetRolesJson, comment]);

    return NextResponse.json({
      success: true,
      message: 'Fund subcategory created successfully',
      subcategorie_id: result.insertId
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fund subcategory: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/[id] - Update fund subcategory target_roles (admin only)
export async function PUT(request) {
  try {
    const roleId = getUserRoleFromRequest(request);
    
    // Only admin can update
    if (roleId !== 3) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const subcategoryId = pathParts[pathParts.length - 1];

    if (!subcategoryId) {
      return NextResponse.json({
        success: false,
        error: 'Subcategory ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const { target_roles } = body;

    // Validate target_roles format
    if (target_roles && (!Array.isArray(target_roles) || !target_roles.every(role => typeof role === 'string' || typeof role === 'number'))) {
      return NextResponse.json({
        success: false,
        error: 'target_roles must be an array of role IDs'
      }, { status: 400 });
    }

    // Convert target_roles to JSON string
    const targetRolesJson = target_roles ? JSON.stringify(target_roles.map(role => role.toString())) : null;

    // Update subcategory
    const [result] = await pool.execute(`
      UPDATE fund_subcategorie 
      SET target_roles = ?, update_at = NOW()
      WHERE subcategorie_id = ? AND delete_at IS NULL
    `, [targetRolesJson, subcategoryId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Fund subcategory not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Fund subcategory updated successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fund subcategory: ' + error.message },
      { status: 500 }
    );
  }
}