const { pool } = require('../config/db');
const { escapeHtml } = require('../services/security');
const { normalizeMobile, isValidMobile, isValidName, validateAddress, MESSAGES } = require('../services/validation');

// Older order rows have an empty product_image (base64 photos were not copied): point at the image endpoint
const withItemImage = (it) => ({ ...it, product_image: it.product_image || (it.product_id ? `/api/products/${it.product_id}/image` : '') });

// All handlers except submitContactInquiry are mounted behind `requireUser`,
// so `req.user` is the signed-in customer. Client-supplied `email` / `customer_id`
// parameters are ignored: a customer can only ever read or change their own data.

// 1. GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, first_name, last_name, email, phone, wallet_balance, loyalty_points, loyalty_tier, avatar_url, created_at FROM customers WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const user = rows[0];
    const firstName = user.first_name || (user.name ? user.name.split(' ')[0] : '');
    const lastName = user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : '');

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        first_name: firstName,
        last_name: lastName
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ success: false, message: 'Could not load your profile.' });
  }
};

// 2. UPDATE USER PROFILE
const updateUserProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    if (!isValidName(first_name) || (last_name && !isValidName(last_name, 1))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid name (letters only).' });
    }

    const cleanPhone = normalizeMobile(phone);
    if (cleanPhone && !isValidMobile(cleanPhone)) {
      return res.status(400).json({ success: false, message: MESSAGES.mobile });
    }

    await pool.query(
      `UPDATE customers SET first_name = ?, last_name = ?, name = ?, phone = ? WHERE id = ?`,
      [first_name || '', last_name || '', fullName, cleanPhone, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ success: false, message: 'Could not update your profile.' });
  }
};

// 3. GET USER ADDRESSES
const getUserAddresses = async (req, res) => {
  try {
    const [addresses] = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
      addresses
    });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return res.status(500).json({ success: false, message: 'Could not load your addresses.' });
  }
};

// 4. ADD USER ADDRESS
const addUserAddress = async (req, res) => {
  try {
    const { type, is_default } = req.body;
    const custId = req.user.id;

    const check = validateAddress(req.body);
    if (!check.ok) {
      return res.status(400).json({ success: false, field: check.field, message: check.message });
    }
    const { name, phone, address_line1, address_line2, city, state, pincode } = check.value;

    // If marked default, unset existing default addresses
    if (is_default) {
      await pool.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [custId]);
    }

    const [result] = await pool.query(
      `INSERT INTO customer_addresses (customer_id, name, phone, type, address_line1, address_line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        custId,
        name || '',
        phone || '',
        type || 'Shipping',
        address_line1,
        address_line2 || '',
        city,
        state,
        pincode,
        is_default ? 1 : 0
      ]
    );

    const [savedRows] = await pool.query('SELECT * FROM customer_addresses WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'New delivery address added successfully!',
      address_id: result.insertId,
      data: savedRows[0] || null
    });
  } catch (error) {
    console.error('Error adding user address:', error);
    return res.status(500).json({ success: false, message: 'Could not save the address.' });
  }
};

// 5. DELETE USER ADDRESS
const deleteUserAddress = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    return res.status(200).json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not remove the address.' });
  }
};

// 6. GET USER ORDERS HISTORY
const getUserOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE LOWER(customer_email) = LOWER(?) AND deleted_at IS NULL ORDER BY created_at DESC`,
      [req.user.email]
    );

    if (orders.length > 0) {
      const [items] = await pool.query(
        'SELECT * FROM order_items WHERE order_id IN (?)',
        [orders.map((o) => o.id)]
      );
      for (const order of orders) {
        order.items = items.filter((it) => it.order_id === order.id).map(withItemImage);
      }
    }

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ success: false, message: 'Could not load your orders.' });
  }
};

// 6b. ONE ORDER WITH ITEMS + STATUS TIMELINE (own orders only)
const loadOwnOrder = async (req) => {
  const [[order]] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND LOWER(customer_email) = LOWER(?) AND deleted_at IS NULL',
    [Number(req.params.id), req.user.email]
  );
  return order || null;
};

const getUserOrderDetails = async (req, res) => {
  try {
    const order = await loadOwnOrder(req);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [order.id]);
    const [timeline] = await pool.query(
      'SELECT title, description, status, created_at FROM order_timeline WHERE order_id = ? ORDER BY id',
      [order.id]
    );
    // Internal admin notes are never sent to customers
    const { admin_notes, razorpay_signature, ...publicOrder } = order;
    return res.status(200).json({ success: true, order: { ...publicOrder, items: items.map(withItemImage) }, timeline });
  } catch (error) {
    console.error('Order details failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not load the order.' });
  }
};

