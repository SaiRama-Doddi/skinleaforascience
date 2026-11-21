const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { sendOrderConfirmationEmail } = require('../services/mailer');
const { ensureSecurityTables, safeEqual } = require('../services/security');
const { getShippingSettings, shippingFeeFor } = require('../services/shippingSettings');

// Shipping charges come from the admin-editable shipping_settings table.
const MAX_QTY_PER_ITEM = 50;

const round2 = (n) => Math.round(n * 100) / 100;

// Razorpay credentials: environment variables first (source of truth in production),
// then the admin-configured DB row. There is deliberately no hardcoded fallback.
const getRazorpayCredentials = async () => {
  let key_id = process.env.RAZORPAY_KEY_ID;
  let key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    try {
      const [rows] = await pool.query(
        "SELECT key_id, key_secret FROM payment_gateways_config WHERE gateway_name = 'Razorpay' AND is_active = 1 LIMIT 1"
      );
      if (rows && rows.length > 0 && rows[0].key_id && rows[0].key_secret) {
        key_id = rows[0].key_id;
        key_secret = rows[0].key_secret;
      }
    } catch (e) {
      // table not ready yet
    }
  }

  if (!key_id || !key_secret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return { key_id: key_id.trim(), key_secret: key_secret.trim() };
};

/**
 * Re-prices the cart from the database. Client prices, names and totals are ignored.
 * Returns { lines, subtotal, shipping_fee, total_amount } or throws a user-facing Error.
 */
const priceCart = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
  }

  // Merge duplicate lines and validate quantities
  const qtyById = new Map();
  for (const item of rawItems) {
    const id = Number(item && (item.id ?? item.product_id));
    const qty = Number(item && item.quantity) || 1;
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty <= 0) {
      throw Object.assign(new Error('Your cart contains an invalid item. Please refresh your cart.'), { status: 400 });
    }
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }

  const ids = [...qtyById.keys()];
  const [products] = await pool.query(
    'SELECT id, name, price, image_url, is_active, deleted_at FROM products WHERE id IN (?)',
    [ids]
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  for (const [id, quantity] of qtyById) {
    const p = byId.get(id);
    if (!p || p.deleted_at || Number(p.is_active) === 0) {
      throw Object.assign(new Error('One of the products in your cart is no longer available. Please update your cart.'), { status: 409 });
    }
    if (quantity > MAX_QTY_PER_ITEM) {
      throw Object.assign(new Error(`Maximum ${MAX_QTY_PER_ITEM} units per product.`), { status: 400 });
    }
    const price = round2(parseFloat(p.price));
    lines.push({
      id: p.id,
      name: p.name,
      image_url: p.image_url && !String(p.image_url).startsWith('data:') ? p.image_url : '',
      price,
      quantity,
      total_price: round2(price * quantity),
    });
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.total_price, 0));
  const shipping_fee = round2(shippingFeeFor(subtotal, await getShippingSettings()));
  const total_amount = round2(subtotal + shipping_fee);

  if (total_amount <= 0) {
    throw Object.assign(new Error('Order total must be greater than zero.'), { status: 400 });
  }

  return { lines, subtotal, shipping_fee, total_amount };
};

const formatAddress = (a, fallbackPhone) => {
  if (!a || typeof a !== 'object') return String(a || '').slice(0, 1000);
  const parts = [
    a.name,
    a.address_line1,
    a.address_line2,
    a.city,
    a.state ? `${a.state}${a.pincode ? ' - ' + a.pincode : ''}` : a.pincode,
  ].filter(Boolean);
  const phone = a.phone || fallbackPhone;
  return `${parts.join(', ')}${phone ? ` (Phone: ${phone})` : ''}`.slice(0, 1000);
};

