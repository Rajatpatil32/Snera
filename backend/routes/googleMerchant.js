const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Product = require('../models/Product');
const {
  syncProduct,
  syncAllProducts,
  deleteProduct,
  getProductFromMerchant,
} = require('../services/googleMerchant');

// All routes require admin JWT
router.use(auth);

// ─── POST /api/google-merchant/sync ──────────────────────────────────────────
// Bulk sync ALL active products to Google Merchant Center
router.post('/sync', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    if (!products.length) {
      return res.json({ success: true, message: 'No active products to sync', total: 0, succeeded: 0, failed: 0, results: [] });
    }

    const result = await syncAllProducts(products);
    const status = result.failed === 0 ? 200 : result.succeeded === 0 ? 502 : 207;
    return res.status(status).json({ success: result.failed === 0, ...result });
  } catch (err) {
    console.error('[GoogleMerchant] /sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/google-merchant/product/:id ───────────────────────────────────
// Sync single product by MongoDB _id
router.post('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    if (!product.isActive) return res.status(400).json({ success: false, error: 'Product is not active — only active products can be synced' });

    const result = await syncProduct(product);
    return res.status(result.success ? 200 : 502).json(result);
  } catch (err) {
    console.error('[GoogleMerchant] /product/:id sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/google-merchant/product/:id ────────────────────────────────────
// Check if a product exists in Merchant Center
router.get('/product/:id', async (req, res) => {
  try {
    const data = await getProductFromMerchant(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    if (err?.code === 404 || err?.response?.status === 404) {
      return res.status(404).json({ success: false, error: 'Product not found in Google Merchant Center' });
    }
    console.error('[GoogleMerchant] /product/:id get error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/google-merchant/product/:id ─────────────────────────────────
// Remove product from Merchant Center
router.delete('/product/:id', async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    return res.status(result.success ? 200 : 502).json(result);
  } catch (err) {
    console.error('[GoogleMerchant] /product/:id delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;