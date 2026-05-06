import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

const WHY = [
  {
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
    title: 'Order First',
    body: 'Every piece begins only after your order is placed. No mass production. No excess stock.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
        <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-4z" />
      </svg>
    ),
    title: 'Made With Care',
    body: 'Each garment is carefully crafted using premium 220 GSM cotton for lasting quality.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13" />
        <path d="M16 8h4l3 3v5h-7z" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="18.5" cy="18.5" r="1.5" />
      </svg>
    ),
    title: 'Delivered in 5 Days',
    body: 'Your order is prepared and delivered within 5 days. Quality is never rushed.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
        <path d="M3 12h18" />
        <path d="M7 8l-4 4 4 4" />
        <path d="M17 16l4-4-4-4" />
      </svg>
    ),
    title: '2 Day Easy Returns',
    body: 'Request a return within 2 days of delivery. Simple and hassle free.'
  }
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useReveal();

  useEffect(() => {
    API.get('/products?featured=true&limit=6')
      .then(r => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="hero" style={{
        minHeight: '100svh', paddingTop: 'var(--nav-h)',
        display: 'grid', gridTemplateColumns: '1fr 1fr'
      }}>
        {/* Left */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(3rem,7vw,6rem) clamp(1.25rem,4vw,3rem) clamp(3rem,7vw,6rem) clamp(1.25rem,6vw,6rem)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', marginBottom: '1.75rem', opacity: 0, animation: 'fadeUp .8s var(--ease) .2s forwards' }}>
            <div style={{ width: 26, height: 1, background: 'var(--stone)', flexShrink: 0 }} />
            <span style={{ fontSize: '.6rem', letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--stone)', fontWeight: 500 }}>New Collection — SS 2025</span>
          </div>

          <div style={{ opacity: 0, animation: 'fadeUp .9s var(--ease) .34s forwards', marginBottom: '1.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(3rem,6.5vw,6rem)', lineHeight: 1.04, letterSpacing: '-.01em'
            }}>
              Dressed in<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>simplicity.</em><br />Built to last.
            </h1>
          </div>

          <p style={{
            fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.78, maxWidth: '36ch', marginBottom: '2.5rem',
            opacity: 0, animation: 'fadeUp .9s var(--ease) .48s forwards'
          }}>
            Premium essentials crafted for those who believe the quietest statement is often the loudest. Wear less. Mean more.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', opacity: 0, animation: 'fadeUp .9s var(--ease) .62s forwards' }}>
            <Link to="/shop" className="btn btn-dark">Explore Collection</Link>
            <a href="#why" className="btn btn-ghost">Our Story →</a>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '.75rem',
            marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--sand)',
            opacity: 0, animation: 'fadeUp .9s var(--ease) .78s forwards'
          }}>
            {[['220', 'GSM Cotton'], ['12', 'Colorways'], ['4.9', 'Avg. Rating']].map(([n, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, height: 28, background: 'var(--sand)', flexShrink: 0 }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400 }}>{n}</div>
                  <div style={{ fontSize: '.56rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--stone)', marginTop: '.1rem' }}>{l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--off)' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}>
            {/* Image */}
            <img
              src="/images/hero.png"   // 👈 add your image here
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Overlay (important for readability) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.25)'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            inset: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent:'flex-start',
paddingLeft:'20%',
            pointerEvents: 'none'
          }}>
            <img
              src="/images/logo1.png"
              alt="SNERA"
              style={{
                width: 'clamp(155px, 18vw, 270px)',
                opacity: 0.5,
                objectFit: 'contain'
              }}
            />
            {/* <span style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(5rem,11vw,9rem)',
              fontWeight: 300, letterSpacing: '.12em',
              color: 'rgba(28,27,24,.07)', userSelect: 'none'
            }}>SNERA</span> */}
          </div>
          {/* <div style={{
            position: 'absolute', bottom: '2rem', left: '2rem',
            background: 'var(--white)', border: '1px solid var(--sand)',
            padding: '.7rem 1.2rem'
          }}>
           
          </div> */}
          <div style={{
            position: 'absolute', bottom: '2.5rem', right: '2.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem'
          }}>
            <span style={{ fontSize: '.52rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--stone)', writingMode: 'vertical-rl' }}>Scroll</span>
            <div style={{ width: 1, height: 38, background: 'var(--stone)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: '-100%', width: '100%', height: '100%',
                background: 'var(--ink)', animation: 'scrlAnim 1.6s ease infinite'
              }} />
            </div>
          </div>

        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          {['Premium Cotton', 'Minimal Design', 'Made in India', 'Free Shipping ₹999+', 'Easy Returns', 'SS 2025 Collection',
            'Premium Cotton', 'Minimal Design', 'Made in India', 'Free Shipping ₹999+', 'Easy Returns', 'SS 2025 Collection'].map((t, i) => (
              <span key={i} className="marquee-item">{t}</span>
            ))}
        </div>
      </div>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <section className="sect" id="featured">
        <div className="container">
          <div className="sect-head reveal">
            <span className="label">New Arrivals</span>
            <h2>The essentials, <em>refined.</em></h2>
            <p>Each piece designed to move through your life quietly and confidently. Timeless cuts, elevated fabric.</p>
          </div>

          {loading ? (
            <div className="page-loader"><div className="loader-ring" /></div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--stone)' }}>
              <p style={{ fontSize: '.85rem' }}>New collection coming soon.</p>
            </div>
          ) : (
            <div className="prod-grid">
              {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }} className="reveal">
            <Link to="/shop" className="btn btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORY SPLIT ────────────────────────────────────────────────── */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderTop: '1px solid var(--sand)', borderBottom: '1px solid var(--sand)'
      }} id="category">
        {[
          { label: 'Collection', title: 'For\nHim', glyph: 'M', link: '/shop?gender=Men', linkTxt: "Shop Men's", image: '/images/men.png' },
          { label: 'Collection', title: 'For\nHer', glyph: 'W', link: '/shop?gender=Women', linkTxt: "Shop Women's", image: '/images/women.png' }
        ].map((cat, i) => (
          <Link to={cat.link}
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)} style={{
              position: 'relative', overflow: 'hidden',
              aspectRatio: '3/4', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: 'clamp(1.5rem,4vw,3rem)',
              borderRight: i === 0 ? '1px solid var(--sand)' : 'none',
              textDecoration: 'none'
            }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden'
            }}>
              {/* Image */}
              <img
                src={cat.image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.18)'
              }} />

              {/* Glyph */}
              <span style={{
                position: 'absolute',
                top: '1.5rem',
                left: '1.5rem',
                zIndex: 4,
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(4.5rem,5vw,4rem)',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.05em',
                userSelect: 'none',


                opacity: hovered === i ? 1 : 0,
                transition: 'opacity 0.4s ease'
              }}>
                {cat.glyph}
              </span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '.58rem', letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.45rem' }}>{cat.label}</div>
              <h3 style={{
                fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,4vw,3.5rem)',
                fontWeight: 300, letterSpacing: '-.01em', marginBottom: '1.1rem', color: '#fff',
                whiteSpace: 'pre-line'
              }}>{cat.title}</h3>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '.45rem',
                fontSize: '.63rem', letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500,
                color: '#fff', borderBottom: '1px solid var(--ink)', paddingBottom: 2
              }}>
                {cat.linkTxt}
                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8 }}>
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── WHY SNERA ─────────────────────────────────────────────────────── */}
      <section className="sect why-sect" id="why">
        <div className="container">
          <div className="sect-head reveal">
            <span className="label">The SNERA Promise</span>
            <h2>Why we're <em>different.</em></h2>
            <p>We don't chase trends. We build wardrobe pillars.</p>
          </div>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <div key={i} className={`why-card reveal reveal-d${i + 1}`}>
                <div className="why-icon" style={{
                  width: 38, height: 38, marginBottom: '0.6rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ width: 22, height: 22, stroke: 'var(--accent)', fill: 'none', strokeWidth: 1.5 }}>
                    {w.icon}
                  </div>
                </div>
                <div style={{ fontSize: '.8rem', fontWeight: 500, letterSpacing: '.07em', marginBottom: '.5rem', color: 'var(--ink)' }}>{w.title}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--stone2)', lineHeight: 1.75 }}>{w.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes scrlAnim {
          0%   { top:-100%; }
          100% { top: 200%; }
        }
        @media(max-width:768px) {
          #hero { grid-template-columns: 1fr !important; min-height: auto !important; }
          #hero > div:last-child { min-height: 55vw; }
          #category { grid-template-columns: 1fr !important; }
          #category > a:first-child { border-right: none !important; border-bottom: 1px solid var(--sand); }
        }
      `}</style>
    </>
  );
}
