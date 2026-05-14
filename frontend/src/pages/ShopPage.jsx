import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO, { itemListSchema } from '../hooks/useseo';
import useCanonical from '../hooks/useCanonical';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const GENDERS    = ['All', 'Men', 'Women', 'Unisex'];

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
  const canonicalUrl = useCanonical();
  const categoryLabel = catParam !== 'All' ? catParam : 'All Products';
  const genderLabel   = genderParam !== 'All' ? ` for ${genderParam}` : '';
  const shopTitle     = `${categoryLabel}${genderLabel} | Shop | SNERA`;
  const shopDesc      = catParam !== 'All'
    ? `Shop premium ${catParam.toLowerCase()}${genderLabel} at SNERA. Minimal, timeless fashion made in India. Free shipping above ₹999.`
    : 'Browse the complete SNERA collection — premium essentials for men and women. Minimal, timeless fashion made in India. Free shipping above ₹999.';

  const shopCrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    ...(catParam !== 'All' ? [{ name: catParam, url: `/shop?category=${catParam}` }] : []),
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
    pageUrl: `/shop${catParam !== 'All' ? `?category=${catParam}` : ''}`,
    pageName: shopTitle,
    pageDescription: shopDesc,
    categoryName: categoryLabel,
  });

  return (
    <>
      <SEOHead
        title={shopTitle}
        description={shopDesc}
        canonical={canonicalUrl}
        schemas={schemas}
        keywords={shopKeywords}
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
    </>
  );
}