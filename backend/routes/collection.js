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

module.exports = router;