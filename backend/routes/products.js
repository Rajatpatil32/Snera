const router  = require('express').Router();
const slugify = require('slugify');
const Product = require('../models/Product');
const auth    = require('../middleware/auth');

// ─── STATIC NAMED ROUTES FIRST (before /:slug wildcard) ──────────────────────

// GET /api/products/admin/all — admin: all products including inactive
router.get('/admin/all', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/products — list with filters
router.get('/', async (req, res) => {
  try {
    const { category, gender, featured, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category   = category;
    if (gender)   filter.gender     = gender;
    if (featured) filter.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:slug — single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// POST /api/products — create
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const base = slugify(name, { lower: true, strict: true });
    let slug = base; let n = 1;
    while (await Product.findOne({ slug })) slug = `${base}-${n++}`;
    const product = await Product.create({ ...req.body, slug });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id — update
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// POST /api/products/admin/bulk-import — bulk create from CSV
router.post('/admin/bulk-import', auth, async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || !products.length)
      return res.status(400).json({ error: 'products array required' });

    const results = [];
    for (const p of products) {
      try {
        const base = slugify(p.name, { lower: true, strict: true });
        let slug = base; let n = 1;
        while (await Product.findOne({ slug })) slug = `${base}-${n++}`;
        const created = await Product.create({
          ...p,
          slug,
          price: Number(p.price) || 0,
          comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
          sizes: p.sizes ? String(p.sizes).split(',').map(s => s.trim()).filter(Boolean) : ['S','M','L','XL'],
          tags:  p.tags  ? String(p.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
          isActive: true,
          isFeatured: false,
          images: [],
          colorGroups: [],
        });
        results.push({ status: 'ok', name: p.name, id: created._id });
      } catch (err) {
        results.push({ status: 'error', name: p.name, error: err.message });
      }
    }
    res.json({ results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});