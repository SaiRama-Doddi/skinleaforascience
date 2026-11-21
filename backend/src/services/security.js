const crypto = require('crypto');
const { pool } = require('../config/db');

// ─── PASSWORD HASHING (scrypt, per-user salt) ───
// Stored format: scrypt$<saltHex>$<hashHex>
// Legacy accounts use sha256(password + static salt); they are verified once and
// upgraded to scrypt transparently on the next successful login.

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const LEGACY_SALT = 'LEAFORA_SALT_2026';

const scryptAsync = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS, (err, key) => (err ? reject(err) : resolve(key)));
  });

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(String(password), salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
};

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const isLegacyHash = (stored) => typeof stored === 'string' && !stored.startsWith('scrypt$');

const verifyPassword = async (password, stored) => {
  if (!stored || typeof stored !== 'string') return false;

  if (stored.startsWith('scrypt$')) {
    const [, saltHex, hashHex] = stored.split('$');
    if (!saltHex || !hashHex) return false;
    const key = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'));
    return safeEqual(key.toString('hex'), hashHex);
  }

  const legacy = crypto.createHash('sha256').update(String(password) + LEGACY_SALT).digest('hex');
  return safeEqual(legacy, stored);
};

// ─── RANDOM VALUES ───
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

// ─── SESSIONS ───
// Raw tokens are only ever held by the client; the database stores their SHA-256.

const SESSION_TTL_MS = {
  admin: 12 * 60 * 60 * 1000, // 12 hours
  customer: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const TOKEN_PREFIX = {
  admin: 'lfa_adm_',
  customer: 'lfa_usr_',
};

let tablesReady = null;

const ensureSecurityTables = () => {
  if (!tablesReady) {
    tablesReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token_hash CHAR(64) NOT NULL UNIQUE,
          subject_type VARCHAR(20) NOT NULL,
          subject_id INT DEFAULT NULL,
          email VARCHAR(255) NOT NULL,
          ip_address VARCHAR(100) DEFAULT NULL,
          user_agent VARCHAR(255) DEFAULT NULL,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_auth_sessions_subject (subject_type, subject_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_intents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
          customer_id INT NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          items_json MEDIUMTEXT NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          shipping_fee DECIMAL(10, 2) NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          amount_paise INT NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'created',
          order_id INT DEFAULT NULL,
          order_number VARCHAR(100) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_payment_intents_customer (customer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      try {
        await pool.query('ALTER TABLE otp_codes ADD COLUMN failed_attempts INT DEFAULT 0');
      } catch (e) {
        // column already exists
      }
    })().catch((err) => {
      tablesReady = null; // allow retry on next call
      throw err;
    });
  }
  return tablesReady;
};

const createSession = async (type, { subjectId = null, email, req } = {}) => {
  await ensureSecurityTables();
  const token = TOKEN_PREFIX[type] + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS[type]);

  await pool.query(
    `INSERT INTO auth_sessions (token_hash, subject_type, subject_id, email, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sha256(token),
      type,
      subjectId,
      String(email || '').toLowerCase(),
      req ? String(req.ip || '').slice(0, 100) : null,
      req ? String(req.headers['user-agent'] || '').slice(0, 255) : null,
      expiresAt,
    ]
  );

  return { token, expiresAt };
};

const findSession = async (type, token) => {
  if (!token || typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX[type])) return null;
  await ensureSecurityTables();
  const [rows] = await pool.query(
    'SELECT * FROM auth_sessions WHERE token_hash = ? AND subject_type = ? AND expires_at > NOW() LIMIT 1',
    [sha256(token), type]
  );
  return rows[0] || null;
};

const revokeSession = async (token) => {
  if (!token) return;
  await ensureSecurityTables();
  await pool.query('DELETE FROM auth_sessions WHERE token_hash = ?', [sha256(token)]);
};

const revokeAllSessions = async (type, subjectId) => {
  await ensureSecurityTables();
  await pool.query('DELETE FROM auth_sessions WHERE subject_type = ? AND subject_id = ?', [type, subjectId]);
};

const extractToken = (req, { allowQuery = false } = {}) => {
  let raw = req.headers.authorization || req.headers['x-admin-token'] || '';
  if (!raw && allowQuery && req.query && typeof req.query.token === 'string') raw = req.query.token;
  raw = String(raw).trim();
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw;
};

// ─── IN-MEMORY RATE LIMITER ───
// Fixed-window counter. Good enough for a single Node process (Hostinger);
// switch to a shared store (Redis) if the app is ever scaled horizontally.

const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60 * 1000).unref();

const hit = (key, max, windowMs) => {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return { allowed: bucket.count <= max, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
};

const resetHits = (key) => buckets.delete(key);

/**
 * Express middleware. `keyFn` may add a second dimension (e.g. the submitted email)
 * so attackers can't bypass the limit by rotating IPs against one account.
 */
const rateLimit = ({ name, max, windowMs, keyFn, message }) => (req, res, next) => {
  const keys = [`${name}:ip:${req.ip}`];
  if (keyFn) {
    const extra = keyFn(req);
    if (extra) keys.push(`${name}:key:${String(extra).toLowerCase()}`);
  }

  for (const key of keys) {
    const { allowed, retryAfterSec } = hit(key, max, windowMs);
    if (!allowed) {
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: message || 'Too many attempts. Please wait a few minutes and try again.',
      });
    }
  }
  return next();
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

module.exports = {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  safeEqual,
  generateOtp,
  sha256,
  ensureSecurityTables,
  createSession,
  findSession,
  revokeSession,
  revokeAllSessions,
  extractToken,
  rateLimit,
  hit,
  resetHits,
  escapeHtml,
};
