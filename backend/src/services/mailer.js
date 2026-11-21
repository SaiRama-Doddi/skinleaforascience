const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Shared helpers ───

// Public site address used for links in e-mails (set SITE_URL in the environment)
const SITE_URL = String(process.env.SITE_URL || 'https://leaforalifescience.com').replace(/\/+$/, '');
const STORE_NAME = 'Leafora Life Sciences';

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

const layout = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #EFE8DE; border-radius: 12px; background-color: #FAF7F2;">
    <div style="text-align: center; margin-bottom: 20px; background: #1A2E22; padding: 18px; border-radius: 8px;">
      <h1 style="color: #C49A45; margin: 0; font-family: Georgia, serif; font-size: 24px;">${STORE_NAME}</h1>
      <p style="color: #E2E8F0; font-size: 12px; margin: 6px 0 0; letter-spacing: 1px;">${esc(title)}</p>
    </div>
    <div style="background: #FFFFFF; padding: 24px; border-radius: 8px;">${bodyHtml}</div>
    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 18px;">
      © ${new Date().getFullYear()} ${STORE_NAME} · <a href="${SITE_URL}" style="color: #94A3B8;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
    </p>
  </div>`;

const button = (href, label) =>
  `<div style="text-align: center; margin: 26px 0 8px;"><a href="${href}" style="background-color: #1A2E22; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 6px; font-weight: bold; display: inline-block;">${esc(label)}</a></div>`;

/** Sends one e-mail; never throws. Returns { success, messageId | error }. */
const send = async ({ to, subject, html, fromName = STORE_NAME, kind }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error(`✉️ ${kind} e-mail not sent: SMTP_USER / SMTP_PASS are not configured.`);
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const info = await transporter.sendMail({ from: `"${fromName}" <${process.env.SMTP_USER}>`, to, subject, html });
    console.log(`✉️ ${kind} e-mail sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`⚠️ ${kind} e-mail to ${to} failed:`, error.message);
    return { success: false, error: error.message };
  }
};

// ─── Admin login OTP ───
const sendOtpEmail = (toEmail, otp) =>
  send({
    kind: 'Admin OTP',
    to: toEmail,
    fromName: `${STORE_NAME} Admin Security`,
    subject: `Your ${STORE_NAME} admin login code`,
    html: layout('ADMIN LOGIN VERIFICATION', `
      <p style="font-size: 15px; color: #334155;">Use this one-time code to sign in to the admin dashboard:</p>
      <div style="text-align: center; margin: 26px 0;">
        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #1b5e20; background-color: #e8f5e9; padding: 12px 28px; border-radius: 8px; border: 2px dashed #4caf50; display: inline-block;">${esc(otp)}</span>
      </div>
      <p style="font-size: 13px; color: #64748B; text-align: center;">Valid for <strong>10 minutes</strong>. Never share this code. If you did not try to sign in, you can ignore this e-mail.</p>`),
  });

// ─── Customer welcome ───
const sendWelcomeRegistrationEmail = (toEmail, firstName) =>
  send({
    kind: 'Welcome',
    to: toEmail,
    subject: `Welcome to ${STORE_NAME}`,
    html: layout('WELCOME', `
      <h2 style="color: #1A2E22; margin-top: 0;">Welcome, ${esc(firstName || 'there')}!</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your account <strong>${esc(toEmail)}</strong> has been created. From your dashboard you can track orders, download invoices, manage addresses and save your wishlist.</p>
      ${button(`${SITE_URL}/dashboard`, 'Go to My Dashboard')}
      <p style="font-size: 13px; color: #64748B;">If you did not create this account, please contact us.</p>`),
  });

