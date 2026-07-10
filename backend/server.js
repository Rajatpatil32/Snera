require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ─── Security + SEO Headers ───────────────────────────────────────────────────
// These headers improve security (Googlebot trusts HTTPS sites more) and
// signal to crawlers that the site is well-maintained.
app.use((req, res, next) => {
  // HTTPS enforcement signal
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Prevent MIME sniffing (affects crawl quality signals)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Referrer policy (privacy-friendly, preserves analytics on same-origin)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Allow Google to read structured data from images
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ─── Cache headers for static assets ─────────────────────────────────────────
// Uploads (product images): cache aggressively — improves LCP scores
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Vary', 'Accept-Encoding');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://suvidhasetu.netraa.co.in'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/upload',   require('./routes/upload'));

// Sitemap — mounted at /api/sitemap
// Accessible at:
//   /api/sitemap/          → sitemap index
//   /api/sitemap.xml       → sitemap index (for robots.txt reference — no redirect)
//   /api/sitemap/pages.xml
//   /api/sitemap/products.xml
// robots.txt points to: /api/sitemap.xml (serves index directly)
app.use('/api/sitemap',  require('./routes/sitemap'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', brand: 'SNERA' }));

//temp
app.get('/api/test-email', async (req, res) => {
  try {
    const SibApiV3Sdk = require('sib-api-v3-sdk');

    const client = SibApiV3Sdk.ApiClient.instance;

    client.authentications['api-key'].apiKey =
      process.env.BREVO_API_KEY;

    const api = new SibApiV3Sdk.TransactionalEmailsApi();

    const response = await api.sendTransacEmail({
      sender: {
        name: 'SNERA',
        email: 'contact@snera.in',
      },

      to: [
        {
          email: 'rajatpatil3264@gmail.com',
        },
      ],

      subject: 'Production Email Test',

      htmlContent: `
        <h1>Email Working 🚀</h1>
      `,
    });

    console.log(response);

    res.json({
      success: true,
      response,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
      full: err,
    });
  }
});

app.use('/api/collections', require('./routes/collection'));

// ─── Keep-Alive (Render free tier) ───────────────────────────────────────────
// Render spins down free services after ~15 min of inactivity.
// This self-ping every 14 minutes keeps the server awake.
// RENDER_EXTERNAL_URL is automatically set by Render in production.
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  const https = require('https');
  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  setInterval(() => {
    const url = `${SELF_URL}/api/health`;
    https.get(url, (res) => {
      console.log(`[keep-alive] ping → ${url} | status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.warn(`[keep-alive] ping failed: ${err.message}`);
    });
  }, PING_INTERVAL_MS);

  console.log(`✓ Keep-alive enabled — pinging ${SELF_URL}/api/health every 14 min`);
}

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snera')
  .then(() => {
    console.log('✓ MongoDB connected');
    seedAdmin();
  })
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Seed default admin if not exists
async function seedAdmin() {
  const Admin = require('./models/Admin');
  const bcrypt = require('bcryptjs');
  const exists = await Admin.findOne({ adminId: process.env.ADMIN_ID || 'admin' });
  if (!exists) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'snera@admin123', 10);
    await Admin.create({ adminId: process.env.ADMIN_ID || 'admin', password: hash });
    console.log('✓ Default admin seeded');
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✓ SNERA backend running on port ${PORT}`));