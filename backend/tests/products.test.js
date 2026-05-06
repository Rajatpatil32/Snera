/**
 * PRODUCTS ROUTE TESTS — mocked mongoose
 */
const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_jwt_secret_snera';

// ── In-memory product store ───────────────────────────────────────────────────
let products = [];
let idCounter = 1;
const makeId = () => new mongoose.Types.ObjectId().toString();

jest.mock('../models/Product', () => {
  const actual = jest.requireActual('../models/Product');
  return {
    find:          jest.fn(),
    findOne:       jest.fn(),
    findById:      jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create:        jest.fn(),
  };
});

const Product = require('../models/Product');

// Helpers to control mock behaviour
const resetProducts = () => { products = []; };

const seed = (overrides = {}) => {
  const p = {
    _id: makeId(), name: 'SNERA Tee', slug: `snera-tee-${Date.now()}`,
    category: 'Tops', gender: 'Unisex', price: 1299,
    description: 'Great tee.', isActive: true, isFeatured: false,
    badge: 'New', glyph: '◈', sizes: ['S','M','L'], soldSizes: [],
    images: [], tags: [], comparePrice: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
  products.push(p);
  return p;
};

// Wire mocks to in-memory store
beforeEach(() => {
  resetProducts();

  Product.find.mockImplementation((filter = {}) => {
    let res = products;
    if (filter.isActive !== undefined) res = res.filter(p => p.isActive === filter.isActive);
    if (filter.category)  res = res.filter(p => p.category  === filter.category);
    if (filter.gender)    res = res.filter(p => p.gender    === filter.gender);
    if (filter.isFeatured !== undefined) res = res.filter(p => p.isFeatured === filter.isFeatured);
    const copy = [...res];
    const chain = {
      sort:  () => chain,
      skip:  () => chain,
      limit: () => Promise.resolve(copy),
    };
    return chain;
  });

  Product.findOne.mockImplementation(async (filter = {}) => {
    return products.find(p => {
      if (filter.slug && p.slug !== filter.slug) return false;
      if (filter._id  && String(p._id) !== String(filter._id)) return false;
      if (filter.isActive !== undefined && p.isActive !== filter.isActive) return false;
      return true;
    }) || null;
  });

  Product.findById.mockImplementation(async (id) =>
    products.find(p => String(p._id) === String(id)) || null
  );

  Product.findByIdAndUpdate.mockImplementation(async (id, update, opts) => {
    const idx = products.findIndex(p => String(p._id) === String(id));
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...update };
    return products[idx];
  });

  Product.countDocuments.mockImplementation(async (filter = {}) => {
    let res = products;
    if (filter.isActive !== undefined) res = res.filter(p => p.isActive === filter.isActive);
    return res.length;
  });

  Product.create.mockImplementation(async (data) => {
    const p = { _id: makeId(), createdAt: new Date(), updatedAt: new Date(), ...data };
    products.push(p);
    return p;
  });
});

const authToken = jwt.sign({ id: 'admin1', adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const app = express();
app.use(express.json());
app.use('/api/products', require('../routes/products'));

// ─── GET /api/products ────────────────────────────────────────────────────────
describe('GET /api/products', () => {

  test('✓ returns 200 with products array', async () => {
    seed(); seed();
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('✓ returns pagination metadata', async () => {
    seed();
    const res = await request(app).get('/api/products');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
  });
});

// ─── POST /api/products ───────────────────────────────────────────────────────
describe('POST /api/products (admin)', () => {
  const newProduct = {
    name: 'New Tee', category: 'Tops', gender: 'Unisex',
    price: 999, description: 'Test desc', sizes: ['S','M'],
  };

  test('✓ admin can create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newProduct);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Tee');
    expect(res.body._id).toBeDefined();
  });

  test('✗ no auth token returns 401', async () => {
    const res = await request(app).post('/api/products').send(newProduct);
    expect(res.status).toBe(401);
  });

  test('✗ invalid token returns 401', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer badtoken')
      .send(newProduct);
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
describe('PUT /api/products/:id (admin)', () => {

  test('✓ updates existing product', async () => {
    const p = seed();
    const res = await request(app)
      .put(`/api/products/${p._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ price: 799, badge: 'Sale' });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(799);
    expect(res.body.badge).toBe('Sale');
  });

  test('✗ no auth returns 401', async () => {
    const p = seed();
    const res = await request(app)
      .put(`/api/products/${p._id}`)
      .send({ price: 100 });
    expect(res.status).toBe(401);
  });

  test('✗ non-existent product returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ price: 100 });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
describe('DELETE /api/products/:id (admin)', () => {

  test('✓ admin can soft-delete (archive) product', async () => {
    const p = seed();
    const res = await request(app)
      .delete(`/api/products/${p._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('✗ no auth returns 401', async () => {
    const p = seed();
    const res = await request(app).delete(`/api/products/${p._id}`);
    expect(res.status).toBe(401);
  });
});