// ─── Customer password reset ───
const sendCustomerPasswordResetEmail = (toEmail, otp) =>
  send({
    kind: 'Password reset',
    to: toEmail,
    subject: `Reset your ${STORE_NAME} password`,
    html: layout('PASSWORD RESET', `
      <p style="font-size: 15px; color: #475569; line-height: 1.6;">We received a request to reset the password for your account. Enter this code on the password reset page:</p>
      <div style="text-align: center; margin: 26px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #A67C52; background-color: #F8F4EE; padding: 14px 30px; border-radius: 8px; border: 2px dashed #C49A45; display: inline-block;">${esc(otp)}</span>
      </div>
      <p style="font-size: 13px; color: #64748B; text-align: center;">Valid for <strong>15 minutes</strong>. If you did not request this, you can safely ignore this e-mail; your password will not change.</p>`),
  });

// ─── Order invoice (sent after successful payment) ───
/**
 * order: { order_number, created_at, customer_name, customer_email, customer_phone, shipping_address,
 *          subtotal, shipping_fee, discount_amount, total_amount, payment_method, razorpay_payment_id }
 * items: [{ product_name, quantity, price, total_price }]
 */
const invoiceHtml = (order, items) => {
  const rows = items.map((it) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #F1F5F9;">${esc(it.product_name)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #F1F5F9; text-align: center;">${Number(it.quantity)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #F1F5F9; text-align: right;">${inr(it.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #F1F5F9; text-align: right;">${inr(it.total_price)}</td>
    </tr>`).join('');

  const discount = Number(order.discount_amount || 0);
  const seller = [process.env.STORE_ADDRESS, process.env.STORE_GSTIN ? `GSTIN: ${process.env.STORE_GSTIN}` : '']
    .filter(Boolean).map(esc).join('<br/>');

  return `
    <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 16px;"><tr>
      <td style="vertical-align: top;">
        <strong style="font-size: 15px; color: #1A2E22;">Invoice</strong><br/>
        Order #: <strong>${esc(order.order_number)}</strong><br/>
        Date: ${formatDate(order.created_at)}<br/>
        Payment: ${esc(order.payment_method || 'Razorpay')}${order.razorpay_payment_id ? ` (${esc(order.razorpay_payment_id)})` : ''}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <strong>${STORE_NAME}</strong>${seller ? `<br/>${seller}` : ''}
      </td>
    </tr></table>
    <p style="font-size: 13px; color: #334155; margin: 0 0 16px;">
      <strong>Bill / Ship to:</strong> ${esc(order.customer_name)}<br/>
      ${esc(order.shipping_address)}<br/>
      ${esc(order.customer_email)}${order.customer_phone ? ` · ${esc(order.customer_phone)}` : ''}
    </p>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
      <thead><tr style="background: #F8F4EE;">
        <th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th><th style="padding: 8px; text-align: right;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width: 100%; font-size: 13px; color: #334155; margin-top: 12px;">
      <tr><td style="text-align: right; padding: 3px 8px;">Subtotal</td><td style="text-align: right; width: 110px; padding: 3px 8px;">${inr(order.subtotal)}</td></tr>
      <tr><td style="text-align: right; padding: 3px 8px;">Shipping</td><td style="text-align: right; padding: 3px 8px;">${Number(order.shipping_fee) ? inr(order.shipping_fee) : 'FREE'}</td></tr>
      ${discount ? `<tr><td style="text-align: right; padding: 3px 8px;">Discount</td><td style="text-align: right; padding: 3px 8px;">− ${inr(discount)}</td></tr>` : ''}
      <tr><td style="text-align: right; padding: 8px; font-weight: bold; font-size: 15px;">Total paid</td><td style="text-align: right; padding: 8px; font-weight: bold; font-size: 15px; color: #A67C52;">${inr(order.total_amount)}</td></tr>
    </table>`;
};

const sendOrderInvoiceEmail = (order, items) =>
  send({
    kind: 'Order invoice',
    to: order.customer_email,
    fromName: `${STORE_NAME} Orders`,
    subject: `Order confirmed #${order.order_number} – your invoice`,
    html: layout('ORDER CONFIRMATION & INVOICE', `
      <h2 style="color: #1A2E22; margin-top: 0;">Thank you for your order, ${esc(order.customer_name)}!</h2>
      <p style="font-size: 14px; color: #475569;">We have received your payment. Your invoice is below; you can also download it any time from your dashboard.</p>
      ${invoiceHtml(order, items)}
      ${button(`${SITE_URL}/dashboard?tab=orders`, 'View My Orders')}`),
  });

