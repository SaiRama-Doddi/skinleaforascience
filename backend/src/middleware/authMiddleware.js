// Authentication and Authorization Middleware for Leafora API
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'] || req.query.token;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Admin authorization token is required.'
    });
  }

  const tokenStr = typeof authHeader === 'string' ? authHeader : String(authHeader);
  const token = tokenStr.startsWith('Bearer ') ? tokenStr.slice(7).trim() : tokenStr.trim();

  // Validate admin token format
  if (!token || !token.startsWith('leafora_admin_token_')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin session token. Please log in again.'
    });
  }

  next();
};

module.exports = {
  verifyAdminToken
};
