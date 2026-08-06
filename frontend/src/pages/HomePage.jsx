import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';
import ProductCard from '../components/ProductCard';
import { useReveal } from '../hooks/useReveal';

const WA_NUMBER = '919826992021';

const CATEGORIES = ['Custom Oversized Tee', 'Classic Fit Tee', 'Polo T-Shirt', 'Custom Hoodie', 'Drop Shoulder Tee', 'Custom Tank Top', 'Other Custom Wear'];

function HowItWorksSection() {
  const steps = [
    {
      icon: '🎨',
      step: '01',
      title: 'Share Your Idea',
      desc: 'Describe your artwork, phrase, logo, or aesthetic. A few words or a detailed vision — we turn it into reality.'
    },
    {
      icon: '👕',
      step: '02',
      title: 'Choose Fabric & Fit',
      desc: 'Pick from 220 GSM heavyweight cotton, relaxed oversized cuts, or classic fits across 12 rich colorways.'
    },
    {
      icon: '📦',
      step: '03',
      title: 'Printed & Delivered',
      desc: 'Handcrafted and screen/DTG printed in India. Delivered to your doorstep in 5 business days.'
    }
  ];

  return (
    <section className="sect fabric-bg" style={{ background: 'var(--off)', borderTop: '1px solid var(--sand)', borderBottom: '1px solid var(--sand)' }}>
      <div className="container">
        <div className="sect-head reveal" style={{ textAlign: 'center', margin: '0 auto clamp(2.5rem,5vw,4rem)', maxWidth: '600px' }}>
          <span className="label" style={{ paddingLeft: 0 }}>Simple 3-Step Process</span>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)' }}>
            How Your <em className="gradient-text">Custom Tee</em> Is Made
          </h2>
          <p style={{ margin: '.8rem auto 0', maxWidth: '48ch' }}>
            From your raw concept to a high-density printed, heavyweight 220 GSM t-shirt ready to wear.
          </p>
        </div>

        <div className="hiw-grid reveal reveal-d1">
          {steps.map((s, i) => (
            <div key={i} className="hiw-card">
              <span className="hiw-step">{s.step}</span>
              <div className="hiw-icon">{s.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.6rem' }}>{s.title}</h3>
              <p style={{ fontSize: '.84rem', color: 'var(--stone2)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConceptSection() {
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Please describe your design concept first.'); return; }
    setError('');
    setLoading(true);
    setGuidance(null);
    const catLine = category ? `Category: ${category}\n` : '';
    const prompt = `You are a creative t-shirt design consultant for SNERA, a custom t-shirt brand in India.
A customer shared their t-shirt concept:
${catLine}Concept: "${text.trim()}"
Respond ONLY with a JSON object, no markdown:
{"silhouette":"t-shirt fit recommendation e.g. Boxy Oversized Fit","palette":"2-3 color combinations for print and shirt base","fabric":"specific cotton GSM recommendation","detail":"one specific print technique e.g. Puff Print on Chest"}`;
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
        silhouette: 'Heavyweight Boxy Oversized Tee',
        palette: 'Deep Cobalt Blue artwork on Cream 220 GSM Cotton base',
        fabric: '100% Super-Combed 220 GSM Premium Cotton',
        detail: 'High-density Screen Print on Chest & Back'
      });
    } finally {
      setLoading(false);
    }
  };

  const openWA = () => {
    const g = guidance;
    const catLine = category ? `*Type:* ${category}\n` : '';
    const msg = `Hello SNERA 👋\n\nI want to design a custom t-shirt!\n\n*My Concept:*\n"${text.trim()}"\n\n${catLine}*Design Specs:*\n• *Fit:* ${g.silhouette}\n• *Colorway:* ${g.palette}\n• *Fabric:* ${g.fabric}\n• *Print Detail:* ${g.detail}\n\nLet's get this printed!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="sect" id="concept" style={{ borderTop: '1px solid var(--sand)', background: 'var(--white)' }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(2rem,5vw,5rem)', alignItems: 'center'
        }} id="concept-section">

          {/* Left: copy */}
          <div className="reveal">
            <span className="label">Custom Design Studio</span>
            <h2 style={{
              fontFamily: 'var(--sans)', fontWeight: 700,
              fontSize: 'clamp(2rem,4.5vw,3.5rem)', letterSpacing: '-.02em', lineHeight: 1.12,
              marginBottom: '1.25rem'
            }}>
              Have a Tee Idea?<br /><span className="gradient-text">We'll Print It Perfectly.</span>
            </h2>
            <p style={{ fontSize: '.9rem', color: 'var(--stone2)', lineHeight: 1.8, maxWidth: '42ch', marginBottom: '2rem' }}>
              Describe your custom t-shirt idea — an occasion, a graphic concept, or a custom text layout. Get instant AI design guidance and connect directly with our production team on WhatsApp.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                ['🎨 Unlimited Print Possibilities', 'Front, back, sleeve prints, puff print, DTG, or high-density screen printing.'],
                ['👕 220 GSM Heavyweight Cotton', 'Pre-shrunk, bio-washed fabric engineered for durability and ultimate comfort.'],
                ['⚡ Fast 5-Day Delivery', 'Custom orders prepared, printed, and shipped anywhere in India in 5 business days.'],
              ].map(([title, body], i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.75rem', fontWeight: 700, color: 'var(--accent)', marginTop: 2
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '.15rem' }}>{title}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--stone2)', lineHeight: 1.6 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form + result */}
          <div className="reveal reveal-d2">
            <div style={{
              background: 'var(--white)', border: '1px solid rgba(108,92,231,.15)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(1.5rem,3vw,2.5rem)',
              boxShadow: '0 20px 50px rgba(108,92,231,.08)'
            }}>

              {/* Category chips */}
              <div style={{ fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--accent)', marginBottom: '.75rem' }}>
                Select Apparel Type
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)} style={{
                    fontSize: '.72rem', padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${category === c ? 'var(--accent)' : 'var(--sand)'}`,
                    background: category === c ? 'var(--gradient)' : 'transparent',
                    color: category === c ? 'var(--white)' : 'var(--stone2)',
                    cursor: 'pointer', transition: 'all .2s', fontFamily: 'var(--sans)', fontWeight: 500
                  }}>{c}</button>
                ))}
              </div>

              {/* Textarea */}
              <div style={{ fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--accent)', marginBottom: '.75rem' }}>
                Describe Your T-Shirt Design
              </div>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setError(''); }}
                placeholder="e.g. A minimal vintage typography design on the chest reading 'TOKYO 1984' in vibrant neon blue on a black oversized tee..."
                rows={4}
                style={{
                  width: '100%', border: '1px solid var(--sand)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '.9rem 1.1rem', fontFamily: 'var(--sans)', fontSize: '.88rem',
                  fontWeight: 400, background: 'var(--off)', color: 'var(--ink)',
                  resize: 'none', lineHeight: 1.75, outline: 'none',
                  transition: 'all var(--t)', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--sand)'}
              />
              {error && <p style={{ fontSize: '.75rem', color: 'var(--error)', margin: '.4rem 0 0', fontWeight: 500 }}>{error}</p>}

              {/* Get guidance button */}
              {!guidance && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-gradient btn-pulse"
                  style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', opacity: loading ? .7 : 1, padding: '1rem' }}
                >
                  {loading ? 'Analyzing your concept…' : '✨ Get AI Design Preview →'}
                </button>
              )}

              {/* Guidance result */}
              {guidance && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--sand)', paddingTop: '1.5rem', animation: 'fadeUp .4s var(--ease) forwards' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                    {[
                      ['Recommended Fit', guidance.silhouette],
                      ['Colorway Spec', guidance.palette],
                      ['Fabric Spec', guidance.fabric],
                      ['Print Technique', guidance.detail],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--off)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(108,92,231,.08)' }}>
                        <div style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent)', marginBottom: '.3rem' }}>{label}</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={openWA} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#25D366', color: '#fff', padding: '.9rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor', flexShrink: 0 }} aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Order via WhatsApp
                    </button>
                    <button onClick={() => { setGuidance(null); }} className="btn btn-outline" style={{ whiteSpace: 'nowrap', fontSize: '.75rem', padding: '.9rem 1.2rem' }}>
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
    icon: '👕',
    title: '220 GSM Heavyweight Cotton',
    body: 'We exclusively use super-combed 220 GSM heavyweight 100% cotton. Soft on skin, built to last 100+ washes.'
  },
  {
    icon: '✨',
    title: 'High-Density Print Quality',
    body: 'From vibrant DTG to tactile puff prints — our prints don\'t fade, crack, or peel after washing.'
  },
  {
    icon: '🚀',
    title: '5-Day Fast Delivery Across India',
    body: 'Every custom order is printed on-demand and delivered directly to your home within 5 business days.'
  },
];

