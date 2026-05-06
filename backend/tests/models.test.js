/**
 * MODEL UNIT TESTS — pure Jest, no real MongoDB required
 * Tests Product, Order, Admin model validation & business logic
 */
const mongoose = require('mongoose');

// ─── Product Model ────────────────────────────────────────────────────────────
describe('Product Model — schema validation', () => {
  let Product;
  beforeAll(() => {
    if (mongoose.modelNames().includes('Product')) mongoose.deleteModel('Product');
    Product = require('../models/Product');
  });

  const valid = {
    name: 'SNERA Test Tee', slug: 'snera-test-tee',
    category: 'Tops', gender: 'Unisex',
    price: 1299, description: 'A great tee.',
    sizes: ['S', 'M', 'L'],
  };

  test('✓ valid product passes validation', async () => {
    const p = new Product(valid);
    await expect(p.validate()).resolves.toBeUndefined();
  });

  test('✓ defaults: isActive=true, isFeatured=false, badge=New, glyph=◈', () => {
    const p = new Product(valid);
    expect(p.isActive).toBe(true);
    expect(p.isFeatured).toBe(false);
    expect(p.badge).toBe('New');
    expect(p.glyph).toBe('◈');
    expect(p.soldSizes).toEqual([]);
    expect(p.images).toEqual([]);
  });

  test('✓ optional comparePrice accepted', async () => {
    const p = new Product({ ...valid, comparePrice: 1599 });
    await expect(p.validate()).resolves.toBeUndefined();
    expect(p.comparePrice).toBe(1599);
  });

  test('✓ all valid categories accepted', async () => {
    for (const cat of ['Tops', 'Bottoms', 'Outerwear', 'Accessories']) {
      const p = new Product({ ...valid, category: cat });
      await expect(p.validate()).resolves.toBeUndefined();
    }
  });

  test('✗ invalid category fails validation', async () => {
    const p = new Product({ ...valid, category: 'Jeans' });
    await expect(p.validate()).rejects.toThrow();
  });

  test('✗ missing name fails', async () => {
    const { name: _, ...d } = valid;
    await expect(new Product(d).validate()).rejects.toThrow();
  });

  test('✗ missing price fails', async () => {
    const { price: _, ...d } = valid;
    await expect(new Product(d).validate()).rejects.toThrow();
  });

  test('✗ missing description fails', async () => {
    const { description: _, ...d } = valid;
    await expect(new Product(d).validate()).rejects.toThrow();
  });

  test('✓ valid genders: Men, Women, Unisex', async () => {
    for (const g of ['Men', 'Women', 'Unisex']) {
      const p = new Product({ ...valid, gender: g });
      await expect(p.validate()).resolves.toBeUndefined();
    }
  });

  test('✓ valid badges: New, Sale, empty string', async () => {
    for (const b of ['New', 'Sale', '']) {
      const p = new Product({ ...valid, badge: b });
      await expect(p.validate()).resolves.toBeUndefined();
    }
  });

  test('✓ tags array stored', () => {
    const p = new Product({ ...valid, tags: ['minimal', 'summer'] });
    expect(p.tags).toEqual(['minimal', 'summer']);
  });

  test('✓ images array defaults to empty', () => {
    const p = new Product(valid);
    expect(Array.isArray(p.images)).toBe(true);
    expect(p.images.length).toBe(0);
  });

  test('✓ images array accepts paths', () => {
    const p = new Product({ ...valid, images: ['/uploads/a.jpg', '/uploads/b.jpg'] });
    expect(p.images.length).toBe(2);
  });
});

