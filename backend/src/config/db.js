const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add SSL support for cloud databases (Aiven, Azure, etc.)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Server');

    // Ensure the database exists (Skip if permission denied)
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      console.log(`✅ Database "${process.env.DB_NAME}" checked/created`);
    } catch (e) {
      console.warn(`⚠️ Could not create database "${process.env.DB_NAME}" (checking if it exists)...`, e.message);
    }

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 TIP: Please check your DB_PASSWORD in the .env file.');
    }
  }
};

module.exports = { pool, testConnection };
