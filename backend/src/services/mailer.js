const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || 'hkahir46@gmail.com',
    pass: process.env.SMTP_PASS || 'upqc hajb cury cnaf',
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Leafora Life Science Admin Security" <${process.env.SMTP_USER || 'hkahir46@gmail.com'}>`,
    to: toEmail,
    subject: '🔑 Your Leafora Life Science Admin Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2e7d32; margin: 0;">Leafora Life Science</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Admin Control Portal Access Verification</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 16px; color: #333;">Hello Admin,</p>
        <p style="font-size: 15px; color: #555;">You requested access to the <strong>Leafora Admin Dashboard</strong>. Use the One-Time Password (OTP) below to complete your login:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1b5e20; background-color: #e8f5e9; padding: 12px 28px; border-radius: 8px; border: 2px dashed #4caf50; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">© 2026 Leafora Life Science. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ OTP Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('⚠️ Nodemailer failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendWelcomeRegistrationEmail = async (toEmail, firstName) => {
  const mailOptions = {
    from: `"Leafora Life Sciences" <${process.env.SMTP_USER || 'hkahir46@gmail.com'}>`,
    to: toEmail,
    subject: '🌱 Account Registered Successfully - Welcome to Leafora Life Sciences!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFE8DE; border-radius: 12px; background-color: #FAF7F2;">
        <div style="text-align: center; margin-bottom: 24px; background: #1A2E22; padding: 20px; border-radius: 8px;">
          <h1 style="color: #A67C52; margin: 0; font-family: Georgia, serif;">Leafora Life Sciences</h1>
          <p style="color: #E2E8F0; font-size: 14px; margin-top: 6px; letter-spacing: 1px;">PURE BOTANICAL & CLINICAL SKINCARE</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <h2 style="color: #1A2E22; margin-top: 0;">Welcome, ${firstName || 'Valued Customer'}! 👋</h2>
          <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            Your account has been successfully created with <strong>${toEmail}</strong>. You are now part of the Leafora Botanical Skincare family!
          </p>
          <p style="font-size: 15px; color: #475569; line-height: 1.6;">
            You can now log in to your personal dashboard to track your orders, manage delivery addresses, save wishlist items, and enjoy exclusive member rewards.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/dashboard" style="background-color: #A67C52; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Go to My Dashboard →</a>
          </div>
          <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 20px 0;" />
          <p style="font-size: 13px; color: #64748B;">If you did not register for this account, please ignore this email or contact support.</p>
        </div>
        <p style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 20px;">© 2026 Leafora Life Sciences. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Welcome Registration Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('⚠️ Nodemailer failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendOrderConfirmationEmail = async (toEmail, orderDetails) => {
  const mailOptions = {
    from: `"Leafora Orders" <${process.env.SMTP_USER || 'hkahir46@gmail.com'}>`,
    to: toEmail,
    subject: `🛍️ Order Confirmed #${orderDetails.order_number} - Leafora Life Sciences`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFE8DE; border-radius: 12px; background-color: #FAF7F2;">
        <div style="text-align: center; margin-bottom: 24px; background: #1A2E22; padding: 20px; border-radius: 8px;">
          <h1 style="color: #A67C52; margin: 0; font-family: Georgia, serif;">Leafora Life Sciences</h1>
          <p style="color: #E2E8F0; font-size: 14px; margin-top: 6px;">ORDER CONFIRMATION</p>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border-radius: 8px;">
          <h2 style="color: #1A2E22; margin-top: 0;">Thank You for Your Order! 🎉</h2>
          <p style="font-size: 15px; color: #475569;">Order Number: <strong>#${orderDetails.order_number}</strong></p>
          <p style="font-size: 15px; color: #475569;">Total Amount: <strong style="color: #A67C52;">₹${Number(orderDetails.total_amount).toFixed(2)}</strong></p>
          <p style="font-size: 15px; color: #475569;">Shipping Address: ${orderDetails.shipping_address}</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/dashboard?tab=orders" style="background-color: #1A2E22; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Track Your Order →</a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Order Confirmation Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('⚠️ Nodemailer failed to send order email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { 
  sendOtpEmail,
  sendWelcomeRegistrationEmail,
  sendOrderConfirmationEmail 
};
