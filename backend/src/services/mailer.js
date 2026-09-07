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

module.exports = { sendOtpEmail };
