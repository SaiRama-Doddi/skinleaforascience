const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { sendOtpEmail } = require('../services/mailer');
const ProductModel = require('../models/productModel');
const { setOrderStatus, refundPayment, refundOrder: refundOrder_ } = require('../services/orderService');

const { generateOtp, safeEqual, createSession, revokeSession, ensureSecurityTables } = require('../services/security');

const ALLOWED_ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();

// ─── AUTHENTICATION ───

// 1. Send OTP
const isAuthorizedAdminEmail = async (email) => {
  if (ALLOWED_ADMIN_EMAIL && email === ALLOWED_ADMIN_EMAIL) return true;
  try {
    const [users] = await pool.query(
      'SELECT id FROM admin_users WHERE LOWER(email) = ? AND (is_active = 1 OR is_active IS NULL) LIMIT 1',
      [email]
    );
    return users.length > 0;
  } catch (err) {
    console.warn('Admin users table query notice:', err.message);
    return false;
  }
};

const sendOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'Admin email is required.' });
  }

  try {
    if (!(await isAuthorizedAdminEmail(email))) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized email address. Please contact the system administrator for admin access.',
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous unused codes for this email, then store the new one
    await pool.query('UPDATE otp_codes SET is_used = 1 WHERE email = ? AND is_used = 0', [email]);
    await pool.query('INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
    try {
      await pool.query(
        'INSERT INTO admin_logs (admin_email, action, details) VALUES (?, ?, ?)',
        [email, 'REQUEST_OTP', `OTP requested from ${req.ip}`]
      );
    } catch (e) {}

    const mailResult = await sendOtpEmail(email, otp);
    if (mailResult && mailResult.success === false) {
      return res.status(502).json({ success: false, message: 'Could not send the OTP email. Please try again shortly.' });
    }

    return res.status(200).json({ success: true, message: `OTP sent to ${email} successfully!` });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Could not send OTP. Please try again.' });
  }
};

// 2. Verify OTP → issues a server-side admin session
const MAX_OTP_ATTEMPTS = 5;

const verifyOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    await ensureSecurityTables();

    const [rows] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email]
    );
    const record = rows[0];

    if (!record || !safeEqual(record.otp, otp)) {
      if (record) {
        const attempts = (record.failed_attempts || 0) + 1;
        await pool.query(
          'UPDATE otp_codes SET failed_attempts = ?, is_used = IF(? >= ?, 1, is_used) WHERE id = ?',
          [attempts, attempts, MAX_OTP_ATTEMPTS, record.id]
        );
        if (attempts >= MAX_OTP_ATTEMPTS) {
          return res.status(429).json({ success: false, message: 'Too many incorrect codes. Please request a new OTP.' });
        }
      }
      try {
        await pool.query(
          'INSERT INTO login_history (admin_email, ip_address, browser, status) VALUES (?, ?, ?, ?)',
          [email, req.ip, String(req.headers['user-agent'] || '').slice(0, 250), 'Failed']
        );
      } catch (e) {}
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Re-check authorization in case the admin was deactivated after requesting the code
    if (!(await isAuthorizedAdminEmail(email))) {
      return res.status(403).json({ success: false, message: 'This admin account is no longer active.' });
    }

    await pool.query('UPDATE otp_codes SET is_used = 1 WHERE id = ?', [record.id]);
    await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE LOWER(email) = ?', [email]).catch(() => {});
    const { token, expiresAt } = await createSession('admin', { email, req });

    try {
      await pool.query(
        'INSERT INTO admin_logs (admin_email, action, details) VALUES (?, ?, ?)',
        [email, 'ADMIN_LOGIN', 'Admin authenticated via OTP successfully']
      );
      await pool.query(
        'INSERT INTO login_history (admin_email, ip_address, browser, status) VALUES (?, ?, ?, ?)',
        [email, req.ip, String(req.headers['user-agent'] || '').slice(0, 250), 'Success']
      );
    } catch (e) {}

    let displayName = 'Admin';
    try {
      const [u] = await pool.query('SELECT name FROM admin_users WHERE LOWER(email) = ? LIMIT 1', [email]);
      if (u[0] && u[0].name) displayName = u[0].name;
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      expires_at: expiresAt,
      user: { email, name: displayName, role: 'Admin' },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Could not verify OTP. Please try again.' });
  }
};

// 3. Logout → revokes the admin session
const adminLogout = async (req, res) => {
  try {
    await revokeSession(req.authToken);
  } catch (e) {
    console.warn('Admin logout notice:', e.message);
  }
  return res.status(200).json({ success: true, message: 'Logged out.' });
};

// ─── DASHBOARD ANALYTICS (live database counts only) ───

const num = (v) => Number(v || 0);

const getAnalytics = async (req, res) => {
  try {
    const [[categoriesCount]] = await pool.query(
      'SELECT COUNT(*) as total, COALESCE(SUM(is_active), 0) as active FROM categories WHERE deleted_at IS NULL'
    );
    const [[productsStats]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(is_active), 0) as active,
        COALESCE(SUM(CASE WHEN stock > 0 AND stock <= COALESCE(low_stock_threshold, 10) THEN 1 ELSE 0 END), 0) as lowStock,
        COALESCE(SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END), 0) as outOfStock
      FROM products WHERE deleted_at IS NULL
    `);
    // Revenue counts only paid orders that were not cancelled or refunded
    const [[ordersStats]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) as todayOrders,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pendingOrders,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND payment_status = 'Paid'
          AND status NOT IN ('Cancelled', 'Refunded') THEN total_amount ELSE 0 END), 0) as todayRevenue,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
          AND payment_status = 'Paid' AND status NOT IN ('Cancelled', 'Refunded') THEN total_amount ELSE 0 END), 0) as monthlyRevenue
      FROM orders WHERE deleted_at IS NULL
    `);
    const [[customersCount]] = await pool.query('SELECT COUNT(*) as total FROM customers WHERE deleted_at IS NULL');
    const [[reviewsCount]] = await pool.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending
      FROM reviews WHERE deleted_at IS NULL
    `);
    const [[referralsStats]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN reward_amount ELSE 0 END), 0) as totalEarnings,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pendingCount
      FROM referrals
    `);
    const [[couponsStats]] = await pool.query(`
      SELECT COUNT(*) as total,
        COALESCE(SUM(CASE WHEN is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW()) THEN 1 ELSE 0 END), 0) as active
      FROM coupons WHERE deleted_at IS NULL
    `);

    return res.status(200).json({
      success: true,
      data: {
        categories: { total: num(categoriesCount.total), active: num(categoriesCount.active) },
        products: {
          total: num(productsStats.total),
          active: num(productsStats.active),
          lowStock: num(productsStats.lowStock),
          outOfStock: num(productsStats.outOfStock),
        },
        orders: {
          total: num(ordersStats.total),
          todayOrders: num(ordersStats.todayOrders),
          pendingOrders: num(ordersStats.pendingOrders),
          todayRevenue: num(ordersStats.todayRevenue),
          monthlyRevenue: num(ordersStats.monthlyRevenue),
        },
        customers: { total: num(customersCount.total) },
        reviews: { total: num(reviewsCount.total), pending: num(reviewsCount.pending) },
        referrals: { totalEarnings: num(referralsStats.totalEarnings), pendingCount: num(referralsStats.pendingCount) },
        coupons: { total: num(couponsStats.total), active: num(couponsStats.active) },
      },
    });
  } catch (error) {
    console.error('Analytics query failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load dashboard figures from the database.' });
  }
};

// ─── CATEGORIES (database only) ───

const dbFail = (res, action, error) => {
  console.error(`Category ${action} failed:`, error.message);
  return res.status(500).json({ success: false, message: `Could not ${action} the category. Please try again.` });
};

const slugify = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// Admin: every category, including inactive and trashed (for the trash view)
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Category list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load categories.' });
  }
};

// Storefront: only active, non-deleted categories
const getPublicCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE deleted_at IS NULL AND (is_active = 1 OR is_active IS NULL) ORDER BY display_order ASC, id ASC'
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Public category list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load categories.' });
  }
};

const addCategory = async (req, res) => {
  const {
    name, parent_id, level, slug, description, image_url, icon_url, banner_url,
    meta_title, meta_description, meta_keywords, is_active, is_featured, is_trending, display_order
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  try {
    const finalSlug = slugify(slug || name);
    const catLevel = level || (parent_id ? 'sub_category' : 'category');
    const pid = parent_id ? Number(parent_id) : null;

    const [result] = await pool.query(
      `INSERT INTO categories
        (parent_id, level, name, slug, description, image_url, icon_url, banner_url, meta_title, meta_description, meta_keywords, is_active, is_featured, is_trending, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pid, catLevel, String(name).trim(), finalSlug, description || '', image_url || '', icon_url || '', banner_url || '',
        meta_title || name, meta_description || description || '', meta_keywords || '',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        is_featured ? 1 : 0, is_trending ? 1 : 0, Number(display_order) || 0
      ]
    );

    const [[saved]] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Category added successfully', data: saved });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A category with this name or slug already exists.' });
    }
    return dbFail(res, 'add', error);
  }
};

const updateCategory = async (req, res) => {
  const numId = Number(req.params.id);
  const {
    name, parent_id, level, slug, description, image_url, icon_url, banner_url,
    meta_title, meta_description, meta_keywords, is_active, is_featured, is_trending, display_order
  } = req.body;

  if (parent_id !== undefined && Number(parent_id) === numId) {
    return res.status(400).json({ success: false, message: 'A category cannot be its own parent.' });
  }

  try {
    const finalSlug = slug ? slugify(slug) : undefined;
    const pidProvided = parent_id !== undefined;
    const pid = pidProvided && parent_id ? Number(parent_id) : null;

    const [result] = await pool.query(
      `UPDATE categories SET
        parent_id = IF(?, ?, parent_id),
        level = COALESCE(?, level),
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url),
        icon_url = COALESCE(?, icon_url),
        banner_url = COALESCE(?, banner_url),
        meta_title = COALESCE(?, meta_title),
        meta_description = COALESCE(?, meta_description),
        meta_keywords = COALESCE(?, meta_keywords),
        is_active = COALESCE(?, is_active),
        is_featured = COALESCE(?, is_featured),
        is_trending = COALESCE(?, is_trending),
        display_order = COALESCE(?, display_order)
       WHERE id = ?`,
      [
        pidProvided ? 1 : 0, pid, level ?? null, name ?? null, finalSlug ?? null, description ?? null, image_url ?? null,
        icon_url ?? null, banner_url ?? null, meta_title ?? null, meta_description ?? null, meta_keywords ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        is_featured !== undefined ? (is_featured ? 1 : 0) : null,
        is_trending !== undefined ? (is_trending ? 1 : 0) : null,
        display_order ?? null, numId
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A category with this name or slug already exists.' });
    }
    return dbFail(res, 'update', error);
  }
};

const deleteCategory = async (req, res) => {
  const numId = Number(req.params.id);
  const force = req.query.force === 'true';
  try {
    const [result] = force
      ? await pool.query('DELETE FROM categories WHERE id = ?', [numId])
      : await pool.query('UPDATE categories SET deleted_at = NOW() WHERE id = ?', [numId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({
      success: true,
      message: force ? `Category #${numId} permanently deleted` : `Category #${numId} moved to Trash`
    });
  } catch (error) {
    return dbFail(res, 'delete', error);
  }
};

const restoreCategory = async (req, res) => {
  const numId = Number(req.params.id);
  try {
    const [result] = await pool.query('UPDATE categories SET deleted_at = NULL WHERE id = ?', [numId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, message: `Category #${numId} restored from Trash` });
  } catch (error) {
    return dbFail(res, 'restore', error);
  }
};

const CATEGORY_BULK_SQL = {
  active: 'UPDATE categories SET is_active = 1 WHERE id IN (?)',
  inactive: 'UPDATE categories SET is_active = 0 WHERE id IN (?)',
  soft_delete: 'UPDATE categories SET deleted_at = NOW() WHERE id IN (?)',
  restore: 'UPDATE categories SET deleted_at = NULL WHERE id IN (?)',
  permanent_delete: 'DELETE FROM categories WHERE id IN (?)',
};

const bulkCategoryStatus = async (req, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No category IDs specified' });
  }
  if (!CATEGORY_BULK_SQL[action]) {
    return res.status(400).json({ success: false, message: 'Unknown bulk action.' });
  }
  try {
    const numIds = ids.map(Number).filter(Number.isInteger);
    const [result] = await pool.query(CATEGORY_BULK_SQL[action], [numIds]);
    return res.status(200).json({ success: true, message: `Bulk action "${action}" applied to ${result.affectedRows} categories` });
  } catch (error) {
    return dbFail(res, 'update', error);
  }
};

const reorderCategories = async (req, res) => {
  const { orders } = req.body; // [{ id, display_order }]
  if (!Array.isArray(orders)) return res.status(400).json({ success: false, message: 'Invalid reorder items' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of orders) {
      await conn.query('UPDATE categories SET display_order = ? WHERE id = ?', [Number(item.display_order) || 0, Number(item.id)]);
    }
    await conn.commit();
    return res.status(200).json({ success: true, message: 'Categories display order updated' });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return dbFail(res, 'reorder', error);
  } finally {
    conn.release();
  }
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const exportCategoriesCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY display_order ASC, id ASC');
    const headers = ['id', 'parent_id', 'level', 'name', 'slug', 'description', 'image_url', 'icon_url', 'banner_url', 'meta_title', 'meta_description', 'meta_keywords', 'is_active', 'is_featured', 'is_trending', 'display_order'];
    const csvStr = [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n') + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="categories_export.csv"');
    return res.status(200).send(csvStr);
  } catch (error) {
    return dbFail(res, 'export', error);
  }
};

/** Minimal CSV parser that understands quoted fields containing commas / escaped quotes. */
const parseCsv = (text) => {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((vals) => Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()])));
};

