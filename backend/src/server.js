const app = require('./app');
const { testConnection } = require('./config/db');
const { initDb } = require('./config/initDb');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Start Express server immediately so application never returns 503
  const server = app.listen(PORT, () => {
    console.log(`🚀 Leafora API Server listening on http://localhost:${PORT}`);
    console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    console.error('❌ Express server error:', err.message);
  });

  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      try {
        await initDb();
      } catch (initErr) {
        console.warn('⚠️ Non-fatal error during DB table initialization:', initErr.message);
      }
    }
  } catch (error) {
    console.error('⚠️ Non-fatal error during DB connection test:', error.message);
  }
};

startServer();
