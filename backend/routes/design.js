const router      = require('express').Router();
const mongoose    = require('mongoose');
const auth        = require('../middleware/auth');
const DesignQuery = require('../models/DesignQuery');
const model       = require('../services/designModel');

// Retrain automatically every N newly accepted requests
const AUTO_RETRAIN_EVERY = 20;

// Tiny in-memory limiter for the public endpoint (per IP, per hour)
const hits = new Map();
function limit(req, res, next) {
  const now = Date.now();
  const rec = (hits.get(req.ip) || []).filter(t => now - t < 3600_000);
  if (rec.length >= 30) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  rec.push(now); hits.set(req.ip, rec);
  next();
}

// POST /api/design/suggest  { category, concept } → { id, guidance }
router.post('/suggest', limit, async (req, res) => {
  try {
    const concept  = String(req.body.concept  || '').trim().slice(0, 600);
    const category = String(req.body.category || '').trim().slice(0, 60);
    if (!concept) return res.status(400).json({ error: 'Please describe your design concept.' });

    if (!model.isReady()) await model.retrain(DesignQuery);
    const { guidance, raw } = model.predict(category, concept);

    const doc = await DesignQuery.create({
      category, concept,
      prediction: { fit: raw.fit, palette: raw.palette, fabric: raw.fabric, detail: raw.detail },
    });
    res.json({ id: doc._id, guidance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/design/:id/accept — visitor went ahead (WhatsApp click) → becomes training data
router.post('/:id/accept', limit, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const doc = await DesignQuery.findOneAndUpdate(
      { _id: req.params.id, accepted: false }, { accepted: true }, { new: true }
    );
    if (doc) {
      const n = await DesignQuery.countDocuments({ accepted: true });
      if (n % AUTO_RETRAIN_EVERY === 0) model.retrain(DesignQuery).catch(console.error);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/design/retrain — admin: retrain now on bootstrap + real data
router.post('/retrain', auth, async (req, res) => {
  try {
    const counts = await model.retrain(DesignQuery);
    res.json({ ...counts, bootstrapHoldoutAccuracy: model.evaluate() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/design/:id — admin: correct the labels of a request (used as training data)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { fit, palette, fabric, detail } = req.body;
    const doc = await DesignQuery.findByIdAndUpdate(
      req.params.id, { corrected: { fit, palette, fabric, detail } }, { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;