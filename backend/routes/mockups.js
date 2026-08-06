const router = require('express').Router();
const TshirtMockup = require('../models/TshirtMockup');
const auth = require('../middleware/auth');

// GET /api/mockups — list active mockups (used by admin design composer)
router.get('/', auth, async (req, res) => {
  try {
    const mockups = await TshirtMockup.find().sort({ order: 1, createdAt: 1 });
    res.json({ mockups, total: mockups.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mockups — create a new global mockup
router.post('/', auth, async (req, res) => {
  try {
    const mockup = await TshirtMockup.create(req.body);
    res.status(201).json(mockup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/mockups/:id — update a mockup
router.put('/:id', auth, async (req, res) => {
  try {
    const mockup = await TshirtMockup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!mockup) return res.status(404).json({ error: 'Mockup not found' });
    res.json(mockup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/mockups/:id — remove a mockup
router.delete('/:id', auth, async (req, res) => {
  try {
    await TshirtMockup.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;