const { pool } = require('../config/db');
const { findSession, extractToken, safeEqual } = require('../services/security');

// Admin sessions are issued by /admin/verify-otp and stored (hashed) in auth_sessions.
// `?token=` is accepted only so CSV/backup downloads opened via window.open still work.
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = extractToken(req, { allowQuery: true });
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authorization token is required.',
      });
    }

    const session = await findSession('admin', token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired admin session token. Please log in again.',
      });
    }

    req.admin = { email: session.email, sessionId: session.id };
    req.authToken = token;
    return next();
  } catch (error) {
    console.error('Admin auth check failed:', error.message);
    return res.status(503).json({ success: false, message: 'Authentication service unavailable. Please retry.' });
  }
};

const loadCustomerForToken = async (token) => {
  if (!token) return null;

  const session = await findSession('customer', token);
  if (session && session.subject_id) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [session.subject_id]
    );
    return rows[0] || null;
  }

  // Legacy sessions (issued before auth_sessions existed) were stored in
  // customers.remember_token. Accept an exact match so existing users stay signed in.
  if (token.startsWith('leafora_user_')) {
    const custId = Number(token.split('_')[2]);
    if (!Number.isInteger(custId) || custId <= 0) return null;
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [custId]
    );
    const customer = rows[0];
    if (customer && customer.remember_token && safeEqual(customer.remember_token, token)) {
      return customer;
    }
  }

  return null;
};

const requireUser = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const customer = await loadCustomerForToken(token);

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }
    if (customer.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been temporarily suspended. Please contact customer support.',
      });
    }

    req.user = customer;
    req.authToken = token;
    return next();
  } catch (error) {
    console.error('User auth check failed:', error.message);
    return res.status(503).json({ success: false, message: 'Authentication service unavailable. Please retry.' });
  }
};

module.exports = {
  verifyAdminToken,
  requireUser,
};
