const router  = require('express').Router();
const slugify = require('slugify');
const Product = require('../models/Product');
const TshirtMockup = require('../models/TshirtMockup');
const auth    = require('../middleware/auth');
const { onProductCreated, onProductUpdated, onProductDeleted } = require('../services/productHooks');
const { composeDesign } = require('../services/compose');
const { smartUpload } = require('../services/ftp');

// ─── Bake each designColors[] entry (design + global mockup) into a flat image ──
// Runs on create/update whenever the product is in designMode, so the admin
// never re-uploads photos per colour — the server composes them.
async function bakeDesignColors(product) {
  if (!product.designMode || !product.designUrl || !product.placement || !product.designColors?.length) return;

  for (const color of product.designColors) {
    const mockup = await TshirtMockup.findById(color.mockup);
    if (!mockup) continue;
    try {
      const composedBuf = await composeDesign(mockup.image, product.designUrl, product.placement);
      const filename = `snera_${product._id}_${color.mockup}_${Date.now()}.webp`;
      const { url } = await smartUpload(composedBuf, filename, null);
      color.image = url;
      color.name  = color.name  || mockup.name;
      color.hex   = color.hex   || mockup.hex;
    } catch (err) {
      console.error(`✗ Bake failed for colour ${color.name || color.mockup}:`, err.message);
    }
  }
  await product.save();
}

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
    await bakeDesignColors(product);   // 🎨 compose design onto each selected mockup
    onProductCreated(product);   // 🔁 auto-sync to Google Merchant
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
    // Only re-bake when the design, its placement, or the colour list changed —
    // avoids re-compositing on unrelated edits (price, description, etc.)
    if (product.designMode && ('designUrl' in req.body || 'placement' in req.body || 'designColors' in req.body)) {
      await bakeDesignColors(product);
    }
    onProductUpdated(product);   // 🔁 auto-sync to Google Merchant
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    onProductDeleted(req.params.id);   // 🔁 remove from Google Merchant
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/admin/bulk-archive — archive many products at once (select-then-delete in Admin)
// body: { ids: [productId, ...] }
router.post('/admin/bulk-archive', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length)
      return res.status(400).json({ error: 'ids array required' });

    await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
    ids.forEach(id => onProductDeleted(id)); // 🔁 remove each from Google Merchant

    res.json({ success: true, archived: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/admin/bulk-import — bulk create from CSV
router.post('/admin/bulk-import', auth, async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || !products.length)
      return res.status(400).json({ error: 'products array required' });

    const VALID_BADGES = ['New', 'Sale', ''];
    const VALID_GENDERS = ['Men', 'Women', 'Unisex'];

    const results = [];
    for (const p of products) {
      try {
        const base = slugify(p.name, { lower: true, strict: true });
        let slug = base; let n = 1;
        while (await Product.findOne({ slug })) slug = `${base}-${n++}`;

        const created = await Product.create({
          name:             p.name,
          slug,
          category:         p.category         || 'Tops',
          gender:           VALID_GENDERS.includes(p.gender) ? p.gender : 'Unisex',
          price:            Number(p.price)     || 0,
          comparePrice:     p.compareprice      ? Number(p.compareprice)  : (p.comparePrice ? Number(p.comparePrice) : undefined),
          description:      p.description       || '',
          fabric:           p.fabric            || '',
          careInstructions: p.careinstructions  || p.careInstructions || '',
          sizes:            p.sizes  ? String(p.sizes).split(/[,|]/).map(s => s.trim()).filter(Boolean) : [],
          soldSizes:        p.soldsizes ? String(p.soldsizes).split(/[,|]/).map(s => s.trim()).filter(Boolean) : [],
          // Optional per-size price add-on, e.g. "XL:50|XXL:100" → XL costs +₹50, XXL costs +₹100
          sizePricing:      (p.sizepricing || p.sizePricing)
            ? String(p.sizepricing || p.sizePricing).split(/[,|]/).map(pair => {
                const [size, extra] = pair.split(':').map(s => s.trim());
                return { size, extraPrice: Number(extra) || 0 };
              }).filter(sp => sp.size)
            : [],
          tags:             p.tags   ? String(p.tags).split(/[,|]/).map(t => t.trim()).filter(Boolean) : [],
          badge:            VALID_BADGES.includes(p.badge) ? p.badge : 'New',
          glyph:            p.glyph             || '◈',
          weight:           p.weight            ? Number(p.weight) : 200,
          isActive:         p.isactive  !== undefined ? (String(p.isactive).toLowerCase()  !== 'false' && p.isactive  !== '0') : true,
          isFeatured:       p.isfeatured !== undefined ? (String(p.isfeatured).toLowerCase() === 'true'  || p.isfeatured === '1') : false,
          images:           [],
          colorGroups:      [],
          seo: {
            metaTitle:       p['seo.metatitle']       || p.seo_metatitle       || '',
            metaDescription: p['seo.metadescription'] || p.seo_metadescription || '',
            focusKeyword:    p['seo.focuskeyword']     || p.seo_focuskeyword    || '',
            keywords:        p['seo.keywords']         ? String(p['seo.keywords']).split(',').map(k => k.trim()).filter(Boolean) : [],
            ogTitle:         p['seo.ogtitle']          || p.seo_ogtitle         || '',
            ogDescription:   p['seo.ogdescription']    || p.seo_ogdescription   || '',
            canonicalUrl:    p['seo.canonicalurl']     || p.seo_canonicalurl    || '',
            noIndex:         String(p['seo.noindex'] || p.seo_noindex || 'false').toLowerCase() === 'true',
          },
        });
        results.push({ status: 'ok', name: p.name, id: created._id });
      } catch (err) {
        results.push({ status: 'error', name: p.name, error: err.message });
      }
    }
    res.json({ results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products/admin/bulk-price-update — adjust ALL product prices in one click
// body: { amount: Number, direction: 'increase' | 'decrease', mode: 'flat' | 'percent', includeComparePrice?: Boolean }
router.post('/admin/bulk-price-update', auth, async (req, res) => {
  try {
    const { amount, direction = 'increase', mode = 'flat', includeComparePrice = false } = req.body;

    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: 'A positive amount is required' });
    if (!['increase', 'decrease'].includes(direction))
      return res.status(400).json({ error: "direction must be 'increase' or 'decrease'" });
    if (!['flat', 'percent'].includes(mode))
      return res.status(400).json({ error: "mode must be 'flat' or 'percent'" });

    const sign = direction === 'increase' ? 1 : -1;
    const adjust = (price) => {
      if (price == null) return price;
      const delta = mode === 'percent' ? price * (amt / 100) : amt;
      const next = price + sign * delta;
      return Math.max(0, Math.round(next * 100) / 100); // never go below 0, round to paise
    };

    const products = await Product.find({}, '_id price comparePrice');
    if (!products.length) return res.json({ success: true, updated: 0 });

    const ops = products.map(p => {
      const update = { price: adjust(p.price) };
      if (includeComparePrice && p.comparePrice != null) update.comparePrice = adjust(p.comparePrice);
      return { updateOne: { filter: { _id: p._id }, update: { $set: update } } };
    });

    await Product.bulkWrite(ops);
    res.json({ success: true, updated: ops.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;