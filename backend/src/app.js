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
    // Relative to __dirname (backend/src)
    path.join(__dirname, '../../build'),
    path.join(__dirname, '../../dist'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../build'),
    path.join(__dirname, '../dist'),
    path.join(__dirname, '../public'),
    path.join(__dirname, '../'),

    // Relative to process.cwd()
    path.join(process.cwd(), 'build'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'frontend/dist'),
    path.join(process.cwd(), 'backend/build'),
    path.join(process.cwd(), 'backend/dist'),
    path.join(process.cwd(), 'backend/public'),
    path.join(process.cwd(), 'public'),
    process.cwd(),

    // Absolute resolves
    path.resolve('build'),
    path.resolve('dist'),
    path.resolve('frontend/dist'),
    path.resolve('public'),
  ];

  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(path.join(dir, 'index.html'))) {
        return path.resolve(dir);
      }
    } catch (e) {}
  }

  return path.resolve(path.join(__dirname, '../../frontend/dist'));
};

// Serve static frontend build assets from all candidate folders
const candidateDirs = [
  path.join(__dirname, '../../build'),
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../build'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'build'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(process.cwd(), 'backend/dist'),
  path.join(process.cwd(), 'backend/public'),
  path.resolve('dist'),
  path.resolve('build'),
  path.resolve('frontend/dist'),
];

candidateDirs.forEach((dir) => {
  try {
    if (fs.existsSync(dir)) {
      app.use(express.static(dir));
    }
  } catch (e) {}
});

// Fallback for React Single Page Application (SPA) routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  const activeBuildDir = getFrontendBuildDir();
  const indexPath = path.join(activeBuildDir, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        // Fallback send if primary sendFile encountered an issue
        const candidateFallback = path.resolve('dist/index.html');
        if (fs.existsSync(candidateFallback)) {
          return res.sendFile(candidateFallback);
        }
        res.status(500).send('Error loading Leafora application.');
      }
    });
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
