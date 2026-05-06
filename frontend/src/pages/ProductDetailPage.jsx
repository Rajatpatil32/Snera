import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';
import { useReveal } from '../hooks/useReveal';

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { dispatch, toast } = useCart();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selSize,  setSelSize]  = useState('');
  const [qty,      setQty]      = useState(1);
  const [added,    setAdded]    = useState(false);
  const [activeImg,setActiveImg]= useState(0);

  useReveal();

  useEffect(() => {
    setLoading(true); setNotFound(false); setAdded(false);
    API.get(`/products/${slug}`)
      .then(r => {
        setProduct(r.data);
        // Pre-select first available size
        const first = r.data.sizes?.find(s => !r.data.soldSizes?.includes(s));
        setSelSize(first || '');
        setActiveImg(0);
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = () => {
    if (!selSize) return;
    dispatch({ type: 'ADD', payload: { product, size: selSize, qty } });
    dispatch({ type: 'OPEN' });
    toast(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{paddingTop:'var(--nav-h)'}}>
      <div className="page-loader"><div className="loader-ring"/></div>
    </div>
  );

  if (notFound) return (
    <div style={{paddingTop:'var(--nav-h)',textAlign:'center',padding:'8rem 2rem'}}>
      <h1 style={{fontFamily:'var(--serif)',fontSize:'2rem',fontWeight:300,marginBottom:'1rem'}}>Product not found</h1>
      <Link to="/shop" className="btn btn-dark">Back to Shop</Link>
    </div>
  );

  if (!product) return null;

  const isSold = (sz) => product.soldSizes?.includes(sz);
  const primaryBg = product.images?.length ? null : '#EDE8E0';

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
          { name:product.name, url:`/product/${product.slug}` }
        ]}
      />

      <div style={{paddingTop:'var(--nav-h)'}}>
        {/* Breadcrumb */}
        <div className="container" style={{paddingTop:'.75rem',paddingBottom:'.75rem'}}>
          <div className="breadcrumb">
            <Link to="/">Home</Link><span>/</span>
            <Link to="/shop">Shop</Link><span>/</span>
            <span style={{color:'var(--ink)'}}>{product.name}</span>
          </div>
        </div>

        {/* Product Layout */}
        <div className="container" style={{paddingBottom:'5rem'}}>
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:'clamp(2rem,5vw,5rem)', alignItems:'start'
          }}>
            {/* Images */}
            <div>
              {/* Main image */}
              <div style={{
                aspectRatio:'3/4',
                background: primaryBg || 'var(--off)',
                overflow:'hidden',
                marginBottom:'.75rem',
                display:'flex',alignItems:'center',justifyContent:'center',
                position:'relative'
              }}>
                {product.images?.[activeImg] ? (
                  <img
                    src={getImageUrl(product.images[activeImg])}
                    alt={`${product.name} — view ${activeImg + 1}`}
                    style={{width:'100%',height:'100%',objectFit:'cover'}}
                  />
                ) : (
                  <span style={{
                    fontFamily:'var(--serif)',fontSize:'8rem',fontWeight:300,
                    color:'rgba(28,27,24,.1)',userSelect:'none'
                  }}>{product.glyph || '◈'}</span>
                )}
                {product.badge && (
                  <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`} style={{position:'absolute',top:'1rem',left:'1rem'}}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} style={{
                      width:72, height:96, overflow:'hidden',
                      border: `1px solid ${i === activeImg ? 'var(--ink)' : 'var(--sand)'}`,
                      cursor:'pointer', background:'none', padding:0,
                      transition:'border-color var(--t)'
                    }}>
                      <img src={getImageUrl(img)} alt={`${product.name} ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{display:'flex',flexDirection:'column',gap:'1.15rem',paddingTop:'1rem'}}>
              <div style={{fontSize:'.58rem',letterSpacing:'.22em',textTransform:'uppercase',color:'var(--stone)'}}>
                {product.category} · {product.gender}
              </div>

              <h1 style={{
                fontFamily:'var(--serif)',fontWeight:300,
                fontSize:'clamp(1.5rem,3vw,2.5rem)',
                lineHeight:1.2,letterSpacing:'-.01em'
              }}>{product.name}</h1>

              <div style={{display:'flex',alignItems:'center',gap:'.9rem'}}>
                <span style={{fontSize:'1.2rem',fontWeight:500}}>{fmt(product.price)}</span>
                {product.comparePrice && (
                  <span style={{fontSize:'.9rem',color:'var(--stone)',textDecoration:'line-through'}}>{fmt(product.comparePrice)}</span>
                )}
                {product.comparePrice && (
                  <span style={{
                    fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',
                    fontWeight:600,padding:'.2rem .55rem',
                    background:'var(--accent)',color:'var(--white)',border:'1px solid var(--accent)'
                  }}>
                    {Math.round((1 - product.price/product.comparePrice)*100)}% off
                  </span>
                )}
              </div>

              <div style={{height:1,background:'var(--sand)'}}/>

              <p style={{fontSize:'.85rem',color:'var(--stone2)',lineHeight:1.8}}>{product.description}</p>

              {/* Size selector */}
              <div>
                <div style={{fontSize:'.6rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--stone)',marginBottom:'.6rem'}}>
                  Size
                </div>
                <div style={{display:'flex',gap:'.45rem',flexWrap:'wrap'}}>
                  {(product.sizes || ['XS','S','M','L','XL','XXL']).map(sz => (
                    <button
                      key={sz}
                      onClick={() => !isSold(sz) && setSelSize(sz)}
                      disabled={isSold(sz)}
                      aria-label={`Size ${sz}${isSold(sz) ? ' — sold out' : ''}`}
                      style={{
                        width:42,height:42,border:'1px solid',
                        fontSize:'.7rem',fontWeight:500,letterSpacing:'.04em',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        cursor: isSold(sz) ? 'not-allowed' : 'pointer',
                        fontFamily:'var(--sans)',
                        background: selSize === sz ? 'var(--ink)' : 'transparent',
                        color:      selSize === sz ? 'var(--white)' : isSold(sz) ? 'var(--sand2)' : 'var(--stone2)',
                        borderColor:selSize === sz ? 'var(--ink)' : 'var(--sand)',
                        opacity:    isSold(sz) ? .4 : 1,
                        textDecoration: isSold(sz) ? 'line-through' : 'none',
                        transition:'all var(--t)'
                      }}
                    >{sz}</button>
                  ))}
                </div>
                {!selSize && <p style={{fontSize:'.68rem',color:'var(--accent)',marginTop:'.4rem'}}>Please select a size</p>}
              </div>

              {/* Qty + Add to cart */}
              <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                {/* Qty */}
                <div style={{display:'flex',alignItems:'center',border:'1px solid var(--sand)'}}>
                  <button onClick={() => qty > 1 && setQty(q => q-1)} style={{
                    width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'1rem',color:'var(--stone2)',background:'none',border:'none',cursor:'pointer'
                  }}>−</button>
                  <span style={{
                    width:42,textAlign:'center',fontSize:'.83rem',fontWeight:500,
                    height:36,display:'flex',alignItems:'center',justifyContent:'center',
                    borderLeft:'1px solid var(--sand)',borderRight:'1px solid var(--sand)'
                  }}>{qty}</span>
                  <button onClick={() => qty < 10 && setQty(q => q+1)} style={{
                    width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'1rem',color:'var(--stone2)',background:'none',border:'none',cursor:'pointer'
                  }}>+</button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={addToCart}
                  disabled={!selSize}
                  style={{
                    flex:1,padding:'.95rem',
                    background: added ? 'var(--success)' : selSize ? 'var(--ink)' : 'var(--sand)',
                    color:'var(--white)',
                    fontFamily:'var(--sans)',fontSize:'.68rem',fontWeight:500,letterSpacing:'.2em',textTransform:'uppercase',
                    border: `1px solid ${added ? 'var(--success)' : selSize ? 'var(--ink)' : 'var(--sand)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:'.6rem',
                    cursor: selSize ? 'pointer' : 'not-allowed',
                    transition:'all var(--t), transform .15s, box-shadow .2s'
                  }}
                >
                  {added ? '✓ Added to Cart' : (
                    <>
                      <svg viewBox="0 0 24 24" style={{width:15,height:15,stroke:'currentColor',fill:'none',strokeWidth:1.6}}>
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
              </div>

              {/* Meta info */}
              <div style={{height:1,background:'var(--sand)'}}/>
              <div style={{display:'flex',gap:'1.75rem',flexWrap:'wrap'}}>
                {[
                  { icon:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, text:'Ships in 24 hrs' },
                  { icon:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>, text:'30-day returns' },
                  { icon:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, text:'Secure checkout' },
                ].map(({icon, text}) => (
                  <div key={text} style={{fontSize:'.7rem',color:'var(--stone2)',display:'flex',alignItems:'center',gap:'.38rem'}}>
                    <svg viewBox="0 0 24 24" style={{width:13,height:13,stroke:'currentColor',fill:'none',strokeWidth:1.5,flexShrink:0}}>{icon}</svg>
                    {text}
                  </div>
                ))}
              </div>

              {/* Fabric / care */}
              {(product.fabric || product.careInstructions) && (
                <>
                  <div style={{height:1,background:'var(--sand)'}}/>
                  {product.fabric && (
                    <div style={{fontSize:'.78rem',color:'var(--stone2)'}}>
                      <strong style={{color:'var(--ink)',fontWeight:500}}>Fabric:</strong> {product.fabric}
                    </div>
                  )}
                  {product.careInstructions && (
                    <div style={{fontSize:'.78rem',color:'var(--stone2)'}}>
                      <strong style={{color:'var(--ink)',fontWeight:500}}>Care:</strong> {product.careInstructions}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .product-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
