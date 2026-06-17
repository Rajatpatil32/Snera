import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';

const SECTION = { padding: 'clamp(2.5rem,5vw,4rem) 0', borderBottom: '1px solid var(--sand)' };
const H2 = { fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-.01em', marginBottom: '1.5rem' };
const BODY = { fontSize: '.86rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' };
const TH = { fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--stone)', padding: '.75rem 1rem', borderBottom: '1px solid var(--sand)', textAlign: 'left', background: 'var(--off)', whiteSpace: 'nowrap' };
const TD = { fontSize: '.82rem', color: 'var(--ink)', padding: '.7rem 1rem', borderBottom: '1px solid var(--sand)' };

const SIZE_FAQS = [
  { q: 'How do SNERA clothes fit — true to size or small?', a: 'SNERA garments are cut with a relaxed, minimal silhouette. They fit true to size. If you are between sizes or prefer a looser drape, size up by one.' },
  { q: 'What size should I order from SNERA if I am between sizes?', a: `Always size up when in doubt. SNERA's minimal cut means a larger size drapes cleanly without looking oversized. Sizing down risks a fitted look that doesn't match the minimal aesthetic.` },
  { q: 'Does SNERA offer plus sizes?', a: 'SNERA currently offers sizes XS to XXL. Check individual product pages for exact availability per style.' },
  { q: 'How do I measure my chest for SNERA tops?', a: 'Wrap a measuring tape around the fullest part of your chest, keeping it level. Match this number to the chest column in the SNERA size chart above.' },
  { q: 'How do I measure my waist for SNERA bottoms?', a: 'Measure around your natural waist — the narrowest part of your torso, roughly 2–3 cm above your navel. Match this to the waist column in the chart.' },
  { q: 'Can I exchange a SNERA product for a different size?', a: 'Yes. SNERA accepts size exchanges within 7 days of delivery. The item must be unused, unwashed, and in original packaging. Email contact@snera.in with your order ID to initiate.' },
  { q: 'What is the inseam length of SNERA bottoms?', a: 'Inseam length varies by style. It is listed in centimetres on each product page under the specifications section.' },
  { q: 'Do SNERA clothes shrink after washing?', a: 'SNERA garments are pre-washed where required. Follow the care label: cold machine wash or hand wash for cotton styles. Avoid tumble drying to maintain fit and fabric integrity.' },
];

const sizeSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://snera.in/size-guide#faq',
  mainEntity: SIZE_FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const tableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://snera.in/size-guide#webpage',
  name: 'SNERA Size Guide — Clothing Size Chart for Men and Women',
  description: 'Official SNERA size chart. Find your correct size for SNERA tops, bottoms, and outerwear. Includes chest, waist, hip measurements in inches and centimetres.',
  url: 'https://snera.in/size-guide',
  inLanguage: 'en-IN',
  about: { '@id': 'https://snera.in/#brand' },
  publisher: { '@id': 'https://snera.in/#organization' },
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2', '.speakable'],
  },
};

