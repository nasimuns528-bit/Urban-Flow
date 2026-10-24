import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for MySQL 8.x
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urbanflow_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Quick connection health check
export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result, VERSION() AS mysql_version');
    console.log(`🐬 MySQL 8 Connection Active. Version: ${rows[0].mysql_version}`);
    return true;
  } catch (error) {
    console.error('⚠️ MySQL Connection Error:', error.message);
    console.error('👉 Make sure MySQL 8.x is running and execute "npm run db:init" to setup the database.');
    return false;
  }
}

export default pool;