const importCategoriesCsv = async (req, res) => {
  const { items, csv_text } = req.body;
  const records = (Array.isArray(items) && items.length ? items : parseCsv(String(csv_text || ''))).filter((r) => r && r.name);

  if (records.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid category records found in CSV' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of records) {
      await conn.query(
        `INSERT INTO categories
          (parent_id, level, name, slug, description, image_url, icon_url, banner_url, meta_title, meta_description, meta_keywords, is_active, is_featured, is_trending, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), image_url = VALUES(image_url)`,
        [
          item.parent_id ? Number(item.parent_id) : null,
          item.level || 'category',
          item.name,
          slugify(item.slug || item.name),
          item.description || '',
          item.image_url || '',
          item.icon_url || '',
          item.banner_url || '',
          item.meta_title || item.name,
          item.meta_description || '',
          item.meta_keywords || '',
          item.is_active !== undefined && item.is_active !== '' ? (Number(item.is_active) ? 1 : 0) : 1,
          Number(item.is_featured) ? 1 : 0,
          Number(item.is_trending) ? 1 : 0,
          Number(item.display_order) || 0
        ]
      );
    }
    await conn.commit();
    return res.status(200).json({ success: true, message: `Successfully imported ${records.length} categories from CSV` });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error('Category import failed:', error.message);
    return res.status(500).json({ success: false, message: `Import failed, nothing was saved: ${error.message}` });
  } finally {
    conn.release();
  }
};

// ─── IMAGE UPLOAD HANDLING (STATIC ASSET & DATABASE STORAGE) ───
const uploadImage = async (req, res) => {
  try {
    const { image_data } = req.body;
    if (!image_data) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    let dataUrl = image_data;
    if (!image_data.startsWith('data:image/')) {
      dataUrl = `data:image/jpeg;base64,${image_data}`;
    }

    // Raster images only. SVG is rejected because it can carry scripts that would run
    // on our own origin (stored XSS against admins).
    const ALLOWED_IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/s);
    if (!matches || !ALLOWED_IMAGE_TYPES[matches[1].toLowerCase()]) {
      return res.status(400).json({ success: false, message: 'Unsupported image type. Please upload a JPG, PNG, WEBP, GIF or AVIF image.' });
    }
    const mimeType = matches[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : matches[1].toLowerCase();
    const ext = ALLOWED_IMAGE_TYPES[matches[1].toLowerCase()];
    const base64Content = matches[2];

    const filename = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 1. Store directly in MySQL media_storage table
    try {
      await pool.query(
        `INSERT INTO media_storage (filename, mime_type, data_base64, file_size) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE data_base64 = VALUES(data_base64), mime_type = VALUES(mime_type)`,
        [filename, mimeType, dataUrl, Buffer.byteLength(base64Content, 'base64')]
      );
    } catch (dbErr) {
      console.warn('media_storage insert notice:', dbErr.message);
    }

    // 2. Also write physical file to uploads folders for static server caching
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      const candidateDirs = [
        path.join(__dirname, '../public/uploads'),
        path.join(__dirname, '../../public/uploads'),
        path.join(__dirname, '../../dist/uploads'),
        path.join(__dirname, '../../build/uploads'),
        path.join(process.cwd(), 'public/uploads'),
        path.join(process.cwd(), 'uploads')
      ];

      for (const targetDir of candidateDirs) {
        try {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.writeFileSync(path.join(targetDir, filename), buffer);
        } catch (_) {}
      }
    } catch (saveErr) {
      console.warn('Physical disk cache notice:', saveErr.message);
    }

    // Return the data URL directly so product stores the image data directly in database
    return res.status(200).json({ 
      success: true, 
      url: dataUrl,
      media_url: `/uploads/${filename}`,
      filename: filename,
      message: 'Image stored in database successfully' 
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONTROL SUITE 2: PRODUCTS (database only) ───

const productFail = (res, action, error) => {
  console.error(`Product ${action} failed:`, error.message);
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
  }
  return res.status(500).json({ success: false, message: `Could not ${action} the product. Please try again.` });
};

const clearProductCache = () => { try { ProductModel.clearCache(); } catch (e) { /* cache is optional */ } };

const parseImagesColumn = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { const arr = JSON.parse(value); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
};

/** Attach images (product_images table, else images column) and variants — 2 queries total. */
const enrichProducts = async (rows) => {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [imgRows] = await pool.query(
    'SELECT product_id, image_url FROM product_images WHERE product_id IN (?) ORDER BY display_order ASC, id ASC',
    [ids]
  );
  const [varRows] = await pool.query('SELECT * FROM product_variants WHERE product_id IN (?) ORDER BY id ASC', [ids]);

  return rows.map((prod) => {
    let images = imgRows.filter((i) => i.product_id === prod.id).map((i) => i.image_url);
    if (images.length === 0) images = parseImagesColumn(prod.images);
    if (images.length === 0 && prod.image_url) images = [prod.image_url];
    return {
      ...prod,
      image_url: images[0] || prod.image_url || '',
      images: images.slice(0, 5),
      variants: varRows.filter((v) => v.product_id === prod.id),
    };
  });
};

const getProducts = async (req, res) => {
  try {
    const { status, category, brand, stock_status, search, min_price, max_price } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (status === 'deleted') query += ' AND deleted_at IS NOT NULL';
    else if (status === 'active') query += ' AND deleted_at IS NULL AND is_active = 1';
    else if (status === 'inactive') query += ' AND deleted_at IS NULL AND is_active = 0';
    else if (status !== 'all') query += ' AND deleted_at IS NULL';

    if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }
    if (brand && brand !== 'all') { query += ' AND brand = ?'; params.push(brand); }

    if (stock_status === 'in_stock') query += ' AND stock > low_stock_threshold';
    else if (stock_status === 'low_stock') query += ' AND stock > 0 AND stock <= low_stock_threshold';
    else if (stock_status === 'out_of_stock') query += ' AND stock <= 0';

    if (search) {
      query += ' AND (name LIKE ? OR sku LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (min_price) { query += ' AND price >= ?'; params.push(Number(min_price)); }
    if (max_price) { query += ' AND price <= ?'; params.push(Number(max_price)); }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: await enrichProducts(rows) });
  } catch (error) {
    console.error('Product list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load products.' });
  }
};

const cleanImages = (images, image_url) => {
  let arr = Array.isArray(images) ? images.filter(Boolean) : [];
  if (arr.length === 0 && image_url) arr = [image_url];
  return arr.slice(0, 5);
};

const replaceImagesAndVariants = async (conn, productId, imagesArr, variants, fallback) => {
  await conn.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (let i = 0; i < imagesArr.length; i++) {
    await conn.query(
      'INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)',
      [productId, imagesArr[i], i === 0 ? 1 : 0, i]
    );
  }
  if (Array.isArray(variants)) {
    await conn.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    for (const v of variants) {
      await conn.query(
        'INSERT INTO product_variants (product_id, variant_name, sku, price, stock, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [
          productId,
          v.variant_name || 'Standard',
          v.sku || `${fallback.sku || 'SKU'}-V`,
          Number(v.price ?? fallback.price ?? 0),
          Number(v.stock ?? fallback.stock ?? 0),
          v.is_active === undefined || v.is_active ? 1 : 0,
        ]
      );
    }
  }
};

const validateProductNumbers = ({ price, stock }) => {
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) return 'Price must be a positive number.';
  if (stock !== undefined && stock !== '' && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) return 'Stock must be a whole number (0 or more).';
  return null;
};

const addProduct = async (req, res) => {
  const {
    name, brand, sku, net_quantity, category, category_id, price, stock, warehouse_stock, reserved_stock, low_stock_threshold,
    description, ingredients, benefits, how_to_use, skin_type, key_ingredients, manufacturing_date, expiry_date, storage, warning,
    image_url, images, is_active, is_featured, is_trending, is_new_arrival,
    meta_title, meta_description, meta_keywords, canonical_url, variants
  } = req.body;

  if (!name || price === undefined || price === '') {
    return res.status(400).json({ success: false, message: 'Product title and price are required' });
  }
  const numErr = validateProductNumbers({ price, stock });
  if (numErr) return res.status(400).json({ success: false, message: numErr });

  const imagesArr = cleanImages(images, image_url);
  const finalSku = sku || `SKU-${Date.now().toString().slice(-6)}`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO products
        (name, brand, sku, net_quantity, category, category_id, price, stock, warehouse_stock, reserved_stock, low_stock_threshold,
         description, ingredients, benefits, how_to_use, skin_type, key_ingredients, manufacturing_date, expiry_date, storage, warning,
         image_url, images, is_active, is_featured, is_trending, is_new_arrival,
         meta_title, meta_description, meta_keywords, canonical_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, brand || 'Leafora', finalSku, net_quantity || '', category || 'General', category_id ? Number(category_id) : null,
        Number(price), Number(stock || 0), Number(warehouse_stock || stock || 0), Number(reserved_stock || 0), Number(low_stock_threshold || 10),
        description || '', ingredients || '', benefits || '', how_to_use || '', skin_type || '', key_ingredients || '',
        manufacturing_date || null, expiry_date || null, storage || '', warning || '',
        imagesArr[0] || '', JSON.stringify(imagesArr),
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        is_featured ? 1 : 0, is_trending ? 1 : 0, is_new_arrival ? 1 : 0,
        meta_title || name, meta_description || description || '', meta_keywords || '', canonical_url || ''
      ]
    );
    await replaceImagesAndVariants(conn, result.insertId, imagesArr, variants, { sku: finalSku, price, stock });
    await conn.commit();
    clearProductCache();

    const [[saved]] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    const [enriched] = await enrichProducts([saved]);
    return res.status(201).json({ success: true, message: 'Product created successfully', data: enriched });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return productFail(res, 'create', error);
  } finally {
    conn.release();
  }
};

const updateProduct = async (req, res) => {
  const numId = Number(req.params.id);
  const {
    name, brand, sku, net_quantity, category, category_id, price, stock, warehouse_stock, reserved_stock, low_stock_threshold,
    description, ingredients, benefits, how_to_use, skin_type, key_ingredients, manufacturing_date, expiry_date, storage, warning,
    image_url, images, is_active, is_featured, is_trending, is_new_arrival,
    meta_title, meta_description, meta_keywords, canonical_url, variants
  } = req.body;

  const numErr = validateProductNumbers({ price, stock });
  if (numErr) return res.status(400).json({ success: false, message: numErr });

  // Only touch images when the client sent them; otherwise keep what is stored
  const imagesSent = Array.isArray(images) || image_url !== undefined;
  const imagesArr = imagesSent ? cleanImages(images, image_url) : null;
  const opt = (v) => (v === undefined ? null : v);
  const optNum = (v) => (v === undefined || v === '' ? null : Number(v));
  const optBool = (v) => (v === undefined ? null : v ? 1 : 0);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE products SET
        name = COALESCE(?, name), brand = COALESCE(?, brand), sku = COALESCE(?, sku), net_quantity = COALESCE(?, net_quantity),
        category = COALESCE(?, category), category_id = COALESCE(?, category_id), price = COALESCE(?, price), stock = COALESCE(?, stock),
        warehouse_stock = COALESCE(?, warehouse_stock), reserved_stock = COALESCE(?, reserved_stock), low_stock_threshold = COALESCE(?, low_stock_threshold),
        description = COALESCE(?, description), ingredients = COALESCE(?, ingredients), benefits = COALESCE(?, benefits),
        how_to_use = COALESCE(?, how_to_use), skin_type = COALESCE(?, skin_type), key_ingredients = COALESCE(?, key_ingredients),
        manufacturing_date = COALESCE(?, manufacturing_date), expiry_date = COALESCE(?, expiry_date), storage = COALESCE(?, storage),
        warning = COALESCE(?, warning), image_url = COALESCE(?, image_url), images = COALESCE(?, images),
        is_active = COALESCE(?, is_active), is_featured = COALESCE(?, is_featured), is_trending = COALESCE(?, is_trending),
        is_new_arrival = COALESCE(?, is_new_arrival), meta_title = COALESCE(?, meta_title), meta_description = COALESCE(?, meta_description),
        meta_keywords = COALESCE(?, meta_keywords), canonical_url = COALESCE(?, canonical_url)
       WHERE id = ?`,
      [
        opt(name), opt(brand), opt(sku), opt(net_quantity), opt(category), category_id ? Number(category_id) : null,
        optNum(price), optNum(stock), optNum(warehouse_stock), optNum(reserved_stock), optNum(low_stock_threshold),
        opt(description), opt(ingredients), opt(benefits), opt(how_to_use), opt(skin_type), opt(key_ingredients),
        manufacturing_date === undefined ? null : manufacturing_date || null,
        expiry_date === undefined ? null : expiry_date || null,
        opt(storage), opt(warning),
        imagesArr ? imagesArr[0] || '' : null, imagesArr ? JSON.stringify(imagesArr) : null,
        optBool(is_active), optBool(is_featured), optBool(is_trending), optBool(is_new_arrival),
        opt(meta_title), opt(meta_description), opt(meta_keywords), opt(canonical_url), numId
      ]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (imagesArr) {
      await replaceImagesAndVariants(conn, numId, imagesArr, variants, { sku, price, stock });
    } else if (Array.isArray(variants)) {
      const [[cur]] = await conn.query('SELECT sku, price, stock FROM products WHERE id = ?', [numId]);
      const [imgRows] = await conn.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY display_order', [numId]);
      await replaceImagesAndVariants(conn, numId, imgRows.map((r) => r.image_url), variants, cur);
    }
    await conn.commit();
    clearProductCache();
    return res.status(200).json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return productFail(res, 'update', error);
  } finally {
    conn.release();
  }
};

const deleteProduct = async (req, res) => {
  const numId = Number(req.params.id);
  const force = req.query.force === 'true';
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let result;
    if (force) {
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [numId]);
      await conn.query('DELETE FROM product_variants WHERE product_id = ?', [numId]);
      [result] = await conn.query('DELETE FROM products WHERE id = ?', [numId]);
    } else {
      [result] = await conn.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [numId]);
    }
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    await conn.commit();
    clearProductCache();
    return res.status(200).json({
      success: true,
      message: force ? `Product #${numId} permanently deleted` : `Product #${numId} moved to Trash Bin`
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return productFail(res, 'delete', error);
  } finally {
    conn.release();
  }
};

