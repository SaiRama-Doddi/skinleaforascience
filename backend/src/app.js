const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow single page app inline styles/assets
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images statically
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api', apiRoutes);

// Function to locate a valid static build directory containing index.html across all possible deployment structures
const getFrontendBuildDir = () => {
  const candidateDirs = [
    // 1. Check root directory (Root public_html on Hostinger)
    path.join(__dirname, '../../'),
    process.cwd(),
    path.resolve('.'),

    // 2. Check backend/public (Committed to Git repo for GitHub Hostinger deployment)
    path.join(__dirname, '../public'),
    path.join(process.cwd(), 'backend/public'),

    // 3. Check root dist (Committed to Git repo for GitHub Hostinger deployment)
    path.join(__dirname, '../../dist'),
    path.join(process.cwd(), 'dist'),
    path.resolve('dist'),

    // 4. Check other candidate dirs
    path.join(__dirname, '../../build'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../dist'),
    path.join(process.cwd(), 'build'),
    path.join(process.cwd(), 'frontend/dist'),
    path.resolve('build'),
    path.resolve('public'),
  ];

  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(path.join(dir, 'index.html'))) {
        return path.resolve(dir);
      }
    } catch (e) {}
  }

  return path.resolve(path.join(__dirname, '../public'));
};

// Serve static frontend build assets from all candidate folders
const candidateDirs = [
  path.join(__dirname, '../../'),
  process.cwd(),
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'backend/public'),
  path.join(__dirname, '../../dist'),
  path.join(process.cwd(), 'dist'),
  path.resolve('dist'),
  path.join(__dirname, '../../build'),
  path.join(__dirname, '../../frontend/dist'),
  path.join(process.cwd(), 'build'),
  path.join(process.cwd(), 'frontend/dist'),
];

candidateDirs.forEach((dir) => {
  try {
    if (fs.existsSync(dir)) {
      app.use(express.static(dir));
    }
  } catch (e) {}
});

// Fallback for React Single Page Application (SPA) routing
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  const activeBuildDir = getFrontendBuildDir();
  const indexPath = path.join(activeBuildDir, 'index.html');

  const fallbackPaths = [
    indexPath,
    path.join(__dirname, '../public/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(__dirname, '../../index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), 'dist/index.html'),
    path.join(process.cwd(), 'backend/public/index.html'),
  ];

  for (const file of fallbackPaths) {
    if (fs.existsSync(file)) {
      return res.sendFile(path.resolve(file), (err) => {
        if (err && !res.headersSent) {
          for (const bp of fallbackPaths) {
            if (fs.existsSync(bp)) {
              return res.sendFile(path.resolve(bp));
            }
          }
          res.status(500).send('Error loading Leafora application.');
        }
      });
    }
  }

  return res.status(404).json({
    message: 'Welcome to Leafora Life Science API Server',
    status: 'Frontend index.html build file not found',
    documentation: '/api/health',
  });
});

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
