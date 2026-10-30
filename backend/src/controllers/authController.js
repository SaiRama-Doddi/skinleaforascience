const { pool } = require('../config/db');
const crypto = require('crypto');

// Password Hashing Helper
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + 'LEAFORA_SALT_2026').digest('hex');
};

// Generate Random Token Helper
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const { sendWelcomeRegistrationEmail } = require('../services/mailer');

// 1. REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, name, email, mobile, phone, password, confirm_password, terms_accepted } = req.body;

    const fn = first_name || (name ? name.split(' ')[0] : '');
    const ln = last_name || (name ? name.split(' ').slice(1).join(' ') : '');
    const fullName = (name || `${fn} ${ln}`).trim();
    const userPhone = mobile || phone || '';

    if (!email || !password || !fn) {
      return res.status(400).json({ success: false, message: 'First name, email address, and password are required.' });
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

    const hashed = hashPassword(password);
    const token = generateToken();
    const signupBonus = 10.00; // Welcome reward

    let insertId = Date.now();
    try {
      const [result] = await pool.query(
        `INSERT INTO customers (name, first_name, last_name, email, phone, password_hash, terms_accepted_at, wallet_balance, loyalty_points, status)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 100, 'Active')`,
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
           VALUES (?, ?, ?, ?, NOW(), ?, 100, 'Active')`,
          [fullName, email.trim().toLowerCase(), userPhone, hashed, signupBonus]
        );
        if (result && result.insertId) {
          insertId = result.insertId;
        }
      } catch (err2) {
        console.error('Register DB fallback query error:', err2.message);
      }
    }

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
      loyalty_points: 100,
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

    const hashed = hashPassword(password);
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

    // If customer not found in DB
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please create an account first.'
      });
    }

    // If password hash does not match or is missing
    if (!customer.password_hash || customer.password_hash !== hashed) {
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

    const token = `leafora_user_${customer.id}_${generateToken()}`;
    const rememberToken = remember_me ? generateToken() : null;

    if (customer.id) {
      try {
        await pool.query('UPDATE customers SET remember_token = ? WHERE id = ?', [token, customer.id]);
      } catch (e) {}
    }

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
    if (!rows || rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No registered account found with this email address.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
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

    return res.status(200).json({
      success: true,
      message: `A 6-digit password reset verification code has been sent to ${email.trim()}. Please check your email.`
    });

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
      return res.status(404).json({ success: false, message: 'No registered account found with this email.' });
    }

    const customer = rows[0];

    if (!customer.reset_otp || customer.reset_otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check the code sent to your email.' });
    }

    if (!customer.reset_otp_expires || new Date(customer.reset_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'The OTP code has expired. Please request a new code.' });
    }

    const hashed = hashPassword(new_password);

    await pool.query(
      `UPDATE customers SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?`,
      [hashed, customer.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

// 5. GET CURRENT USER PROFILE
const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    let customer = null;

    // Check if token has embedded ID: leafora_user_<id>_<hash>
    if (token.startsWith('leafora_user_')) {
      const parts = token.split('_');
      const custId = parts[2];
      if (custId) {
        const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [custId]);
        if (rows && rows[0]) customer = rows[0];
      }
    }

    // Fallback query by remember_token
    if (!customer) {
      const [rows] = await pool.query('SELECT * FROM customers WHERE remember_token = ?', [token]);
      if (rows && rows[0]) customer = rows[0];
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'User session not found. Please log in again.' });
    }

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
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser
};