const restoreProduct = async (req, res) => {
  const numId = Number(req.params.id);
  try {
    const [result] = await pool.query('UPDATE products SET deleted_at = NULL WHERE id = ?', [numId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    clearProductCache();
    return res.status(200).json({ success: true, message: `Product #${numId} restored from Trash` });
  } catch (error) {
    return productFail(res, 'restore', error);
  }
};

const duplicateProduct = async (req, res) => {
  const numId = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    const [[source]] = await conn.query('SELECT * FROM products WHERE id = ?', [numId]);
    if (!source) return res.status(404).json({ success: false, message: 'Product not found.' });

    await conn.beginTransaction();
    const copySku = `${source.sku || 'SKU'}-COPY-${Date.now().toString().slice(-4)}`;
    const [result] = await conn.query(
      `INSERT INTO products
        (name, brand, sku, net_quantity, category, category_id, price, stock, warehouse_stock, reserved_stock, low_stock_threshold, description,
         ingredients, benefits, how_to_use, skin_type, key_ingredients, manufacturing_date, expiry_date, storage, warning,
         image_url, images, is_active, is_featured, is_trending, is_new_arrival, meta_title, meta_description, meta_keywords, canonical_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${source.name} (Copy)`, source.brand, copySku, source.net_quantity, source.category, source.category_id,
        source.price, source.stock, source.warehouse_stock, source.reserved_stock, source.low_stock_threshold, source.description,
        source.ingredients, source.benefits, source.how_to_use, source.skin_type, source.key_ingredients,
        source.manufacturing_date, source.expiry_date, source.storage, source.warning,
        source.image_url, source.images, source.is_featured, source.is_trending, source.is_new_arrival,
        source.meta_title, source.meta_description, source.meta_keywords, ''
      ]
    );
    await conn.query(
      `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
       SELECT ?, image_url, is_primary, display_order FROM product_images WHERE product_id = ?`,
      [result.insertId, numId]
    );
    await conn.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, stock, is_active)
       SELECT ?, variant_name, CONCAT(sku, '-COPY'), price, stock, is_active FROM product_variants WHERE product_id = ?`,
      [result.insertId, numId]
    );
    await conn.commit();
    clearProductCache();
    // Copies start inactive so they don't appear in the shop until reviewed
    return res.status(201).json({ success: true, message: `Product #${numId} duplicated as #${result.insertId} (inactive until you publish it)` });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return productFail(res, 'duplicate', error);
  } finally {
    conn.release();
  }
};

const bulkProductAction = async (req, res) => {
  const { ids, action, price_percent, stock_value } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No product IDs specified' });
  }
  const numIds = ids.map(Number).filter(Number.isInteger);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let result;
    switch (action) {
      case 'active': [result] = await conn.query('UPDATE products SET is_active = 1 WHERE id IN (?)', [numIds]); break;
      case 'inactive': [result] = await conn.query('UPDATE products SET is_active = 0 WHERE id IN (?)', [numIds]); break;
      case 'soft_delete': [result] = await conn.query('UPDATE products SET deleted_at = NOW() WHERE id IN (?)', [numIds]); break;
      case 'restore': [result] = await conn.query('UPDATE products SET deleted_at = NULL WHERE id IN (?)', [numIds]); break;
      case 'permanent_delete':
        await conn.query('DELETE FROM product_images WHERE product_id IN (?)', [numIds]);
        await conn.query('DELETE FROM product_variants WHERE product_id IN (?)', [numIds]);
        [result] = await conn.query('DELETE FROM products WHERE id IN (?)', [numIds]);
        break;
      case 'price_update': {
        const pct = Number(price_percent);
        if (!Number.isFinite(pct) || pct <= -100) throw Object.assign(new Error('Invalid price percentage.'), { status: 400 });
        [result] = await conn.query('UPDATE products SET price = ROUND(price * ?, 2) WHERE id IN (?)', [1 + pct / 100, numIds]);
        break;
      }
      case 'stock_update': {
        const sv = Number(stock_value);
        if (!Number.isInteger(sv) || sv < 0) throw Object.assign(new Error('Stock must be a whole number (0 or more).'), { status: 400 });
        [result] = await conn.query('UPDATE products SET stock = ?, warehouse_stock = ? WHERE id IN (?)', [sv, sv, numIds]);
        break;
      }
      default:
        throw Object.assign(new Error('Unknown bulk action.'), { status: 400 });
    }
    await conn.commit();
    clearProductCache();
    return res.status(200).json({ success: true, message: `Bulk action "${action}" applied to ${result.affectedRows} products` });
  } catch (error) {
    await conn.rollback().catch(() => {});
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    return productFail(res, 'update', error);
  } finally {
    conn.release();
  }
};

const PRODUCT_CSV_HEADERS = [
  'id', 'name', 'brand', 'sku', 'net_quantity', 'category', 'price', 'stock', 'warehouse_stock', 'reserved_stock', 'low_stock_threshold',
  'description', 'ingredients', 'benefits', 'how_to_use', 'skin_type', 'key_ingredients', 'manufacturing_date', 'expiry_date', 'storage', 'warning',
  'image_url', 'is_active', 'is_featured', 'is_trending', 'is_new_arrival', 'meta_title', 'meta_description', 'meta_keywords', 'canonical_url'
];

const exportProductsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id DESC');
    const csvStr = [PRODUCT_CSV_HEADERS.join(','), ...rows.map((r) => PRODUCT_CSV_HEADERS.map((h) => csvCell(r[h])).join(','))].join('\n') + '\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
    return res.status(200).send(csvStr);
  } catch (error) {
    return productFail(res, 'export', error);
  }
};

const importProductsCsv = async (req, res) => {
  const { items, csv_text } = req.body;
  const records = (Array.isArray(items) && items.length ? items : parseCsv(String(csv_text || ''))).filter((r) => r && r.name);
  if (records.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid product records found in CSV' });
  }
  for (const [i, item] of records.entries()) {
    const err = validateProductNumbers({ price: item.price, stock: item.stock });
    if (err) return res.status(400).json({ success: false, message: `Row ${i + 2} (${item.name}): ${err}` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of records) {
      await conn.query(
        `INSERT INTO products
          (name, brand, sku, net_quantity, category, price, stock, warehouse_stock, reserved_stock, low_stock_threshold,
           description, ingredients, benefits, how_to_use, skin_type, key_ingredients, manufacturing_date, expiry_date, storage, warning,
           image_url, images, is_active, is_featured, is_trending, is_new_arrival, meta_title, meta_description, meta_keywords, canonical_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), stock = VALUES(stock)`,
        [
          item.name, item.brand || 'Leafora', item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`, item.net_quantity || '',
          item.category || 'General', Number(item.price || 0), Number(item.stock || 0), Number(item.warehouse_stock || item.stock || 0),
          Number(item.reserved_stock || 0), Number(item.low_stock_threshold || 10),
          item.description || '', item.ingredients || '', item.benefits || '', item.how_to_use || '', item.skin_type || '',
          item.key_ingredients || '', item.manufacturing_date || null, item.expiry_date || null, item.storage || '', item.warning || '',
          item.image_url || '', JSON.stringify(item.image_url ? [item.image_url] : []),
          item.is_active !== undefined && item.is_active !== '' ? (Number(item.is_active) ? 1 : 0) : 1,
          Number(item.is_featured) ? 1 : 0, Number(item.is_trending) ? 1 : 0, Number(item.is_new_arrival) ? 1 : 0,
          item.meta_title || item.name, item.meta_description || '', item.meta_keywords || '', item.canonical_url || ''
        ]
      );
    }
    await conn.commit();
    clearProductCache();
    return res.status(200).json({ success: true, message: `Successfully imported ${records.length} products from CSV` });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error('Product import failed:', error.message);
    return res.status(500).json({ success: false, message: `Import failed, nothing was saved: ${error.message}` });
  } finally {
    conn.release();
  }
};

const bulkUploadProducts = (req, res) => importProductsCsv(req, res);

// Records a restock reminder in the admin log. (No vendor e-mail integration exists.)
const notifyVendor = async (req, res) => {
  try {
    const [[prod]] = await pool.query('SELECT id, name, stock FROM products WHERE id = ?', [req.params.id]);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });
    await pool.query('INSERT INTO admin_logs (admin_email, action, details) VALUES (?, ?, ?)', [
      (req.admin && req.admin.email) || 'admin',
      'RESTOCK_REMINDER',
      `Restock reminder recorded for "${prod.name}" (stock: ${prod.stock})`,
    ]);
    return res.status(200).json({ success: true, message: `Restock reminder recorded for ${prod.name}` });
  } catch (error) {
    return productFail(res, 'record a restock reminder for', error);
  }
};

// ─── CONTROL SUITE 3 & 4: ORDERS (database only; status changes e-mail the customer) ───

const orderFail = (res, error, action = 'update the order') => {
  if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message });
  console.error(`Order ${action} failed:`, error);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : `Could not ${action}. Please try again.` });
};

const getOrders = async (req, res) => {
  try {
    const { status, payment_status, courier, search } = req.query;
    let query = `
      SELECT o.*,
        COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id = o.id), 0) AS items_count,
        (SELECT COUNT(*) FROM order_timeline WHERE order_id = o.id) AS timeline_count
      FROM orders o WHERE 1=1`;
    const params = [];

    if (status === 'deleted') query += ' AND o.deleted_at IS NOT NULL';
    else {
      query += ' AND o.deleted_at IS NULL';
      if (status && status !== 'all') { query += ' AND o.status = ?'; params.push(status); }
    }
    if (payment_status && payment_status !== 'all') { query += ' AND o.payment_status = ?'; params.push(payment_status); }
    if (courier && courier !== 'all') { query += ' AND o.shipping_partner = ?'; params.push(courier); }
    if (search) {
      const s = `%${search}%`;
      query += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ? OR o.tracking_number LIKE ? OR o.id = ?)';
      params.push(s, s, s, s, s, isNaN(search) ? -1 : Number(search));
    }
    query += ' ORDER BY o.id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows.map((o) => ({ ...o, items_count: Number(o.items_count), timeline_count: Number(o.timeline_count) })) });
  } catch (error) {
    return orderFail(res, error, 'load orders');
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const numId = Number(req.params.id);
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [numId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order record not found' });

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [numId]);
    const [timeline] = await pool.query('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC', [numId]);
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id ASC', [numId]);
    const [[customer]] = await pool.query('SELECT id, name, email, phone, status, created_at FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1', [order.customer_email]);

    return res.status(200).json({ success: true, data: { order, items, timeline, payments, customer: customer || null } });
  } catch (error) {
    return orderFail(res, error, 'load the order');
  }
};

// PUT /admin/orders/:id and /admin/orders/:id/status
const updateOrderDetails = async (req, res) => {
  const numId = Number(req.params.id);
  const {
    status, shipping_partner, warehouse, tracking_number,
    admin_notes, return_reason, exchange_notes, customer_name, customer_phone, shipping_address
  } = req.body;

  try {
    // Plain fields (no status logic). payment_status is deliberately NOT editable here:
    // it is set only by verified payments and real refunds.
    const [result] = await pool.query(
      `UPDATE orders SET
        shipping_partner = COALESCE(?, shipping_partner), warehouse = COALESCE(?, warehouse),
        tracking_number = COALESCE(?, tracking_number), admin_notes = COALESCE(?, admin_notes),
        return_reason = COALESCE(?, return_reason), exchange_notes = COALESCE(?, exchange_notes),
        customer_name = COALESCE(?, customer_name), customer_phone = COALESCE(?, customer_phone),
        shipping_address = COALESCE(?, shipping_address)
       WHERE id = ?`,
      [
        shipping_partner || null, warehouse || null, tracking_number || null, admin_notes ?? null, return_reason || null,
        exchange_notes || null, customer_name || null, customer_phone || null, shipping_address || null, numId
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (status) {
      await setOrderStatus(numId, status, { shipping_partner, tracking_number, adminEmail: req.admin && req.admin.email });
    }
    return res.status(200).json({ success: true, message: status ? `Order updated to "${status}" and the customer was notified` : 'Order updated successfully' });
  } catch (error) {
    return orderFail(res, error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await setOrderStatus(Number(req.params.id), 'Cancelled', { reason: req.body.reason || 'Cancelled by store', adminEmail: req.admin && req.admin.email });
    const paid = order.payment_status === 'Paid';
    return res.status(200).json({
      success: true,
      message: `Order #${order.order_number} cancelled, stock returned and customer notified.${paid ? ' The payment was NOT refunded automatically — use "Refund" to return the money.' : ''}`,
    });
  } catch (error) {
    return orderFail(res, error, 'cancel the order');
  }
};

const refundOrder = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const result = await refundOrder_(Number(req.params.id), { amount, reason, adminEmail: req.admin && req.admin.email });
    return res.status(200).json({ success: true, message: `Refund of ₹${result.amount.toFixed(2)} issued via Razorpay (${result.refund_id}).`, ...result });
  } catch (error) {
    return orderFail(res, error, 'refund the order');
  }
};

const returnOrder = async (req, res) => {
  try {
    const order = await setOrderStatus(Number(req.params.id), 'Returned', { reason: req.body.reason || 'Item returned', adminEmail: req.admin && req.admin.email });
    return res.status(200).json({ success: true, message: `Return recorded for #${order.order_number}; stock returned. Issue a refund separately if needed.` });
  } catch (error) {
    return orderFail(res, error, 'record the return');
  }
};

const exchangeOrder = async (req, res) => {
  try {
    const numId = Number(req.params.id);
    const notes = req.body.exchange_notes || 'Exchange requested';
    await pool.query('UPDATE orders SET exchange_notes = ? WHERE id = ?', [notes, numId]);
    const order = await setOrderStatus(numId, 'Exchanged', { reason: notes, adminEmail: req.admin && req.admin.email });
    return res.status(200).json({ success: true, message: `Exchange recorded for #${order.order_number}` });
  } catch (error) {
    return orderFail(res, error, 'record the exchange');
  }
};

const addOrderTimelineEvent = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Timeline title is required.' });
    const [[order]] = await pool.query('SELECT id FROM orders WHERE id = ?', [Number(req.params.id)]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    await pool.query(
      'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, ?)',
      [order.id, title, description || '', status || null]
    );
    return res.status(201).json({ success: true, message: 'Timeline event recorded' });
  } catch (error) {
    return orderFail(res, error, 'add the timeline note');
  }
};

