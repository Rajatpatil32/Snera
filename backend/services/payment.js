/**
 * SNERA Razorpay Payment Service
 * Handles order creation, payment verification, and refunds
 */

const crypto = require('crypto');

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create a Razorpay order (called before checkout payment)
 * @param {number} amount  - Amount in INR (not paise)
 * @param {string} receipt - Internal reference (order number)
 */
async function createRazorpayOrder(amount, receipt) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount:   Math.round(amount * 100), // convert to paise
    currency: 'INR',
    receipt:  receipt,
    notes:    { source: 'SNERA', brand: 'snera.in' },
  });
  return order;
}

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 * Must be called after payment success on frontend
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const body      = razorpayOrderId + '|' + razorpayPaymentId;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === razorpaySignature;
}

module.exports = { createRazorpayOrder, verifyPaymentSignature };
