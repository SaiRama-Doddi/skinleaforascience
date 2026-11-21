const { pool } = require('../config/db');
const { getShippingSettings, updateShippingSettings } = require('../services/shippingSettings');

// GET /api/shipping-settings (public: cart, header banner)
// GET /api/admin/shipping-settings (admin)
const getSettings = async (req, res) => {
  const settings = await getShippingSettings();
  return res.status(200).json({ success: true, data: settings });
};

// PUT /api/admin/shipping-settings
// Body: { shipping_fee, free_shipping_enabled, free_shipping_threshold }
const updateSettings = async (req, res) => {
  try {
    const adminEmail = req.admin && req.admin.email;
    const settings = await updateShippingSettings(req.body || {}, adminEmail);

    try {
      await pool.query(
        'INSERT INTO activity_logs (admin_name, module, action, ip_address) VALUES (?, ?, ?, ?)',
        [
          adminEmail || 'Admin',
          'Shipping',
          `Shipping updated: fee ₹${settings.shipping_fee}, free shipping ${settings.free_shipping_enabled ? `above ₹${settings.free_shipping_threshold}` : 'disabled'}`,
          req.ip,
        ]
      );
    } catch (e) {
      // activity log is informational only
    }

    return res.status(200).json({ success: true, message: 'Shipping charges updated.', data: settings });
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) console.error('Update shipping settings error:', error);
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Could not save shipping charges. Please try again.' : error.message,
    });
  }
};

module.exports = { getSettings, updateSettings };
