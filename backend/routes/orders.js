const router  = require('express').Router();
const Order   = require('../models/Order');
const auth    = require('../middleware/auth');
const { sendOrderConfirmation, sendShippingNotification } = require('../services/email');
const { createRazorpayOrder, verifyPaymentSignature }     = require('../services/payment');

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT ROUTES  (must be BEFORE /:id to avoid param conflict)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orders/payment/create
router.post('/payment/create', async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || isNaN(amount))
      return res.status(400).json({ error: 'Valid amount required' });

    const rzpOrder = await createRazorpayOrder(
      Number(amount),
      receipt || `snera_${Date.now()}`
    );
    res.json({
      id:       rzpOrder.id,
      amount:   rzpOrder.amount,
      currency: rzpOrder.currency,
      key:      process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/payment/verify
router.post('/payment/verify', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId)
      return res.status(400).json({ error: 'All payment verification fields required' });

    const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    if (!isValid) {
      await Order.findByIdAndUpdate(orderId, { 'payment.status': 'failed' });
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status:                      'confirmed',
        'payment.status':            'paid',
        'payment.razorpayOrderId':   razorpayOrderId,
        'payment.razorpayPaymentId': razorpayPaymentId,
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'Order not found' });

    sendOrderConfirmation(order).catch(console.error);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STATS  (before /:id)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/orders/stats/summary  — admin dashboard
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);

    const [
      totalOrders, pendingOrders, shippedOrders,
      deliveredOrders, cancelledOrders,
      revenueAgg, todayOrders, recentOrders,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.find({}).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      totalOrders, pendingOrders, shippedOrders,
      deliveredOrders, cancelledOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      todayOrders,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orders  — guest checkout
router.post('/', async (req, res) => {
  try {
    const { customer, address, items, subtotal, shippingFee, total, payment } = req.body;

    if (!customer?.name || !customer?.email || !customer?.phone)
      return res.status(400).json({ error: 'Customer name, email and phone are required' });
    if (!address?.line1 || !address?.city || !address?.state || !address?.pincode)
      return res.status(400).json({ error: 'Full shipping address is required' });
    if (!items?.length)
      return res.status(400).json({ error: 'Order must have at least one item' });

    const method = payment?.method || 'razorpay';

    // COD can be toggled off from backend/.env (COD_ENABLED) without a redeploy —
    // reject here too in case a stale frontend still shows the option.
    if (method === 'cod' && String(process.env.COD_ENABLED).toLowerCase() !== 'true')
      return res.status(400).json({ error: 'Cash on Delivery is currently unavailable. Please choose another payment method.' });

    const order  = await Order.create({
      customer, address, items,
      subtotal:    subtotal    || 0,
      shippingFee: shippingFee || 0,
      total:       total       || 0,
      payment:     { method, status: 'pending' },
      // cod = confirmed immediately (pay on delivery)
      // whatsapp = pending until admin confirms payment received on WhatsApp
      // razorpay = pending until Razorpay verify callback
      status: method === 'cod' ? 'confirmed' : 'pending',
    });


    // Only COD gets confirmation email immediately
    // WhatsApp → admin manually confirms → email sent from admin panel
    // Razorpay → email sent after payment/verify succeeds
    if (method === 'cod') {
      await sendOrderConfirmation(order);
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message }); 
    
  }
});

// GET /api/orders/track/:orderNumber  — public tracking
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
    if (!order) return res.status(404).json({ error: 'Order not found. Please check the order number.' });

    const { getCourierTrackingUrl } = require('../services/email');
    const courierTrackingUrl = order.trackingId
      ? getCourierTrackingUrl(order.courier, order.trackingId)
      : null;

    res.json({
      orderNumber:       order.orderNumber,
      status:            order.status,
      trackingId:        order.trackingId || null,
      courier:           order.courier    || 'Blue Dart',
      courierTrackingUrl,
      items:             order.items.map(i => ({ name: i.name, size: i.size, qty: i.qty })),
      customer:          { name: order.customer.name },
      createdAt:         order.createdAt,
      updatedAt:         order.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/orders  — admin list
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id  — admin single
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id  — admin update (status, tracking, courier)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, trackingId, courier, notes, payment } = req.body;
    const update = {};
    if (status)     update.status     = status;
    if (trackingId) update.trackingId = trackingId;
    if (courier)    update.courier    = courier;
    if (notes !== undefined) update.notes = notes;
    if (payment)    update.payment    = payment;

    
    const prevOrder = await Order.findById(req.params.id);
    if (!prevOrder) return res.status(404).json({ error: 'Order not found' });

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });

    // Fire shipping email when status → 'shipped' for the first time with an AWB
    const becomesShipped  = status === 'shipped'   && prevOrder.status !== 'shipped';
    // Send confirmation email when admin confirms a WhatsApp order (payment received)
    const becomesConfirmed = status === 'confirmed' && prevOrder.status === 'pending'
                             && prevOrder.payment?.method === 'whatsapp';

    const awb = update.trackingId || order.trackingId;
    if (becomesShipped && awb)   sendShippingNotification(order).catch(console.error);
    if (becomesConfirmed)        sendOrderConfirmation(order).catch(console.error);

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;