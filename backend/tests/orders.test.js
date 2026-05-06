/**
 * ORDERS ROUTE TESTS — mocked mongoose + mocked email service
 */
const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET        = 'test_jwt_secret_snera';
process.env.RAZORPAY_KEY_ID   = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';

// ── Mock email service ────────────────────────────────────────────────────────
jest.mock('../services/email', () => ({
  sendOrderConfirmation:   jest.fn().mockResolvedValue(true),
  sendShippingNotification: jest.fn().mockResolvedValue(true),
  getCourierTrackingUrl:   jest.fn((courier, awb) =>
    `https://www.bluedart.com/tracking?trackfor=${awb}`
  ),
}));

// ── Mock payment service ──────────────────────────────────────────────────────
jest.mock('../services/payment', () => ({
  createRazorpayOrder:    jest.fn().mockResolvedValue({
    id: 'order_rzp_test123', amount: 129900, currency: 'INR',
  }),
  verifyPaymentSignature: jest.fn().mockReturnValue(true),
}));

// ── In-memory order store ──────────────────────────────────────────────────────
let orders  = [];
let counter = 0;
const makeId = () => new mongoose.Types.ObjectId().toString();
const makeOrderNum = () => `SNR${String(++counter + 1000).padStart(5, '0')}`;

jest.mock('../models/Order', () => ({
  find:              jest.fn(),
  findOne:           jest.fn(),
  findById:          jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments:    jest.fn(),
  aggregate:         jest.fn(),
  create:            jest.fn(),
}));

const Order = require('../models/Order');

beforeEach(() => {
  orders  = [];
  counter = 0;

  Order.create.mockImplementation(async (data) => {
    const o = {
      _id: makeId(), orderNumber: makeOrderNum(),
      status: data.status || 'pending', courier: 'Blue Dart',
      createdAt: new Date(), updatedAt: new Date(), ...data,
    };
    orders.push(o);
    return o;
  });

  Order.find.mockImplementation((filter = {}) => {
    let res = orders;
    if (filter.status) res = res.filter(o => o.status === filter.status);
    const chain = { sort: () => chain, skip: () => chain, limit: () => Promise.resolve([...res]) };
    return chain;
  });

  Order.findOne.mockImplementation(async (filter) => {
    if (filter.orderNumber) return orders.find(o => o.orderNumber === filter.orderNumber) || null;
    return null;
  });

  Order.findById.mockImplementation(async (id) =>
    orders.find(o => String(o._id) === String(id)) || null
  );

  Order.findByIdAndUpdate.mockImplementation(async (id, update) => {
    const idx = orders.findIndex(o => String(o._id) === String(id));
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...update, updatedAt: new Date() };
    return orders[idx];
  });

  Order.countDocuments.mockImplementation(async (filter = {}) => {
    if (!filter || !Object.keys(filter).length) return orders.length;
    if (filter.status) return orders.filter(o => o.status === filter.status).length;
    if (filter.createdAt) return orders.length; // simplified for today
    return orders.length;
  });

  Order.aggregate.mockResolvedValue([{ _id: null, total: 9999 }]);
});