// ─── Order Model ──────────────────────────────────────────────────────────────
describe('Order Model — schema validation', () => {
  let Order;
  beforeAll(() => {
    if (mongoose.modelNames().includes('Order')) mongoose.deleteModel('Order');
    Order = require('../models/Order');
  });

  const valid = {
    customer: { name: 'Aarav Shah', email: 'a@a.com', phone: '9876543210' },
    address:  { line1: '12 Main St', city: 'Mumbai', state: 'MH', pincode: '400001' },
    items:    [{ name: 'SNERA Tee', size: 'M', price: 1299, qty: 1 }],
    subtotal: 1299, shippingFee: 0, total: 1299,
  };

  test('✓ valid order passes validation', async () => {
    const o = new Order(valid);
    await expect(o.validate()).resolves.toBeUndefined();
  });

  test('✓ default status is pending', () => {
    expect(new Order(valid).status).toBe('pending');
  });

  test('✓ default payment status is pending', () => {
    expect(new Order(valid).payment.status).toBe('pending');
  });

  test('✓ default courier is Blue Dart', () => {
    expect(new Order(valid).courier).toBe('Blue Dart');
  });

  test('✓ all valid statuses', async () => {
    const statuses = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    for (const status of statuses) {
      const o = new Order({ ...valid, status });
      await expect(o.validate()).resolves.toBeUndefined();
    }
  });

  test('✗ invalid status fails', async () => {
    await expect(new Order({ ...valid, status: 'returned' }).validate()).rejects.toThrow();
  });

  test('✓ payment method razorpay or cod', async () => {
    for (const method of ['razorpay', 'cod']) {
      const o = new Order({ ...valid, payment: { method, status: 'pending' } });
      await expect(o.validate()).resolves.toBeUndefined();
    }
  });

  test('✓ multiple items stored correctly', () => {
    const o = new Order({
      ...valid,
      items: [
        { name: 'Tee',    size: 'S', price: 999,  qty: 2 },
        { name: 'Jogger', size: 'M', price: 1899, qty: 1 },
      ],
    });
    expect(o.items.length).toBe(2);
    expect(o.items[0].qty).toBe(2);
    expect(o.items[1].price).toBe(1899);
  });

  test('✓ optional trackingId field', () => {
    const o = new Order({ ...valid, trackingId: 'BD123456' });
    expect(o.trackingId).toBe('BD123456');
  });

  test('✓ optional address line2', () => {
    const o = new Order({ ...valid, address: { ...valid.address, line2: 'Near Station' } });
    expect(o.address.line2).toBe('Near Station');
  });
});

// ─── Admin Model ──────────────────────────────────────────────────────────────
describe('Admin Model — schema validation', () => {
  let Admin;
  beforeAll(() => {
    if (mongoose.modelNames().includes('Admin')) mongoose.deleteModel('Admin');
    Admin = require('../models/Admin');
  });

  test('✓ valid admin passes', async () => {
    const a = new Admin({ adminId: 'admin', password: '$2a$10$hashed' });
    await expect(a.validate()).resolves.toBeUndefined();
  });

  test('✗ missing adminId fails', async () => {
    await expect(new Admin({ password: 'hash' }).validate()).rejects.toThrow();
  });

  test('✗ missing password fails', async () => {
    await expect(new Admin({ adminId: 'admin' }).validate()).rejects.toThrow();
  });

  test('✓ timestamps enabled on schema', () => {
    const a = new Admin({ adminId: 'x', password: 'y' });
    expect(a.schema.options.timestamps).toBe(true);
  });
});

// ─── Business Logic (pure JS) ─────────────────────────────────────────────────
describe('Business logic — pricing & formatting', () => {
  const slugify = require('slugify');

  test('✓ subtotal = sum(price × qty)', () => {
    const items = [{ price: 1299, qty: 2 }, { price: 1899, qty: 1 }];
    expect(items.reduce((s, i) => s + i.price * i.qty, 0)).toBe(4497);
  });

  test('✓ free shipping at ₹999+', () => {
    const fee = (t) => t >= 999 ? 0 : 99;
    expect(fee(1299)).toBe(0);
    expect(fee(999)).toBe(0);
    expect(fee(998)).toBe(99);
    expect(fee(0)).toBe(99);
  });

  test('✓ discount percentage calculation', () => {
    const pct = (p, c) => Math.round((1 - p / c) * 100);
    expect(pct(999, 1299)).toBe(23);
    expect(pct(500, 1000)).toBe(50);
    expect(pct(1299, 1299)).toBe(0);
  });

  test('✓ order number format: SNRxxxxx', () => {
    const gen = (n) => `SNR${String(n + 1001).padStart(5, '0')}`;
    expect(gen(0)).toBe('SNR01001');
    expect(gen(9)).toBe('SNR01010');
    expect(gen(0)).toMatch(/^SNR\d{5}$/);
  });

  test('✓ slug generation from product names', () => {
    expect(slugify('SNERA Essential Tee',    { lower: true, strict: true })).toBe('snera-essential-tee');
    expect(slugify('Men\'s Oversized Hoodie', { lower: true, strict: true })).toBe('mens-oversized-hoodie');
    expect(slugify('Cotton T-Shirt 220 GSM',  { lower: true, strict: true })).toBe('cotton-t-shirt-220-gsm');
  });

  test('✓ INR formatter correctness', () => {
    const fmt = (n) => new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(n);
    expect(fmt(1299)).toContain('1,299');
    expect(fmt(0)).toContain('0');
    expect(fmt(12999)).toContain('12,999');
  });
});
