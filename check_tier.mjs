import mysql from 'mysql2/promise';
const pool = mysql.createPool({
  host: '147.50.227.17', port: 3306, user: 'drnadech_interndev',
  password: 'c%hFq8vfDL8#c1gk', database: 'drnadech_fund_cpkku_intern',
  charset: 'utf8mb4'
});

const [rows] = await pool.execute(`SELECT * FROM thaijo_journals`);
console.log('=== All thaijo_journals rows ===');
rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
console.log('Total:', rows.length);

await pool.end();
