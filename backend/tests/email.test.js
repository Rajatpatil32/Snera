/**
 * EMAIL SERVICE TESTS
 * Tests: getCourierTrackingUrl, HTML template generation, send functions
 */

// Mock nodemailer before requiring the service
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

const nodemailer = require('nodemailer');
const { sendOrderConfirmation, sendShippingNotification, getCourierTrackingUrl } = require('../services/email');

// Sample order for templates
const mockOrder = {
  _id:         'order_id_1',
  orderNumber: 'SNR01001',
  status:      'confirmed',
  customer:    { name: 'Aarav Shah', email: 'aarav@test.com', phone: '9876543210' },
  address:     { line1: 'Flat 101, Sunrise', line2: 'Andheri West', city: 'Mumbai', state: 'MH', pincode: '400053' },
  items:       [
    { name: 'SNERA Essential Tee', size: 'M', price: 1299, qty: 2 },
    { name: 'SNERA Minimal Jogger', size: 'L', price: 1899, qty: 1 },
  ],
  subtotal:    4497,
  shippingFee: 0,
  total:       4497,
  trackingId:  'BD99887766',
  courier:     'Blue Dart',
  payment:     { method: 'razorpay', status: 'paid' },
};

// ─── getCourierTrackingUrl ─────────────────────────────────────────────────────
describe('getCourierTrackingUrl', () => {

  test('✓ Blue Dart tracking URL', () => {
    const url = getCourierTrackingUrl('Blue Dart', 'BD123456');
    expect(url).toContain('bluedart.com');
    expect(url).toContain('BD123456');
  });

  test('✓ bluedart (lowercase) tracking URL', () => {
    const url = getCourierTrackingUrl('bluedart', 'BD789');
    expect(url).toContain('bluedart.com');
  });

  test('✓ Delhivery tracking URL', () => {
    const url = getCourierTrackingUrl('Delhivery', 'DLV123');
    expect(url).toContain('delhivery.com');
    expect(url).toContain('DLV123');
  });

  test('✓ DTDC tracking URL', () => {
    const url = getCourierTrackingUrl('DTDC', 'DTDC456');
    expect(url).toContain('dtdc.in');
    expect(url).toContain('DTDC456');
  });

  test('✓ Ekart tracking URL', () => {
    const url = getCourierTrackingUrl('Ekart', 'FMPC123');
    expect(url).toContain('ekartlogistics.com');
  });

  test('✓ India Post tracking URL', () => {
    const url = getCourierTrackingUrl('India Post', 'EE123456789IN');
    expect(url).toContain('indiapost.gov.in');
  });

  test('✓ Xpressbees tracking URL', () => {
    const url = getCourierTrackingUrl('Xpressbees', 'XB9999');
    expect(url).toContain('xpressbees.com');
  });

  test('✓ Shadowfax tracking URL', () => {
    const url = getCourierTrackingUrl('Shadowfax', 'SFX777');
    expect(url).toContain('shadowfax.in');
  });

  test('✓ unknown courier falls back to Google search', () => {
    const url = getCourierTrackingUrl('UnknownCourier', 'AWB123');
    expect(url).toContain('google.com');
    expect(url).toContain('AWB123');
  });

  test('✓ returns null when AWB is empty string', () => {
    const url = getCourierTrackingUrl('Blue Dart', '');
    expect(url).toBeNull();
  });

  test('✓ returns null when AWB is null', () => {
    const url = getCourierTrackingUrl('Blue Dart', null);
    expect(url).toBeNull();
  });

  test('✓ returns null when AWB is undefined', () => {
    const url = getCourierTrackingUrl('Blue Dart', undefined);
    expect(url).toBeNull();
  });

  test('✓ tracking URL contains the exact AWB number', () => {
    const awb = 'TESTAWB9988776655';
    const url = getCourierTrackingUrl('Blue Dart', awb);
    expect(url).toContain(awb);
  });
});

// ─── sendOrderConfirmation ────────────────────────────────────────────────────
describe('sendOrderConfirmation', () => {

  beforeEach(() => {
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASS = 'testpassword';
    process.env.EMAIL_FROM = 'SNERA <test@test.com>';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  test('✓ sends email when credentials configured', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({ messageId: 'msg123' }) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const callArgs = mockTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.to).toBe('aarav@test.com');
    expect(callArgs.subject).toContain('SNR01001');
    expect(callArgs.subject).toContain('SNERA');
    expect(callArgs.html).toBeDefined();
  });

  test('✓ email HTML contains order number', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('SNR01001');
  });

  test('✓ email HTML contains customer name', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('Aarav Shah');
  });

  test('✓ email HTML contains all ordered items', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('SNERA Essential Tee');
    expect(html).toContain('SNERA Minimal Jogger');
  });

  test('✓ email HTML contains formatted total', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('4,497'); // INR formatted
  });

  test('✓ email HTML contains shipping address', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('Mumbai');
    expect(html).toContain('400053');
  });

  test('✓ email HTML contains track order link', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('track-order');
    expect(html).toContain('SNR01001');
  });

  test('✓ free shipping shows Free in email', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendOrderConfirmation({ ...mockOrder, shippingFee: 0 });

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html.toLowerCase()).toContain('free');
  });

  test('✓ no-op when EMAIL_USER not set (no crash)', async () => {
    delete process.env.EMAIL_USER;
    await expect(sendOrderConfirmation(mockOrder)).resolves.toBeUndefined();
  });

  test('✓ non-fatal on SMTP error', async () => {
    const mockTransporter = { sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    // Should not throw
    await expect(sendOrderConfirmation(mockOrder)).resolves.not.toThrow();
  });
});

// ─── sendShippingNotification ─────────────────────────────────────────────────
describe('sendShippingNotification', () => {

  beforeEach(() => {
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASS = 'testpassword';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  test('✓ sends shipping email with tracking info', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendShippingNotification(mockOrder);

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const { to, subject, html } = mockTransporter.sendMail.mock.calls[0][0];
    expect(to).toBe('aarav@test.com');
    expect(subject).toContain('shipped');
    expect(html).toContain('BD99887766');  // AWB in body
  });

  test('✓ shipping email contains courier name', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendShippingNotification(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('Blue Dart');
  });

  test('✓ shipping email contains courier tracking URL', async () => {
    const mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await sendShippingNotification(mockOrder);

    const html = mockTransporter.sendMail.mock.calls[0][0].html;
    expect(html).toContain('bluedart.com');
    expect(html).toContain('BD99887766');
  });

  test('✓ no-op when credentials not set', async () => {
    delete process.env.EMAIL_USER;
    await expect(sendShippingNotification(mockOrder)).resolves.toBeUndefined();
  });

  test('✓ non-fatal on SMTP error', async () => {
    const mockTransporter = { sendMail: jest.fn().mockRejectedValue(new Error('Connection timeout')) };
    nodemailer.createTransport.mockReturnValueOnce(mockTransporter);

    await expect(sendShippingNotification(mockOrder)).resolves.not.toThrow();
  });
});
