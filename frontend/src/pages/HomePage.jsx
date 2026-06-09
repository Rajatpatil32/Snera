import React, { useEffect, useState } from 'react';
import FAQ from '../components/FAQ';
import { useFAQSchema } from '../hooks/useFAQSchema';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

const WA_NUMBER = '919826992021';

const CATEGORIES = ['Dress', 'Kurta / Set', 'Co-ord Set', 'Jacket', 'Top', 'Trousers / Skirt', 'Saree / Drape', 'Other'];

function ConceptSection() {
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Please describe your concept first.'); return; }
    setError('');
    setLoading(true);
    setGuidance(null);
    const catLine = category ? `Category: ${category}\n` : '';
    const prompt = `You are a creative fashion consultant for SNERA, a premium Indian clothing brand — refined, minimal, editorial.
A customer has shared their concept:
${catLine}Concept: "${text.trim()}"
Respond ONLY with a JSON object, no markdown, no preamble:
{"silhouette":"short label e.g. Fluid A-line with gathered waist","palette":"2 sentences naming specific tones","fabric":"2 sentences naming specific materials","detail":"one specific finishing detail"}`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
      setGuidance(JSON.parse(raw));
    } catch {
      setGuidance({
        silhouette: 'Relaxed structured silhouette',
        palette: 'Dusty rose, warm ivory, and deep terracotta — tones that feel quiet and considered.',
        fabric: 'Handloom cotton or linen — honours the relaxed spirit while keeping it refined.',
        detail: 'Hand-rolled hems for a handcrafted finish.'
      });
    } finally {
      setLoading(false);
    }
  };

  const openWA = () => {
    const g = guidance;
    const catLine = category ? `*Category:* ${category}\n` : '';
    const msg = `Hello SNERA 👋\n\nI have a custom design concept I'd love to discuss.\n\n*My idea:*\n"${text.trim()}"\n\n${catLine}*Creative direction:*\n• *Silhouette:* ${g.silhouette}\n• *Palette:* ${g.palette}\n• *Fabric:* ${g.fabric}\n• *Detail:* ${g.detail}\n\nWould love to explore this further!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="sect" id="concept" style={{ borderTop: '1px solid var(--sand)', background: 'var(--off)' }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(2rem,5vw,5rem)', alignItems: 'start'
        }} id="concept-section">

          {/* Left: copy */}
          <div className="reveal">
            <span className="label">Custom Design</span>
            <h2 style={{
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(1.8rem,4vw,3rem)', letterSpacing: '-.01em', lineHeight: 1.15,
              marginBottom: '1rem'
            }}>
              Have a vision?<br /><em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Let's craft it.</em>
            </h2>
            <p style={{ fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.8, maxWidth: '38ch' }}>
              Describe your concept — an occasion, a feeling, a silhouette. Our team will take it from there and connect with you personally on WhatsApp.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {[
                ['Share your idea', 'A few words or sentences — however it comes to you.'],
                ['Get instant direction', 'Silhouette, palette, and fabric suggestions tailored to your concept.'],
                ['Talk to our team', 'Continue the conversation directly on WhatsApp.'],
              ].map(([title, body], i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, width: 22, height: 22, border: '1px solid var(--sand2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.62rem', fontWeight: 500, color: 'var(--stone)', marginTop: 2
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '.15rem' }}>{title}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--stone2)', lineHeight: 1.7 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form + result */}
          <div className="reveal reveal-d2">
            <div style={{ background: 'var(--white)', border: '1px solid var(--sand)', padding: 'clamp(1.5rem,3vw,2.25rem)' }}>

              {/* Category chips */}
              <div style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--stone)', marginBottom: '.6rem' }}>
                What are you designing?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.4rem' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)} style={{
                    fontSize: '.7rem', padding: '5px 12px',
                    border: `1px solid ${category === c ? 'var(--ink)' : 'var(--sand)'}`,
                    background: category === c ? 'var(--ink)' : 'transparent',
                    color: category === c ? 'var(--white)' : 'var(--stone2)',
                    cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--sans)', fontWeight: 300
                  }}>{c}</button>
                ))}
              </div>

              {/* Textarea */}
              <div style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--stone)', marginBottom: '.6rem' }}>
                Describe your concept
              </div>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setError(''); }}
                placeholder="e.g. A flowy linen dress for a beach wedding — earthy tones, relaxed but elegant..."
                rows={4}
                style={{
                  width: '100%', border: '1px solid var(--sand)', borderBottom: guidance ? '1px solid var(--sand)' : '1px solid var(--sand)',
                  padding: '.85rem 1rem', fontFamily: 'var(--sans)', fontSize: '.82rem',
                  fontWeight: 300, background: 'var(--white)', color: 'var(--ink)',
                  resize: 'none', lineHeight: 1.75, outline: 'none',
                  transition: 'border-color var(--t)', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--stone2)'}
                onBlur={e => e.target.style.borderColor = 'var(--sand)'}
              />
              {error && <p style={{ fontSize: '.72rem', color: 'var(--error)', margin: '.4rem 0 0' }}>{error}</p>}

              {/* Get guidance button */}
              {!guidance && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-dark"
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', opacity: loading ? .7 : 1 }}
                >
                  {loading ? 'Getting your guidance…' : 'Get creative guidance →'}
                </button>
              )}

              {/* Guidance result */}
              {guidance && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--sand)', paddingTop: '1.25rem', animation: 'fadeUp .4s var(--ease) forwards' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--sand)', border: '1px solid var(--sand)', marginBottom: '1rem' }}>
                    {[
                      ['Silhouette', guidance.silhouette],
                      ['Palette', guidance.palette],
                      ['Fabric', guidance.fabric],
                      ['Detail', guidance.detail],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--white)', padding: '.9rem 1rem' }}>
                        <div style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--stone)', marginBottom: '.35rem' }}>{label}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--stone2)', lineHeight: 1.7 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={openWA} className="btn btn-dark" style={{ flex: 1, justifyContent: 'center', background: '#25D366', borderColor: '#25D366' }}>
                      <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: 'currentColor', flexShrink: 0 }} aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Continue on WhatsApp
                    </button>
                    <button onClick={() => { setGuidance(null); }} className="btn btn-outline" style={{ whiteSpace: 'nowrap', fontSize: '.72rem' }}>
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  // {
  //   icon: (
  //     <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
  //       <path d="M3 12h18" />
  //       <path d="M7 8l-4 4 4 4" />
  //       <path d="M17 16l4-4-4-4" />
  //     </svg>
  //   ),
  //   title: '2 Day Easy Returns',
  //   body: 'Request a return within 2 days of delivery. Simple and hassle free.'
  // }
];

const HOME_FAQS = [
  { q: 'What is SNERA?', a: 'SNERA is a premium minimal Indian fashion brand. Every piece is designed with quiet confidence — crafted in India, built to last.' },
  { q: 'Does SNERA offer free shipping?', a: 'Yes. Free standard shipping on all orders above ₹999 across India. Express delivery (2–3 business days) is available at checkout.' },
  { q: 'What is the return policy?', a: 'Returns accepted within 7 days of delivery for eligible, unused items in original packaging. Refunds process in 5–7 business days. Sale and custom items are not eligible.' },
  { q: 'How do I track my order?', a: 'Track your order anytime at snera.in/track-order using your order ID and registered email.' },
  { q: 'What payment methods are accepted?', a: 'All major credit/debit cards, UPI, net banking, and wallets via Razorpay. Every transaction is SSL-secured.' },
  { q: 'Does SNERA ship across India?', a: 'Yes — SNERA ships to all major cities and towns across India.' },
  { q: 'How do I find my size?', a: 'Each product page lists available sizes. When in doubt, size up. Email us at contact@snera.in for help.' },
  { q: 'How can I contact SNERA?', a: 'Email us at contact@snera.in or use the Contact page. We respond within 24–48 hours, Monday–Saturday.' },
];

function HomeFAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section style={{ borderTop: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }} id="faq">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'clamp(2rem,5vw,5rem)', alignItems: 'start' }}>
          <div className="reveal">
            <span className="label">Got Questions?</span>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-.01em', lineHeight: 1.15, marginBottom: '1rem' }}>
              Everything you <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>need to know.</em>
            </h2>
            <p style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.8, maxWidth: '32ch' }}>
              Can\'t find an answer? Write to us at{' '}
              <a href="mailto:contact@snera.in" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>contact@snera.in</a>
            </p>
          </div>
          <div itemScope itemType="https://schema.org/FAQPage">
            {HOME_FAQS.map(({ q, a }, i) => (
              <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid var(--sand)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
                >
                  <span itemProp="name" style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.8, transition: 'transform .2s', transform: open === i ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open === i && (
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ paddingBottom: '1.1rem' }}>
                    <p itemProp="text" style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.8, margin: 0 }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useReveal();
  const { faqSchema, faqs: faqData } = useFAQSchema();

  useEffect(() => {
    API.get('/products?featured=true&limit=6')
      .then(r => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead
  title="Custom T-Shirts & Premium Essentials | SNERA India"
  description="Design your own customised t-shirts at SNERA. Premium minimal apparel with FAQs on custom orders, sizing, fabrics & delivery. Free shipping ₹999+."
  image="https://snera.in/images/og-image-custom-tshirt.webp" // If you have a custom t-shirt focused OG image
  url="https://snera.in"
  schemas={[
    ...useSEO({
      type: 'home',
      pageName: 'Custom T-Shirts & Premium Essentials | SNERA India',
      pageDescription: 'Design your own customised t-shirts at SNERA. Premium minimal apparel with FAQs on custom orders, sizing, fabrics & delivery. Free shipping ₹999+.',
      breadcrumbs: [{ name: 'Home', url: '/' }],
    }),
    faqSchema,
  ]}
/>

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
            {/* LCP image — eager + fetchpriority high to boost Largest Contentful Paint */}
            <img
              src="https://suvidhasetu.netraa.co.in/uploads/hero.webp"
              alt="SNERA — Premium minimal fashion collection for men and women"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
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
            inset: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent:'flex-start',
paddingRight:'26%',
            pointerEvents: 'none'
          }}>
            <img
              src="/images/logo1.webp"
              alt="SNERA"
              style={{
                width: '800px',
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
              {products.map((p, i) => (
              <ProductCard
                key={p._id}
                product={p}
                index={i}
                showFlip={true}
              />
            ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }} className="reveal">
            <Link to="/shop" className="btn btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORY SPLIT ────────────────────────────────────────────────── */}
      {/* <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderTop: '1px solid var(--sand)', borderBottom: '1px solid var(--sand)'
      }} id="category">
        {[
          { label: 'Collection', title: 'For\nHim', glyph: 'M', link: '/shop?gender=Men', linkTxt: "Shop Men's", image: 'https://suvidhasetu.netraa.co.in/uploads/men.webp' },
          { label: 'Collection', title: 'For\nHer', glyph: 'W', link: '/shop?gender=Women', linkTxt: "Shop Women's", image: 'https://suvidhasetu.netraa.co.in/uploads/women.webp' }
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
              
              <img
                src={cat.image}
                alt={`SNERA ${cat.title.replace('\n', ' ')} — ${cat.linkTxt}`}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.18)'
              }} />

              
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
      </section> */}

      {/* ── NOSTALGIC ─────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        borderTop: '1px solid var(--sand)', borderBottom: '1px solid var(--sand)',
        aspectRatio: '16/7'
      }} id="nostalgic">
        {/* 👇 Replace src with your nostalgic image */}
        <img
          src="https://suvidhasetu.netraa.co.in/uploads/nostalgic.webp"
          alt="Nostalgic collection"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,18,.32)' }} />

        {/* Overlay text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'clamp(1.5rem,4vw,3rem)'
        }}>
          <span className="label" style={{ color: 'rgba(248,247,244,.6)', marginBottom: '.5rem' }}>Nostalgic Edit</span>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(2rem,5vw,4rem)', letterSpacing: '-.01em',
            color: '#F8F7F4', lineHeight: 1.1, marginBottom: '1.25rem'
          }}>
            Dressed in <em style={{ fontStyle: 'italic' }}>memory.</em>
          </h2>
          <Link to="/shop?collection=Unisex" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '.45rem',
            fontSize: '.63rem', letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500,
            color: '#F8F7F4', borderBottom: '1px solid rgba(248,247,244,.5)',
            paddingBottom: 2, textDecoration: 'none', alignSelf: 'flex-start'
          }}>
            Explore the Edit
            <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8 }}>
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQ faqs={faqData} />

      {/* ── CONCEPT → WHATSAPP ───────────────────────────────────────────── */}
      <ConceptSection />

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
          #nostalgic { aspect-ratio: 9/5 !important; }
          #concept-section { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}