export default function SizeGuidePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [unit, setUnit] = useState('in');

  const baseSchemas = useSEO({
    type: 'webpage',
    pageUrl: '/size-guide',
    pageName: 'SNERA Size Guide — Clothing Size Chart for Men and Women',
    pageDescription: 'Official SNERA size chart. Find your correct size for SNERA tops, bottoms, and outerwear. Chest, waist, hip measurements in inches and centimetres.',
    datePublished: '2026-01-01',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Size Guide', url: '/size-guide' },
    ],
  });

  return (
    <>
      <SEOHead
        title="SNERA Size Guide | Clothing Size Chart — Men & Women"
        description="Official SNERA size chart. Find your correct size for SNERA tops, bottoms, and outerwear. Chest, waist, hip measurements in inches and centimetres."
        url="https://snera.in/size-guide"
        schemas={[...baseSchemas, sizeSchema, tableSchema]}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 'calc(var(--nav-h) + clamp(3rem,6vw,5rem))', paddingBottom: 'clamp(2.5rem,5vw,4rem)', borderBottom: '1px solid var(--sand)' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <span className="label" style={{ marginBottom: '.75rem', display: 'block' }}>Fit & Sizing</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: '1.25rem' }}>
            SNERA Size Guide
          </h1>
          <p className="speakable" style={{ ...BODY, maxWidth: '55ch', marginBottom: 0 }}>
            Find your correct SNERA size using the charts below. All measurements are body measurements — not garment measurements. When in doubt, size up.
          </p>
        </div>
      </section>

      {/* ── HOW TO MEASURE ───────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>How to measure yourself</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Chest', steps: 'Wrap tape around the fullest part of your chest. Keep it level. Do not pull tight.' },
              { label: 'Waist', steps: 'Measure around your natural waist — 2–3 cm above your navel, the narrowest point.' },
              { label: 'Hips', steps: 'Measure around the fullest part of your hips and seat, keeping the tape level.' },
              { label: 'Inseam', steps: 'Measure from your crotch to your ankle along the inner leg. Wear fitted trousers for accuracy.' },
            ].map(({ label, steps }) => (
              <div key={label} style={{ padding: '1.25rem', border: '1px solid var(--sand)' }}>
                <div style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--stone)', marginBottom: '.5rem' }}>{label}</div>
                <p style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.75, margin: 0 }}>{steps}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIT TOGGLE ──────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--sand)', padding: '1rem 0' }}>
        <div className="container" style={{ maxWidth: 860, display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stone)', marginRight: '.5rem' }}>Units:</span>
          {['in', 'cm'].map(u => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              style={{
                padding: '.35rem .85rem', border: '1px solid var(--sand)',
                background: unit === u ? 'var(--ink)' : 'transparent',
                color: unit === u ? 'var(--white)' : 'var(--stone)',
                fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all var(--t)',
              }}
            >{u}</button>
          ))}
        </div>
      </div>

      {/* ── TOPS CHART ───────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Tops, T-shirts & Shirts — SNERA size chart</h2>
          <p className="speakable" style={BODY}>
            SNERA tops are cut with a relaxed, minimal fit. The chest measurement is the most important reference for tops.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr>
                  {['SNERA Size', 'Chest', 'Shoulder', 'Sleeve Length', 'Body Length'].map(h => (
                    <th key={h} style={TH}>{h} ({unit})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'XS',  chest:[34,35], shoulder:[16.5,17],  sleeve:[24,24.5], length:[26,26.5] },
                  { size: 'S',   chest:[36,37], shoulder:[17,17.5],  sleeve:[24.5,25], length:[27,27.5] },
                  { size: 'M',   chest:[38,39], shoulder:[17.5,18],  sleeve:[25,25.5], length:[28,28.5] },
                  { size: 'L',   chest:[40,41], shoulder:[18,18.5],  sleeve:[25.5,26], length:[29,29.5] },
                  { size: 'XL',  chest:[42,43], shoulder:[18.5,19],  sleeve:[26,26.5], length:[30,30.5] },
                  { size: 'XXL', chest:[44,45], shoulder:[19,19.5],  sleeve:[26.5,27], length:[31,31.5] },
                ].map(({ size, chest, shoulder, sleeve, length }) => {
                  const c = unit === 'in'
                    ? { chest, shoulder, sleeve, length }
                    : {
                        chest:    chest.map(v => Math.round(v * 2.54)),
                        shoulder: shoulder.map(v => Math.round(v * 2.54 * 10) / 10),
                        sleeve:   sleeve.map(v => Math.round(v * 2.54 * 10) / 10),
                        length:   length.map(v => Math.round(v * 2.54 * 10) / 10),
                      };
                  const fmt = ([a, b]) => `${a}–${b}`;
                  return (
                    <tr key={size} style={{ background: ['XS','M','XL'].includes(size) ? 'var(--off)' : 'transparent' }}>
                      <td style={{ ...TD, fontWeight: 600 }}>{size}</td>
                      <td style={TD}>{fmt(c.chest)}</td>
                      <td style={TD}>{fmt(c.shoulder)}</td>
                      <td style={TD}>{fmt(c.sleeve)}</td>
                      <td style={TD}>{fmt(c.length)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BOTTOMS CHART ────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Bottoms & Trousers — SNERA size chart</h2>
          <p className="speakable" style={BODY}>
            For SNERA bottoms, use your natural waist measurement as the primary reference.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 440 }}>
              <thead>
                <tr>
                  {['SNERA Size', 'Waist', 'Hips', 'Inseam'].map(h => (
                    <th key={h} style={TH}>{h} ({unit})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'XS',  waist:[26,27], hips:[34,35], inseam:[29,30] },
                  { size: 'S',   waist:[28,29], hips:[36,37], inseam:[30,31] },
                  { size: 'M',   waist:[30,31], hips:[38,39], inseam:[30,31] },
                  { size: 'L',   waist:[32,33], hips:[40,41], inseam:[31,32] },
                  { size: 'XL',  waist:[34,35], hips:[42,43], inseam:[31,32] },
                  { size: 'XXL', waist:[36,37], hips:[44,45], inseam:[32,33] },
                ].map(({ size, waist, hips, inseam }) => {
                  const c = unit === 'in'
                    ? { waist, hips, inseam }
                    : {
                        waist:  waist.map(v => Math.round(v * 2.54)),
                        hips:   hips.map(v => Math.round(v * 2.54)),
                        inseam: inseam.map(v => Math.round(v * 2.54)),
                      };
                  const fmt = ([a, b]) => `${a}–${b}`;
                  return (
                    <tr key={size} style={{ background: ['XS','M','XL'].includes(size) ? 'var(--off)' : 'transparent' }}>
                      <td style={{ ...TD, fontWeight: 600 }}>{size}</td>
                      <td style={TD}>{fmt(c.waist)}</td>
                      <td style={TD}>{fmt(c.hips)}</td>
                      <td style={TD}>{fmt(c.inseam)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FIT GUIDE ────────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>SNERA fit philosophy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Relaxed', desc: 'Our standard cut. Easy through the chest and body. Clean drape without being boxy. Suits most body types.' },
              { name: 'Slim Relaxed', desc: 'Slightly tapered at the waist and sleeve while maintaining a clean, non-restrictive silhouette.' },
              { name: 'Oversized', desc: 'Intentionally wide and long. Order your true size — the excess is the design.' },
            ].map(({ name, desc }) => (
              <div key={name} style={{ padding: '1.25rem', border: '1px solid var(--sand)' }}>
                <div style={{ fontSize: '.72rem', letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--ink)', marginBottom: '.5rem' }}>{name}</div>
                <p style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Size FAQ</h2>
          <div itemScope itemType="https://schema.org/FAQPage">
            {SIZE_FAQS.map(({ q, a }, i) => (
              <SizeFaqItem key={i} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(2.5rem,5vw,4rem) 0' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <p style={{ ...BODY, marginBottom: '1.5rem' }}>
            Still unsure about your size? Email <a href="mailto:contact@snera.in" style={{ color: 'var(--ink)', fontWeight: 500 }}>contact@snera.in</a> with your measurements and we'll recommend the right size.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn-dark">Shop SNERA Collection</Link>
            <Link to="/contact" className="btn btn-outline">Ask About Sizing</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SizeFaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid var(--sand)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
      >
        <span itemProp="name" style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.8, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ paddingBottom: '1.1rem' }}>
          <p itemProp="text" style={{ fontSize: '.82rem', color: 'var(--stone2)', lineHeight: 1.85, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}
