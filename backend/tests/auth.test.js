/**
 * AUTH ROUTE TESTS — mocked mongoose, no real DB
 */
const request = require('supertest');
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_jwt_secret_snera';

// ── Mock Admin model ──────────────────────────────────────────────────────────
const mockAdmins = [];
jest.mock('../models/Admin', () => ({
  findOne: jest.fn(async ({ adminId }) =>
    mockAdmins.find(a => a.adminId === adminId) || null
  ),
  create: jest.fn(async (data) => {
    mockAdmins.push(data);
    return data;
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));

beforeAll(async () => {
  const hash = await bcrypt.hash('testpass123', 10);
  mockAdmins.push({ _id: 'admin_id_1', adminId: 'testadmin', password: hash });
});

beforeEach(() => jest.clearAllMocks());

// Re-wire findOne after clear
afterEach(() => {
  const Admin = require('../models/Admin');
  Admin.findOne.mockImplementation(async ({ adminId }) =>
    mockAdmins.find(a => a.adminId === adminId) || null
  );
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  test('✓ returns JWT token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'testadmin', password: 'testpass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.adminId).toBe('testadmin');
  });

  test('✓ token is a valid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'testadmin', password: 'testpass123' });

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.adminId).toBe('testadmin');
  });

  test('✗ wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'testadmin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('✗ unknown admin returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'nobody', password: 'testpass123' });

    expect(res.status).toBe(401);
  });

  test('✗ missing password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'testadmin' });

    expect(res.status).toBe(400);
  });

  test('✗ missing adminId returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'testpass123' });

    expect(res.status).toBe(400);
  });

  test('✗ empty body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/auth/verify ─────────────────────────────────────────────────────
describe('GET /api/auth/verify', () => {

  let validToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ adminId: 'testadmin', password: 'testpass123' });
    validToken = res.body.token;
  });

  test('✓ verifies valid token', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.adminId).toBe('testadmin');
  });

  test('✗ rejects invalid token string', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer totally_invalid_token');

    expect(res.status).toBe(401);
  });

  test('✗ rejects expired token', async () => {
    const expired = jwt.sign({ id: '1', adminId: 'testadmin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  test('✗ rejects token signed with wrong secret', async () => {
    const wrongToken = jwt.sign({ id: '1', adminId: 'x' }, 'wrong_secret_key', { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${wrongToken}`);

    expect(res.status).toBe(401);
  });

  test('✗ rejects missing Authorization header', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.status).toBe(401);
  });
});