const HOME_FAQS = [
  { q: 'How do I order a custom t-shirt on SNERA?', a: 'You can browse our shop collection or submit your custom design idea in the Design Studio above. Our team will review your specs and send you a digital preview via WhatsApp before printing.' },
  { q: 'What fabric quality does SNERA use?', a: 'All SNERA t-shirts are crafted from 220 GSM super-combed 100% heavyweight cotton — pre-shrunk, bio-washed, and ultra-durable.' },
  { q: 'Is there a minimum order quantity (MOQ) for custom tees?', a: 'No! We print single custom t-shirts as well as bulk orders for events, brands, and groups.' },
  { q: 'Does SNERA offer free shipping?', a: 'Yes! Free shipping on all orders above ₹999 across India.' },
  { q: 'What printing techniques do you use?', a: 'We offer Direct-to-Garment (DTG), Screen Printing, Puff Printing, and Embroidery depending on your design requirements.' },
  { q: 'How long does custom t-shirt delivery take?', a: 'Your order is printed and dispatched within 24–48 hours, reaching you in 5 business days anywhere in India.' },
];

function HomeFAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section style={{ borderTop: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0', background: 'var(--off)' }} id="faq">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'clamp(2rem,5vw,5rem)', alignItems: 'start' }}>
          <div className="reveal">
            <span className="label">Custom Tee Questions</span>
            <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 'clamp(1.8rem,4vw,2.8rem)', letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: '1rem' }}>
              Everything you <em className="gradient-text">need to know.</em>
            </h2>
            <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.8, maxWidth: '32ch' }}>
              Got a specific custom print request? Write to us at{' '}
              <a href="mailto:contact@snera.in" style={{ color: 'var(--accent)', fontWeight: 600 }}>contact@snera.in</a>
            </p>
          </div>
          <div itemScope itemType="https://schema.org/FAQPage">
            {HOME_FAQS.map(({ q, a }, i) => (
              <div key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid var(--sand)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
                >
                  <span itemProp="name" style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
                  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2, transition: 'transform .2s', transform: open === i ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open === i && (
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ paddingBottom: '1.25rem' }}>
                    <p itemProp="text" style={{ fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.8, margin: 0 }}>{a}</p>
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

function BlogSection({ blogs }) {
  if (!blogs.length) return null;

  return (
    <section className="sect" style={{ background: 'var(--white)', borderTop: '1px solid var(--sand)' }}>
      <div className="container">
        <div className="sect-head reveal" style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <span className="label">From The Journal</span>
            <h2 style={{ marginBottom: 0 }}>Style Tips & <em className="gradient-text">Stories</em></h2>
            <p style={{ marginTop: '.5rem', maxWidth: 480 }}>Fashion tips, fabric care guides, and behind-the-scenes stories from the SNERA studio.</p>
          </div>
          <Link to="/blog" className="btn btn-outline" style={{ flexShrink: 0 }}>
            View All Posts →
          </Link>
        </div>

        <div className="reveal reveal-d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(1.5rem, 3vw, 2.5rem)', marginTop: '2.5rem' }}>
          {blogs.map(blog => (
            <Link key={blog._id} to={`/blog/${blog.slug}`} className="why-card" style={{ padding: 0, overflow: 'hidden', display: 'block' }}>
              <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                <img src={blog.featuredImage} alt={blog.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s var(--ease)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '1.4rem' }}>
                <p style={{ fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: '.6rem' }}>
                  {blog.category} · {blog.readTime} min read
                </p>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.25rem', lineHeight: 1.4, color: 'var(--ink)', marginBottom: '.7rem' }}>
                  {blog.title}
                </h3>
                <p style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.7 }}>
                  {blog.excerpt.length > 110 ? blog.excerpt.slice(0, 110) + '…' : blog.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [shelves, setShelves] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    API.get('/collections').then(async (r) => {
      const cols = r.data.collections || r.data || [];
      const results = await Promise.all(
        cols.map(c =>
          API.get(`/products?category=${encodeURIComponent(c.name)}&limit=8`)
            .then(res => ({ collection: c, products: res.data.products || [] }))
            .catch(() => ({ collection: c, products: [] }))
        )
      );
      setShelves(results.filter(s => s.products.length > 0));
    });
  }, []);

  useEffect(() => {
    API.get('/blog/featured/recent?limit=3')
      .then(r => setBlogs(r.data || []))
      .catch(() => setBlogs([]));
  }, []);

  useReveal();

  return (
    <>
      <SEOHead
        title="Customizable T-Shirts India | Design Your Own Tee — SNERA"
        description="Design and order custom t-shirts online with SNERA. Upload your design, choose premium 220 GSM cotton, and get it printed and delivered across India. Free shipping above ₹999."
        url="https://snera.in"
        schemas={useSEO({
          type: 'home',
          pageUrl: '/',
          pageName: 'Customizable T-Shirts India | Design Your Own Tee — SNERA',
          pageDescription: 'Design and order custom t-shirts online with SNERA. Upload your design, choose premium 220 GSM cotton, and get it printed and delivered across India.',
          breadcrumbs: [{ name: 'Home', url: '/' }],
        })}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="hero" className="hero-sect" style={{
        minHeight: '100svh', paddingTop: 'var(--nav-h)',
        display: 'grid', gridTemplateColumns: '1.1fr 0.9fr',
        background: 'linear-gradient(160deg, var(--off) 0%, var(--white) 55%, var(--off2) 100%)',
        color: 'var(--ink)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(108,92,231,.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(232,67,147,.1) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Left Copy */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(3rem,7vw,6rem) clamp(1.25rem,4vw,3rem) clamp(3rem,7vw,6rem) clamp(1.25rem,6vw,6rem)',
          position: 'relative', zIndex: 1
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.4rem .9rem', background: 'var(--white)', borderRadius: '30px', border: '1px solid rgba(108,92,231,.18)', boxShadow: '0 4px 14px rgba(108,92,231,.08)', marginBottom: '1.75rem', width: 'fit-content', opacity: 0, animation: 'fadeUp .8s var(--ease) .2s forwards' }}>
            <span style={{ fontSize: '.7rem' }}>✨</span>
            <span style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>Custom T-Shirts · Printed in India</span>
          </div>

          <div style={{ opacity: 0, animation: 'fadeUp .9s var(--ease) .34s forwards', marginBottom: '1.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--sans)', fontWeight: 700,
              fontSize: 'clamp(2.8rem,6.2vw,5.5rem)', lineHeight: 1.05, letterSpacing: '-.03em', color: 'var(--ink)'
            }}>
              DESIGN.<br />
              <span className="gradient-text">PRINT. WEAR.</span><br />
              YOUR WAY.
            </h1>
          </div>

          <p style={{
            fontSize: '1rem', color: 'var(--stone2)', lineHeight: 1.75, maxWidth: '40ch', marginBottom: '2.5rem',
            opacity: 0, animation: 'fadeUp .9s var(--ease) .48s forwards'
          }}>
            SNERA lets you design your own custom t-shirts — printed on 220 GSM heavyweight cotton and delivered across India in 5 days.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap', opacity: 0, animation: 'fadeUp .9s var(--ease) .62s forwards' }}>
            <a href="#concept" className="btn btn-gradient btn-pulse" style={{ padding: '1rem 2.2rem', fontSize: '.78rem' }}>
              ✨ Design Your Tee Now
            </a>
            <Link to="/shop" className="btn btn-outline" style={{ padding: '.95rem 2rem', fontSize: '.75rem' }}>
              Browse Collection
            </Link>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--sand)',
            opacity: 0, animation: 'fadeUp .9s var(--ease) .78s forwards'
          }}>
            {[
              ['220 GSM', 'Heavy Cotton'],
              ['12+', 'Colorways'],
              ['5-Day', 'Fast Delivery'],
              ['4.9★', 'Customer Rating']
            ].map(([n, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, height: 28, background: 'var(--sand)', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>{n}</div>
                  <div style={{ fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: '.1rem', fontWeight: 600 }}>{l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Graphic Mockup */}
        <div className="hero-media" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1 }}>
          <div className="hero-media-card" style={{
            position: 'relative', width: '100%', maxWidth: '480px', aspectRatio: '4/5',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(108,92,231,.16)',
            border: '1px solid var(--sand)'
          }}>
            <img
              src="https://suvidhasetu.netraa.co.in/uploads/hero.webp"
              alt="SNERA Custom T-Shirts"
              loading="eager"
              fetchPriority="high"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            />
            {/* T-Shirt Badge Floating Overlay */}
            <div style={{
              position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(108,92,231,.12)', borderRadius: 'var(--radius)',
              boxShadow: '0 10px 30px rgba(0,0,0,.08)',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '.65rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700 }}>Custom Print Ready</div>
                <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--ink)' }}>220 GSM Heavyweight Oversized Tee</div>
              </div>
              <span style={{ fontSize: '1.5rem' }}>👕</span>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 960px) {
          .hero-sect {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            padding-bottom: 2.5rem;
          }
          .hero-media { padding: 0 clamp(1.25rem,6vw,3rem) 1rem !important; }
          .hero-media-card { max-width: 420px !important; aspect-ratio: 4/3.4 !important; }
        }
        @media (max-width: 480px) {
          .hero-media-card { aspect-ratio: 4/3.6 !important; }
        }
      `}</style>

      {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          {['Custom T-Shirts', '220 GSM Heavyweight Cotton', 'Design Your Own Tee', 'Free Shipping ₹999+', 'Screen & DTG Printing', 'Delivered in 5 Days', 'Made in India'].map((t, i) => (
            <span key={i} className="marquee-item">{t}</span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── SHOP BY COLLECTION ───────────────────────────────────────────── */}
      {shelves.map((shelf, idx) => (
        <section
          key={shelf.collection._id}
          className="sect"
          style={{
            borderTop: '1px solid var(--sand)',
            background: idx % 2 === 0 ? 'var(--off)' : 'var(--white)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Watermark */}
          <span aria-hidden="true" style={{
            position: 'absolute', top: '-1vw', right: '-1vw',
            fontFamily: 'var(--sans)', fontWeight: 800,
            fontSize: 'clamp(5rem,13vw,12rem)', lineHeight: 1,
            color: 'var(--accent)', opacity: 0.03, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>{shelf.collection.name}</span>

          <div className="container" style={{ position: 'relative' }}>
            <div className="sect-head reveal" style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              borderBottom: 'none', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div>
                <span className="label">Featured Collection</span>
                <h2 style={{ marginBottom: 0 }}>{shelf.collection.name}</h2>
                {shelf.collection.description && (
                  <p style={{ marginTop: '.5rem', maxWidth: 480 }}>{shelf.collection.description}</p>
                )}
              </div>
              <Link
                to={`/shop?category=${encodeURIComponent(shelf.collection.name)}`}
                className="btn btn-outline"
                style={{ flexShrink: 0 }}
              >
                Shop All {shelf.collection.name} →
              </Link>
            </div>

            <div className="prod-grid" style={{ marginTop: '2.5rem' }}>
              {shelf.products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} showFlip={true} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── DESIGN STUDIO / CONCEPT SECTION ───────────────────────────────── */}
      <ConceptSection />

      {/* ── WHY SNERA ─────────────────────────────────────────────────────── */}
      <section className="sect why-sect" id="why" style={{ background: 'var(--off)', borderTop: '1px solid var(--sand)' }}>
        <div className="container">
          <div className="sect-head reveal" style={{ textAlign: 'center', margin: '0 auto clamp(2.5rem,5vw,4rem)' }}>
            <span className="label" style={{ paddingLeft: 0 }}>The SNERA Guarantee</span>
            <h2>Why Choose <em className="gradient-text">SNERA Custom Tees?</em></h2>
            <p style={{ margin: '.5rem auto 0' }}>We engineered the ideal t-shirt canvas so your custom prints look and feel premium.</p>
          </div>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <div key={i} className={`why-card reveal reveal-d${i + 1}`}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{w.icon}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '.5rem', color: 'var(--ink)' }}>{w.title}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--stone2)', lineHeight: 1.75 }}>{w.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FROM THE JOURNAL ─────────────────────────────────────────────── */}
      <BlogSection blogs={blogs} />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <HomeFAQ />

      {/* ── FLOATING MOBILE CTA ───────────────────────────────────────────── */}
      <a href="#concept" className="floating-cta btn-pulse">
        ✨ Design Your Custom Tee
      </a>
    </>
  );
}