const BULK_STATUS = { ship: 'Shipped', deliver: 'Delivered', cancel: 'Cancelled' };

const bulkOrderAction = async (req, res) => {
  const { ids, action, extra } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No orders selected' });
  }
  const numIds = ids.map(Number).filter(Number.isInteger);

  try {
    if (BULK_STATUS[action]) {
      const failed = [];
      for (const id of numIds) {
        try {
          await setOrderStatus(id, BULK_STATUS[action], { shipping_partner: action === 'ship' ? extra?.courier : undefined, adminEmail: req.admin && req.admin.email });
        } catch (e) {
          failed.push(`#${id}: ${e.message}`);
        }
      }
      return res.status(failed.length ? 207 : 200).json({
        success: failed.length === 0,
        message: failed.length
          ? `${numIds.length - failed.length} updated, ${failed.length} failed — ${failed.join('; ')}`
          : `${numIds.length} orders marked "${BULK_STATUS[action]}" and customers notified`,
      });
    }

    if (action === 'soft_delete') await pool.query('UPDATE orders SET deleted_at = NOW() WHERE id IN (?)', [numIds]);
    else if (action === 'restore') await pool.query('UPDATE orders SET deleted_at = NULL WHERE id IN (?)', [numIds]);
    else if (action === 'permanent_delete') {
      // Paid orders are financial records: they can be hidden (soft delete) but not erased
      const [[paid]] = await pool.query("SELECT COUNT(*) AS cnt FROM orders WHERE id IN (?) AND payment_status IN ('Paid', 'Partially Refunded', 'Refunded')", [numIds]);
      if (paid.cnt > 0) {
        return res.status(409).json({ success: false, message: 'Paid orders cannot be permanently deleted (they are needed for accounting). Move them to Trash instead.' });
      }
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM order_items WHERE order_id IN (?)', [numIds]);
        await conn.query('DELETE FROM order_timeline WHERE order_id IN (?)', [numIds]);
        await conn.query('DELETE FROM orders WHERE id IN (?)', [numIds]);
        await conn.commit();
      } catch (e) {
        await conn.rollback().catch(() => {});
        throw e;
      } finally {
        conn.release();
      }
    } else {
      return res.status(400).json({ success: false, message: 'Unknown bulk action.' });
    }
    return res.status(200).json({ success: true, message: `Bulk action "${action}" completed for ${numIds.length} orders` });
  } catch (error) {
    return orderFail(res, error, 'apply the bulk action');
  }
};

const exportOrdersCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY id DESC');
    const headers = ['id', 'order_number', 'customer_name', 'customer_email', 'customer_phone', 'subtotal', 'tax_amount', 'shipping_fee', 'discount_amount', 'total_amount', 'status', 'payment_status', 'payment_method', 'razorpay_payment_id', 'shipping_partner', 'tracking_number', 'shipping_address', 'created_at'];
    const csv = [headers.join(','), ...rows.map((o) => headers.map((h) => csvCell(o[h])).join(','))].join('\n') + '\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leafora_orders.csv"');
    return res.send(csv);
  } catch (error) {
    return orderFail(res, error, 'export orders');
  }
};

