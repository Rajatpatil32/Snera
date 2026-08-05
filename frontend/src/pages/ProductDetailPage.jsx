import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';
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

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setLoading(true); setNotFound(false); setAdded(false);
    API.get(`/products/${slug}`)
      .then(r => {
        const p = r.data;
        setProduct(p);

        const colourParam = parseInt(searchParams.get('colour') || '0', 10);
        const hasGroups   = p.colorGroups?.length > 0;
        const initColour  = hasGroups ? Math.min(colourParam, p.colorGroups.length - 1) : 0;
        setActiveColour(initColour);
        setActiveImg(0);

        const group     = hasGroups ? p.colorGroups[initColour] : null;
        const soldSizes = group?.soldSizes || p.soldSizes || [];
        const first     = (p.sizes || []).find(s => !soldSizes.includes(s));
        setSelSize(first || '');
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug, searchParams]);

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
      <h1 style={{ fontFamily:'var(--sans)', fontSize:'2rem', fontWeight:600, marginBottom:'1rem' }}>Product not found</h1>
      <Link to="/shop" className="btn btn-gradient">Back to Shop</Link>
    </div>
  );

  const hasGroups   = product.colorGroups?.length > 0;
  const activeGroup = hasGroups ? product.colorGroups[activeColour] : null;
  const images      = activeGroup?.images?.length ? activeGroup.images : product.images || [];
  const soldSizes   = activeGroup?.soldSizes?.length ? activeGroup.soldSizes : product.soldSizes || [];

  const isSold = (sz) => soldSizes.includes(sz);

  const addToCart = () => {
    if (!selSize) return;
    dispatch({
      type: 'ADD',
      payload: {
        product: {
          ...product,
          images: images.length ? images : product.images,
        },
        size: selSize,
        qty,
      },
    });
    dispatch({ type: 'OPEN' });
    toast(`${product.name}${activeGroup ? ` (${activeGroup.name})` : ''} added`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: product.category, url: '/shop' },
    { name: product.name, url: `/product/${product.slug}` },
  ];

  const seoTitle = product.seo?.metaTitle || `Buy ${product.name} Custom T-Shirt Online | SNERA`;
  const metaDescription = product.seo?.metaDescription || `Customizable ${product.name} printed on premium 220 GSM heavyweight cotton. Free shipping above ₹999.`;

  const ogImg = (() => {
    const imgs = (product.colorGroups?.find(g => g.isDefault) || product.colorGroups?.[0])?.images || product.images || [];
    return imgs[0] ? (imgs[0].startsWith('http') ? imgs[0] : `https://snera.in${imgs[0]}`) : 'https://snera.in/og-image.jpg';
  })();

  const schemas = useSEO({
    type: 'product',
    product,
    breadcrumbs: crumbs,
    pageUrl: `/product/${product.slug}`,
    pageName: seoTitle,
    pageDescription: metaDescription,
    datePublished: product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : undefined,
    dateModified: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined,
  });

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={metaDescription}
        url={`https://snera.in/product/${product.slug}`}
        image={ogImg}
        product={product}
        schemas={schemas}
      />

      <div style={{ paddingTop:'var(--nav-h)', background: 'var(--white)' }}>
        <div className="container" style={{ paddingTop:'.75rem' }}>
          <div className="breadcrumb">
            <Link to="/">Home</Link><span>/</span>
            <Link to="/shop">Shop</Link><span>/</span>
            <Link to={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span>
            <span style={{ color:'var(--ink)', fontWeight:600 }}>{product.name}</span>
          </div>
        </div>

        <div className="container" style={{ paddingBottom:'5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:'clamp(2rem,5vw,4rem)', alignItems:'start' }}>

            {/* ── LEFT: images ── */}
            <div>
              <div style={{
                aspectRatio:'3/4', background:'var(--gradient-card)', overflow:'hidden',
                borderRadius:'var(--radius-lg)', marginBottom:'.85rem',
                display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
                border: '1px solid rgba(108,92,231,.1)'
              }}>
                {images[activeImg] ? (
                  <img
                    src={getImageUrl(images[activeImg])}
                    alt={`${product.name}${activeGroup ? ` — ${activeGroup.name}` : ''} view ${activeImg+1}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                ) : (
                  <span style={{ fontSize:'6rem' }}>👕</span>
                )}
                
                {/* 220 GSM Badge */}
                <span className="prod-badge" style={{ position:'absolute', top:'1.2rem', left:'1.2rem', background:'var(--gradient)', color:'#fff' }}>
                  220 GSM COTTON
                </span>

                {/* Colour name label overlay */}
                {activeGroup && (
                  <div style={{ position:'absolute', bottom:'1.2rem', right:'1.2rem', display:'flex', alignItems:'center', gap:'.5rem', background:'rgba(255,255,255,.9)', padding:'.4rem .8rem', borderRadius:'20px', backdropFilter:'blur(8px)', boxShadow:'0 4px 15px rgba(0,0,0,.08)' }}>
                    <span style={{ width:12, height:12, borderRadius:'50%', background:activeGroup.hex, border:'1px solid rgba(0,0,0,.15)', flexShrink:0 }}/>
                    <span style={{ fontSize:'.68rem', letterSpacing:'.08em', color:'var(--ink)', textTransform:'uppercase', fontWeight:600 }}>{activeGroup.name}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'.65rem' }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      style={{
                        width:70, height:90, overflow:'hidden', padding:0,
                        borderRadius:'var(--radius-sm)',
                        border: `2px solid ${i===activeImg ? 'var(--accent)' : 'var(--sand)'}`,
                        cursor:'pointer', background:'none', transition:'all var(--t)',
                      }}
                    >
                      <img src={getImageUrl(img)} alt={`${product.name} view ${i + 1}`} loading="lazy" decoding="async" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: details & actions ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div>
                <div style={{ fontSize:'.68rem', letterSpacing:'.16em', textTransform:'uppercase', color:'var(--accent)', fontWeight:700, marginBottom:'.3rem' }}>
                  {product.category || 'Custom Apparel'} · 220 GSM Cotton
                </div>
                <h1 style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:'clamp(1.8rem,3vw,2.5rem)', lineHeight:1.15, letterSpacing:'-.02em' }}>
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div style={{ display:'flex', alignItems:'center', gap: '1rem' }}>
                <span style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--ink)' }}>{fmt(product.price)}</span>
                {product.comparePrice && (
                  <span style={{ fontSize:'1rem', color:'var(--stone)', textDecoration:'line-through' }}>{fmt(product.comparePrice)}</span>
                )}
                {product.comparePrice && (
                  <span style={{ fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:700, padding:'.25rem .65rem', borderRadius:'6px', background:'var(--gradient)', color:'var(--white)' }}>
                    {Math.round((1-product.price/product.comparePrice)*100)}% OFF
                  </span>
                )}
              </div>

              <p style={{ fontSize:'.88rem', color:'var(--stone2)', lineHeight:1.8 }}>{product.description}</p>

              {/* ── Colour picker ── */}
              {hasGroups && product.colorGroups.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.65rem' }}>
                    <span style={{ fontSize:'.65rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--accent)', fontWeight:700 }}>
                      Colorway
                    </span>
                    <span style={{ fontSize:'.82rem', fontWeight:600, color:'var(--ink)' }}>
                      {activeGroup?.name || ''}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap' }}>
                    {product.colorGroups.map((g, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColourSwitch(i)}
                        title={g.name}
                        style={{
                          display:'flex', flexDirection:'column', alignItems:'center', gap:'.35rem',
                          background:'transparent', border:'none', cursor:'pointer', padding:'.35rem',
                        }}
                      >
                        <span style={{
                          display:'block',
                          width:30, height:30, borderRadius:'50%', background:g.hex,
                          border: i===activeColour ? '2.5px solid var(--accent)' : '1.5px solid rgba(0,0,0,.15)',
                          boxShadow: i===activeColour ? '0 0 0 3px rgba(108,92,231,.25)' : 'none',
                          transition:'all .2s var(--ease-spring)',
                          transform: i===activeColour ? 'scale(1.15)' : 'scale(1)',
                        }}/>
                        <span style={{ fontSize:'.6rem', color: i===activeColour ? 'var(--ink)' : 'var(--stone)', fontWeight: 600, letterSpacing:'.04em' }}>
                          {g.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Size picker ── */}
              <div>
                <div style={{ fontSize:'.65rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--accent)', fontWeight:700, marginBottom:'.65rem' }}>Select Size</div>
                <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                  {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => !isSold(sz) && setSelSize(sz)}
                      disabled={isSold(sz)}
                      style={{
                        width:46, height:46, borderRadius:'var(--radius-sm)',
                        border:'1px solid',
                        fontSize:'.75rem', fontWeight:700, letterSpacing:'.04em',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor: isSold(sz) ? 'not-allowed' : 'pointer',
                        fontFamily:'var(--sans)',
                        background:  selSize===sz ? 'var(--gradient)' : 'transparent',
                        color:       selSize===sz ? 'var(--white)' : isSold(sz) ? 'var(--sand2)' : 'var(--ink)',
                        borderColor: selSize===sz ? 'transparent' : 'var(--sand)',
                        opacity:     isSold(sz) ? .4 : 1,
                        textDecoration: isSold(sz) ? 'line-through' : 'none',
                        transition:'all var(--t)',
                        boxShadow: selSize===sz ? '0 4px 15px rgba(108,92,231,.3)' : 'none'
                      }}
                    >{sz}</button>
                  ))}
                </div>
              </div>

              {/* ── Qty + Add to cart ── */}
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginTop:'.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--sand)', borderRadius:'var(--radius-sm)' }}>
                  <button type="button" onClick={() => qty>1 && setQty(q=>q-1)} style={{ width:40, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'var(--stone2)', background:'none', border:'none', cursor:'pointer' }}>−</button>
                  <span style={{ width:44, textAlign:'center', fontSize:'.9rem', fontWeight:600, height:44, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px solid var(--sand)', borderRight:'1px solid var(--sand)' }}>{qty}</span>
                  <button type="button" onClick={() => qty<10 && setQty(q=>q+1)} style={{ width:40, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'var(--stone2)', background:'none', border:'none', cursor:'pointer' }}>+</button>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selSize}
                  className={selSize && !added ? 'btn-gradient btn-pulse' : ''}
                  style={{
                    flex:1, padding:'1rem',
                    background: added ? 'var(--success)' : !selSize ? 'var(--sand)' : undefined,
                    color:'var(--white)',
                    fontFamily:'var(--sans)', fontSize:'.75rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
                    borderRadius:'var(--radius-sm)', border:'none',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'.6rem',
                    cursor: selSize ? 'pointer' : 'not-allowed',
                    transition:'all var(--t)',
                  }}
                >
                  {added ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
              </div>

              {/* Custom Design Box */}
              <div style={{
                background: 'var(--gradient-subtle)', border: '1px solid rgba(108,92,231,.15)',
                borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center'
              }}>
                <span style={{ fontSize: '2rem' }}>✨</span>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--ink)' }}>Want Custom Artwork Printed On This?</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--stone2)', marginTop: '.2rem' }}>We print custom text, graphics & logos on all our 220 GSM t-shirts.</div>
                  <a href="/#concept" style={{ fontSize: '.72rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '.4rem', display: 'inline-block' }}>
                    Go to Custom Design Studio →
                  </a>
                </div>
              </div>

              {/* Guarantees */}
              <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', paddingTop:'.5rem' }}>
                {[
                  { i:'🚚', t:'Free Ship ₹999+' },
                  { i:'✨', t:'220 GSM Cotton' },
                  { i:'🛡️', t:'Fast 5-Day Delivery' },
                ].map(({ i, t }) => (
                  <div key={t} style={{ fontSize:'.75rem', color:'var(--stone2)', fontWeight:600, display:'flex', alignItems:'center', gap:'.4rem' }}>
                    <span>{i}</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}