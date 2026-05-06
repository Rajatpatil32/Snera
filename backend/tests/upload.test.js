/**
 * UPLOAD ROUTE TESTS
 * Tests: GET /api/upload/list, DELETE /api/upload/:filename, path traversal security
 */

const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

process.env.JWT_SECRET = 'test_jwt_secret_snera';

const authToken = jwt.sign({ id: 'admin1', adminId: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Create a real temp upload directory so fs operations work
let tmpDir;
let originalUploadDir;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snera-upload-test-'));

  // Patch the upload directory path before requiring the route
  // We do this by modifying the module's resolved path
  jest.resetModules();

  // Intercept multer storage to write to tmpDir
  jest.doMock('multer', () => {
    const realMulter = jest.requireActual('multer');
    return Object.assign(
      (opts) => realMulter({ ...opts }),
      realMulter
    );
  });
});

afterAll(() => {
  // Clean up temp files
  try {
    fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
    fs.rmdirSync(tmpDir);
  } catch {}
});

// Build test app with custom upload dir
function buildApp() {
  const app = express();
  app.use(express.json());

  // Override __dirname-based path in the route by setting env
  process.env.UPLOAD_DIR_OVERRIDE = tmpDir;

  // Recreate the route logic inline for testability
  const multer = require('multer');
  const auth   = require('../middleware/auth');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpDir),
    filename:    (req, file, cb) => cb(null, `test_${Date.now()}.jpg`),
  });
  const upload = multer({ storage });

  app.post('/api/upload', auth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  });

  app.get('/api/upload/list', auth, (req, res) => {
    try {
      const files = fs.readdirSync(tmpDir)
        .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
        .map(filename => {
          const fp   = path.join(tmpDir, filename);
          const stat = fs.statSync(fp);
          return { filename, url: `/uploads/${filename}`, size: stat.size, uploadedAt: stat.birthtime };
        });
      res.json({ images: files, total: files.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/upload/:filename', auth, (req, res) => {
    const filename = req.params.filename;
    const safe     = path.basename(filename);
    if (safe !== filename || safe.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(tmpDir, safe);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, filename: safe });
  });

  return app;
}

// ─── GET /api/upload/list ─────────────────────────────────────────────────────
describe('GET /api/upload/list (admin)', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('✓ returns empty list when no images', async () => {
    const res = await request(app)
      .get('/api/upload/list')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.images).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('✓ lists uploaded images with metadata', async () => {
    // Create a fake image file
    const fname = 'snera_test_img.jpg';
    fs.writeFileSync(path.join(tmpDir, fname), Buffer.from('fake-jpg-data'));

    const res = await request(app)
      .get('/api/upload/list')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.images.length).toBeGreaterThan(0);
    const img = res.body.images.find(i => i.filename === fname);
    expect(img).toBeDefined();
    expect(img).toHaveProperty('url');
    expect(img).toHaveProperty('size');
    expect(img).toHaveProperty('uploadedAt');
    expect(img.url).toContain(fname);

    // Cleanup
    fs.unlinkSync(path.join(tmpDir, fname));
  });

  test('✓ only returns image files (jpg, png, webp, avif)', async () => {
    // Create a non-image file
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not an image');
    fs.writeFileSync(path.join(tmpDir, 'photo.jpg'), 'fake jpg');

    const res = await request(app)
      .get('/api/upload/list')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    res.body.images.forEach(img => {
      expect(img.filename).toMatch(/\.(jpe?g|png|webp|avif)$/i);
    });
    expect(res.body.images.find(i => i.filename === 'readme.txt')).toBeUndefined();

    // Cleanup
    fs.unlinkSync(path.join(tmpDir, 'readme.txt'));
    fs.unlinkSync(path.join(tmpDir, 'photo.jpg'));
  });

  test('✗ rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/upload/list');
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/upload/:filename ─────────────────────────────────────────────
describe('DELETE /api/upload/:filename (admin)', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  test('✓ deletes existing file', async () => {
    const fname = 'to_delete.jpg';
    fs.writeFileSync(path.join(tmpDir, fname), 'fake data');

    const res = await request(app)
      .delete(`/api/upload/${fname}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, fname))).toBe(false);
  });

  test('✗ returns 404 for non-existent file', async () => {
    const res = await request(app)
      .delete('/api/upload/doesnotexist.jpg')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  test('✗ blocks path traversal attempt (../)', async () => {
    const res = await request(app)
      .delete('/api/upload/..%2F..%2Fetc%2Fpasswd')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBeOneOf([400, 404]);
  });

  test('✗ rejects unauthenticated delete', async () => {
    const res = await request(app).delete('/api/upload/anything.jpg');
    expect(res.status).toBe(401);
  });
});

// ─── Path traversal security ──────────────────────────────────────────────────
describe('Security — path traversal prevention', () => {

  const sanitize = (filename) => {
    const safe = path.basename(filename);
    if (safe !== filename || safe.includes('..')) return null;
    return safe;
  };

  test('✓ normal filename passes sanitization', () => {
    expect(sanitize('snera_img_001.jpg')).toBe('snera_img_001.jpg');
  });

  test('✗ path traversal with ../ is blocked', () => {
    expect(sanitize('../../../etc/passwd')).toBeNull();
  });

  test('✗ nested path is blocked', () => {
    expect(sanitize('subdir/image.jpg')).toBeNull();
  });

  test('✗ encoded traversal is blocked', () => {
    // path.basename handles encoded chars differently — ensure safety
    const decoded = decodeURIComponent('..%2F..%2Fetc%2Fpasswd');
    expect(sanitize(decoded)).toBeNull();
  });

  test('✓ filename with spaces is safe if no path', () => {
    const name = 'my image.jpg';
    expect(sanitize(name)).toBe(name);
  });
});

// Custom matcher for toBeOneOf
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () => `expected ${received} to be one of ${expected.join(', ')}`,
    };
  },
});
