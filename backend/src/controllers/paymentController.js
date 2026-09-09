const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay Instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_SwedUUn1KgRMs0';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'xdW2Ry7T67sUK4zMKb3oOsZh';
  return new Razorpay({ key_id, key_secret });
};

// 1. CREATE RAZORPAY ORDER
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const instance = getRazorpayInstance();
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const options = {
      amount: amountInPaise, // Amount in paise (1 INR = 100 Paise)
      currency: 'INR',
      receipt: `receipt_ord_${Date.now()}`,
      payment_capture: 1
    };

    const rzpOrder = await instance.orders.create(options);

    return res.status(200).json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SwedUUn1KgRMs0',
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ success: false, message: error.message || 'Razorpay order creation failed.' });
  }
};

// 2. VERIFY RAZORPAY PAYMENT SIGNATURE
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature verification parameters.' });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'xdW2Ry7T67sUK4zMKb3oOsZh';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Razorpay payment signature verified successfully!',
        razorpay_order_id,
        razorpay_payment_id
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
};
