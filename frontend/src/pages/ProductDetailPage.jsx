import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';

export default function ProductDetailPage() {
  const { slug }              = useParams();
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const { dispatch, toast }   = useCart();

  const [product,   setProduct]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  // Colour + image state
  const [activeColour, setActiveColour] = useState(0);
  const [activeImg,    setActiveImg]    = useState(0);

  // Cart state
  const [selSize, setSelSize] = useState('');
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);

  useEffect(() => {
    setLoading(true); setNotFound(false); setAdded(false);
    API.get(`/products/${slug}`)
      .then(r => {
        const p = r.data;
        setProduct(p);

        // Pre-select colour from URL param (passed from ProductCard)
        const colourParam = parseInt(searchParams.get('colour') || '0', 10);
        const hasGroups   = p.colorGroups?.length > 0;
        const initColour  = hasGroups ? Math.min(colourParam, p.colorGroups.length - 1) : 0;
        setActiveColour(initColour);
        setActiveImg(0);

        // Pre-select first available size in that colour
        const group     = hasGroups ? p.colorGroups[initColour] : null;
        const soldSizes = group?.soldSizes || p.soldSizes || [];
        const first     = (p.sizes || []).find(s => !soldSizes.includes(s));
        setSelSize(first || '');
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug, searchParams]);

  // When colour changes → reset image + recompute first available size
  const handleColourSwitch = (i) => {
    setActiveColour(i);
    setActiveImg(0);
    if (!product) return;
    const group     = product.colorGroups?.[i];
    const soldSizes = group?.soldSizes || product.soldSizes || [];
    const first     = (product.sizes || []).find(s => !soldSizes.includes(s));
    setSelSize(first || '');
  };

  if (loading) return <div style={{ paddingTop:'var(--nav-h)' }}><div className="page-loader"><div className="loader-ring"/></div></div>;
  if (notFound || !product) return (
    <div style={{ paddingTop:'var(--nav-h)', textAlign:'center', padding:'8rem 2rem' }}>
      <h1 style={{ fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:300, marginBottom:'1rem' }}>Product not found</h1>
      <Link to="/shop" className="btn btn-dark">Back to Shop</Link>
    </div>
  );

  // ── Derive active images & sold-out sizes ──────────────────────────────────
  const hasGroups   = product.colorGroups?.length > 0;
  const activeGroup = hasGroups ? product.colorGroups[activeColour] : null;
  const images      = activeGroup?.images?.length ? activeGroup.images : product.images || [];
  const soldSizes   = activeGroup?.soldSizes?.length ? activeGroup.soldSizes : product.soldSizes || [];

  const isSold = (sz) => soldSizes.includes(sz);

  // ── Add to cart ────────────────────────────────────────────────────────────
  const addToCart = () => {
    if (!selSize) return;
    dispatch({
      type: 'ADD',
      payload: {
        product: { ...product, images: images.length ? images : product.images },
        size: selSize,
        qty,
        // Colour data so cart / checkout can display it
        colour: activeGroup
          ? { name: activeGroup.name, hex: activeGroup.hex, image: images[0] || null }
          : null,
      },
    });
    dispatch({ type: 'OPEN' });
    toast(`${product.name}${activeGroup ? ` (${activeGroup.name})` : ''} added`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <SEOHead
        title={`${product.name} — SNERA`}
        description={product.description}
        url={`https://snera.in/product/${product.slug}`}
        product={product}
        breadcrumbs={[
          { name:'Home', url:'/' },
          { name:'Shop', url:'/shop' },
          { name: product.name, url:`/product/${product.slug}` },
        ]}
      />

      <div style={{ paddingTop:'var(--nav-h)' }}>
        <div className="container" style={{ paddingTop:'.75rem' }}>
          <div className="breadcrumb">
            <Link to="/">Home</Link><span>/</span>
            <Link to="/shop">Shop</Link><span>/</span>
            <span style={{ color:'var(--ink)' }}>{product.name}</span>
          </div>
        </div>

        <div className="container" style={{ paddingBottom:'5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(2rem,5vw,5rem)', alignItems:'start' }}>

            {/* ── LEFT: images ── */}
            <div>
              {/* Main image */}
              <div style={{ aspectRatio:'3/4', background:'var(--off)', overflow:'hidden', marginBottom:'.65rem', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                {images[activeImg] ? (
                  <img
                    src={getImageUrl(images[activeImg])}
                    alt={`${product.name}${activeGroup ? ` — ${activeGroup.name}` : ''} view ${activeImg+1}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                ) : (
                  <span style={{ fontFamily:'var(--serif)', fontSize:'8rem', fontWeight:300, color:'rgba(28,27,24,.08)' }}>
                    {product.glyph || '◈'}
                  </span>
                )}
                {product.badge && (
                  <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`} style={{ position:'absolute', top:'1rem', left:'1rem' }}>
                    {product.badge}
                  </span>
                )}

                {/* Colour name label overlay */}
                {activeGroup && (
                  <div style={{ position:'absolute', bottom:'1rem', right:'1rem', display:'flex', alignItems:'center', gap:'.45rem', background:'rgba(255,255,255,.92)', padding:'.35rem .65rem', backdropFilter:'blur(4px)' }}>
                    <span style={{ width:12, height:12, borderRadius:'50%', background:activeGroup.hex, border:'1px solid rgba(0,0,0,.18)', flexShrink:0 }}/>
                    <span style={{ fontSize:'.62rem', letterSpacing:'.1em', color:'var(--ink)', textTransform:'uppercase' }}>{activeGroup.name}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails for active colour */}
              {images.length > 1 && (
                <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.65rem' }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      style={{
                        width:64, height:86, overflow:'hidden', padding:0,
                        border: `1px solid ${i===activeImg ? 'var(--ink)' : 'var(--sand)'}`,
                        cursor:'pointer', background:'none', transition:'border-color var(--t)',
                      }}
                    >
                      <img src={getImageUrl(img)} alt={`View ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: info ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1.15rem', paddingTop:'1rem' }}>
              <div style={{ fontSize:'.58rem', letterSpacing:'.22em', textTransform:'uppercase', color:'var(--stone)' }}>
                {product.category} · {product.gender}
              </div>

              <h1 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'clamp(1.5rem,3vw,2.5rem)', lineHeight:1.15, letterSpacing:'-.01em' }}>
                {product.name}
              </h1>

              {/* Price */}
              <div style={{ display:'flex', alignItems:'center', gap:'.9rem' }}>
                <span style={{ fontSize:'1.2rem', fontWeight:500 }}>{fmt(product.price)}</span>
                {product.comparePrice && (
                  <span style={{ fontSize:'.9rem', color:'var(--stone)', textDecoration:'line-through' }}>{fmt(product.comparePrice)}</span>
                )}
                {product.comparePrice && (
                  <span style={{ fontSize:'.58rem', letterSpacing:'.14em', textTransform:'uppercase', fontWeight:600, padding:'.2rem .55rem', background:'var(--accent)', color:'var(--white)' }}>
                    {Math.round((1-product.price/product.comparePrice)*100)}% off
                  </span>
                )}
              </div>

              <div style={{ height:1, background:'var(--sand)' }}/>

              <p style={{ fontSize:'.85rem', color:'var(--stone2)', lineHeight:1.8 }}>{product.description}</p>

              {/* ── Colour picker ── */}
              {hasGroups && product.colorGroups.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.65rem' }}>
                    <span style={{ fontSize:'.6rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--stone)' }}>
                      Colour
                    </span>
                    <span style={{ fontSize:'.78rem', fontWeight:500, color:'var(--ink)' }}>
                      {activeGroup?.name || ''}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap' }}>
                    {product.colorGroups.map((g, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColourSwitch(i)}
                        title={g.name}
                        aria-label={`${g.name}${i===activeColour?' (selected)':''}`}
                        style={{
                          display:'flex', flexDirection:'column', alignItems:'center', gap:'.35rem',
                          background:'transparent', border:'none', cursor:'pointer', padding:'.35rem',
                        }}
                      >
                        <span style={{
                          display:'block',
                          width:28, height:28, borderRadius:'50%', background:g.hex,
                          border: i===activeColour ? '2.5px solid var(--ink)' : '1.5px solid rgba(0,0,0,.2)',
                          boxShadow: i===activeColour ? '0 0 0 2px var(--white),0 0 0 3.5px var(--ink)' : 'none',
                          transition:'box-shadow .18s, border .18s, transform .18s',
                          transform: i===activeColour ? 'scale(1.12)' : 'scale(1)',
                        }}/>
                        <span style={{ fontSize:'.56rem', color: i===activeColour ? 'var(--ink)' : 'var(--stone)', letterSpacing:'.06em', whiteSpace:'nowrap' }}>
                          {g.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Size picker ── */}
              <div>
                <div style={{ fontSize:'.6rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--stone)', marginBottom:'.6rem' }}>Size</div>
                <div style={{ display:'flex', gap:'.45rem', flexWrap:'wrap' }}>
                  {(product.sizes || []).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => !isSold(sz) && setSelSize(sz)}
                      disabled={isSold(sz)}
                      style={{
                        width:42, height:42, border:'1px solid',
                        fontSize:'.7rem', fontWeight:500, letterSpacing:'.04em',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor: isSold(sz) ? 'not-allowed' : 'pointer',
                        fontFamily:'var(--sans)',
                        background:  selSize===sz ? 'var(--ink)' : 'transparent',
                        color:       selSize===sz ? 'var(--white)' : isSold(sz) ? 'var(--sand2)' : 'var(--stone2)',
                        borderColor: selSize===sz ? 'var(--ink)' : 'var(--sand)',
                        opacity:     isSold(sz) ? .4 : 1,
                        textDecoration: isSold(sz) ? 'line-through' : 'none',
                        transition:'all var(--t)',
                      }}
                    >{sz}</button>
                  ))}
                </div>
                {!selSize && <p style={{ fontSize:'.68rem', color:'var(--accent)', marginTop:'.4rem' }}>Please select a size</p>}
              </div>

              {/* ── Qty + Add to cart ── */}
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--sand)' }}>
                  <button type="button" onClick={() => qty>1 && setQty(q=>q-1)} style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--stone2)', background:'none', border:'none', cursor:'pointer' }}>−</button>
                  <span style={{ width:42, textAlign:'center', fontSize:'.83rem', fontWeight:500, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px solid var(--sand)', borderRight:'1px solid var(--sand)' }}>{qty}</span>
                  <button type="button" onClick={() => qty<10 && setQty(q=>q+1)} style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--stone2)', background:'none', border:'none', cursor:'pointer' }}>+</button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selSize}
                  style={{
                    flex:1, padding:'.95rem',
                    background: added ? 'var(--success)' : selSize ? 'var(--ink)' : 'var(--sand)',
                    color:'var(--white)',
                    fontFamily:'var(--sans)', fontSize:'.68rem', fontWeight:500, letterSpacing:'.2em', textTransform:'uppercase',
                    border:`1px solid ${added ? 'var(--success)' : selSize ? 'var(--ink)' : 'var(--sand)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'.6rem',
                    cursor: selSize ? 'pointer' : 'not-allowed',
                    transition:'all var(--t)',
                  }}
                >
                  {added ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
              </div>

              {/* Meta */}
              <div style={{ height:1, background:'var(--sand)' }}/>
              <div style={{ display:'flex', gap:'1.75rem', flexWrap:'wrap' }}>
                {[
                  { i:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, t:'Ships in 24 hrs' },
                  { i:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>, t:'30-day returns' },
                  { i:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, t:'Secure checkout' },
                ].map(({ i, t }) => (
                  <div key={t} style={{ fontSize:'.7rem', color:'var(--stone2)', display:'flex', alignItems:'center', gap:'.38rem' }}>
                    <svg viewBox="0 0 24 24" style={{ width:13, height:13, stroke:'currentColor', fill:'none', strokeWidth:1.5, flexShrink:0 }}>{i}</svg>
                    {t}
                  </div>
                ))}
              </div>

              {/* Fabric / care */}
              {(product.fabric || product.careInstructions) && (
                <>
                  <div style={{ height:1, background:'var(--sand)' }}/>
                  {product.fabric         && <div style={{ fontSize:'.78rem', color:'var(--stone2)' }}><strong style={{ color:'var(--ink)', fontWeight:500 }}>Fabric:</strong> {product.fabric}</div>}
                  {product.careInstructions && <div style={{ fontSize:'.78rem', color:'var(--stone2)' }}><strong style={{ color:'var(--ink)', fontWeight:500 }}>Care:</strong> {product.careInstructions}</div>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .container>div>div[style*="grid-template-columns"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </>
  );
}