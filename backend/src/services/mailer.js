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

// ─── Logo ───
// E-mails reference it as an inline attachment (cid:), which Gmail/Outlook display without
// "show images". The printable invoice embeds it as a data URI so it also prints / saves to PDF.
const path = require('path');
const fs = require('fs');
const LOGO_PATH = path.join(__dirname, '../assets/leafora-logo.png');
const LOGO_CID = 'leafora-logo';
const hasLogo = fs.existsSync(LOGO_PATH);
let logoDataUri = '';
if (hasLogo) {
  logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
} else {
  console.warn('⚠️ E-mail logo not found at', LOGO_PATH);
}

/** Absolute URL for an image path stored on an order item (e.g. /api/products/3/image). */
const absoluteImageUrl = (src) => {
  if (!src || String(src).startsWith('data:')) return '';
  return String(src).startsWith('/') ? `${SITE_URL}${src}` : String(src);
};

const layout = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #EFE8DE; border-radius: 12px; background-color: #FAF7F2;">
    <div style="text-align: center; margin-bottom: 20px; background: #1A2E22; padding: 18px; border-radius: 8px;">
      ${hasLogo ? `<img src="cid:${LOGO_CID}" alt="${STORE_NAME}" width="72" height="72" style="display: block; margin: 0 auto 8px; width: 72px; height: 72px; background: #FFFFFF; border-radius: 50%; padding: 6px;" />` : ''}
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
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments: hasLogo ? [{ filename: 'leafora-logo.png', path: LOGO_PATH, cid: LOGO_CID, contentDisposition: 'inline' }] : [],
    });
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

// ─── Order invoice (sent after successful payment; also used for the printable invoice) ───
/**
 * order: { order_number, created_at, status, payment_status, customer_name, customer_email, customer_phone,
 *          shipping_address, subtotal, shipping_fee, discount_amount, total_amount, payment_method, razorpay_payment_id }
 * items: [{ product_name, quantity, price, total_price, product_image?, product_id? }]
 * opts.logoSrc: image source for the logo ('cid:…' in e-mails, data URI on the printable page)
 */
