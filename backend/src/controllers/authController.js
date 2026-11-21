const { pool } = require('../config/db');
const {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  generateOtp,
  createSession,
  revokeSession,
  revokeAllSessions,
  hit,
  resetHits,
} = require('../services/security');

const { sendWelcomeRegistrationEmail } = require('../services/mailer');
const { normalizeMobile, isValidMobile, isValidName, MESSAGES } = require('../services/validation');

// 1. REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, name, email, mobile, phone, password, confirm_password, terms_accepted } = req.body;

    const fn = first_name || (name ? name.split(' ')[0] : '');
    const ln = last_name || (name ? name.split(' ').slice(1).join(' ') : '');
    const fullName = (name || `${fn} ${ln}`).trim();
    const userPhone = normalizeMobile(mobile || phone || '');

    if (!email || !password || !fn) {
      return res.status(400).json({ success: false, message: 'First name, email address, and password are required.' });
    }

    if (!isValidName(fn) || (ln && !isValidName(ln, 1))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid name (letters only).' });
    }

    if (!isValidMobile(userPhone)) {
      return res.status(400).json({ success: false, message: MESSAGES.mobile });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if customer email already exists
    let existing = [];
    try {
      const [rows] = await pool.query('SELECT id, email FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      existing = rows || [];
    } catch (e) {
      existing = [];
    }

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please sign in instead.' });
    }

    const hashed = await hashPassword(password);
    // Wallet credit isn't redeemable at checkout, so accounts start at zero (no fake balance).
    const signupBonus = 0;

    let insertId = null;
    try {
      const [result] = await pool.query(
        `INSERT INTO customers (name, first_name, last_name, email, phone, password_hash, terms_accepted_at, wallet_balance, loyalty_points, status)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 0, 'Active')`,
        [fullName, fn, ln, email.trim().toLowerCase(), userPhone, hashed, signupBonus]
      );
      if (result && result.insertId) {
        insertId = result.insertId;
      }
    } catch (e) {
      console.warn('Register DB query primary failed, running standard fallback:', e.message);
      try {
        const [result] = await pool.query(
          `INSERT INTO customers (name, email, phone, password_hash, terms_accepted_at, wallet_balance, loyalty_points, status)
           VALUES (?, ?, ?, ?, NOW(), ?, 0, 'Active')`,
          [fullName, email.trim().toLowerCase(), userPhone, hashed, signupBonus]
        );
        if (result && result.insertId) {
          insertId = result.insertId;
        }
      } catch (err2) {
        console.error('Register DB fallback query error:', err2.message);
      }
    }

    if (!insertId) {
      return res.status(500).json({ success: false, message: 'Could not create your account right now. Please try again shortly.' });
    }

    const { token } = await createSession('customer', { subjectId: insertId, email: email.trim().toLowerCase(), req });

    // Send Registration Welcome Email via Nodemailer
    try {
      sendWelcomeRegistrationEmail(email.trim().toLowerCase(), fn);
    } catch (e) {
      console.warn('Mailer trigger error:', e.message);
    }

    // Log Activity
    try {
      await pool.query(
        `INSERT INTO activity_logs (admin_name, module, action, ip_address) VALUES (?, ?, ?, ?)`,
        ['Customer Registration', 'Authentication', `New customer account created: ${fullName} (${email})`, req.ip || '127.0.0.1']
      );
    } catch (e) {}

    const userProfile = {
      id: insertId,
      first_name: fn,
      last_name: ln,
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: userPhone,
      wallet_balance: signupBonus,
      loyalty_points: 0,
      loyalty_tier: 'Silver',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      token
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Leafora Life Sciences.',
      user: userProfile,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal registration server error.' });
  }
};

