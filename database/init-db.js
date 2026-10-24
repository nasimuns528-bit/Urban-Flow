import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('----------------------------------------------------');
  console.log('🌊 UrbanFlow: Initialising MySQL 8.x Database System');
  console.log('----------------------------------------------------');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL Server at ${config.host}:${config.port} as user '${config.user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server successfully.');

    // 1. Create database if not exists
    const dbName = process.env.DB_NAME || 'urbanflow_db';
    console.log(`Verifying / creating database: ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: dbName });
    console.log(`Switched to database: ${dbName}`);

    // 2. Read and apply schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Applying schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Tables, foreign keys, and indexes created successfully.');

    // 3. Read and apply seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    console.log(`Seeding initial data from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('✅ Wards, users, realistic flood incidents, and tasks seeded successfully.');

    console.log('----------------------------------------------------');
    console.log('✨ UrbanFlow MySQL 8.x database ready for operation!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Database initialisation error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ Could not connect to MySQL Server.');
      console.error('Please ensure MySQL 8.x is running on your machine (e.g. via MySQL Service, XAMPP, or Docker).');
      console.error(`Check settings in your .env file (Host: ${config.host}, Port: ${config.port}, User: ${config.user}).\n`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️ Access denied for MySQL user.');
      console.error('Please verify DB_USER and DB_PASSWORD in your .env file.\n');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
