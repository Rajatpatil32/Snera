/**
 * sitemap.js — Dynamic XML Sitemap for SNERA
 *
 * Endpoints:
 *   GET /api/sitemap/          → Sitemap index
 *   GET /api/sitemap/pages.xml → Static pages sitemap
 *   GET /api/sitemap/products.xml → Product pages + image tags
 *
 * Changes made:
 *  1. Removed /api/sitemap/categories.xml entirely.
 *     Filter URLs like /shop?category=Tops are UI state, not indexable pages.
 *     They were also conflicting with the ShopPage canonical (always /shop).
 *     Removed from sitemap index too.
 *  2. Fixed the .xml redirect — it now points to the correct final URL
 *     so robots.txt `Sitemap:` line can reference the non-redirect endpoint directly.
 */

const router  = require('express').Router();
const Product = require('../models/Product');
const Blog    = require('../models/Blog');
const seoSlugs = require('../data/seoSlugs.json');

const BASE     = process.env.FRONTEND_URL || 'https://snera.in';
const API_BASE = process.env.BACKEND_URL  || 'https://snera.in';

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  return `${API_BASE}${path}`;
}

// ── Sitemap Index ─────────────────────────────────────────────────────────────
// CHANGED: removed categories sitemap entry — filter URLs are not indexable pages
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
    <loc>${BASE}/api/sitemap/blog.xml</loc>
    <lastmod>${today()}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// CHANGED: .xml now serves the sitemap index directly instead of redirecting.
// robots.txt points to /api/sitemap.xml — this makes that URL resolve without a redirect.
router.get('.xml', async (req, res) => {
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
    <loc>${BASE}/api/sitemap/blog.xml</loc>
    <lastmod>${today()}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// ── Static Pages Sitemap ──────────────────────────────────────────────────────
router.get('/pages.xml', (req, res) => {
  const pages = [
    { loc: '/',               priority: '1.0', changefreq: 'daily'   },
    { loc: '/shop',           priority: '0.9', changefreq: 'daily'   },
    { loc: '/blog',           priority: '0.8', changefreq: 'daily'   },
    { loc: '/about',          priority: '0.8', changefreq: 'monthly' },
    { loc: '/size-guide',     priority: '0.8', changefreq: 'monthly' },
    { loc: '/care-guide',     priority: '0.7', changefreq: 'monthly' },
    { loc: '/contact',        priority: '0.7', changefreq: 'monthly' },
    { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly'  },
    { loc: '/refund-policy',  priority: '0.3', changefreq: 'yearly'  },
    { loc: '/terms',          priority: '0.3', changefreq: 'yearly'  },
    { loc: '/shipping-policy',priority: '0.3', changefreq: 'yearly'  },
    { loc: '/custom',         priority: '0.9', changefreq: 'weekly'  },
    ...seoSlugs.map(s => ({ loc: `/custom/${s}`, priority: '0.8', changefreq: 'monthly' })),
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
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(xml);
});

// ── Product Pages Sitemap (with image sitemap extension) ──────────────────────
router.get('/products.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('slug name updatedAt images colorGroups category gender')
      .lean();

    const urls = products.map(p => {
      const allImages = p.colorGroups?.length
        ? p.colorGroups.flatMap(g => (g.images || []))
        : (p.images || []);

      const imageTags = allImages
        .slice(0, 10)
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

// ── Blog Sitemap ────────────────────────────────────────────────────────────
router.get('/blog.xml', async (req, res) => {
  try {
    const posts = await Blog.find({ isPublished: true })
      .select('slug updatedAt publishedAt')
      .lean();

    const urls = posts.map(b => `
  <url>
    <loc>${xmlEscape(`${BASE}/blog/${b.slug}`)}</loc>
    <lastmod>${(b.updatedAt || b.publishedAt) ? new Date(b.updatedAt || b.publishedAt).toISOString().split('T')[0] : today()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
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