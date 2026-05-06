/**
 * PAYMENT SERVICE TESTS
 * Tests: Razorpay order creation, signature verification
 */

const crypto = require('crypto');

// Mock Razorpay SDK
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id:       'order_test_123',
        amount:   129900,
        currency: 'INR',
        receipt:  'SNR01001',
        status:   'created',
      }),
    },
  }));
});

describe('Payment Service', () => {

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID     = 'rzp_test_testkey123';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_xyz';
    jest.resetModules();
  });

  afterEach(() => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  // ─── createRazorpayOrder ───────────────────────────────────────────────────
  describe('createRazorpayOrder', () => {

    test('✓ creates order and returns Razorpay order object', async () => {
      const { createRazorpayOrder } = require('../services/payment');
      const order = await createRazorpayOrder(1299, 'SNR01001');

      expect(order).toBeDefined();
      expect(order.id).toBe('order_test_123');
      expect(order.currency).toBe('INR');
    });

    test('✓ converts INR amount to paise (× 100)', async () => {
      const Razorpay = require('razorpay');
      const { createRazorpayOrder } = require('../services/payment');

      await createRazorpayOrder(1299, 'SNR01001');

      const instance      = Razorpay.mock.results[0].value;
      const createCall    = instance.orders.create.mock.calls[0][0];
      expect(createCall.amount).toBe(129900); // 1299 * 100
    });

    test('✓ passes receipt to Razorpay', async () => {
      const Razorpay = require('razorpay');
      const { createRazorpayOrder } = require('../services/payment');

      await createRazorpayOrder(999, 'SNR02002');

      const instance   = Razorpay.mock.results[0].value;
      const createCall = instance.orders.create.mock.calls[0][0];
      expect(createCall.receipt).toBe('SNR02002');
    });

    test('✓ sets currency to INR', async () => {
      const Razorpay = require('razorpay');
      const { createRazorpayOrder } = require('../services/payment');

      await createRazorpayOrder(500, 'test');

      const instance   = Razorpay.mock.results[0].value;
      const createCall = instance.orders.create.mock.calls[0][0];
      expect(createCall.currency).toBe('INR');
    });

    test('✓ rounds fractional amounts', async () => {
      const Razorpay = require('razorpay');
      const { createRazorpayOrder } = require('../services/payment');

      await createRazorpayOrder(99.99, 'test');

      const instance   = Razorpay.mock.results[0].value;
      const createCall = instance.orders.create.mock.calls[0][0];
      expect(Number.isInteger(createCall.amount)).toBe(true);
    });

    test('✗ throws when RAZORPAY_KEY_ID missing', async () => {
      delete process.env.RAZORPAY_KEY_ID;
      const { createRazorpayOrder } = require('../services/payment');
      await expect(createRazorpayOrder(100, 'test')).rejects.toThrow(/razorpay/i);
    });

    test('✗ throws when RAZORPAY_KEY_SECRET missing', async () => {
      delete process.env.RAZORPAY_KEY_SECRET;
      const { createRazorpayOrder } = require('../services/payment');
      await expect(createRazorpayOrder(100, 'test')).rejects.toThrow(/razorpay/i);
    });
  });

  // ─── verifyPaymentSignature ────────────────────────────────────────────────
  describe('verifyPaymentSignature', () => {

    // Build a real valid signature for testing
    function makeValidSignature(orderId, paymentId, secret) {
      return crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    }

    test('✓ returns true for valid HMAC signature', () => {
      const { verifyPaymentSignature } = require('../services/payment');
      const secret    = process.env.RAZORPAY_KEY_SECRET;
      const orderId   = 'order_abc123';
      const paymentId = 'pay_xyz789';
      const sig       = makeValidSignature(orderId, paymentId, secret);

      const result = verifyPaymentSignature({
        razorpayOrderId:   orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sig,
      });

      expect(result).toBe(true);
    });

    test('✗ returns false for tampered signature', () => {
      const { verifyPaymentSignature } = require('../services/payment');

      const result = verifyPaymentSignature({
        razorpayOrderId:   'order_abc123',
        razorpayPaymentId: 'pay_xyz789',
        razorpaySignature: 'tampered_signature_value',
      });

      expect(result).toBe(false);
    });

    test('✗ returns false for wrong order ID', () => {
      const { verifyPaymentSignature } = require('../services/payment');
      const secret = process.env.RAZORPAY_KEY_SECRET;
      // Build signature for different orderId
      const sig = makeValidSignature('order_DIFFERENT', 'pay_xyz789', secret);

      const result = verifyPaymentSignature({
        razorpayOrderId:   'order_abc123',  // different from what sig was built with
        razorpayPaymentId: 'pay_xyz789',
        razorpaySignature: sig,
      });

      expect(result).toBe(false);
    });

    test('✗ returns false for wrong payment ID', () => {
      const { verifyPaymentSignature } = require('../services/payment');
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const sig = makeValidSignature('order_abc123', 'pay_DIFFERENT', secret);

      const result = verifyPaymentSignature({
        razorpayOrderId:   'order_abc123',
        razorpayPaymentId: 'pay_xyz789',  // different
        razorpaySignature: sig,
      });

      expect(result).toBe(false);
    });

    test('✗ returns false for empty signature', () => {
      const { verifyPaymentSignature } = require('../services/payment');
      const result = verifyPaymentSignature({
        razorpayOrderId:   'order_abc',
        razorpayPaymentId: 'pay_xyz',
        razorpaySignature: '',
      });
      expect(result).toBe(false);
    });

    test('✓ HMAC is deterministic — same inputs = same result', () => {
      const { verifyPaymentSignature } = require('../services/payment');
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const sig    = makeValidSignature('order_1', 'pay_1', secret);

      const r1 = verifyPaymentSignature({ razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: sig });
      const r2 = verifyPaymentSignature({ razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: sig });

      expect(r1).toBe(true);
      expect(r2).toBe(true);
    });
  });
});
