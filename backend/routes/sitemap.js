/**
 * sitemap.js — Dynamic XML Sitemap for SNERA
 *
 * Endpoints:
 *   GET /api/sitemap.xml        → Sitemap index (references sub-sitemaps)
 *   GET /api/sitemap/pages.xml  → Static pages sitemap
 *   GET /api/sitemap/products.xml → Product pages + image tags
 *   GET /api/sitemap/categories.xml → Category/filter pages
 *
 * Mounted at /api/sitemap in server.js
 *
 * Image sitemap spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */

const router  = require('express').Router();
const Product = require('../models/Product');

const BASE = process.env.FRONTEND_URL || 'https://snera.in';
const API_BASE = process.env.BACKEND_URL || 'https://snera.in';

// ── Helpers ──────────────────────────────────────────────────────────────────
function xmlEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function absImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Backend-served uploads
  return `${API_BASE}${path}`;
}

// ── Sitemap Index ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE}/api/sitemap/pages.xml</loc>
    <lastmod>${today()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/api/sitemap/products.xml</loc>
    <lastmod>${today()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/api/sitemap/categories.xml</loc>
    <lastmod>${today()}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600'); // cache 1 hour
  res.send(xml);
});

// ── Also serve sitemap index at /api/sitemap.xml (for robots.txt ref) ────────
router.get('.xml', async (req, res) => res.redirect(301, `${BASE}/api/sitemap/`));

// ── Static Pages Sitemap ──────────────────────────────────────────────────────
router.get('/pages.xml', (req, res) => {
  const pages = [
    { loc: '/',               priority: '1.0', changefreq: 'daily'   },
    { loc: '/shop',           priority: '0.9', changefreq: 'daily'   },
    { loc: '/contact',        priority: '0.7', changefreq: 'monthly' },
    { loc: '/track-order',    priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly'  },
    { loc: '/refund-policy',  priority: '0.3', changefreq: 'yearly'  },
    { loc: '/terms',          priority: '0.3', changefreq: 'yearly'  },
    { loc: '/shipping-policy',priority: '0.3', changefreq: 'yearly'  },
  ];

  const urls = pages.map(p => `
  <url>
    <loc>${xmlEscape(`${BASE}${p.loc}`)}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=86400'); // 24h
  res.send(xml);
});

// ── Product Pages Sitemap (with image sitemap extension) ──────────────────────
router.get('/products.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('slug name updatedAt images colorGroups category gender')
      .lean();

    const urls = products.map(p => {
      // Collect all images across colour groups
      const allImages = p.colorGroups?.length
        ? p.colorGroups.flatMap(g => (g.images || []))
        : (p.images || []);

      const imageTags = allImages
        .slice(0, 10) // Google allows up to 1000 but keep it sane
        .map(img => {
          const url = absImageUrl(img);
          if (!url) return '';
          return `
    <image:image>
      <image:loc>${xmlEscape(url)}</image:loc>
      <image:title>${xmlEscape(p.name)}</image:title>
      <image:caption>${xmlEscape(`${p.name} — ${p.category} | SNERA`)}</image:caption>
    </image:image>`;
        }).join('');

      return `
  <url>
    <loc>${xmlEscape(`${BASE}/product/${p.slug}`)}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : today()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imageTags}
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Category / Filter Pages Sitemap ──────────────────────────────────────────
router.get('/categories.xml', async (req, res) => {
  try {
    const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Accessories'];
    const GENDERS    = ['Men', 'Women', 'Unisex'];

    const categoryPages = CATEGORIES.map(cat => ({
      loc:        `/shop?category=${cat}`,
      priority:   '0.8',
      changefreq: 'daily',
    }));

    const genderPages = GENDERS.map(g => ({
      loc:        `/shop?gender=${g}`,
      priority:   '0.7',
      changefreq: 'daily',
    }));

    // Cross-filtered pages (category + gender)
    const crossPages = [];
    for (const cat of CATEGORIES) {
      for (const g of GENDERS) {
        crossPages.push({
          loc:        `/shop?category=${cat}&gender=${g}`,
          priority:   '0.6',
          changefreq: 'weekly',
        });
      }
    }

    const allPages = [...categoryPages, ...genderPages, ...crossPages];

    const urls = allPages.map(p => `
  <url>
    <loc>${xmlEscape(`${BASE}${p.loc}`)}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;