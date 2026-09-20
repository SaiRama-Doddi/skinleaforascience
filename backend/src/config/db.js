const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Auto-detect and normalize Hostinger DB host.
// Hostinger hPanel sets DB_HOST="srv1473.hstgr.io" in Environment Variables.
// However, Node.js running on Hostinger must connect via local loopback "127.0.0.1" or "localhost".
let rawHost = (process.env.DB_HOST || '127.0.0.1').trim();
if (rawHost === 'srv1473.hstgr.io' || rawHost.includes('hstgr.io')) {
  rawHost = '127.0.0.1';
}

// Create connection pool for MySQL
const pool = mysql.createPool({
  host: rawHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leafora_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  connectTimeout: 1500,
  queueLimit: 0,
});

// Helper function to test DB connection with a strict 1.2s timeout
const testConnection = async () => {
  try {
    const connPromise = pool.getConnection().then((conn) => {
      conn.release();
      return true;
    });
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(false), 1200)
    );

    const isConnected = await Promise.race([connPromise, timeoutPromise]);
    if (isConnected) {
      console.log('✅ MySQL Database connected successfully.');
    } else {
      console.warn('⚠️  MySQL Database connection check timed out (using fast fallback).');
    }
    return Boolean(isConnected);
  } catch (error) {
    console.warn('⚠️  MySQL Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