// 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password, remember_me } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email address and password.' });
    }

    let customer = null;

    try {
      const [rows] = await pool.query(
        'SELECT * FROM customers WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL',
        [email.trim()]
      );
      if (rows && rows.length > 0) {
        customer = rows[0];
      }
    } catch (e) {
      console.warn('Login DB query fallback:', e.message);
    }

    // Same response for unknown email and wrong password, so accounts can't be enumerated
    const passwordOk = customer ? await verifyPassword(password, customer.password_hash) : false;
    if (!customer || !passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.'
      });
    }

    // If status is Suspended / Blocked
    if (customer.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been temporarily suspended. Please contact customer support.'
      });
    }

    // Transparently upgrade legacy SHA-256 hashes to scrypt
    if (isLegacyHash(customer.password_hash)) {
      try {
        await pool.query('UPDATE customers SET password_hash = ? WHERE id = ?', [await hashPassword(password), customer.id]);
      } catch (e) {
        console.warn('Password hash upgrade skipped:', e.message);
      }
    }

    const { token } = await createSession('customer', { subjectId: customer.id, email: customer.email, req });
    const rememberToken = null;

    // Log Login Attempt
    try {
      await pool.query(
        `INSERT INTO login_history (admin_email, ip_address, browser, status) VALUES (?, ?, ?, ?)`,
        [email, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Browser', 'Success']
      );
    } catch (e) {}

    const userProfile = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      wallet_balance: parseFloat(customer.wallet_balance || 0),
      loyalty_points: customer.loyalty_points || 0,
      loyalty_tier: customer.loyalty_tier || 'Silver',
      avatar_url: customer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customer.name)}`,
      token,
      rememberToken
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      user: userProfile,
      token,
      rememberToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal login error.' });
  }
};

// 3. FORGOT PASSWORD (REQUEST OTP)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
    }

    // Check if customer exists
    const [rows] = await pool.query('SELECT id, name, email FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    const genericMessage = `If an account exists for ${email.trim()}, a 6-digit password reset code has been sent. Please check your email.`;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    // Generate 6-digit OTP (cryptographically secure)
    const otp = generateOtp();
    resetHits(`reset-otp:${email.trim().toLowerCase()}`);

    await pool.query(
      `UPDATE customers SET reset_otp = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE LOWER(email) = LOWER(?)`,
      [otp, email.trim()]
    );

    // Send real email to customer
    try {
      const { sendCustomerPasswordResetEmail } = require('../services/mailer');
      await sendCustomerPasswordResetEmail(email.trim(), otp);
    } catch (mailErr) {
      console.warn('Failed to send customer password reset email:', mailErr.message);
    }

    return res.status(200).json({ success: true, message: genericMessage });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error requesting password reset.' });
  }
};

// 4. RESET PASSWORD (VERIFY OTP & UPDATE PASSWORD)
const resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    // Verify OTP and Expiration
    const [rows] = await pool.query(
      'SELECT id, reset_otp, reset_otp_expires FROM customers WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check the code sent to your email.' });
    }

    const customer = rows[0];

    if (!customer.reset_otp || customer.reset_otp !== String(otp).trim()) {
      // Max 5 wrong guesses per code; after that the code is burned and a new one must be requested
      const { allowed } = hit(`reset-otp:${email.trim().toLowerCase()}`, 5, 15 * 60 * 1000);
      if (!allowed) {
        await pool.query('UPDATE customers SET reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?', [customer.id]);
        return res.status(429).json({ success: false, message: 'Too many incorrect codes. Please request a new password reset code.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check the code sent to your email.' });
    }

    if (!customer.reset_otp_expires || new Date(customer.reset_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'The OTP code has expired. Please request a new code.' });
    }

    const hashed = await hashPassword(new_password);

    await pool.query(
      `UPDATE customers SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL, remember_token = NULL WHERE id = ?`,
      [hashed, customer.id]
    );
    resetHits(`reset-otp:${email.trim().toLowerCase()}`);

    // Sign out every existing session after a password reset
    try { await revokeAllSessions('customer', customer.id); } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

// 5. GET CURRENT USER PROFILE (route is protected by requireUser)
const getCurrentUser = async (req, res) => {
  const customer = req.user;
  return res.status(200).json({
    success: true,
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      wallet_balance: parseFloat(customer.wallet_balance || 0),
      loyalty_points: customer.loyalty_points || 0,
      loyalty_tier: customer.loyalty_tier || 'Silver',
      avatar_url: customer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customer.name)}`,
      token: req.authToken
    }
  });
};

// 6. LOGOUT (revoke the current session; route is protected by requireUser)
const logoutUser = async (req, res) => {
  try {
    await revokeSession(req.authToken);
    if (req.user && req.user.remember_token === req.authToken) {
      await pool.query('UPDATE customers SET remember_token = NULL WHERE id = ?', [req.user.id]);
    }
  } catch (e) {
    console.warn('Logout notice:', e.message);
  }
  return res.status(200).json({ success: true, message: 'Signed out successfully.' });
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logoutUser
};
