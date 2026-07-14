const router     = require('express').Router();
const Collection = require('../models/Collection');
const auth       = require('../middleware/auth');

// GET /api/collections — public: active collections only, for Shop filters
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/admin/all — admin: all collections including inactive
router.get('/admin/all', auth, async (req, res) => {
  try {
    const collections = await Collection.find().sort({ sortOrder: 1, name: 1 });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/collections — admin: create
router.post('/', auth, async (req, res) => {
  try {
    const collection = await Collection.create(req.body);
    res.status(201).json({ collection });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/collections/:id — admin: update
router.put('/:id', auth, async (req, res) => {
  try {
    const slug = req.body.name ? require('slugify')(req.body.name, { lower: true, strict: true }) : undefined;
    req.body.slug = slug;
    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/collections/:id — admin: delete (only if no products use it)
router.delete('/:id', auth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const inUse = await Product.countDocuments({ category: collection.name });
    if (inUse > 0) return res.status(400).json({ error: `${inUse} product(s) still use this collection. Reassign them first.` });

    await collection.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC: all active collections
router.get('/', async (req, res) => {
  try {
    const cols = await Collection.find({ isActive: true })
      .populate('products', 'name slug price images')
      .sort({ displayOrder: 1 });
    res.json(cols);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUBLIC: single collection by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const col = await Collection.findOne({ slug: req.params.slug, isActive: true })
      .populate('products', 'name slug price images category');
    if (!col) return res.status(404).json({ error: 'Not found' });
    res.json(col);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUBLIC: featured collections
router.get('/featured/list', async (req, res) => {
  try {
    const cols = await Collection.find({ isActive: true, isFeatured: true })
      .populate('products', 'name slug price images')
      .sort({ displayOrder: 1 })
      .limit(6);
    res.json(cols);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: all collections
router.get('/admin/all', auth, async (req, res) => {
  try {
    const cols = await Collection.find()
      .populate('products', 'name slug')
      .sort({ displayOrder: 1 });
    res.json(cols);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: create collection
router.post('/admin', auth, async (req, res) => {
  try {
    const col    = new Collection(req.body);
    const saved  = await col.save();
    const result = await saved.populate('products', 'name slug');
    res.status(201).json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: update collection
router.put('/admin/:id', auth, async (req, res) => {
  try {
    const col = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('products', 'name slug');
    if (!col) return res.status(404).json({ error: 'Not found' });
    res.json(col);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: add products to collection
router.post('/admin/:id/add-products', auth, async (req, res) => {
  try {
    const { productIds } = req.body;
    const col = await Collection.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { products: { $each: productIds } } },
      { new: true }
    ).populate('products', 'name slug price');
    if (!col) return res.status(404).json({ error: 'Not found' });
    res.json(col);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: remove product from collection
router.delete('/admin/:id/products/:productId', auth, async (req, res) => {
  try {
    const col = await Collection.findByIdAndUpdate(
      req.params.id,
      { $pull: { products: req.params.productId } },
      { new: true }
    ).populate('products', 'name slug');
    if (!col) return res.status(404).json({ error: 'Not found' });
    res.json(col);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ADMIN: delete collection
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const col = await Collection.findByIdAndDelete(req.params.id);
    if (!col) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;