// ─── CONTROL SUITE 5: CUSTOMERS MANAGEMENT ───
const getCustomers = async (req, res) => {
  try {
    const { status, tier, search } = req.query;
    let query = 'SELECT c.* FROM customers c WHERE 1=1';
    const params = [];

    if (status === 'deleted') {
      query += ' AND c.deleted_at IS NOT NULL';
    } else {
      query += ' AND c.deleted_at IS NULL';
      if (status && status !== 'all') {
        query += ' AND c.status = ?';
        params.push(status);
      }
    }

    if (tier && tier !== 'all') {
      query += ' AND c.loyalty_tier = ?';
      params.push(tier);
    }

    if (search) {
      const s = `%${search}%`;
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.id = ?)';
      params.push(s, s, s, isNaN(search) ? -1 : Number(search));
    }

    query += ' ORDER BY c.id DESC';
    const [rows] = await pool.query(query, params);

    // Enrich with counts
    for (let c of rows) {
      try {
        const [oCnt] = await pool.query('SELECT COUNT(*) as cnt FROM orders WHERE customer_email = ? OR customer_name = ?', [c.email, c.name]);
        c.orders_count = oCnt[0]?.cnt || 0;

        const [wCnt] = await pool.query('SELECT COUNT(*) as cnt FROM customer_wishlist WHERE customer_id = ?', [c.id]);
        c.wishlist_count = wCnt[0]?.cnt || 0;

        const [cCnt] = await pool.query('SELECT COUNT(*) as cnt FROM customer_cart WHERE customer_id = ?', [c.id]);
        c.cart_count = cCnt[0]?.cnt || 0;

        const [aCnt] = await pool.query('SELECT COUNT(*) as cnt FROM customer_addresses WHERE customer_id = ?', [c.id]);
        c.addresses_count = aCnt[0]?.cnt || 0;

        const [cpCnt] = await pool.query('SELECT COUNT(*) as cnt FROM customer_coupon_history WHERE customer_id = ?', [c.id]);
        c.coupons_count = cpCnt[0]?.cnt || 0;
      } catch (e) {}
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const [cRows] = await pool.query('SELECT * FROM customers WHERE id = ?', [numId]);
    if (cRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer record not found' });
    }
    const customer = cRows[0];

    // 1. Order History
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE customer_email = ? OR customer_name = ? ORDER BY id DESC',
      [customer.email, customer.name]
    );

    // 2. Addresses
    const [addresses] = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC',
      [numId]
    );

    // 3. Wishlist
    const [wishlist] = await pool.query(
      `SELECT w.id as wishlist_id, w.created_at as added_at, p.* 
       FROM customer_wishlist w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.customer_id = ?`,
      [numId]
    );

    // 4. Cart
    const [cart] = await pool.query(
      `SELECT c.id as cart_id, c.quantity, c.created_at as added_at, p.* 
       FROM customer_cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.customer_id = ?`,
      [numId]
    );

    // 5. Coupon History
    const [couponHistory] = await pool.query(
      'SELECT * FROM customer_coupon_history WHERE customer_id = ? ORDER BY id DESC',
      [numId]
    );

    return res.status(200).json({
      success: true,
      data: {
        customer,
        orders,
        addresses,
        wishlist,
        cart,
        coupon_history: couponHistory
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, loyalty_tier, name, email, phone, notes } = req.body;
    await pool.query(
      `UPDATE customers SET 
        status = COALESCE(?, status), 
        loyalty_tier = COALESCE(?, loyalty_tier),
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [status || null, loyalty_tier || null, name || null, email || null, phone || null, notes || null, id]
    );
    return res.status(200).json({ success: true, message: 'Customer profile updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    await pool.query('UPDATE customers SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json({ success: true, message: `Customer status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomerWalletPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet_balance, loyalty_points, referral_earnings } = req.body;

    await pool.query(
      `UPDATE customers SET 
        wallet_balance = COALESCE(?, wallet_balance), 
        loyalty_points = COALESCE(?, loyalty_points),
        referral_earnings = COALESCE(?, referral_earnings)
       WHERE id = ?`,
      [
        wallet_balance !== undefined ? parseFloat(wallet_balance) : null,
        loyalty_points !== undefined ? parseInt(loyalty_points) : null,
        referral_earnings !== undefined ? parseFloat(referral_earnings) : null,
        id
      ]
    );
    return res.status(200).json({ success: true, message: 'Wallet & Loyalty Points updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    if (force === 'true') {
      await pool.query('DELETE FROM customer_addresses WHERE customer_id = ?', [id]);
      await pool.query('DELETE FROM customer_wishlist WHERE customer_id = ?', [id]);
      await pool.query('DELETE FROM customer_cart WHERE customer_id = ?', [id]);
      await pool.query('DELETE FROM customer_coupon_history WHERE customer_id = ?', [id]);
      await pool.query('DELETE FROM customers WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: `Customer record #${id} permanently deleted` });
    } else {
      await pool.query('UPDATE customers SET deleted_at = NOW(), status = "Inactive" WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: `Customer record #${id} moved to Trash Bin` });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE customers SET deleted_at = NULL, status = "Active" WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: `Customer record #${id} restored to Active Users` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportCustomers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY id DESC');
    let csv = 'ID,Name,Email,Phone,Status,Loyalty Tier,Total Spent,Wallet Balance,Loyalty Points,Referral Earnings,Created At\n';
    rows.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.email}","${c.phone || ''}","${c.status}","${c.loyalty_tier}","${c.total_spent || 0}","${c.wallet_balance || 0}","${c.loyalty_points || 0}","${c.referral_earnings || 0}","${c.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leafora_customers_catalog.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ─── CONTROL SUITE 6 & 7: REVENUE & TRANSACTIONS ───
const getPayments = async (req, res) => {
  try {
    const { status, gateway, settlement, search } = req.query;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (gateway && gateway !== 'all') {
      query += ' AND gateway = ?';
      params.push(gateway);
    }

    if (settlement && settlement !== 'all') {
      query += ' AND settlement_status = ?';
      params.push(settlement);
    }

    if (search) {
      const s = `%${search}%`;
      query += ' AND (transaction_id LIKE ? OR order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentGatewaysConfig = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_gateways_config ORDER BY id ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePaymentGatewayConfig = async (req, res) => {
  try {
    const { gateway_name, key_id, key_secret, webhook_secret, environment, is_active } = req.body;
    if (!gateway_name) {
      return res.status(400).json({ success: false, message: 'Gateway name is required' });
    }

    await pool.query(
      `INSERT INTO payment_gateways_config (gateway_name, key_id, key_secret, webhook_secret, environment, is_active) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
        key_id = COALESCE(VALUES(key_id), key_id),
        key_secret = COALESCE(VALUES(key_secret), key_secret),
        webhook_secret = COALESCE(VALUES(webhook_secret), webhook_secret),
        environment = COALESCE(VALUES(environment), environment),
        is_active = COALESCE(VALUES(is_active), is_active)`,
      [
        gateway_name, key_id || '', key_secret || '', webhook_secret || '',
        environment || 'test', is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    return res.status(200).json({ success: true, message: `${gateway_name} API integration configuration updated successfully!` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Real Razorpay refund for a payment row (see services/orderService.js)
const issueRefund = async (req, res) => {
  try {
    const { refund_amount, reason } = req.body;
    const result = await refundPayment(Number(req.params.id), {
      amount: refund_amount,
      reason,
      adminEmail: req.admin && req.admin.email,
    });
    return res.status(200).json({
      success: true,
      message: `Refund of ₹${result.amount.toFixed(2)} issued via Razorpay (Refund ID: ${result.refund_id}). The customer has been e-mailed.`,
      refund_id: result.refund_id,
      refunded_amount: result.refunded_total,
      status: result.status,
    });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message });
    console.error('Refund failed:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Refund failed.' });
  }
};

// Razorpay payment links are not integrated, so nothing can be "resent". Be explicit instead of pretending.
const retryFailedPayment = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Payment retry links are not available. Ask the customer to place the order again from their cart.',
  });
};

const markCodCollected = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    await pool.query('UPDATE payments SET cod_collected = 1, status = "Completed", settlement_status = "Settled" WHERE id = ?', [numId]);

    const [[pay]] = await pool.query('SELECT * FROM payments WHERE id = ?', [numId]);
    if (pay && pay.order_id) {
      await pool.query('UPDATE orders SET payment_status = "Paid" WHERE id = ?', [pay.order_id]);
      await pool.query(
        'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, "Paid")',
        [pay.order_id, 'COD Cash Amount Deposited', `Courier partner confirmed COD collection of ₹${pay.amount}.`, 'Paid']
      );
    }

    return res.status(200).json({ success: true, message: `COD collection of ₹${pay ? pay.amount : ''} marked as collected and settled.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentRefundsLog = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_refunds ORDER BY id DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentSettlements = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_settlements ORDER BY id DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportRevenueReport = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY id DESC');
    let csv = 'Payment ID,Order ID,Order Number,Customer Name,Customer Email,Transaction ID,Amount,Refunded Amount,Gateway,Payment Method,Status,Settlement ID,Settlement Status,Date\n';
    rows.forEach(p => {
      csv += `"${p.id}","${p.order_id}","${p.order_number || ''}","${p.customer_name || ''}","${p.customer_email || ''}","${p.transaction_id}","${p.amount}","${p.refunded_amount || 0}","${p.gateway || ''}","${p.payment_method || ''}","${p.status}","${p.settlement_id || ''}","${p.settlement_status || ''}","${p.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments_export.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONTROL SUITE 10: REVIEWS ───

const getReviews = async (req, res) => {
  try {
    const { search, status, rating, is_reported_abuse, show_deleted, page = 1, limit = 20 } = req.query;
    let whereConditions = [];
    const params = [];

    if (show_deleted === 'true') {
      whereConditions.push('r.deleted_at IS NOT NULL');
    } else {
      whereConditions.push('r.deleted_at IS NULL');
    }

    if (search) {
      whereConditions.push('(r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.product_name LIKE ? OR r.comment LIKE ? OR r.title LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (status && status !== 'all') {
      whereConditions.push('r.status = ?');
      params.push(status);
    }

    if (rating && rating !== 'all') {
      whereConditions.push('r.rating = ?');
      params.push(parseInt(rating));
    }

    if (is_reported_abuse === 'true') {
      whereConditions.push('r.is_reported_abuse = 1');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM reviews r ${whereClause}`, params);
    const total = countRows[0].total;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT r.*, p.image as main_product_image 
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ${whereClause} 
      ORDER BY r.id DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [...params, limitNum, offset]);

    const formatted = rows.map(r => {
      let parsedImages = [];
      if (r.images) {
        try { parsedImages = typeof r.images === 'string' ? JSON.parse(r.images) : r.images; } catch (e) { parsedImages = []; }
      }
      return {
        ...r,
        images: parsedImages,
        product_image: r.product_image || r.main_product_image || null
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getReviews error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReviewDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT r.*, p.image as main_product_image, p.price as product_price, p.slug as product_slug
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const review = rows[0];
    let parsedImages = [];
    if (review.images) {
      try { parsedImages = typeof review.images === 'string' ? JSON.parse(review.images) : review.images; } catch (e) { parsedImages = []; }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...review,
        images: parsedImages,
        product_image: review.product_image || review.main_product_image || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_featured, is_verified_buyer } = req.body;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (is_featured !== undefined) {
      updates.push('is_featured = ?');
      params.push(is_featured ? 1 : 0);
    }
    if (is_verified_buyer !== undefined) {
      updates.push('is_verified_buyer = ?');
      params.push(is_verified_buyer ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update' });
    }

    params.push(id);
    await pool.query(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_reply } = req.body;

    await pool.query(
      'UPDATE reviews SET admin_reply = ?, admin_replied_at = NOW() WHERE id = ?',
      [admin_reply || null, id]
    );

    return res.status(200).json({ success: true, message: 'Admin response updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reportAbuseReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_reported_abuse, abuse_reason } = req.body;

    await pool.query(
      'UPDATE reviews SET is_reported_abuse = ?, abuse_reason = ? WHERE id = ?',
      [is_reported_abuse ? 1 : 0, is_reported_abuse ? (abuse_reason || 'Flagged by Admin') : null, id]
    );

    return res.status(200).json({ success: true, message: is_reported_abuse ? 'Review flagged for abuse' : 'Abuse flag removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    if (force === 'true') {
      await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: 'Review permanently deleted' });
    } else {
      await pool.query('UPDATE reviews SET deleted_at = NOW() WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: 'Review moved to trash' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const restoreReview = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE reviews SET deleted_at = NULL WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Review restored successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const {
      product_id,
      customer_name,
      customer_email,
      rating,
      title,
      comment,
      status = 'Approved',
      is_featured = 0,
      is_verified_buyer = 1,
      images = []
    } = req.body;

    if (!product_id || !customer_name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID, customer name, rating, and comment are required.' });
    }

    // Fetch product details if available
    let product_name = 'Product #' + product_id;
    let product_image = null;
    try {
      const [pRows] = await pool.query('SELECT name, image FROM products WHERE id = ?', [product_id]);
      if (pRows && pRows.length > 0) {
        product_name = pRows[0].name;
        product_image = pRows[0].image;
      }
    } catch (e) {
      console.warn('Could not fetch product details for review creation:', e);
    }

    const imagesJson = typeof images === 'string' ? images : JSON.stringify(Array.isArray(images) ? images : []);

    const [result] = await pool.query(
      `INSERT INTO reviews (product_id, product_name, product_image, customer_name, customer_email, rating, title, comment, status, is_featured, is_verified_buyer, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        product_name,
        product_image,
        customer_name,
        customer_email || null,
        parseInt(rating) || 5,
        title || null,
        comment,
        status || 'Approved',
        is_featured ? 1 : 0,
        is_verified_buyer ? 1 : 0,
        imagesJson
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReviewAnalytics = async (req, res) => {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_reviews,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_reviews,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_reviews,
        SUM(CASE WHEN is_reported_abuse = 1 THEN 1 ELSE 0 END) as reported_abuse_reviews,
        SUM(CASE WHEN is_verified_buyer = 1 THEN 1 ELSE 0 END) as verified_buyer_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star_1
      FROM reviews
      WHERE deleted_at IS NULL
    `);

    const stats = counts[0];
    const total = stats.total_reviews || 0;
    const avgRating = stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : '0.0';
    const verifiedPercent = total > 0 ? Math.round((stats.verified_buyer_reviews / total) * 100) : 0;

    const [topProducts] = await pool.query(`
      SELECT 
        product_id, 
        product_name, 
        COUNT(*) as review_count, 
        AVG(rating) as avg_rating
      FROM reviews
      WHERE deleted_at IS NULL AND status = 'Approved'
      GROUP BY product_id, product_name
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_reviews: total,
          average_rating: parseFloat(avgRating),
          pending_reviews: stats.pending_reviews || 0,
          approved_reviews: stats.approved_reviews || 0,
          rejected_reviews: stats.rejected_reviews || 0,
          reported_abuse_reviews: stats.reported_abuse_reviews || 0,
          verified_buyer_percent: verifiedPercent
        },
        star_distribution: {
          5: stats.star_5 || 0,
          4: stats.star_4 || 0,
          3: stats.star_3 || 0,
          2: stats.star_2 || 0,
          1: stats.star_1 || 0
        },
        top_rated_products: topProducts.map(p => ({
          ...p,
          avg_rating: parseFloat(p.avg_rating).toFixed(1)
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportReviewsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, product_name, customer_name, customer_email, rating, title, comment, status, is_verified_buyer, is_reported_abuse, admin_reply, created_at
      FROM reviews
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `);

    let csv = 'ID,Product Name,Customer Name,Customer Email,Rating,Title,Comment,Status,Verified Buyer,Reported Abuse,Admin Reply,Created At\n';
    rows.forEach(r => {
      const cleanComment = (r.comment || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanTitle = (r.title || '').replace(/"/g, '""');
      const cleanReply = (r.admin_reply || '').replace(/"/g, '""').replace(/\n/g, ' ');

      csv += `"${r.id}","${(r.product_name || '').replace(/"/g, '""')}","${(r.customer_name || '').replace(/"/g, '""')}","${r.customer_email || ''}","${r.rating}","${cleanTitle}","${cleanComment}","${r.status}","${r.is_verified_buyer ? 'Yes' : 'No'}","${r.is_reported_abuse ? 'Yes' : 'No'}","${cleanReply}","${r.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews_export.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONTROL SUITE 10B: HOMEPAGE CMS & LAYOUT BUILDER (database only) ───

const BANNER_TYPES = ['hero', 'offer', 'category', 'flash_sale'];

const toMysqlDateTime = (value) => {
  if (value === undefined) return undefined; // not sent
  if (value === null || String(value).trim() === '') return null; // cleared
  let v = String(value).replace('T', ' ');
  if (v.length === 16) v += ':00';
  return v;
};

const bannerFail = (res, action, error) => {
  console.error(`Banner ${action} failed:`, error.message);
  return res.status(500).json({ success: false, message: `Could not ${action} the banner. Please try again.` });
};

// Admin: all banners (filters optional). Public route is getPublicBanners.
const getHomepageBanners = async (req, res) => {
  try {
    const { type, active_only } = req.query;
    const conditions = [];
    const params = [];
    if (type && type !== 'all') { conditions.push('banner_type = ?'); params.push(type); }
    if (active_only === 'true' || active_only === '1') conditions.push('is_active = 1');
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`SELECT * FROM homepage_banners${where} ORDER BY display_order ASC, id DESC`, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Banner list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load banners.' });
  }
};

// Storefront: active banners only; expired flash sales are hidden
const getPublicBanners = async (req, res) => {
  try {
    const { type } = req.query;
    const params = [];
    let query = `SELECT * FROM homepage_banners WHERE is_active = 1
      AND (banner_type <> 'flash_sale' OR flash_sale_end_time IS NULL OR flash_sale_end_time > NOW())`;
    if (type && type !== 'all') { query += ' AND banner_type = ?'; params.push(type); }
    query += ' ORDER BY display_order ASC, id DESC';
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Public banner list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load banners.' });
  }
};

const createHomepageBanner = async (req, res) => {
  const {
    banner_type = 'hero', title, subtitle, desktop_image_url, mobile_image_url, link_url,
    button_text, category_id, flash_sale_end_time, display_order = 0, is_active = true
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, message: 'Banner headline / title is required' });
  }
  if (!desktop_image_url || !String(desktop_image_url).trim()) {
    return res.status(400).json({ success: false, message: 'Desktop banner image URL or upload is required' });
  }
  if (!BANNER_TYPES.includes(banner_type)) {
    return res.status(400).json({ success: false, message: 'Unknown banner type.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO homepage_banners
        (banner_type, title, subtitle, desktop_image_url, mobile_image_url, link_url, button_text, category_id, flash_sale_end_time, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        banner_type, String(title).trim(), subtitle ? String(subtitle).trim() : null, desktop_image_url,
        mobile_image_url || desktop_image_url, link_url || null, button_text || 'Shop Now',
        category_id && String(category_id).trim() !== '' ? Number(category_id) : null,
        toMysqlDateTime(flash_sale_end_time) ?? null, parseInt(display_order, 10) || 0, is_active ? 1 : 0
      ]
    );
    const [[banner]] = await pool.query('SELECT * FROM homepage_banners WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Homepage banner created successfully', banner_id: result.insertId, banner });
  } catch (error) {
    return bannerFail(res, 'create', error);
  }
};

const updateHomepageBanner = async (req, res) => {
  const {
    banner_type, title, subtitle, desktop_image_url, mobile_image_url, link_url,
    button_text, category_id, flash_sale_end_time, display_order, is_active
  } = req.body;

  if (banner_type !== undefined && !BANNER_TYPES.includes(banner_type)) {
    return res.status(400).json({ success: false, message: 'Unknown banner type.' });
  }

  // Build SET list from fields actually sent, so toggling "active" never wipes other fields
  const sets = [];
  const params = [];
  const set = (col, val) => { sets.push(`${col} = ?`); params.push(val); };
  if (banner_type !== undefined) set('banner_type', banner_type);
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ success: false, message: 'Banner title cannot be empty.' });
    set('title', String(title).trim());
  }
  if (subtitle !== undefined) set('subtitle', subtitle ? String(subtitle).trim() : null);
  if (desktop_image_url) set('desktop_image_url', desktop_image_url);
  if (mobile_image_url !== undefined) set('mobile_image_url', mobile_image_url || null);
  if (link_url !== undefined) set('link_url', link_url || null);
  if (button_text !== undefined) set('button_text', button_text || 'Shop Now');
  if (category_id !== undefined) set('category_id', category_id && String(category_id).trim() !== '' ? Number(category_id) : null);
  const flashEnd = toMysqlDateTime(flash_sale_end_time);
  if (flashEnd !== undefined) set('flash_sale_end_time', flashEnd);
  if (display_order !== undefined && display_order !== '') set('display_order', parseInt(display_order, 10) || 0);
  if (is_active !== undefined) set('is_active', is_active ? 1 : 0);

  if (sets.length === 0) return res.status(400).json({ success: false, message: 'Nothing to update.' });

  try {
    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE homepage_banners SET ${sets.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    return res.status(200).json({ success: true, message: 'Homepage banner updated successfully' });
  } catch (error) {
    return bannerFail(res, 'update', error);
  }
};

const deleteHomepageBanner = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM homepage_banners WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    return res.status(200).json({ success: true, message: 'Homepage banner deleted successfully' });
  } catch (error) {
    return bannerFail(res, 'delete', error);
  }
};

const reorderRows = async (table, orders) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of orders) {
      await conn.query(`UPDATE ${table} SET display_order = ? WHERE id = ?`, [Number(item.display_order) || 0, Number(item.id)]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
};

const reorderHomepageBanners = async (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ success: false, message: 'Invalid orders format' });
  try {
    await reorderRows('homepage_banners', orders);
    return res.status(200).json({ success: true, message: 'Banner order updated successfully' });
  } catch (error) {
    return bannerFail(res, 'reorder', error);
  }
};

const getHomepageSections = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM homepage_sections ORDER BY display_order ASC, id ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Section list failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load homepage sections.' });
  }
};

const updateHomepageSection = async (req, res) => {
  try {
    const { custom_title, custom_subtitle, item_limit, is_active } = req.body;
    const [result] = await pool.query(
      `UPDATE homepage_sections SET
        custom_title = COALESCE(?, custom_title), custom_subtitle = COALESCE(?, custom_subtitle),
        item_limit = COALESCE(?, item_limit), is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        custom_title ?? null, custom_subtitle ?? null,
        item_limit !== undefined && item_limit !== '' ? Math.max(1, parseInt(item_limit, 10) || 1) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        req.params.id
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Section not found.' });
    return res.status(200).json({ success: true, message: 'Section settings updated successfully' });
  } catch (error) {
    console.error('Section update failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not update the section.' });
  }
};

const reorderHomepageSections = async (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ success: false, message: 'Invalid orders format' });
  try {
    await reorderRows('homepage_sections', orders);
    return res.status(200).json({ success: true, message: 'Homepage section order updated successfully' });
  } catch (error) {
    console.error('Section reorder failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not reorder sections.' });
  }
};

const getCuratedProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT id, name, sku, price, image_url, image_url AS image, is_featured, is_trending, is_new_arrival,
              COALESCE(is_best_seller, 0) AS is_best_seller, is_active
       FROM products WHERE deleted_at IS NULL ORDER BY id DESC`
    );
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Curated products failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load products.' });
  }
};

const curateProducts = async (req, res) => {
  const { id, is_featured, is_trending, is_new_arrival, is_best_seller } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Product ID is required' });

  const updates = [];
  const params = [];
  if (is_featured !== undefined) { updates.push('is_featured = ?'); params.push(is_featured ? 1 : 0); }
  if (is_trending !== undefined) { updates.push('is_trending = ?'); params.push(is_trending ? 1 : 0); }
  if (is_new_arrival !== undefined) { updates.push('is_new_arrival = ?'); params.push(is_new_arrival ? 1 : 0); }
  if (is_best_seller !== undefined) { updates.push('is_best_seller = ?'); params.push(is_best_seller ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ success: false, message: 'Nothing to update.' });

  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    clearProductCache();
    return res.status(200).json({ success: true, message: 'Product curation flags updated successfully' });
  } catch (error) {
    console.error('Curate products failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not update the product.' });
  }
};

// ─── CONTROL SUITE 12: SYSTEM SETTINGS & ADMINISTRATION (database only) ───

const sysFail = (res, what, error) => {
  console.error(`${what} failed:`, error.message);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'An admin user with this e-mail already exists.' });
  return res.status(500).json({ success: false, message: `${what} failed. Please try again.` });
};

const parsePermissions = (value) => {
  if (Array.isArray(value)) return value;
  try { const arr = JSON.parse(value || '[]'); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
};

const logActivity = (req, module, action) =>
  pool.query('INSERT INTO activity_logs (admin_name, module, action, ip_address) VALUES (?, ?, ?, ?)', [
    (req.admin && req.admin.email) || 'admin', module, action, req.ip,
  ]).catch(() => {});

const getSystemSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, key_value FROM system_settings');
    const data = Object.fromEntries(rows.map((r) => [r.key_name, r.key_value ?? '']));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sysFail(res, 'Loading settings', error);
  }
};

const updateSystemSettingsGroup = async (req, res) => {
  const settingsObj = req.body.settings || {};
  const keys = Object.keys(settingsObj).filter((k) => /^[a-z0-9_]{1,100}$/i.test(k));
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No settings provided.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of keys) {
      await conn.query(
        'INSERT INTO system_settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)',
        [key, String(settingsObj[key] ?? '')]
      );
    }
    await conn.commit();
    logActivity(req, 'Settings', `Updated ${keys.length} setting(s)`);
    return res.status(200).json({ success: true, message: 'Settings saved.' });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return sysFail(res, 'Saving settings', error);
  } finally {
    conn.release();
  }
};

const getSystemUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, permissions, is_active, last_login_at, created_at FROM admin_users ORDER BY id ASC');
    return res.status(200).json({ success: true, data: rows.map((u) => ({ ...u, permissions: parsePermissions(u.permissions) })) });
  } catch (error) {
    return sysFail(res, 'Loading admin users', error);
  }
};

const ADMIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createSystemUser = async (req, res) => {
  const { name, email, phone, role, permissions, is_active } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!name || !ADMIN_EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Name and a valid e-mail are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO admin_users (name, email, phone, role, permissions, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [String(name).trim(), cleanEmail, phone || '', role || 'Store Manager', JSON.stringify(parsePermissions(permissions)), is_active === false ? 0 : 1]
    );
    logActivity(req, 'Admin Users', `Created admin user ${cleanEmail}`);
    return res.status(201).json({ success: true, message: 'Admin user created. They can now sign in with an e-mailed code.', id: result.insertId });
  } catch (error) {
    return sysFail(res, 'Creating admin user', error);
  }
};

const updateSystemUser = async (req, res) => {
  const { name, email, phone, role, permissions, is_active } = req.body;
  const cleanEmail = email !== undefined ? String(email).trim().toLowerCase() : undefined;
  if (cleanEmail !== undefined && !ADMIN_EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid e-mail.' });
  }
  try {
    const [[target]] = await pool.query('SELECT email FROM admin_users WHERE id = ?', [req.params.id]);
    if (!target) return res.status(404).json({ success: false, message: 'Admin user not found.' });
    if (req.admin && target.email.toLowerCase() === req.admin.email && is_active === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }
    await pool.query(
      `UPDATE admin_users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
         role = COALESCE(?, role), permissions = COALESCE(?, permissions), is_active = COALESCE(?, is_active) WHERE id = ?`,
      [
        name ?? null, cleanEmail ?? null, phone ?? null, role ?? null,
        permissions !== undefined ? JSON.stringify(parsePermissions(permissions)) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        req.params.id,
      ]
    );
    // Deactivated admins lose their sessions immediately
    if (is_active === false) {
      await pool.query("DELETE FROM auth_sessions WHERE subject_type = 'admin' AND email = ?", [target.email.toLowerCase()]).catch(() => {});
    }
    logActivity(req, 'Admin Users', `Updated admin user ${target.email}`);
    return res.status(200).json({ success: true, message: 'Admin user updated.' });
  } catch (error) {
    return sysFail(res, 'Updating admin user', error);
  }
};

const deleteSystemUser = async (req, res) => {
  try {
    const [[target]] = await pool.query('SELECT email FROM admin_users WHERE id = ?', [req.params.id]);
    if (!target) return res.status(404).json({ success: false, message: 'Admin user not found.' });
    if (req.admin && target.email.toLowerCase() === req.admin.email) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await pool.query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
    await pool.query("DELETE FROM auth_sessions WHERE subject_type = 'admin' AND email = ?", [target.email.toLowerCase()]).catch(() => {});
    logActivity(req, 'Admin Users', `Deleted admin user ${target.email}`);
    return res.status(200).json({ success: true, message: 'Admin user deleted.' });
  } catch (error) {
    return sysFail(res, 'Deleting admin user', error);
  }
};

const getSystemRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM admin_roles ORDER BY id ASC');
    return res.status(200).json({ success: true, data: rows.map((r) => ({ ...r, permissions: parsePermissions(r.permissions) })) });
  } catch (error) {
    return sysFail(res, 'Loading roles', error);
  }
};

const updateSystemRole = async (req, res) => {
  const { role_name, description, permissions } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE admin_roles SET role_name = COALESCE(?, role_name), description = COALESCE(?, description), permissions = COALESCE(?, permissions) WHERE id = ?',
      [role_name ?? null, description ?? null, permissions !== undefined ? JSON.stringify(parsePermissions(permissions)) : null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Role not found.' });
    logActivity(req, 'Roles', `Updated role #${req.params.id}`);
    return res.status(200).json({ success: true, message: 'Role updated.' });
  } catch (error) {
    return sysFail(res, 'Updating role', error);
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 200');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sysFail(res, 'Loading activity logs', error);
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM login_history ORDER BY id DESC LIMIT 200');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sysFail(res, 'Loading login history', error);
  }
};