const generateOrderNumber = () =>
  `LFA-${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

// 1. CREATE RAZORPAY ORDER (requireUser)
// Body: { items: [{ id, quantity }] }. The amount is computed server-side.
const createRazorpayOrder = async (req, res) => {
  try {
    await ensureSecurityTables();
    const { lines, subtotal, shipping_fee, total_amount } = await priceCart(req.body.items);
    const amountInPaise = Math.round(total_amount * 100);

    const { key_id, key_secret } = await getRazorpayCredentials();
    const instance = new Razorpay({ key_id, key_secret });

    let rzpOrder;
    try {
      rzpOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${req.user.id}_${Date.now()}`,
        payment_capture: 1,
        notes: { customer_id: String(req.user.id) },
      });
    } catch (rzpErr) {
      console.error('Razorpay order create failed:', rzpErr?.error?.description || rzpErr.message);
      return res.status(502).json({ success: false, message: 'Payment gateway is unavailable right now. Please try again in a moment.' });
    }

    await pool.query(
      `INSERT INTO payment_intents (razorpay_order_id, customer_id, customer_email, items_json, subtotal, shipping_fee, total_amount, amount_paise, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
      [rzpOrder.id, req.user.id, req.user.email, JSON.stringify(lines), subtotal, shipping_fee, total_amount, amountInPaise]
    );

    return res.status(200).json({
      success: true,
      key_id,
      order: rzpOrder,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      subtotal,
      shipping_fee,
      total_amount,
    });
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) console.error('Error creating Razorpay order:', error);
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Could not start checkout. Please try again.' : error.message,
    });
  }
};

// 2. VERIFY RAZORPAY PAYMENT & RECORD ORDER (requireUser)
const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, verified: false, message: 'Missing Razorpay verification parameters.' });
  }

  let connection;
  try {
    await ensureSecurityTables();
    const { key_secret } = await getRazorpayCredentials();

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expectedSignature, razorpay_signature)) {
      console.warn(`Rejected payment with invalid signature: order=${razorpay_order_id} payment=${razorpay_payment_id}`);
      return res.status(400).json({ success: false, verified: false, message: 'Invalid payment signature. Verification failed.' });
    }

    const [intents] = await pool.query(
      'SELECT * FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1',
      [razorpay_order_id]
    );
    const intent = intents[0];
    if (!intent || intent.customer_id !== req.user.id) {
      return res.status(404).json({ success: false, verified: false, message: 'Checkout session not found for this payment.' });
    }

    // Idempotent: the same payment verified twice returns the same order
    if (intent.status === 'paid' && intent.order_id) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment already verified.',
        order_number: intent.order_number,
        order_id: intent.order_id,
        total_amount: parseFloat(intent.total_amount),
        razorpay_order_id,
        razorpay_payment_id,
      });
    }

    const lines = JSON.parse(intent.items_json);
    const customer = req.user;
    const customerName = (shipping_address && shipping_address.name) || customer.name || customer.email.split('@')[0];
    const customerPhone = (shipping_address && shipping_address.phone) || customer.phone || '';
    const formattedAddress = formatAddress(shipping_address, customerPhone);
    const orderNumber = generateOrderNumber();

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Claim the intent; a concurrent duplicate request gets affectedRows = 0
    const [claim] = await connection.query(
      "UPDATE payment_intents SET status = 'processing' WHERE id = ? AND status = 'created'",
      [intent.id]
    );
    if (claim.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, verified: true, message: 'This payment is already being processed. Please check your orders shortly.' });
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, subtotal, shipping_fee, discount_amount, total_amount, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, 0.00, ?, 'Pending', 'Paid', 'Razorpay', ?, ?, ?, ?)`,
      [
        orderNumber,
        customerName,
        customer.email.trim().toLowerCase(),
        customerPhone,
        intent.subtotal,
        intent.shipping_fee,
        intent.total_amount,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        formattedAddress,
      ]
    );
    const orderId = orderResult.insertId;

    for (const line of lines) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, line.id, line.name, line.image_url, line.price, line.quantity, line.total_price]
      );
      await connection.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [line.quantity, line.id]);
    }

    await connection.query(
      `INSERT INTO payments (order_id, order_number, customer_name, customer_email, transaction_id, amount, payment_method, gateway, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Razorpay', 'Razorpay', ?, ?, ?, 'Success')`,
      [orderId, orderNumber, customerName, customer.email.trim().toLowerCase(), razorpay_payment_id, intent.total_amount, razorpay_order_id, razorpay_payment_id, razorpay_signature]
    );

    try {
      await connection.query(
        `INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, 'Order Placed', ?, 'Pending')`,
        [orderId, `Order #${orderNumber} placed and paid via Razorpay (${razorpay_payment_id}).`]
      );
    } catch (e) {
      // timeline is informational; don't fail a paid order over it
      console.warn('Order timeline insert notice:', e.message);
    }

    await connection.query(
      "UPDATE payment_intents SET status = 'paid', order_id = ?, order_number = ? WHERE id = ?",
      [orderId, orderNumber, intent.id]
    );

    await connection.commit();

    sendOrderConfirmationEmail(customer.email, {
      order_number: orderNumber,
      total_amount: parseFloat(intent.total_amount),
      shipping_address: formattedAddress,
    }).catch((e) => console.warn('Order confirmation email failed:', e.message));

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment verified and order placed!',
      order_number: orderNumber,
      order_id: orderId,
      total_amount: parseFloat(intent.total_amount),
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    // The customer HAS paid at this point (signature was valid). Log loudly so it can be reconciled.
    console.error(`PAID ORDER NOT RECORDED order=${razorpay_order_id} payment=${razorpay_payment_id}:`, error);
    return res.status(500).json({
      success: false,
      verified: true,
      message: `Your payment was received but we could not finalise the order. Please contact support with payment ID ${razorpay_payment_id}.`,
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