const invoiceHtml = (order, items, opts = {}) => {
  const itemCount = items.reduce((n, it) => n + Number(it.quantity || 0), 0);

  const rows = items.map((it) => {
    const img = absoluteImageUrl(it.product_image || (it.product_id ? `/api/products/${it.product_id}/image` : ''));
    return `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #F1F5F9;">
        <table style="border-collapse: collapse;"><tr>
          ${img ? `<td style="padding-right: 10px; vertical-align: middle;"><img src="${esc(img)}" alt="" width="48" height="48" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #EFE8DE; border-radius: 6px; background: #FAF7F2;" /></td>` : ''}
          <td style="vertical-align: middle; color: #1E293B;">${esc(it.product_name)}</td>
        </tr></table>
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #F1F5F9; text-align: center;">${Number(it.quantity)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #F1F5F9; text-align: right; white-space: nowrap;">${inr(it.price)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #F1F5F9; text-align: right; white-space: nowrap;">${inr(it.total_price)}</td>
    </tr>`;
  }).join('');

  const discount = Number(order.discount_amount || 0);
  const seller = [process.env.STORE_ADDRESS, process.env.STORE_GSTIN ? `GSTIN: ${process.env.STORE_GSTIN}` : '']
    .filter(Boolean).map(esc).join('<br/>');
  const label = 'color: #64748B; padding: 3px 0; width: 130px; vertical-align: top;';
  const value = 'color: #1E293B; padding: 3px 0; vertical-align: top;';

  return `
    <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 18px; border-collapse: collapse;"><tr>
      <td style="vertical-align: top;">
        ${opts.logoSrc ? `<img src="${opts.logoSrc}" alt="${STORE_NAME}" width="56" height="56" style="width: 56px; height: 56px; display: block; margin-bottom: 6px;" />` : ''}
        <strong style="font-size: 15px; color: #1A2E22;">${STORE_NAME}</strong>${seller ? `<br/><span style="color: #64748B;">${seller}</span>` : ''}
      </td>
      <td style="vertical-align: top; text-align: right;">
        <strong style="font-size: 18px; color: #1A2E22; letter-spacing: 1px;">INVOICE</strong><br/>
        <span style="color: #64748B;">Order</span> <strong>#${esc(order.order_number)}</strong><br/>
        <span style="color: #64748B;">Date</span> ${formatDate(order.created_at)}
      </td>
    </tr></table>

    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 18px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 12px;">
          <div style="font-weight: bold; color: #1A2E22; margin-bottom: 4px;">Delivery address</div>
          <div style="color: #334155; line-height: 1.5;">
            ${esc(order.customer_name)}<br/>${esc(order.shipping_address)}<br/>
            ${esc(order.customer_email)}${order.customer_phone ? `<br/>Phone: ${esc(order.customer_phone)}` : ''}
          </div>
        </td>
        <td style="vertical-align: top; width: 50%;">
          <div style="font-weight: bold; color: #1A2E22; margin-bottom: 4px;">Order summary</div>
          <table style="font-size: 13px; border-collapse: collapse;">
            <tr><td style="${label}">Order status</td><td style="${value}">${esc(order.status || 'Pending')}</td></tr>
            <tr><td style="${label}">Payment status</td><td style="${value}">${esc(order.payment_status || 'Paid')}</td></tr>
            <tr><td style="${label}">Payment method</td><td style="${value}">${esc(order.payment_method || 'Razorpay')}</td></tr>
            ${order.razorpay_payment_id ? `<tr><td style="${label}">Payment ID</td><td style="${value}">${esc(order.razorpay_payment_id)}</td></tr>` : ''}
            <tr><td style="${label}">Items</td><td style="${value}">${itemCount}</td></tr>
            ${order.shipping_partner ? `<tr><td style="${label}">Courier</td><td style="${value}">${esc(order.shipping_partner)}</td></tr>` : ''}
            ${order.tracking_number ? `<tr><td style="${label}">Tracking no.</td><td style="${value}">${esc(order.tracking_number)}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
      <thead><tr style="background: #F8F4EE;">
        <th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th><th style="padding: 8px; text-align: right;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width: 100%; font-size: 13px; color: #334155; margin-top: 12px; border-collapse: collapse;">
      <tr><td style="text-align: right; padding: 3px 8px;">Subtotal</td><td style="text-align: right; width: 120px; padding: 3px 8px;">${inr(order.subtotal)}</td></tr>
      <tr><td style="text-align: right; padding: 3px 8px;">Shipping</td><td style="text-align: right; padding: 3px 8px;">${Number(order.shipping_fee) ? inr(order.shipping_fee) : 'FREE'}</td></tr>
      ${discount ? `<tr><td style="text-align: right; padding: 3px 8px;">Discount</td><td style="text-align: right; padding: 3px 8px;">− ${inr(discount)}</td></tr>` : ''}
      <tr><td style="text-align: right; padding: 10px 8px; font-weight: bold; font-size: 15px; border-top: 2px solid #EFE8DE;">Total paid</td>
          <td style="text-align: right; padding: 10px 8px; font-weight: bold; font-size: 15px; color: #A67C52; border-top: 2px solid #EFE8DE;">${inr(order.total_amount)}</td></tr>
    </table>`;
};

// Printable invoice page (customer dashboard → Download Invoice): logo embedded so it prints / saves to PDF
const invoicePageHtml = (order, items) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <title>Invoice ${esc(order.order_number)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{font-family:Arial,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;color:#334155}
  .bar{display:flex;justify-content:flex-end;margin-bottom:14px}
  button{background:#1A2E22;color:#fff;border:0;padding:9px 18px;border-radius:6px;cursor:pointer;font-size:14px}
  .sheet{border:1px solid #EFE8DE;border-radius:10px;padding:24px}
  @media print{.bar{display:none}.sheet{border:0;padding:0}body{margin:0}}</style></head><body>
  <div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="sheet">
    ${invoiceHtml(order, items, { logoSrc: logoDataUri })}
    <p style="font-size:12px;color:#94A3B8;margin-top:24px">This is a computer-generated invoice for order ${esc(order.order_number)}.</p>
  </div>
</body></html>`;

// Order confirmation e-mail: full order details + invoice. No buttons, per store preference.
const sendOrderInvoiceEmail = (order, items) =>
  send({
    kind: 'Order invoice',
    to: order.customer_email,
    fromName: `${STORE_NAME} Orders`,
    subject: `Order confirmed #${order.order_number} – your invoice`,
    html: layout('ORDER CONFIRMATION & INVOICE', `
      <h2 style="color: #1A2E22; margin-top: 0;">Thank you for your order, ${esc(order.customer_name)}!</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We have received your payment of <strong>${inr(order.total_amount)}</strong> and your order is confirmed.
        We will e-mail you again when it ships. Your invoice is below.
      </p>
      ${invoiceHtml(order, items)}
      <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">Keep this e-mail for your records. Reply to this e-mail if you have any questions about your order.</p>`),
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
  invoicePageHtml,
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