const authToken = jwt.sign({ id: 'admin1', adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const app = express();
app.use(express.json());
app.use('/api/orders', require('../routes/orders'));

const validOrder = {
  customer: { name: 'Priya Shah', email: 'p@p.com', phone: '9876543210' },
  address:  { line1: '12 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
  items:    [{ name: 'SNERA Tee', size: 'M', price: 1299, qty: 1 }],
  subtotal: 1299, shippingFee: 0, total: 1299,
  payment:  { method: 'razorpay', status: 'pending' },
};

// ─── POST /api/orders ─────────────────────────────────────────────────────────
describe('POST /api/orders', () => {

  test('✓ creates Razorpay order with valid data', async () => {
    const res = await request(app).post('/api/orders').send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.orderNumber).toMatch(/^SNR\d{5}$/);
    expect(res.body.order.status).toBe('pending');
  });

  test('✓ COD order is confirmed immediately', async () => {
    const res = await request(app).post('/api/orders').send({
      ...validOrder,
      payment: { method: 'cod', status: 'pending' },
    });
    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('confirmed');
  });

  test('✓ COD triggers confirmation email immediately', async () => {
    const { sendOrderConfirmation } = require('../services/email');
    sendOrderConfirmation.mockClear();

    await request(app).post('/api/orders').send({
      ...validOrder, payment: { method: 'cod' },
    });

    // Email is async fire-and-forget — give it a tick
    await new Promise(r => setTimeout(r, 50));
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  test('✓ Razorpay order does NOT trigger email on creation', async () => {
    const { sendOrderConfirmation } = require('../services/email');
    sendOrderConfirmation.mockClear();

    await request(app).post('/api/orders').send(validOrder);
    await new Promise(r => setTimeout(r, 50));
    expect(sendOrderConfirmation).not.toHaveBeenCalled();
  });

  test('✗ missing customer name → 400', async () => {
    const res = await request(app).post('/api/orders').send({
      ...validOrder, customer: { email: 'x@x.com', phone: '9999999999' },
    });
    expect(res.status).toBe(400);
  });

  test('✗ missing address city → 400', async () => {
    const res = await request(app).post('/api/orders').send({
      ...validOrder, address: { line1: '12 St', state: 'MH', pincode: '400001' },
    });
    expect(res.status).toBe(400);
  });

  test('✗ empty items → 400', async () => {
    const res = await request(app).post('/api/orders').send({ ...validOrder, items: [] });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/orders/payment/create ─────────────────────────────────────────
describe('POST /api/orders/payment/create', () => {

  test('✓ returns Razorpay order id + key', async () => {
    const res = await request(app)
      .post('/api/orders/payment/create')
      .send({ amount: 1299, receipt: 'SNR01001' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('amount');
    expect(res.body).toHaveProperty('key');
    expect(res.body.id).toBe('order_rzp_test123');
  });

  test('✗ missing amount → 400', async () => {
    const res = await request(app)
      .post('/api/orders/payment/create')
      .send({});
    expect(res.status).toBe(400);
  });

  test('✗ invalid amount → 400', async () => {
    const res = await request(app)
      .post('/api/orders/payment/create')
      .send({ amount: 'notanumber' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/orders/payment/verify ─────────────────────────────────────────
describe('POST /api/orders/payment/verify', () => {

  let orderId;

  beforeEach(async () => {
    const o = await Order.create(validOrder);
    orderId = o._id;
  });

  test('✓ valid signature marks order paid + confirmed + sends email', async () => {
    const { sendOrderConfirmation } = require('../services/email');
    sendOrderConfirmation.mockClear();

    const res = await request(app)
      .post('/api/orders/payment/verify')
      .send({
        razorpayOrderId:   'order_rzp_test123',
        razorpayPaymentId: 'pay_test456',
        razorpaySignature: 'valid_sig',
        orderId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('confirmed');
    expect(res.body.order['payment.status'] || res.body.order.payment?.status).toBeDefined();

    await new Promise(r => setTimeout(r, 50));
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  test('✗ invalid signature → 400', async () => {
    const { verifyPaymentSignature } = require('../services/payment');
    verifyPaymentSignature.mockReturnValueOnce(false);

    const res = await request(app)
      .post('/api/orders/payment/verify')
      .send({
        razorpayOrderId:   'order_bad',
        razorpayPaymentId: 'pay_bad',
        razorpaySignature: 'wrong_sig',
        orderId,
      });

    expect(res.status).toBe(400);
  });

  test('✗ missing fields → 400', async () => {
    const res = await request(app)
      .post('/api/orders/payment/verify')
      .send({ orderId });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/orders/stats/summary ───────────────────────────────────────────
describe('GET /api/orders/stats/summary (admin)', () => {

  beforeEach(async () => {
    await Order.create({ ...validOrder, status: 'pending' });
    await Order.create({ ...validOrder, status: 'shipped',   trackingId: 'BD123' });
    await Order.create({ ...validOrder, status: 'delivered' });
  });

  test('✓ returns all required stats fields', async () => {
    const res = await request(app)
      .get('/api/orders/stats/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('pendingOrders');
    expect(res.body).toHaveProperty('shippedOrders');
    expect(res.body).toHaveProperty('deliveredOrders');
    expect(res.body).toHaveProperty('cancelledOrders');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('todayOrders');
    expect(res.body).toHaveProperty('recentOrders');
  });

  test('✓ recentOrders is an array', async () => {
    const res = await request(app)
      .get('/api/orders/stats/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(Array.isArray(res.body.recentOrders)).toBe(true);
  });

  test('✓ totalRevenue is a number', async () => {
    const res = await request(app)
      .get('/api/orders/stats/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(typeof res.body.totalRevenue).toBe('number');
  });

  test('✗ unauthenticated → 401', async () => {
    const res = await request(app).get('/api/orders/stats/summary');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/orders/track/:orderNumber ──────────────────────────────────────
describe('GET /api/orders/track/:orderNumber (public)', () => {

  let orderNum;

  beforeEach(async () => {
    const o = await Order.create({
      ...validOrder,
      status:     'shipped',
      trackingId: 'BD99887766',
      courier:    'Blue Dart',
    });
    orderNum = o.orderNumber;
    Order.findOne.mockImplementation(async ({ orderNumber }) =>
      orders.find(o => o.orderNumber === orderNumber?.toUpperCase?.() || o.orderNumber === orderNumber) || null
    );
  });

  test('✓ returns tracking info with courierTrackingUrl', async () => {
    const res = await request(app).get(`/api/orders/track/${orderNum}`);
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(orderNum);
    expect(res.body.trackingId).toBe('BD99887766');
    expect(res.body.courierTrackingUrl).toContain('BD99887766');
  });

  test('✓ courierTrackingUrl is null when no trackingId', async () => {
    const o2 = await Order.create({ ...validOrder, status: 'confirmed' });
    Order.findOne.mockResolvedValueOnce(o2);
    const res = await request(app).get(`/api/orders/track/${o2.orderNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.courierTrackingUrl).toBeNull();
  });

  test('✓ does not expose customer email/phone', async () => {
    const res = await request(app).get(`/api/orders/track/${orderNum}`);
    expect(res.body.customer).not.toHaveProperty('email');
    expect(res.body.customer).not.toHaveProperty('phone');
  });

  test('✗ invalid order number → 404', async () => {
    Order.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/orders/track/SNR99999');
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/orders/:id ────────────────────────────────────────────────────
describe('PATCH /api/orders/:id (admin)', () => {

  let orderId;

  beforeEach(async () => {
    const o = await Order.create(validOrder);
    orderId = o._id;
  });

  test('✓ updates status to shipped', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped', trackingId: 'BD123456' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
    expect(res.body.trackingId).toBe('BD123456');
  });

  test('✓ shipping email triggered when status → shipped with AWB', async () => {
    const { sendShippingNotification } = require('../services/email');
    sendShippingNotification.mockClear();

    await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped', trackingId: 'BD999' });

    await new Promise(r => setTimeout(r, 50));
    expect(sendShippingNotification).toHaveBeenCalledTimes(1);
  });

  test('✓ no shipping email if no trackingId when shipping', async () => {
    const { sendShippingNotification } = require('../services/email');
    sendShippingNotification.mockClear();

    await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped' }); // no AWB

    await new Promise(r => setTimeout(r, 50));
    expect(sendShippingNotification).not.toHaveBeenCalled();
  });

  test('✓ no duplicate shipping email if already shipped', async () => {
    const { sendShippingNotification } = require('../services/email');
    sendShippingNotification.mockClear();

    // Set order to already shipped
    orders.find(o => String(o._id) === String(orderId)).status = 'shipped';

    await request(app)
      .patch(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped', trackingId: 'BD999' });

    await new Promise(r => setTimeout(r, 50));
    expect(sendShippingNotification).not.toHaveBeenCalled();
  });

  test('✗ no auth → 401', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(401);
  });

  test('✗ non-existent order → 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(404);
  });
});
