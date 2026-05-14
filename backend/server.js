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
//   /api/sitemap/pages.xml
//   /api/sitemap/products.xml
//   /api/sitemap/categories.xml
// robots.txt points to: /api/sitemap.xml → redirects to index
app.use('/api/sitemap',  require('./routes/sitemap'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', brand: 'SNERA' }));

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