const exportSystemBackup = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM system_settings');
    const [users] = await pool.query('SELECT id, name, email, phone, role, permissions, is_active, last_login_at, created_at FROM admin_users');
    const [roles] = await pool.query('SELECT * FROM admin_roles');
    const [logs] = await pool.query('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 5000');
    const [logins] = await pool.query('SELECT * FROM login_history ORDER BY id DESC LIMIT 5000');

    const backupData = {
      exported_at: new Date().toISOString(),
      store: 'Leafora Life Sciences',
      data: { system_settings: settings, admin_users: users, admin_roles: roles, activity_logs: logs, login_history: logins },
    };
    logActivity(req, 'Backup', 'Exported admin configuration backup');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="leafora_backup_${Date.now()}.json"`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    return sysFail(res, 'Backup export', error);
  }
};

// ─── CONTROL SUITE 11: REFERRALS & WALLET SUITE ───

const getReferrals = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM referrals WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (referrer_name LIKE ? OR referrer_email LIKE ? OR referee_name LIKE ? OR referee_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM referrals');
    const [[{ pendingCount }]] = await pool.query('SELECT COUNT(*) as pendingCount FROM referrals WHERE status = "Pending"');
    const [[{ approvedCount }]] = await pool.query('SELECT COUNT(*) as approvedCount FROM referrals WHERE status = "Approved"');
    const [[{ rejectedCount }]] = await pool.query('SELECT COUNT(*) as rejectedCount FROM referrals WHERE status = "Rejected"');
    const [[{ approvedAmount }]] = await pool.query('SELECT COALESCE(SUM(reward_amount), 0) as approvedAmount FROM referrals WHERE status = "Approved"');

    return res.status(200).json({
      success: true,
      data: rows,
      total,
      metrics: {
        totalReferrals: total,
        pendingCount,
        approvedCount,
        rejectedCount,
        approvedAmount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const [[ref]] = await pool.query('SELECT * FROM referrals WHERE id = ?', [id]);
    if (!ref) {
      return res.status(404).json({ success: false, message: 'Referral record not found' });
    }

    if (status === 'Approved' && ref.status !== 'Approved') {
      const rewardAmt = parseFloat(ref.reward_amount || 15.00);

      // Find referrer customer
      let referrerCust = null;
      if (ref.referrer_id) {
        const [[cust]] = await pool.query('SELECT * FROM customers WHERE id = ?', [ref.referrer_id]);
        referrerCust = cust;
      }
      if (!referrerCust && ref.referrer_email) {
        const [[cust]] = await pool.query('SELECT * FROM customers WHERE email = ?', [ref.referrer_email]);
        referrerCust = cust;
      }

      if (referrerCust) {
        const newBal = parseFloat(referrerCust.wallet_balance || 0) + rewardAmt;
        const newEarnings = parseFloat(referrerCust.referral_earnings || 0) + rewardAmt;
        await pool.query(
          'UPDATE customers SET wallet_balance = ?, referral_earnings = ? WHERE id = ?',
          [newBal, newEarnings, referrerCust.id]
        );

        // Record wallet transaction audit
        await pool.query(
          `INSERT INTO wallet_transactions (customer_id, customer_name, customer_email, transaction_type, amount, source, reference_id, description, balance_after)
           VALUES (?, ?, ?, 'credit', ?, 'referral_bonus', ?, ?, ?)`,
          [
            referrerCust.id,
            referrerCust.name,
            referrerCust.email,
            rewardAmt,
            `REF-${id}`,
            `Referral reward approved for inviting ${ref.referee_name || ref.referee_email}`,
            newBal
          ]
        );
      }

      await pool.query('UPDATE referrals SET status = "Approved", rejection_reason = NULL WHERE id = ?', [id]);
      return res.status(200).json({
        success: true,
        message: `Referral #${id} APPROVED! ₹${rewardAmt.toFixed(2)} wallet credit granted to ${ref.referrer_name}.`
      });

    } else if (status === 'Rejected') {
      await pool.query('UPDATE referrals SET status = "Rejected", rejection_reason = ? WHERE id = ?', [rejection_reason || 'Rejected by administrator', id]);
      return res.status(200).json({ success: true, message: `Referral #${id} REJECTED.` });
    } else {
      await pool.query('UPDATE referrals SET status = ? WHERE id = ?', [status || 'Pending', id]);
      return res.status(200).json({ success: true, message: `Referral #${id} status set to ${status}` });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReferralSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM referral_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          referrer_reward_amount: 15.00,
          referee_discount_amount: 10.00,
          min_order_amount: 30.00,
          signup_bonus_amount: 5.00,
          min_cashout_threshold: 25.00,
          max_wallet_balance: 500.00,
          is_program_active: 1
        }
      });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateReferralSettings = async (req, res) => {
  try {
    const {
      referrer_reward_amount,
      referee_discount_amount,
      min_order_amount,
      signup_bonus_amount,
      min_cashout_threshold,
      max_wallet_balance,
      is_program_active
    } = req.body;

    const [rows] = await pool.query('SELECT id FROM referral_settings LIMIT 1');
    if (rows.length > 0) {
      await pool.query(
        `UPDATE referral_settings SET 
          referrer_reward_amount = COALESCE(?, referrer_reward_amount),
          referee_discount_amount = COALESCE(?, referee_discount_amount),
          min_order_amount = COALESCE(?, min_order_amount),
          signup_bonus_amount = COALESCE(?, signup_bonus_amount),
          min_cashout_threshold = COALESCE(?, min_cashout_threshold),
          max_wallet_balance = COALESCE(?, max_wallet_balance),
          is_program_active = COALESCE(?, is_program_active)
         WHERE id = ?`,
        [
          referrer_reward_amount !== undefined ? parseFloat(referrer_reward_amount) : null,
          referee_discount_amount !== undefined ? parseFloat(referee_discount_amount) : null,
          min_order_amount !== undefined ? parseFloat(min_order_amount) : null,
          signup_bonus_amount !== undefined ? parseFloat(signup_bonus_amount) : null,
          min_cashout_threshold !== undefined ? parseFloat(min_cashout_threshold) : null,
          max_wallet_balance !== undefined ? parseFloat(max_wallet_balance) : null,
          is_program_active !== undefined ? (is_program_active ? 1 : 0) : null,
          rows[0].id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO referral_settings (referrer_reward_amount, referee_discount_amount, min_order_amount, signup_bonus_amount, min_cashout_threshold, max_wallet_balance, is_program_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          parseFloat(referrer_reward_amount) || 15.00,
          parseFloat(referee_discount_amount) || 10.00,
          parseFloat(min_order_amount) || 30.00,
          parseFloat(signup_bonus_amount) || 5.00,
          parseFloat(min_cashout_threshold) || 25.00,
          parseFloat(max_wallet_balance) || 500.00,
          is_program_active ? 1 : 0
        ]
      );
    }

    return res.status(200).json({ success: true, message: 'Referral Reward & Wallet Settings updated successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getWalletTransactions = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM wallet_transactions WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR reference_id LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      query += ' AND transaction_type = ?';
      params.push(type);
    }

    query += ' ORDER BY id DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM wallet_transactions');

    return res.status(200).json({
      success: true,
      data: rows,
      total
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const manualWalletAdjustment = async (req, res) => {
  try {
    const { customer_id, transaction_type, amount, description } = req.body;
    if (!customer_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and positive amount are required' });
    }

    const [[cust]] = await pool.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (!cust) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    const numAmt = parseFloat(amount);
    let newBal = parseFloat(cust.wallet_balance || 0);

    if (transaction_type === 'debit') {
      if (newBal < numAmt) {
        return res.status(400).json({ success: false, message: `Insufficient wallet balance (₹${newBal.toFixed(2)}) for debit` });
      }
      newBal -= numAmt;
    } else {
      newBal += numAmt;
    }

    await pool.query('UPDATE customers SET wallet_balance = ? WHERE id = ?', [newBal, customer_id]);

    const refId = `ADM-ADJ-${Math.floor(1000 + Math.random() * 9000)}`;

    await pool.query(
      `INSERT INTO wallet_transactions (customer_id, customer_name, customer_email, transaction_type, amount, source, reference_id, description, balance_after)
       VALUES (?, ?, ?, ?, ?, 'admin_adjustment', ?, ?, ?)`,
      [
        cust.id,
        cust.name,
        cust.email,
        transaction_type === 'debit' ? 'debit' : 'credit',
        numAmt,
        refId,
        description || `Manual admin wallet ${transaction_type === 'debit' ? 'debit' : 'credit'} adjustment`,
        newBal
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Manual wallet ${transaction_type === 'debit' ? 'debit (-)' : 'credit (+)'} of ₹${numAmt.toFixed(2)} applied for ${cust.name}. New balance: ₹${newBal.toFixed(2)}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReferralAnalytics = async (req, res) => {
  try {
    const [[{ totalReferrals }]] = await pool.query('SELECT COUNT(*) as totalReferrals FROM referrals');
    const [[{ pendingCount }]] = await pool.query('SELECT COUNT(*) as pendingCount FROM referrals WHERE status = "Pending"');
    const [[{ approvedCount }]] = await pool.query('SELECT COUNT(*) as approvedCount FROM referrals WHERE status = "Approved"');
    const [[{ rejectedCount }]] = await pool.query('SELECT COUNT(*) as rejectedCount FROM referrals WHERE status = "Rejected"');
    const [[{ totalDisbursed }]] = await pool.query('SELECT COALESCE(SUM(reward_amount), 0) as totalDisbursed FROM referrals WHERE status = "Approved"');
    const [[{ pendingDisbursement }]] = await pool.query('SELECT COALESCE(SUM(reward_amount), 0) as pendingDisbursement FROM referrals WHERE status = "Pending"');

    const [topReferrers] = await pool.query(`
      SELECT referrer_name, referrer_email, COUNT(*) as referral_count, SUM(CASE WHEN status = "Approved" THEN reward_amount ELSE 0 END) as total_earned
      FROM referrals
      GROUP BY referrer_email, referrer_name
      ORDER BY referral_count DESC, total_earned DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      analytics: {
        totalReferrals,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalDisbursed,
        pendingDisbursement,
        topReferrers
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportReferralsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM referrals ORDER BY id DESC');
    let csv = 'ID,Referrer Name,Referrer Email,Referee Name,Referee Email,Reward Amount,Referee Discount,Status,Rejection Reason,Created At\n';
    rows.forEach(r => {
      csv += `"${r.id}","${r.referrer_name}","${r.referrer_email}","${r.referee_name}","${r.referee_email}","${r.reward_amount}","${r.referee_discount}","${r.status}","${r.rejection_reason || ''}","${r.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="referrals_export.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportWalletTransactionsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM wallet_transactions ORDER BY id DESC');
    let csv = 'ID,Customer ID,Customer Name,Customer Email,Transaction Type,Amount,Source,Reference ID,Description,Balance After,Created At\n';
    rows.forEach(w => {
      csv += `"${w.id}","${w.customer_id}","${w.customer_name}","${w.customer_email}","${w.transaction_type}","${w.amount}","${w.source}","${w.reference_id || ''}","${w.description || ''}","${w.balance_after}","${w.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="wallet_transactions_export.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONTROL SUITE 13: SHIPROCKET SHIPPING MANAGEMENT ───
const getShiprocketConfig = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shiprocket_config ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { api_email: '', api_password: '', secret_key: '', environment: 'production', is_connected: 0, auto_sync: 0, token: '' }
      });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateShiprocketConfig = async (req, res) => {
  try {
    const { api_email, api_password, secret_key, environment, auto_sync } = req.body;
    const [rows] = await pool.query('SELECT id FROM shiprocket_config LIMIT 1');
    const newToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTg3MjE0LCJlbWFpbCI6Ii${Buffer.from(api_email || 'sr').toString('base64')}"}`;

    if (rows.length > 0) {
      await pool.query(
        `UPDATE shiprocket_config SET 
          api_email = COALESCE(?, api_email),
          api_password = COALESCE(?, api_password),
          secret_key = COALESCE(?, secret_key),
          environment = COALESCE(?, environment),
          auto_sync = COALESCE(?, auto_sync),
          token = ?,
          is_connected = 1
         WHERE id = ?`,
        [api_email || null, api_password || null, secret_key || null, environment || null, auto_sync !== undefined ? (auto_sync ? 1 : 0) : null, newToken, rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO shiprocket_config (api_email, api_password, secret_key, environment, auto_sync, token, is_connected) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [api_email || 'shipping@leaforalifescience.com', api_password || 'pass', secret_key || 'key', environment || 'production', auto_sync ? 1 : 0, newToken]
      );
    }

    return res.status(200).json({ success: true, message: 'Shiprocket API credentials updated and token re-authenticated successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getShiprocketPickupLocations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shiprocket_pickup_locations ORDER BY is_primary DESC, id ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addShiprocketPickupLocation = async (req, res) => {
  try {
    const { location_name, contact_name, email, phone, address_line1, address_line2, city, state, pincode, country, is_primary } = req.body;
    if (!location_name || !contact_name || !address_line1 || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Location name, contact, address, city and pincode are required' });
    }

    if (is_primary) {
      await pool.query('UPDATE shiprocket_pickup_locations SET is_primary = 0');
    }

    const [result] = await pool.query(
      `INSERT INTO shiprocket_pickup_locations 
        (location_name, contact_name, email, phone, address_line1, address_line2, city, state, pincode, country, is_primary, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        location_name, contact_name, email || '', phone || '', address_line1, address_line2 || '',
        city, state || '', pincode, country || 'India', is_primary ? 1 : 0
      ]
    );

    return res.status(201).json({ success: true, message: `Pickup Location "${location_name}" created`, id: result.insertId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateShiprocketPickupLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_name, contact_name, email, phone, address_line1, address_line2, city, state, pincode, country, is_primary, status } = req.body;

    if (is_primary) {
      await pool.query('UPDATE shiprocket_pickup_locations SET is_primary = 0');
    }

    await pool.query(
      `UPDATE shiprocket_pickup_locations SET 
        location_name = COALESCE(?, location_name),
        contact_name = COALESCE(?, contact_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address_line1 = COALESCE(?, address_line1),
        address_line2 = COALESCE(?, address_line2),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        country = COALESCE(?, country),
        is_primary = COALESCE(?, is_primary),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        location_name || null, contact_name || null, email || null, phone || null,
        address_line1 || null, address_line2 || null, city || null, state || null,
        pincode || null, country || null, is_primary !== undefined ? (is_primary ? 1 : 0) : null,
        status || null, id
      ]
    );

    return res.status(200).json({ success: true, message: 'Pickup location updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteShiprocketPickupLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM shiprocket_pickup_locations WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Pickup location deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const calculateShippingRates = async (req, res) => {
  try {
    const { pickup_pincode = '500033', delivery_pincode = '400050', weight = 0.5, length = 10, width = 10, height = 10, cod = 0 } = req.body;
    const w = Number(weight) || 0.5;
    const isCod = Number(cod) === 1;

    // Simulate smart rate recommendation logic
    const couriers = [
      {
        id: 1,
        courier_name: 'BlueDart Express Air',
        mode: 'Air',
        rate: Number((12.50 + w * 4.0 + (isCod ? 2.5 : 0)).toFixed(2)),
        etd: '1-2 Days',
        rating: 4.8,
        min_weight: '0.50 kg',
        badge: 'Fastest Air',
        cod_available: true
      },
      {
        id: 2,
        courier_name: 'Delhivery Surface',
        mode: 'Surface',
        rate: Number((6.80 + w * 2.5 + (isCod ? 1.8 : 0)).toFixed(2)),
        etd: '3-4 Days',
        rating: 4.5,
        min_weight: '0.50 kg',
        badge: 'Best Value',
        cod_available: true
      },
      {
        id: 3,
        courier_name: 'FedEx Express Priority',
        mode: 'Air',
        rate: Number((18.00 + w * 5.0 + (isCod ? 3.0 : 0)).toFixed(2)),
        etd: '1 Day',
        rating: 4.9,
        min_weight: '1.00 kg',
        badge: 'Top Rated',
        cod_available: true
      },
      {
        id: 4,
        courier_name: 'Xpressbees Air',
        mode: 'Air',
        rate: Number((9.90 + w * 3.2 + (isCod ? 2.0 : 0)).toFixed(2)),
        etd: '2 Days',
        rating: 4.4,
        min_weight: '0.50 kg',
        badge: 'Economy Air',
        cod_available: true
      },
      {
        id: 5,
        courier_name: 'DTDC Express Gold',
        mode: 'Surface',
        rate: Number((7.50 + w * 2.8 + (isCod ? 2.0 : 0)).toFixed(2)),
        etd: '2-3 Days',
        rating: 4.6,
        min_weight: '0.50 kg',
        badge: 'Reliable',
        cod_available: true
      }
    ];

    return res.status(200).json({
      success: true,
      pickup_pincode,
      delivery_pincode,
      weight: w,
      volumetric_weight: Number(((length * width * height) / 5000).toFixed(2)),
      couriers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getShiprocketShipments = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM shiprocket_shipments WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      const s = `%${search}%`;
      query += ' AND (order_number LIKE ? OR awb_code LIKE ? OR courier_name LIKE ? OR tracking_number LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateShiprocketAwb = async (req, res) => {
  try {
    const { order_id, order_number, courier_name, pickup_location_id, pickup_location_name, weight, length, width, height } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const awbCode = `SR-AWB-${Math.floor(100000 + Math.random() * 900000)}`;
    const srOrdId = `SR-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const shpId = `SR-SHP-${Math.floor(8000 + Math.random() * 1000)}`;
    const trackUrl = `https://track.shiprocket.in/${awbCode}`;
    const cName = courier_name || 'BlueDart Express Air';
    const pLocName = pickup_location_name || 'Hyderabad HQ Vault';

    const [result] = await pool.query(
      `INSERT INTO shiprocket_shipments 
        (order_id, order_number, shiprocket_order_id, shipment_id, awb_code, courier_name, pickup_location_id, pickup_location_name, status, tracking_url, freight_charges, weight, length, width, height) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AWB Generated', ?, 14.50, ?, ?, ?, ?)`,
      [
        order_id, order_number || `ORD-${order_id}`, srOrdId, shpId, awbCode, cName,
        pickup_location_id || 1, pLocName, trackUrl,
        Number(weight || 0.5), Number(length || 10), Number(width || 10), Number(height || 10)
      ]
    );

    // Update main order record
    await pool.query(
      'UPDATE orders SET tracking_number = ?, shipping_partner = ?, status = "Confirmed" WHERE id = ? OR order_number = ?',
      [awbCode, cName, order_id, order_number || `ORD-${order_id}`]
    );

    // Add timeline log
    await pool.query(
      'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, "Confirmed")',
      [order_id, `Shiprocket AWB Generated (${awbCode})`, `Assigned ${cName} via Shiprocket. Tracking AWB: ${awbCode}`, 'Confirmed']
    );

    return res.status(201).json({
      success: true,
      message: `AWB ${awbCode} generated successfully for Order #${order_number || order_id}!`,
      awb_code: awbCode,
      shipment_id: shpId,
      id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const scheduleShiprocketPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_date, time_slot } = req.body;
    const pkpToken = `PKP-${Math.floor(10000 + Math.random() * 90000)}`;

    await pool.query(
      'UPDATE shiprocket_shipments SET status = "Pickup Scheduled", pickup_scheduled_date = ?, pickup_token_number = ? WHERE id = ?',
      [pickup_date || new Date().toISOString().slice(0, 10), pkpToken, id]
    );

    const [[shp]] = await pool.query('SELECT * FROM shiprocket_shipments WHERE id = ?', [id]);
    if (shp && shp.order_id) {
      await pool.query('UPDATE orders SET status = "Processing" WHERE id = ?', [shp.order_id]);
      await pool.query(
        'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, "Processing")',
        [shp.order_id, 'Courier Pickup Scheduled', `Pickup scheduled for ${pickup_date || 'today'} (${time_slot || '10 AM - 1 PM'}). Token: ${pkpToken}`, 'Processing']
      );
    }

    return res.status(200).json({
      success: true,
      message: `Pickup scheduled successfully! Token #${pkpToken}`,
      pickup_token: pkpToken
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateShiprocketLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const [[shp]] = await pool.query('SELECT * FROM shiprocket_shipments WHERE id = ?', [id]);
    if (!shp) {
      return res.status(404).json({ success: false, message: 'Shipment record not found' });
    }

    const [[ord]] = await pool.query('SELECT * FROM orders WHERE id = ? OR order_number = ?', [shp.order_id, shp.order_number]);

    return res.status(200).json({
      success: true,
      data: {
        awb_code: shp.awb_code,
        order_number: shp.order_number,
        courier_name: shp.courier_name,
        pickup_location: shp.pickup_location_name,
        weight: shp.weight,
        dimensions: `${shp.length}x${shp.width}x${shp.height} cm`,
        customer_name: ord ? ord.customer_name : 'Customer',
        customer_address: ord ? ord.shipping_address : 'Standard Address',
        customer_phone: ord ? ord.customer_phone : '+91 9876543210',
        payment_mode: ord && ord.payment_status === 'Paid' ? 'PREPAID' : 'COD'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelShiprocketShipment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE shiprocket_shipments SET status = "Cancelled" WHERE id = ?', [id]);
    const [[shp]] = await pool.query('SELECT * FROM shiprocket_shipments WHERE id = ?', [id]);
    if (shp && shp.order_id) {
      await pool.query(
        'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, "Cancelled")',
        [shp.order_id, 'Shiprocket Shipment Cancelled', `Shipment AWB ${shp.awb_code} cancelled on Shiprocket portal.`, 'Cancelled']
      );
    }
    return res.status(200).json({ success: true, message: 'Shipment cancelled on Shiprocket' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const trackShiprocketShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const [[shp]] = await pool.query('SELECT * FROM shiprocket_shipments WHERE id = ? OR awb_code = ?', [id, id]);
    if (!shp) {
      return res.status(404).json({ success: false, message: 'Shipment tracking data not found' });
    }

    const checkpoints = [
      { status: 'Manifested', location: shp.pickup_location_name || 'Hyderabad HQ', timestamp: '2026-09-08 09:30 AM', activity: 'Shipment data electronically submitted to courier portal.' },
      { status: 'Picked Up', location: shp.pickup_location_name || 'Hyderabad HQ', timestamp: '2026-09-08 11:45 AM', activity: 'Package collected by courier dispatch van.' },
      { status: 'In Transit', location: 'Rajiv Gandhi Airport Sorting Hub, Hyd', timestamp: '2026-09-08 03:15 PM', activity: 'Item scanned at regional hub. Air transport in progress.' },
      { status: 'Out For Delivery', location: 'Destination Facility', timestamp: 'Pending', activity: 'Assigned to local delivery associate.' },
      { status: 'Delivered', location: 'Recipient Doorstep', timestamp: 'Pending', activity: 'Delivered to recipient with digital signature.' }
    ];

    return res.status(200).json({
      success: true,
      shipment: shp,
      checkpoints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getShiprocketNdr = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shiprocket_ndr ORDER BY id DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resolveShiprocketNdr = async (req, res) => {
  try {
    const { id } = req.params;
    const { action_requested, action_remarks } = req.body;

    await pool.query(
      'UPDATE shiprocket_ndr SET action_requested = ?, action_remarks = ?, status = "Resolved" WHERE id = ?',
      [action_requested || 'Re-attempt', action_remarks || 'Re-attempt requested by admin', id]
    );

    return res.status(200).json({ success: true, message: `NDR action "${action_requested}" submitted to Shiprocket.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getShiprocketManifests = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shiprocket_manifests ORDER BY id DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateShiprocketManifest = async (req, res) => {
  try {
    const { courier_name, pickup_location } = req.body;
    const mnfNum = `MNF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;

    const [result] = await pool.query(
      'INSERT INTO shiprocket_manifests (manifest_number, courier_name, pickup_location, total_shipments, download_url) VALUES (?, ?, ?, 4, ?)',
      [mnfNum, courier_name || 'BlueDart Express Air', pickup_location || 'Hyderabad HQ Vault', `/manifests/${mnfNum}.pdf`]
    );

    return res.status(201).json({
      success: true,
      message: `Manifest #${mnfNum} generated successfully!`,
      manifest_number: mnfNum,
      id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CONTROL SUITE 10: COUPONS & PROMOTIONS MANAGEMENT ───

const getCoupons = async (req, res) => {
  try {
    const { search, status, type, trash, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];

    if (trash === 'true') {
      query += ' AND deleted_at IS NOT NULL';
    } else {
      query += ' AND deleted_at IS NULL';
    }

    if (search) {
      query += ' AND (code LIKE ? OR title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'Active') {
      query += ' AND is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW())';
    } else if (status === 'Expired') {
      query += ' AND expiry_date IS NOT NULL AND expiry_date <= NOW()';
    } else if (status === 'Inactive') {
      query += ' AND is_active = 0';
    }

    if (type) {
      query += ' AND discount_type = ?';
      params.push(type);
    }

    query += ' ORDER BY id DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM coupons WHERE deleted_at IS NULL');
    const [[{ activeCount }]] = await pool.query('SELECT COUNT(*) as activeCount FROM coupons WHERE deleted_at IS NULL AND is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW())');
    const [[{ expiredCount }]] = await pool.query('SELECT COUNT(*) as expiredCount FROM coupons WHERE deleted_at IS NULL AND expiry_date IS NOT NULL AND expiry_date <= NOW()');
    const [[{ totalRedemptions }]] = await pool.query('SELECT COALESCE(SUM(times_used), 0) as totalRedemptions FROM coupons WHERE deleted_at IS NULL');

    return res.status(200).json({
      success: true,
      data: rows,
      total,
      metrics: {
        totalCoupons: total,
        activeCoupons: activeCount,
        expiredCoupons: expiredCount,
        totalRedemptions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCouponDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [[coupon]] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    const [usageLogs] = await pool.query(
      'SELECT * FROM coupon_usage_history WHERE coupon_id = ? OR coupon_code = ? ORDER BY used_at DESC LIMIT 50',
      [id, coupon.code]
    );

    return res.status(200).json({
      success: true,
      coupon,
      usageLogs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      start_date,
      expiry_date,
      total_usage_limit,
      per_user_limit,
      is_first_order_only,
      is_free_shipping,
      applies_to_type,
      target_ids,
      is_active
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check code uniqueness
    const [[existing]] = await pool.query('SELECT id FROM coupons WHERE code = ? AND deleted_at IS NULL', [cleanCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" already exists` });
    }

    const targetJson = Array.isArray(target_ids) ? JSON.stringify(target_ids) : (target_ids || null);

    const [result] = await pool.query(
      `INSERT INTO coupons (
        code, title, description, discount_type, discount_value, min_purchase_amount, max_discount_amount,
        start_date, expiry_date, total_usage_limit, per_user_limit, is_first_order_only, is_free_shipping,
        applies_to_type, target_ids, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCode,
        title || `Coupon ${cleanCode}`,
        description || '',
        discount_type || 'percentage',
        parseFloat(discount_value) || 0,
        parseFloat(min_purchase_amount) || 0,
        parseFloat(max_discount_amount) || 0,
        start_date || new Date(),
        expiry_date || null,
        parseInt(total_usage_limit) || 0,
        parseInt(per_user_limit) || 1,
        is_first_order_only ? 1 : 0,
        is_free_shipping ? 1 : 0,
        applies_to_type || 'all',
        targetJson,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      coupon_id: result.insertId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      title,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      start_date,
      expiry_date,
      total_usage_limit,
      per_user_limit,
      is_first_order_only,
      is_free_shipping,
      applies_to_type,
      target_ids,
      is_active
    } = req.body;

    const targetJson = Array.isArray(target_ids) ? JSON.stringify(target_ids) : (target_ids || null);

    await pool.query(
      `UPDATE coupons SET
        code = COALESCE(?, code),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_purchase_amount = COALESCE(?, min_purchase_amount),
        max_discount_amount = COALESCE(?, max_discount_amount),
        start_date = COALESCE(?, start_date),
        expiry_date = ?,
        total_usage_limit = COALESCE(?, total_usage_limit),
        per_user_limit = COALESCE(?, per_user_limit),
        is_first_order_only = COALESCE(?, is_first_order_only),
        is_free_shipping = COALESCE(?, is_free_shipping),
        applies_to_type = COALESCE(?, applies_to_type),
        target_ids = COALESCE(?, target_ids),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [
        code ? code.trim().toUpperCase() : null,
        title,
        description,
        discount_type,
        discount_value !== undefined ? parseFloat(discount_value) : null,
        min_purchase_amount !== undefined ? parseFloat(min_purchase_amount) : null,
        max_discount_amount !== undefined ? parseFloat(max_discount_amount) : null,
        start_date,
        expiry_date !== undefined ? expiry_date : null,
        total_usage_limit !== undefined ? parseInt(total_usage_limit) : null,
        per_user_limit !== undefined ? parseInt(per_user_limit) : null,
        is_first_order_only !== undefined ? (is_first_order_only ? 1 : 0) : null,
        is_free_shipping !== undefined ? (is_free_shipping ? 1 : 0) : null,
        applies_to_type,
        targetJson,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    );

    return res.status(200).json({ success: true, message: `Coupon #${id} updated successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const newStatus = is_active ? 1 : 0;
    await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [newStatus, id]);
    return res.status(200).json({ success: true, message: `Coupon #${id} status updated` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    if (force === 'true') {
      await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: `Coupon #${id} permanently deleted` });
    } else {
      await pool.query('UPDATE coupons SET deleted_at = NOW(), is_active = 0 WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: `Coupon #${id} moved to Trash Bin` });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const restoreCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE coupons SET deleted_at = NULL, is_active = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: `Coupon #${id} restored to Active Coupons` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const bulkGenerateCoupons = async (req, res) => {
  try {
    const {
      prefix = 'PROMO2026',
      count = 10,
      discount_type = 'percentage',
      discount_value = 15,
      min_purchase_amount = 30,
      max_discount_amount = 50,
      expiry_days = 30,
      total_usage_limit = 1,
      per_user_limit = 1,
      is_first_order_only = false,
      is_free_shipping = false,
      applies_to_type = 'all'
    } = req.body;

    const generated = [];
    const cleanPrefix = prefix.trim().toUpperCase();

    for (let i = 0; i < parseInt(count); i++) {
      const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `${cleanPrefix}-${randStr}`;

      const [result] = await pool.query(
        `INSERT INTO coupons (
          code, title, description, discount_type, discount_value, min_purchase_amount, max_discount_amount,
          start_date, expiry_date, total_usage_limit, per_user_limit, is_first_order_only, is_free_shipping,
          applies_to_type, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, 1)`,
        [
          code,
          `Bulk Promo Code ${code}`,
          `Generated in batch ${cleanPrefix}`,
          discount_type,
          parseFloat(discount_value),
          parseFloat(min_purchase_amount),
          parseFloat(max_discount_amount),
          parseInt(expiry_days),
          parseInt(total_usage_limit),
          parseInt(per_user_limit),
          is_first_order_only ? 1 : 0,
          is_free_shipping ? 1 : 0,
          applies_to_type
        ]
      );
      generated.push({ id: result.insertId, code, discount_type, discount_value });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully generated batch of ${generated.length} coupon codes!`,
      coupons: generated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCouponAnalytics = async (req, res) => {
  try {
    const [[{ totalSaved }]] = await pool.query('SELECT COALESCE(SUM(discount_applied), 0) as totalSaved FROM coupon_usage_history');
    const [[{ totalCouponSales }]] = await pool.query('SELECT COALESCE(SUM(order_total), 0) as totalCouponSales FROM coupon_usage_history');
    const [[{ totalRedemptions }]] = await pool.query('SELECT COUNT(*) as totalRedemptions FROM coupon_usage_history');
    const [topCoupons] = await pool.query(`
      SELECT coupon_code, COUNT(*) as usage_count, SUM(discount_applied) as total_discount, SUM(order_total) as gross_sales
      FROM coupon_usage_history
      GROUP BY coupon_code
      ORDER BY usage_count DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      analytics: {
        totalDiscountSaved: totalSaved,
        totalCouponSales,
        totalRedemptions,
        topCoupons
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCouponUsageHistory = async (req, res) => {
  try {
    const { search, coupon_code, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM coupon_usage_history WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (coupon_code LIKE ? OR order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (coupon_code) {
      query += ' AND coupon_code = ?';
      params.push(coupon_code);
    }

    query += ' ORDER BY used_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM coupon_usage_history');

    return res.status(200).json({
      success: true,
      data: rows,
      total
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exportCouponsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons WHERE deleted_at IS NULL ORDER BY id DESC');
    let csv = 'ID,Code,Title,Discount Type,Discount Value,Min Order,Max Discount Cap,Start Date,Expiry Date,Times Used,Total Limit,Status,First Order Only,Free Shipping,Applies To\n';
    rows.forEach(c => {
      csv += `"${c.id}","${c.code}","${c.title}","${c.discount_type}","${c.discount_value}","${c.min_purchase_amount}","${c.max_discount_amount}","${c.start_date || ''}","${c.expiry_date || ''}","${c.times_used}","${c.total_usage_limit}","${c.is_active ? 'Active' : 'Inactive'}","${c.is_first_order_only ? 'Yes' : 'No'}","${c.is_free_shipping ? 'Yes' : 'No'}","${c.applies_to_type}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leafora_coupons_catalog.csv"');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Shiprocket API is not integrated: these actions previously returned simulated rates, AWB numbers,
// pickups and tracking (and wrote fake tracking numbers into real orders). They now refuse honestly.
// Ship manually: set courier + tracking number on the order (Orders → update status), which e-mails the customer.
const shiprocketNotConnected = (req, res) =>
  res.status(501).json({
    success: false,
    message: 'Shiprocket is not connected. Book the shipment in your Shiprocket panel, then enter the courier and tracking number on the order.',
  });

module.exports = {
  sendOtp,
  verifyOtp,
  adminLogout,
  getAnalytics,
  uploadImage,
  getCategories,
  getPublicCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  bulkCategoryStatus,
  reorderCategories,
  exportCategoriesCsv,
  importCategoriesCsv,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  duplicateProduct,
  bulkUploadProducts,
  bulkProductAction,
  exportProductsCsv,
  importProductsCsv,
  notifyVendor,
  getOrders,
  getOrderDetails,
  updateOrderStatus: updateOrderDetails,
  updateOrderDetails,
  cancelOrder,
  refundOrder,
  returnOrder,
  exchangeOrder,
  addOrderTimelineEvent,
  bulkOrderAction,
  exportOrdersCsv,
  getCustomers,
  getCustomerDetails,
  updateCustomer,
  updateCustomerStatus,
  updateCustomerWalletPoints,
  deleteCustomer,
  restoreCustomer,
  exportCustomers,
  getPayments,
  getPaymentGatewaysConfig,
  updatePaymentGatewayConfig,
  issueRefund,
  retryFailedPayment,
  markCodCollected,
  getPaymentRefundsLog,
  getPaymentSettlements,
  exportRevenueReport,
  getReviews,
  createReview,
  getReviewDetails,
  updateReviewStatus,
  replyToReview,
  reportAbuseReview,
  deleteReview,
  restoreReview,
  getReviewAnalytics,
  exportReviewsCsv,
  getReferrals,
  updateReferralStatus,
  getReferralSettings,
  updateReferralSettings,
  getWalletTransactions,
  manualWalletAdjustment,
  getReferralAnalytics,
  exportReferralsCsv,
  exportWalletTransactionsCsv,
  getCoupons,
  getCouponDetails,
  createCoupon,
  addCoupon: createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  restoreCoupon,
  bulkGenerateCoupons,
  getCouponAnalytics,
  getCouponUsageHistory,
  exportCouponsCsv,
  getShiprocketConfig,
  updateShiprocketConfig,
  getShiprocketPickupLocations,
  addShiprocketPickupLocation,
  updateShiprocketPickupLocation,
  deleteShiprocketPickupLocation,
  calculateShippingRates: shiprocketNotConnected,
  getShiprocketShipments,
  generateShiprocketAwb: shiprocketNotConnected,
  scheduleShiprocketPickup: shiprocketNotConnected,
  generateShiprocketLabel: shiprocketNotConnected,
  cancelShiprocketShipment: shiprocketNotConnected,
  trackShiprocketShipment: shiprocketNotConnected,
  getShiprocketNdr,
  resolveShiprocketNdr: shiprocketNotConnected,
  getShiprocketManifests,
  generateShiprocketManifest: shiprocketNotConnected,
  getHomepageBanners,
  getPublicBanners,
  createHomepageBanner,
  updateHomepageBanner,
  deleteHomepageBanner,
  reorderHomepageBanners,
  getHomepageSections,
  updateHomepageSection,
  reorderHomepageSections,
  getCuratedProducts,
  curateProducts,
  getSystemSettings,
  updateSystemSettingsGroup,
  getSystemUsers,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  getSystemRoles,
  updateSystemRole,
  getActivityLogs,
  getLoginHistory,
  exportSystemBackup,
};

