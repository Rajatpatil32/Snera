require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL,'http://localhost:3000','https://suvidhasetu.netraa.co.in'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/upload',   require('./routes/upload'));
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
