const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Hostinger runs Node behind one reverse proxy; trust it so req.ip is the real
// client IP (required for per-IP rate limiting).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

// Middleware
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow single page app inline styles/assets
  })
);

// CORS: only explicitly configured origins (comma-separated CLIENT_URL).
// The SPA is served from the same origin, so it needs no CORS at all.
const allowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Large bodies (base64 images, CSV imports) are only accepted on authenticated admin routes.
const largeJson = express.json({ limit: '25mb' });
const smallJson = express.json({ limit: '1mb' });
const largeForm = express.urlencoded({ extended: true, limit: '25mb' });
const smallForm = express.urlencoded({ extended: true, limit: '1mb' });
app.use((req, res, next) => {
  const isAdmin = req.path.startsWith('/api/admin');
  (isAdmin ? largeJson : smallJson)(req, res, (err) => {
    if (err) return next(err);
    (isAdmin ? largeForm : smallForm)(req, res, next);
  });
});

// Uploaded media is user content: forbid it from running scripts if opened directly.
app.use(['/uploads', '/api/media'], (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Static file caching options for high performance asset loading
const staticCacheOptions = {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff2)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
};

// Serve uploaded images statically with caching
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, staticCacheOptions));

// Dynamic Media & Uploads Handler - Serves from Disk OR MySQL Database
app.get(['/uploads/:filename', '/api/media/:filename'], async (req, res, next) => {
  const filename = req.params.filename;
  // Params are URL-decoded, so "..%2F..%2F.env" would otherwise escape the uploads dir
  if (!filename || filename !== path.basename(filename) || !/^[\w.\-]+$/.test(filename) || filename.startsWith('.')) {
    return next();
  }

  // 1. Check physical disk locations
  const diskCandidates = [
    path.join(__dirname, '../public/uploads', filename),
    path.join(__dirname, '../../public/uploads', filename),
    path.join(__dirname, '../../dist/uploads', filename),
    path.join(process.cwd(), 'public/uploads', filename),
    path.join(process.cwd(), 'uploads', filename)
  ];

  for (const diskPath of diskCandidates) {
    try {
      if (fs.existsSync(diskPath)) {
        return res.sendFile(path.resolve(diskPath));
      }
    } catch (_) {}
  }

  // 2. Fetch from MySQL media_storage table
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query(
      'SELECT mime_type, data_base64 FROM media_storage WHERE filename = ? LIMIT 1',
      [filename]
    );
    if (rows && rows[0]) {
      const mimeType = rows[0].mime_type || 'image/jpeg';
      let base64Data = rows[0].data_base64;
      if (base64Data.includes(';base64,')) {
        base64Data = base64Data.split(';base64,')[1];
      }
      const imgBuffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(imgBuffer);
    }
  } catch (dbErr) {
    console.error('Media DB fetch notice:', dbErr.message);
  }

  return next();
});

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

// The repo root holds a copy of index.html + assets/ for Hostinger, but it also holds
// all source code. Only expose its assets/ folder, never the root itself.
const rootDirs = [...new Set([path.resolve(__dirname, '../../'), path.resolve(process.cwd())])];
rootDirs.forEach((dir) => {
  const assetsDir = path.join(dir, 'assets');
  if (fs.existsSync(assetsDir)) {
    app.use('/assets', express.static(assetsDir, staticCacheOptions));
  }
});

// Serve static frontend build folders (these contain only build output)
const candidateDirs = [
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
      app.use(express.static(dir, staticCacheOptions));
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
