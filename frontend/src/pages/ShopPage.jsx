import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

const GENDERS = ['All', 'Men', 'Women', 'Unisex'];
const SITE = 'https://snera.in';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [categories, setCategories] = useState(['All']);
  
  useEffect(() => {
    API.get('/collections').then(r => setCategories(['All', ...(r.data.collections || r.data || []).map(c => c.name)]));
  }, []);
  
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

  const canonicalUrl = `${SITE}/shop`;
  const categoryLabel = catParam !== 'All' ? catParam : 'All Custom Apparel';
  const genderLabel   = genderParam !== 'All' ? ` for ${genderParam}` : '';
  const shopTitle     = `${categoryLabel}${genderLabel} | Customizable T-Shirts | SNERA`;
  const shopDesc      = 'Browse SNERA\'s collection of customizable t-shirts and premium apparel. 220 GSM heavyweight cotton made in India. Free shipping above ₹999.';

  const shopCrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    ...(catParam !== 'All' ? [{ name: catParam, url: '/shop' }] : []),
  ];

  const schemas = useSEO({
    type: 'shop',
    products,
    breadcrumbs: shopCrumbs,
    pageUrl: '/shop',
    pageName: shopTitle,
    pageDescription: shopDesc,
    categoryName: categoryLabel,
    datePublished: '2026-01-01',
  });

  return (
    <>
      <SEOHead
        title={shopTitle}
        description={shopDesc}
        url={canonicalUrl}
        schemas={schemas}
      />

      <div style={{ paddingTop:'var(--nav-h)', background: 'var(--white)' }}>
        {/* Page header */}
        <div style={{
          borderBottom:'1px solid var(--sand)',
          padding:'clamp(2.5rem,4vw,4rem) 0',
          background:'var(--gradient-subtle)'
        }}>
          <div className="container">
            <div className="breadcrumb" style={{marginBottom:'1.25rem'}}>
              <a href="/">Home</a><span>/</span><span style={{color:'var(--ink)', fontWeight:600}}>Shop</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1.5rem'}}>
              <div>
                <span className="label">Custom Apparel Catalog</span>
                <h1 style={{
                  fontFamily:'var(--sans)',fontWeight:700,
                  fontSize:'clamp(2.2rem,4vw,3.2rem)',letterSpacing:'-.02em'
                }}>
                  {catParam !== 'All' ? catParam : 'All Apparel & Tees'}
                </h1>
                {!loading && <p style={{fontSize:'.82rem',color:'var(--stone2)',marginTop:'.35rem',fontWeight:500}}>{total} premium pieces available</p>}
              </div>

              {/* Filters */}
              <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap'}}>
                {/* Category filter */}
                <div>
                  <span style={{fontSize:'.62rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--accent)',display:'block',marginBottom:'.4rem',fontWeight:700}}>Category</span>
                  <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                    {categories.map(c => (
                      <button key={c} onClick={() => setFilter('category', c)} style={{
                        fontSize:'.68rem',letterSpacing:'.08em',textTransform:'uppercase',
                        padding:'.35rem .9rem',borderRadius:'var(--radius-sm)',border:'1px solid',cursor:'pointer',
                        fontFamily:'var(--sans)',fontWeight:600,
                        background: catParam === c ? 'var(--gradient)' : 'var(--white)',
                        color:      catParam === c ? 'var(--white)' : 'var(--stone2)',
                        borderColor:catParam === c ? 'transparent' : 'var(--sand)',
                        transition:'all var(--t)',
                        boxShadow:  catParam === c ? '0 4px 15px rgba(108,92,231,.25)' : 'none'
                      }}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Gender filter */}
                <div>
                  <span style={{fontSize:'.62rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--accent)',display:'block',marginBottom:'.4rem',fontWeight:700}}>Fit</span>
                  <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                    {GENDERS.map(g => (
                      <button key={g} onClick={() => setFilter('gender', g)} style={{
                        fontSize:'.68rem',letterSpacing:'.08em',textTransform:'uppercase',
                        padding:'.35rem .9rem',borderRadius:'var(--radius-sm)',border:'1px solid',cursor:'pointer',
                        fontFamily:'var(--sans)',fontWeight:600,
                        background: genderParam === g ? 'var(--gradient)' : 'var(--white)',
                        color:      genderParam === g ? 'var(--white)' : 'var(--stone2)',
                        borderColor:genderParam === g ? 'transparent' : 'var(--sand)',
                        transition:'all var(--t)',
                        boxShadow:  genderParam === g ? '0 4px 15px rgba(108,92,231,.25)' : 'none'
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
              <p style={{fontFamily:'var(--sans)',fontSize:'1.5rem',fontWeight:600,marginBottom:'1rem'}}>No products found in this category.</p>
              <p style={{fontSize:'.88rem'}}>Try adjusting your filters or browse all apparel.</p>
            </div>
          ) : (
            <>
              <div className="prod-grid">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} showFlip />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div style={{display:'flex',justifyContent:'center',gap:'.5rem',marginTop:'3.5rem'}}>
                  {Array.from({length:pages},(_,i)=>i+1).map(n => (
                    <button key={n} onClick={() => fetchProducts(n)} style={{
                      width:40,height:40,borderRadius:'var(--radius-sm)',border:'1px solid',cursor:'pointer',
                      fontFamily:'var(--sans)',fontSize:'.8rem',fontWeight:700,
                      background: n === page ? 'var(--gradient)' : 'var(--white)',
                      color:      n === page ? 'var(--white)' : 'var(--stone2)',
                      borderColor:n === page ? 'transparent' : 'var(--sand)',
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
  { q: 'Can all products in the shop be customized?', a: 'Yes! All SNERA apparel is designed as a premium blank canvas for your custom artwork, logos, and phrases.' },
  { q: 'What is 220 GSM heavyweight cotton?', a: 'GSM stands for Grams per Square Meter. 220 GSM means a thick, substantial, non-see-through fabric that holds its structure and fit wash after wash.' },
  { q: 'How do I submit my custom design?', a: 'You can use the Design Studio form on our homepage or contact our design team via WhatsApp after choosing your t-shirt style.' },
  { q: 'Is free shipping available?', a: 'Yes — free standard delivery on all orders above ₹999 across India.' },
];

function ShopFAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section style={{ borderTop: '1px solid var(--sand)', padding: 'clamp(2.5rem,5vw,4rem) 0', background: 'var(--off)' }}>
      <div className="container" style={{ maxWidth: 780 }}>
        <span className="label" style={{ marginBottom: '.65rem', display: 'block' }}>Apparel FAQs</span>
        <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 'clamp(1.5rem,3vw,2.2rem)', letterSpacing: '-.02em', marginBottom: '1.75rem' }}>
          Shopping SNERA Custom Tees
        </h2>
        <div itemScope itemType="https://schema.org/FAQPage">
          {SHOP_FAQS.map(({ q, a }, i) => (
            <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid var(--sand)' }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
              >
                <span itemProp="name" style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2, transition: 'transform .2s', transform: open === i ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ paddingBottom: '1.1rem' }}>
                  <p itemProp="text" style={{ fontSize: '.84rem', color: 'var(--stone2)', lineHeight: 1.8, margin: 0 }}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}