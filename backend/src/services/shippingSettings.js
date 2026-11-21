const { pool } = require('../config/db');

// Admin-editable shipping charges. Single row (id = 1) in `shipping_settings`.
// Used by the storefront (cart / banner) and — authoritatively — by checkout pricing.

const DEFAULTS = Object.freeze({
  shipping_fee: 99,
  free_shipping_enabled: true,
  free_shipping_threshold: 999,
});

const CACHE_MS = 30 * 1000;
let cache = null;
let cacheAt = 0;
let tableReady = null;

const ensureTable = () => {
  if (!tableReady) {
    tableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS shipping_settings (
          id TINYINT PRIMARY KEY,
          shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 99.00,
          free_shipping_enabled TINYINT(1) NOT NULL DEFAULT 1,
          free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 999.00,
          updated_by VARCHAR(255) DEFAULT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)
      .catch((err) => {
        tableReady = null;
        throw err;
      });
  }
  return tableReady;
};

const normalize = (row) => ({
  shipping_fee: Number(row.shipping_fee),
  free_shipping_enabled: Boolean(Number(row.free_shipping_enabled)),
  free_shipping_threshold: Number(row.free_shipping_threshold),
});

const getShippingSettings = async ({ fresh = false } = {}) => {
  if (!fresh && cache && Date.now() - cacheAt < CACHE_MS) return cache;
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT * FROM shipping_settings WHERE id = 1');
    cache = rows[0] ? normalize(rows[0]) : { ...DEFAULTS };
  } catch (err) {
    console.warn('Shipping settings read failed, using defaults:', err.message);
    cache = cache || { ...DEFAULTS };
  }
  cacheAt = Date.now();
  return cache;
};

const MAX_AMOUNT = 100000;

const parseAmount = (value, label) => {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) {
    throw Object.assign(new Error(`${label} must be a number between 0 and ${MAX_AMOUNT}.`), { status: 400 });
  }
  return Math.round(n * 100) / 100;
};

const updateShippingSettings = async (input, updatedBy) => {
  const current = await getShippingSettings({ fresh: true });
  const next = {
    shipping_fee: input.shipping_fee !== undefined ? parseAmount(input.shipping_fee, 'Shipping fee') : current.shipping_fee,
    free_shipping_enabled: input.free_shipping_enabled !== undefined ? Boolean(input.free_shipping_enabled) : current.free_shipping_enabled,
    free_shipping_threshold: input.free_shipping_threshold !== undefined
      ? parseAmount(input.free_shipping_threshold, 'Free shipping minimum order')
      : current.free_shipping_threshold,
  };

  await ensureTable();
  await pool.query(
    `INSERT INTO shipping_settings (id, shipping_fee, free_shipping_enabled, free_shipping_threshold, updated_by)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE shipping_fee = VALUES(shipping_fee), free_shipping_enabled = VALUES(free_shipping_enabled),
       free_shipping_threshold = VALUES(free_shipping_threshold), updated_by = VALUES(updated_by)`,
    [next.shipping_fee, next.free_shipping_enabled ? 1 : 0, next.free_shipping_threshold, updatedBy || null]
  );

  cache = next;
  cacheAt = Date.now();
  return next;
};

/** Shipping charge for a cart subtotal. Same rule is mirrored in the storefront. */
const shippingFeeFor = (subtotal, s) => {
  if (subtotal <= 0) return 0;
  if (s.free_shipping_enabled && subtotal >= s.free_shipping_threshold) return 0;
  return s.shipping_fee;
};

module.exports = {
  DEFAULTS,
  getShippingSettings,
  updateShippingSettings,
  shippingFeeFor,
};
