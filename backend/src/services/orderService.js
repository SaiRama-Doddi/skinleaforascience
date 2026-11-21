const Razorpay = require('razorpay');
const { pool } = require('../config/db');
const { sendOrderStatusEmail, sendRefundEmail } = require('./mailer');

// Statuses the admin can set. Anything else is rejected.
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Exchanged'];
// Once an order is in one of these, stock has been returned and it can't move back to fulfilment.
const CLOSED_STATUSES = ['Cancelled', 'Returned'];

const httpError = (status, message) => Object.assign(new Error(message), { status });

const loadOrder = async (conn, orderId) => {
  const [[order]] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (!order) throw httpError(404, 'Order not found.');
  return order;
};

/**
 * Changes an order's status in one transaction: timeline entry, stock returned on
 * cancel/return, then a customer e-mail. Returns the updated order.
 */
const setOrderStatus = async (orderId, status, { reason, shipping_partner, tracking_number, adminEmail, notify = true } = {}) => {
  if (!ORDER_STATUSES.includes(status)) throw httpError(400, `Unknown order status "${status}".`);

  const conn = await pool.getConnection();
  let order;
  try {
    await conn.beginTransaction();
    order = await loadOrder(conn, orderId);

    if (order.status === status && !shipping_partner && !tracking_number) {
      await conn.rollback();
      return order; // nothing to do
    }
    if (CLOSED_STATUSES.includes(order.status) && !CLOSED_STATUSES.includes(status)) {
      throw httpError(409, `Order #${order.order_number} is ${order.status}; it cannot be moved back to "${status}".`);
    }

    await conn.query(
      `UPDATE orders SET status = ?, shipping_partner = COALESCE(?, shipping_partner), tracking_number = COALESCE(?, tracking_number),
         return_reason = IF(? = 'Returned', COALESCE(?, return_reason), return_reason)
       WHERE id = ?`,
      [status, shipping_partner || null, tracking_number || null, status, reason || null, orderId]
    );

    // Put items back in stock exactly once, when the order first becomes cancelled/returned
    if (CLOSED_STATUSES.includes(status) && !CLOSED_STATUSES.includes(order.status)) {
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const it of items) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
      }
    }

    const details = [
      `Status changed from ${order.status} to ${status}`,
      shipping_partner ? `courier: ${shipping_partner}` : '',
      tracking_number ? `tracking: ${tracking_number}` : '',
      reason ? `note: ${reason}` : '',
      adminEmail ? `by ${adminEmail}` : '',
    ].filter(Boolean).join(' · ');
    await conn.query('INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, ?)', [orderId, status, details, status]);

    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }

  const updated = { ...order, status, shipping_partner: shipping_partner || order.shipping_partner, tracking_number: tracking_number || order.tracking_number };
  if (notify && order.status !== status) {
    sendOrderStatusEmail(updated, status, { reason, shipping_partner, tracking_number }).catch(() => {});
  }
  return updated;
};

/**
 * Refunds a Razorpay payment for real (Razorpay API), then records it.
 * `amount` defaults to everything not yet refunded. Never refunds more than was paid.
 */
const refundPayment = async (paymentId, { amount, reason, adminEmail } = {}) => {
  const [[pay]] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
  if (!pay) throw httpError(404, 'Payment record not found.');

  const rzpPaymentId = pay.razorpay_payment_id || (String(pay.transaction_id || '').startsWith('pay_') ? pay.transaction_id : null);
  if (!rzpPaymentId) {
    throw httpError(400, 'This payment was not made through Razorpay, so it cannot be refunded automatically. Refund it manually and record it in the order notes.');
  }

  const paid = Number(pay.amount || 0);
  const already = Number(pay.refunded_amount || 0);
  const remaining = Math.round((paid - already) * 100) / 100;
  const refundAmt = amount === undefined || amount === '' || amount === null ? remaining : Math.round(Number(amount) * 100) / 100;

  if (!Number.isFinite(refundAmt) || refundAmt <= 0) throw httpError(400, 'Refund amount must be greater than zero.');
  if (refundAmt > remaining) throw httpError(400, `Refund amount exceeds the refundable balance of ₹${remaining.toFixed(2)}.`);

  // 1. Move the money (Razorpay). If this fails nothing is recorded.
  const { getRazorpayCredentials } = require('../controllers/paymentController');
  const { key_id, key_secret } = await getRazorpayCredentials();
  const rzp = new Razorpay({ key_id, key_secret });
  let refund;
  try {
    refund = await rzp.payments.refund(rzpPaymentId, {
      amount: Math.round(refundAmt * 100),
      notes: { reason: String(reason || 'Refund by admin').slice(0, 250), by: String(adminEmail || 'admin') },
    });
  } catch (err) {
    const msg = err?.error?.description || err.message || 'Razorpay rejected the refund.';
    throw httpError(502, `Razorpay refund failed: ${msg}`);
  }

  // 2. Record it
  const totalRefunded = Math.round((already + refundAmt) * 100) / 100;
  const isFull = totalRefunded >= paid;
  const newStatus = isFull ? 'Refunded' : 'Partially Refunded';

  const conn = await pool.getConnection();
  let order = null;
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE payments SET status = ?, refunded_amount = ?, refund_status = ?, refund_reason = ? WHERE id = ?',
      [newStatus, totalRefunded, isFull ? 'Full' : 'Partial', reason || 'Refund by admin', pay.id]
    );
    await conn.query(
      'INSERT INTO payment_refunds (payment_id, order_id, transaction_id, refund_id, amount, refund_type, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pay.id, pay.order_id || 0, rzpPaymentId, refund.id, refundAmt, isFull ? 'Full' : 'Partial', reason || 'Refund by admin']
    );
    if (pay.order_id) {
      await conn.query('UPDATE orders SET payment_status = ? WHERE id = ?', [newStatus, pay.order_id]);
      await conn.query(
        'INSERT INTO order_timeline (order_id, title, description, status) VALUES (?, ?, ?, ?)',
        [pay.order_id, `${isFull ? 'Full' : 'Partial'} refund ₹${refundAmt.toFixed(2)}`, `Razorpay refund ${refund.id}${reason ? ` · ${reason}` : ''}${adminEmail ? ` · by ${adminEmail}` : ''}`, newStatus]
      );
      [[order]] = await conn.query('SELECT * FROM orders WHERE id = ?', [pay.order_id]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    // Money already moved: log loudly so the record can be fixed by hand
    console.error(`REFUND ${refund.id} (₹${refundAmt}) SUCCEEDED AT RAZORPAY BUT WAS NOT RECORDED for payment #${pay.id}:`, error);
    throw httpError(500, `Refund ${refund.id} was issued by Razorpay but could not be saved. Please note it in the order manually.`);
  } finally {
    conn.release();
  }

  if (order) sendRefundEmail(order, refundAmt, refund.id).catch(() => {});
  return { refund_id: refund.id, amount: refundAmt, refunded_total: totalRefunded, status: newStatus };
};

/** Refund by order id (looks up the order's successful Razorpay payment). */
const refundOrder = async (orderId, opts) => {
  const [[pay]] = await pool.query(
    "SELECT id FROM payments WHERE order_id = ? AND (razorpay_payment_id IS NOT NULL OR transaction_id LIKE 'pay\\_%') ORDER BY id DESC LIMIT 1",
    [orderId]
  );
  if (!pay) throw httpError(400, 'No Razorpay payment found for this order.');
  return refundPayment(pay.id, opts);
};

module.exports = { ORDER_STATUSES, setOrderStatus, refundPayment, refundOrder };
