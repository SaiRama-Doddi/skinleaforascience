const app = require('./app');
const { testConnection } = require('./config/db');
const { initDb } = require('./config/initDb');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt DB connection test & initialize tables
    const dbConnected = await testConnection();
    if (dbConnected) {
      await initDb();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Leafora API Server listening on http://localhost:${PORT}`);
      console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
};

startServer();
