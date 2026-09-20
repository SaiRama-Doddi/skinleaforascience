const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leafora_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  connectTimeout: 3000,
  queueLimit: 0,
});

// Helper function to test DB connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️  MySQL Database connection failed:', error.message);
    console.warn('💡 Tip: Ensure MySQL service is running and credentials in .env are correct.');
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
