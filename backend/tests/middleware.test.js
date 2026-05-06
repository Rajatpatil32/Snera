/**
 * MIDDLEWARE + SITEMAP TESTS — pure jest mocks
 */
const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_jwt_secret_snera';

const authMiddleware = require('../middleware/auth');

// ─── Auth Middleware ──────────────────────────────────────────────────────────
describe('Auth Middleware', () => {
  const app = express();
  app.use(express.json());
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ ok: true, adminId: req.admin.adminId });
  });

  test('✓ allows valid JWT', async () => {
    const token = jwt.sign({ id: '1', adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.adminId).toBe('admin');
  });

  test('✗ blocks missing Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  test('✗ blocks malformed token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not_a_jwt_at_all');
    expect(res.status).toBe(401);
  });

  test('✗ blocks expired token', async () => {
    const token = jwt.sign({ id: '1', adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('✗ blocks token signed with wrong secret', async () => {
    const token = jwt.sign({ id: '1', adminId: 'admin' }, 'totally_wrong_secret', { expiresIn: '1h' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('✗ blocks Bearer with empty value', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  test('✓ sets req.admin from decoded token payload', async () => {
    const token = jwt.sign({ id: 'uid_1', adminId: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.adminId).toBe('superadmin');
  });
});

// ─── Sitemap Route ────────────────────────────────────────────────────────────
let mockProducts = [];

jest.mock('../models/Product', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

const Product = require('../models/Product');

// Wire up the mock before each test
beforeEach(() => {
  Product.find.mockImplementation(() => ({
    select: jest.fn(() => Promise.resolve(mockProducts)),
    sort:   jest.fn(function() { return this; }),
    skip:   jest.fn(function() { return this; }),
    limit:  jest.fn(() => Promise.resolve(mockProducts)),
  }));
});describe('GET /api/sitemap.xml', () => {
  const app = express();
  app.use(express.json());
  // sitemap.js registers router.get('.xml', ...) so mount maps /api/sitemap → router
  // Accessing /api/sitemap.xml hits the .xml handler
  app.use('/api/sitemap', require('../routes/sitemap'));

  beforeEach(() => { mockProducts = []; });

  // Route: app.use('/api/sitemap') + router.get('/') → GET /api/sitemap
  const SITEMAP_URL = '/api/sitemap';

  test('✓ returns 200 with XML content-type', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
  });

  test('✓ contains XML declaration', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('<?xml version="1.0"');
  });

  test('✓ contains urlset element', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('</urlset>');
  });

  test('✓ contains /shop static page', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('/shop');
  });

  test('✓ contains /track-order static page', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('/track-order');
  });

  test('✓ includes active product slugs', async () => {
    mockProducts = [
      { slug: 'snera-essential-tee', updatedAt: new Date() },
      { slug: 'snera-minimal-hoodie', updatedAt: new Date() },
    ];
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('/product/snera-essential-tee');
    expect(res.text).toContain('/product/snera-minimal-hoodie');
  });

  test('✓ empty product list still returns valid XML', async () => {
    mockProducts = [];
    const res = await request(app).get(SITEMAP_URL);
    expect(res.status).toBe(200);
    expect(res.text).toContain('<urlset');
  });

  test('✓ each URL has loc element', async () => {
    const res = await request(app).get(SITEMAP_URL);
    expect(res.text).toContain('<loc>');
    expect(res.text).toContain('</loc>');
  });
});
