import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO, { itemListSchema } from '../hooks/useseo';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

// CHANGED: removed `import useCanonical from '../hooks/useCanonical'`
// The useCanonical hook was returning the current window URL including ?category=Tops etc.,
// which was canonicalising filter pages as separate indexable pages — conflicting with
// the robots.txt Disallow and the sitemap strategy. Now we set canonical explicitly:
//   - /shop (no filters active) → canonical = https://snera.in/shop
//   - /shop?category=X (filter active) → canonical = https://snera.in/shop
// This tells Google the filtered view is a variant of /shop, not a separate page.
// If you later add proper path-based category routes (/shop/tops), update canonical there.

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const GENDERS    = ['All', 'Men', 'Women', 'Unisex'];

const SITE = 'https://snera.in';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);

  const catParam    = searchParams.get('category') || 'All';
  const genderParam = searchParams.get('gender')   || 'All';
  useReveal();

  const fetchProducts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (catParam !== 'All')    params.category = catParam;
      if (genderParam !== 'All') params.gender   = genderParam;

      const r = await API.get('/products', { params });
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
      setPage(p);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [catParam, genderParam]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'All') next.delete(key);
    else next.set(key, val);
    setSearchParams(next);
  };

  // ── SEO ────────────────────────────────────────────────────────────────────
  // CHANGED: canonical is always /shop regardless of active filters.
  // Filter combinations (?category=Tops, ?gender=Men) are UI state, not separate pages.
  const canonicalUrl = `${SITE}/shop`;

  const categoryLabel = catParam !== 'All' ? catParam : 'All Products';
  const genderLabel   = genderParam !== 'All' ? ` for ${genderParam}` : '';
  const shopTitle     = `${categoryLabel}${genderLabel} | Shop | SNERA`;
  const shopDesc      = catParam !== 'All'
    ? `Shop premium ${catParam.toLowerCase()}${genderLabel} at SNERA. Minimal, timeless fashion made in India. Free shipping above ₹999.`
    : 'Browse the complete SNERA collection — premium essentials for men and women. Minimal, timeless fashion made in India. Free shipping above ₹999.';

  const shopCrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    ...(catParam !== 'All' ? [{ name: catParam, url: '/shop' }] : []),
  ];

  const shopKeywords = [
    catParam !== 'All' ? `${catParam} online India` : 'premium fashion India',
    genderParam !== 'All' ? `${genderParam.toLowerCase()} clothing` : '',
    'SNERA', 'minimal fashion', 'premium essentials', 'buy clothes India',
  ].filter(Boolean).join(', ');

  const schemas = useSEO({
    type: 'shop',
    products,
    breadcrumbs: shopCrumbs,
    pageUrl: '/shop',
    pageName: shopTitle,
    pageDescription: shopDesc,
    categoryName: categoryLabel,
    datePublished: '2024-01-01',
  });

  return (
    <>
      <SEOHead
        title={shopTitle}
        description={shopDesc}
        url={canonicalUrl}
        schemas={schemas}
      />

      <div style={{ paddingTop:'var(--nav-h)' }}>
        {/* Page header */}
        <div style={{
          borderBottom:'1px solid var(--sand)',
          padding:'clamp(2rem,4vw,3.5rem) 0',
          background:'var(--off)'
        }}>
          <div className="container">
            {/* Breadcrumb */}
            <div className="breadcrumb" style={{marginBottom:'1.25rem'}}>
              <a href="/">Home</a><span>/</span><span style={{color:'var(--ink)'}}>Shop</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
              <div>
                <h1 style={{
                  fontFamily:'var(--serif)',fontWeight:300,
                  fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-.01em'
                }}>
                  {catParam !== 'All' ? catParam : 'All Products'}
                </h1>
                {!loading && <p style={{fontSize:'.75rem',color:'var(--stone)',marginTop:'.35rem'}}>{total} pieces</p>}
              </div>

              {/* Filters */}
              <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                {/* Category filter */}
                <div>
                  <span style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--stone)',display:'block',marginBottom:'.4rem'}}>Category</span>
                  <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap'}}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setFilter('category', c)} style={{
                        fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',
                        padding:'.28rem .75rem',border:'1px solid',cursor:'pointer',
                        fontFamily:'var(--sans)',fontWeight:500,
                        background: catParam === c ? 'var(--ink)' : 'transparent',
                        color:      catParam === c ? 'var(--white)' : 'var(--stone2)',
                        borderColor:catParam === c ? 'var(--ink)' : 'var(--sand)',
                        transition:'all var(--t)'
                      }}>{c}</button>
                    ))}
                  </div>
                </div>
                {/* Gender filter */}
                <div>
                  <span style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--stone)',display:'block',marginBottom:'.4rem'}}>For</span>
                  <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap'}}>
                    {GENDERS.map(g => (
                      <button key={g} onClick={() => setFilter('gender', g)} style={{
                        fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',
                        padding:'.28rem .75rem',border:'1px solid',cursor:'pointer',
                        fontFamily:'var(--sans)',fontWeight:500,
                        background: genderParam === g ? 'var(--ink)' : 'transparent',
                        color:      genderParam === g ? 'var(--white)' : 'var(--stone2)',
                        borderColor:genderParam === g ? 'var(--ink)' : 'var(--sand)',
                        transition:'all var(--t)'
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="container sect">
          {loading ? (
            <div className="page-loader"><div className="loader-ring"/></div>
          ) : products.length === 0 ? (
            <div style={{textAlign:'center',padding:'5rem 0',color:'var(--stone)'}}>
              <p style={{fontFamily:'var(--serif)',fontSize:'1.5rem',fontWeight:300,marginBottom:'1rem'}}>Nothing here yet.</p>
              <p style={{fontSize:'.82rem'}}>Try a different filter or check back soon.</p>
            </div>
          ) : (
            <>
              <div className="prod-grid">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} showFlip />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div style={{display:'flex',justifyContent:'center',gap:'.5rem',marginTop:'3rem'}}>
                  {Array.from({length:pages},(_,i)=>i+1).map(n => (
                    <button key={n} onClick={() => fetchProducts(n)} style={{
                      width:36,height:36,border:'1px solid',cursor:'pointer',
                      fontFamily:'var(--sans)',fontSize:'.72rem',fontWeight:500,
                      background: n === page ? 'var(--ink)' : 'transparent',
                      color:      n === page ? 'var(--white)' : 'var(--stone2)',
                      borderColor:n === page ? 'var(--ink)' : 'var(--sand)',
                      transition:'all var(--t)'
                    }}>{n}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <ShopFAQ />
    </>
  );
}

const SHOP_FAQS = [
  { q: 'What categories does SNERA offer?', a: 'SNERA offers Tops, Bottoms, Outerwear, and Accessories for Men, Women, and Unisex. New drops are added regularly.' },
  { q: 'How do I filter products by size or category?', a: 'Use the Category and Gender filters at the top of the shop page to narrow down the collection.' },
  { q: 'Does SNERA restock sold-out items?', a: 'Some styles are restocked. Contact us at contact@snera.in or follow @snera.store on Instagram for restock updates.' },
  { q: 'How do I know which size to order?', a: 'Available sizes are shown on each product page. If between sizes, we recommend sizing up. Email contact@snera.in for help.' },
  { q: 'Is free shipping available?', a: 'Yes — free standard shipping on orders above ₹999 across India.' },
  { q: 'Can I return a product?', a: 'Returns are accepted within 7 days of delivery for eligible, unused items. See our Refund Policy for full details.' },
];

function ShopFAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section style={{ borderTop: '1px solid var(--sand)', padding: 'clamp(2.5rem,5vw,4rem) 0', background: 'var(--off)' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="label" style={{ marginBottom: '.65rem', display: 'block' }}>FAQs</span>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-.01em', marginBottom: '1.75rem' }}>
          Shopping with SNERA
        </h2>
        <div itemScope itemType="https://schema.org/FAQPage">
          {SHOP_FAQS.map(({ q, a }, i) => (
            <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid var(--sand)' }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
              >
                <span itemProp="name" style={{ fontSize: '.83rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.8, transition: 'transform .2s', transform: open === i ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ paddingBottom: '1rem' }}>
                  <p itemProp="text" style={{ fontSize: '.8rem', color: 'var(--stone2)', lineHeight: 1.8, margin: 0 }}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}