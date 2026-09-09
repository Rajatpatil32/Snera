const router     = require('express').Router();
const Collection = require('../models/Collection');
const Product    = require('../models/Product');
const slugify    = require('slugify');
const auth       = require('../middleware/auth');

// GET /api/collections — public: active collections only, for Navbar/Shop/Homepage.
// Sorted by displayOrder (lower = shown first), so the Admin "Display Order"
// field actually controls priority/ordering everywhere it's used.
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/featured/list — public: featured collections only (e.g. homepage highlights)
router.get('/featured/list', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true, isFeatured: true })
      .populate('products', 'name slug price images')
      .sort({ displayOrder: 1, name: 1 })
      .limit(6);
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/slug/:slug — public: single collection with its curated products
router.get('/slug/:slug', async (req, res) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, isActive: true })
      .populate('products', 'name slug price images category');
    if (!collection) return res.status(404).json({ error: 'Not found' });
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/admin/all — admin: every collection (active + inactive), with products populated
// for the "Selected products" preview in the collection form. Sorted by displayOrder.
router.get('/admin/all', auth, async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate('products', 'name slug price images')
      .sort({ displayOrder: 1, name: 1 });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/collections/admin — admin: create
router.post('/admin', auth, async (req, res) => {
  try {
    const collection = await Collection.create(req.body);
    const populated  = await collection.populate('products', 'name slug price images');
    res.status(201).json({ collection: populated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/collections/admin/:id — admin: update
router.put('/admin/:id', auth, async (req, res) => {
  try {
    if (req.body.name) req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('products', 'name slug price images');
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/collections/admin/:id — admin: delete (blocked if products still use this category,
// so you never end up with orphaned products silently invisible from Shop/homepage again)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const inUse = await Product.countDocuments({ category: collection.name });
    if (inUse > 0)
      return res.status(400).json({ error: `${inUse} product(s) still use this category. Reassign them first.` });

    await collection.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/collections/admin/:id/add-products — admin: add products to a collection's curated list
router.post('/admin/:id/add-products', auth, async (req, res) => {
  try {
    const { productIds } = req.body;
    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { products: { $each: productIds } } },
      { new: true }
    ).populate('products', 'name slug price images');
    if (!collection) return res.status(404).json({ error: 'Not found' });
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/collections/admin/:id/products/:productId — admin: remove one product from a collection
router.delete('/admin/:id/products/:productId', auth, async (req, res) => {
  try {
    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      { $pull: { products: req.params.productId } },
      { new: true }
    ).populate('products', 'name slug price images');
    if (!collection) return res.status(404).json({ error: 'Not found' });
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;