// ─── Order status updates ───
const STATUS_MESSAGES = {
  Confirmed: 'Your order has been confirmed and is being prepared.',
  Processing: 'Your order is being packed at our warehouse.',
  Shipped: 'Good news — your order has been shipped!',
  'In Transit': 'Your order is on its way.',
  'Out for Delivery': 'Your order is out for delivery today.',
  Delivered: 'Your order has been delivered. We hope you love it!',
  Cancelled: 'Your order has been cancelled.',
  Returned: 'Your return has been recorded.',
  Exchanged: 'Your exchange has been recorded.',
};

const sendOrderStatusEmail = (order, status, extra = {}) => {
  const message = STATUS_MESSAGES[status];
  if (!message || !order.customer_email) return Promise.resolve({ success: false, error: 'No e-mail for this status' });
  const tracking = extra.tracking_number || order.tracking_number;
  const courier = extra.shipping_partner || order.shipping_partner;
  return send({
    kind: `Order status (${status})`,
    to: order.customer_email,
    fromName: `${STORE_NAME} Orders`,
    subject: `Order #${order.order_number}: ${status}`,
    html: layout('ORDER UPDATE', `
      <h2 style="color: #1A2E22; margin-top: 0;">${esc(status)}</h2>
      <p style="font-size: 15px; color: #475569;">Hi ${esc(order.customer_name)}, ${esc(message)}</p>
      <p style="font-size: 14px; color: #475569;">Order <strong>#${esc(order.order_number)}</strong> · Total ${inr(order.total_amount)}</p>
      ${courier || tracking ? `<p style="font-size: 14px; color: #475569;">${courier ? `Courier: <strong>${esc(courier)}</strong><br/>` : ''}${tracking ? `Tracking number: <strong>${esc(tracking)}</strong>` : ''}</p>` : ''}
      ${extra.reason ? `<p style="font-size: 14px; color: #475569;">Note: ${esc(extra.reason)}</p>` : ''}
      ${button(`${SITE_URL}/dashboard?tab=orders`, 'View Order')}`),
  });
};

// ─── Refunds ───
const sendRefundEmail = (order, amount, refundId) =>
  send({
    kind: 'Refund',
    to: order.customer_email,
    fromName: `${STORE_NAME} Orders`,
    subject: `Refund of ${inr(amount)} for order #${order.order_number}`,
    html: layout('REFUND PROCESSED', `
      <p style="font-size: 15px; color: #475569;">Hi ${esc(order.customer_name)}, we have refunded <strong>${inr(amount)}</strong> for order <strong>#${esc(order.order_number)}</strong>.</p>
      <p style="font-size: 14px; color: #475569;">Refund reference: <strong>${esc(refundId)}</strong><br/>It usually reaches your original payment method within 5–7 working days.</p>
      ${button(`${SITE_URL}/dashboard?tab=orders`, 'View Order')}`),
  });

module.exports = {
  transporter,
  invoiceHtml,
  sendOtpEmail,
  sendWelcomeRegistrationEmail,
  sendCustomerPasswordResetEmail,
  sendOrderInvoiceEmail,
  sendOrderStatusEmail,
  sendRefundEmail,
  // Backwards-compatible alias
  sendOrderConfirmationEmail: (toEmail, details) =>
    sendOrderInvoiceEmail({ ...details, customer_email: toEmail, customer_name: details.customer_name || 'Customer' }, details.items || []),
};