// 6c. PRINTABLE INVOICE (HTML; customer prints or saves as PDF)
const getUserOrderInvoice = async (req, res) => {
  try {
    const order = await loadOwnOrder(req);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!['Paid', 'Partially Refunded', 'Refunded'].includes(order.payment_status)) {
      return res.status(400).json({ success: false, message: 'An invoice is available once the payment is complete.' });
    }
    const [items] = await pool.query('SELECT product_name, quantity, price, total_price FROM order_items WHERE order_id = ? ORDER BY id', [order.id]);
    const { invoiceHtml } = require('../services/mailer');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.order_number)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{font-family:Arial,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#334155}
      .bar{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #C49A45;padding-bottom:10px;margin-bottom:18px}
      .bar h1{margin:0;color:#1A2E22;font-family:Georgia,serif;font-size:22px}
      button{background:#1A2E22;color:#fff;border:0;padding:8px 16px;border-radius:6px;cursor:pointer}
      @media print{button{display:none}}</style></head><body>
      <div class="bar"><h1>Leafora Life Sciences</h1><button onclick="window.print()">Print / Save as PDF</button></div>
      ${invoiceHtml(order, items)}
      <p style="font-size:12px;color:#94A3B8;margin-top:24px">This is a computer-generated invoice for order ${escapeHtml(order.order_number)}.</p>
      </body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Invoice failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not create the invoice.' });
  }
};

// 7. GET USER WISHLIST
const getUserWishlist = async (req, res) => {
  try {
    const [wishlistItems] = await pool.query(
      `SELECT w.id as wishlist_id, p.* FROM customer_wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.customer_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      wishlist: wishlistItems
    });
  } catch (error) {
    console.error('Error fetching user wishlist:', error);
    return res.status(500).json({ success: false, message: 'Could not load your wishlist.' });
  }
};

// 7b. TOGGLE USER WISHLIST ITEM
const toggleUserWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    const custId = req.user.id;
    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM customer_wishlist WHERE customer_id = ? AND product_id = ?',
      [custId, product_id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM customer_wishlist WHERE customer_id = ? AND product_id = ?', [custId, product_id]);
      return res.status(200).json({
        success: true,
        action: 'removed',
        message: 'Item removed from your Wishlist'
      });
    }

    await pool.query('INSERT INTO customer_wishlist (customer_id, product_id) VALUES (?, ?)', [custId, product_id]);
    return res.status(200).json({
      success: true,
      action: 'added',
      message: 'Item added to your Wishlist ♥'
    });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return res.status(500).json({ success: false, message: 'Could not update your wishlist.' });
  }
};

// 7c. DELETE WISHLIST ITEM BY ID
const deleteWishlistItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM customer_wishlist WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    return res.status(200).json({ success: true, message: 'Item removed from wishlist.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not remove the item.' });
  }
};

// 8. SUBMIT CONTACT INQUIRY (public)
const submitContactInquiry = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, subject, message } = req.body;
    if (!first_name || !email || !message) {
      return res.status(400).json({ success: false, message: 'First name, email, and message are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (String(message).length > 5000) {
      return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters).' });
    }

    const fullName = `${first_name} ${last_name || ''}`.trim();
    let saved = false;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          subject VARCHAR(255) DEFAULT 'General Inquiry',
          message TEXT NOT NULL,
          status ENUM('New', 'Read', 'Replied') DEFAULT 'New',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(
        `INSERT INTO contact_inquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
        [fullName, email.trim().toLowerCase(), phone || '', subject || 'General Inquiry', message]
      );
      saved = true;
    } catch (dbErr) {
      console.error('DB inquiry save error:', dbErr.message);
    }

    // Email notification to the store admin. All user input is HTML-escaped.
    let mailed = false;
    try {
      const { transporter } = require('../services/mailer');
      const adminEmail = process.env.ADMIN_EMAIL;
      if (transporter && adminEmail) {
        const safe = {
          name: escapeHtml(fullName),
          email: escapeHtml(email),
          phone: escapeHtml(phone || 'Not provided'),
          subject: escapeHtml(subject || 'General Inquiry'),
          message: escapeHtml(message),
        };
        await transporter.sendMail({
          from: `"LeafOra Customer Contact" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          replyTo: email,
          subject: `New Inquiry from ${fullName.replace(/[\r\n]/g, ' ')}: ${String(subject || 'Website Contact').replace(/[\r\n]/g, ' ')}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1E293B; max-width: 600px; border: 1px solid #E2E8F0; border-radius: 10px;">
              <h2 style="color: #1A3E2F; border-bottom: 2px solid #C49A45; padding-bottom: 8px; margin-top: 0;">New LeafOra Website Inquiry</h2>
              <p><strong>Name:</strong> ${safe.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
              <p><strong>Phone:</strong> ${safe.phone}</p>
              <p><strong>Subject:</strong> ${safe.subject}</p>
              <div style="background: #F8F4EE; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #C49A45;">
                <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${safe.message}</p>
              </div>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">LeafOra Life Sciences Admin Notification</p>
            </div>
          `
        });
        mailed = true;
      }
    } catch (mailErr) {
      console.error('Contact email delivery error:', mailErr.message);
    }

    if (!saved && !mailed) {
      return res.status(500).json({ success: false, message: 'Failed to submit contact message. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: `Thank you ${first_name}! Your message has been sent successfully. We will get back to you within 24 hours.`
    });
  } catch (error) {
    console.error('Contact inquiry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit contact message. Please try again.' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
  getUserOrders,
  getUserOrderDetails,
  getUserOrderInvoice,
  getUserWishlist,
  toggleUserWishlist,
  deleteWishlistItem,
  submitContactInquiry
};
