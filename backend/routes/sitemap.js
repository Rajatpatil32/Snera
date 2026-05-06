const router  = require('express').Router();
const Product = require('../models/Product');

// GET /api/sitemap.xml  (mounted at /api/sitemap in server.js)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('slug updatedAt');
    const base = process.env.FRONTEND_URL || 'https://snera.in';

    const staticPages = ['', '/shop', '/about', '/track-order'];

    const staticUrls = staticPages.map(p => `
  <url>
    <loc>${base}${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

    const productUrls = products.map(p => `
  <url>
    <loc>${base}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${productUrls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
