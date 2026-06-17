import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';

const SECTION = { padding: 'clamp(2.5rem,5vw,4rem) 0', borderBottom: '1px solid var(--sand)' };
const H2 = { fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-.01em', marginBottom: '1.5rem' };
const BODY = { fontSize: '.86rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' };

const CARE_FAQS = [
  { q: 'How do I wash SNERA clothes?', a: 'Most SNERA garments should be washed in cold water on a gentle or delicate machine cycle. Turn the garment inside out before washing. For best results, use a mild detergent without bleach.' },
  { q: 'Can I put SNERA clothes in the dryer?', a: 'Avoid tumble drying SNERA garments. High heat shrinks fabric and breaks down fibre integrity. Lay flat or hang dry in shade.' },
  { q: 'How do I remove wrinkles from SNERA clothes?', a: 'Use a steam iron or garment steamer on a low setting. Do not iron directly on prints or embroidered details. Place a thin cloth between the iron and the garment.' },
  { q: 'How do I store SNERA clothes?', a: 'Store folded in a cool, dry place away from direct sunlight. For outerwear, use padded hangers to maintain shoulder shape. Avoid cramped storage that creases fabric permanently.' },
  { q: 'Do SNERA clothes shrink after washing?', a: 'SNERA garments are pre-washed where applicable to minimise shrinkage. Cold wash and air dry maintain original fit. Hot water or machine drying may cause slight shrinkage.' },
  { q: 'How do I care for SNERA cotton garments?', a: 'Machine wash cold, gentle cycle. Mild detergent. No bleach. Tumble dry low or air dry flat. Iron on medium heat inside out.' },
  { q: 'How do I care for SNERA linen garments?', a: 'Hand wash or machine wash cold on delicate. Lay flat to dry — linen loses shape when hung wet. Iron while slightly damp for best results. Linen softens with each wash.' },
  { q: 'Can I dry clean SNERA clothes?', a: 'Dry cleaning is safe for most SNERA outerwear and structured garments. Check the individual care label before dry cleaning knits or delicate fabrics.' },
];

const careSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://snera.in/care-guide#faq',
  mainEntity: CARE_FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const FABRICS = [
  {
    name: 'Premium Cotton',
    wash: 'Cold, gentle cycle',
    dry: 'Air dry flat',
    iron: 'Medium heat, inside out',
    notes: 'Most common SNERA fabric. Durable, breathable, minimal care.',
  },
  {
    name: 'Linen Blend',
    wash: 'Cold, delicate or hand wash',
    dry: 'Lay flat to dry',
    iron: 'Medium heat while slightly damp',
    notes: 'Softens and improves with each wash.',
  },
  {
    name: 'Viscose / Rayon',
    wash: 'Hand wash cold',
    dry: 'Hang dry, no direct sun',
    iron: 'Low heat, steam preferred',
    notes: 'Do not wring. Handle gently when wet.',
  },
  {
    name: 'Cotton-Polyester Blend',
    wash: 'Cold, gentle cycle',
    dry: 'Air dry or tumble dry low',
    iron: 'Low to medium heat',
    notes: 'Wrinkle-resistant. Quick drying.',
  },
];

export default function CareGuidePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const schemas = useSEO({
    type: 'webpage',
    pageUrl: '/care-guide',
    pageName: 'SNERA Care Guide — How to Wash and Care for SNERA Clothes',
    pageDescription: 'Official SNERA care guide. How to wash, dry, iron and store SNERA garments by fabric type. Keep your SNERA clothes looking new.',
    datePublished: '2026-01-01',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Care Guide', url: '/care-guide' },
    ],
  });

  return (
    <>
      <SEOHead
        title="SNERA Care Guide | How to Wash & Care for SNERA Clothes"
        description="Official SNERA care guide. How to wash, dry, iron and store SNERA garments by fabric type. Keep your SNERA clothes looking new."
        url="https://snera.in/care-guide"
        schemas={[...schemas, careSchema]}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 'calc(var(--nav-h) + clamp(3rem,6vw,5rem))', paddingBottom: 'clamp(2.5rem,5vw,4rem)', borderBottom: '1px solid var(--sand)' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <span className="label" style={{ marginBottom: '.75rem', display: 'block' }}>Fabric Care</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: '1.25rem' }}>
            SNERA Care Guide
          </h1>
          <p style={{ ...BODY, maxWidth: '55ch', marginBottom: 0 }}>
            How to wash, dry, iron, and store SNERA garments so they retain shape, colour, and fabric integrity wash after wash.
          </p>
        </div>
      </section>

      {/* ── GOLDEN RULES ─────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>5 rules for every SNERA garment</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              ['01', 'Cold water only', 'Never wash in hot water. Cold wash preserves colour, prevents shrinkage, and is gentler on fabric.'],
              ['02', 'Turn inside out', 'Protects surface texture and colour from friction and fading during machine wash.'],
              ['03', 'No tumble drying', 'Air dry all SNERA garments. Heat destroys fabric structure and causes permanent shrinkage.'],
              ['04', 'Dry in shade', 'Direct sunlight fades colour, especially in dark and saturated tones.'],
              ['05', 'Read the label', 'Each SNERA garment has a care label. When in doubt, follow that over general guidance.'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ padding: '1.25rem', border: '1px solid var(--sand)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 300, color: 'rgba(28,27,24,.12)', marginBottom: '.35rem' }}>{num}</div>
                <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink)', marginBottom: '.5rem' }}>{title}</div>
                <p style={{ fontSize: '.8rem', color: 'var(--stone2)', lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BY FABRIC ────────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Care by fabric type</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr>
                  {['Fabric', 'Wash', 'Dry', 'Iron', 'Notes'].map(h => (
                    <th key={h} style={{
                      fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase',
                      fontWeight: 600, color: 'var(--stone)', padding: '.75rem 1rem',
                      borderBottom: '1px solid var(--sand)', textAlign: 'left',
                      background: 'var(--off)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FABRICS.map((f, i) => (
                  <tr key={f.name} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--off)' }}>
                    <td style={{ fontSize: '.82rem', color: 'var(--ink)', fontWeight: 600, padding: '.8rem 1rem', borderBottom: '1px solid var(--sand)', whiteSpace: 'nowrap' }}>{f.name}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--stone2)', padding: '.8rem 1rem', borderBottom: '1px solid var(--sand)' }}>{f.wash}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--stone2)', padding: '.8rem 1rem', borderBottom: '1px solid var(--sand)' }}>{f.dry}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--stone2)', padding: '.8rem 1rem', borderBottom: '1px solid var(--sand)' }}>{f.iron}</td>
                    <td style={{ fontSize: '.78rem', color: 'var(--stone2)', padding: '.8rem 1rem', borderBottom: '1px solid var(--sand)' }}>{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── STAIN REMOVAL ────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Stain removal</h2>
          <p style={BODY}>Act immediately. The longer a stain sets, the harder it is to remove.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { type: 'Food & grease', method: 'Blot (do not rub) immediately with a clean cloth. Apply a small amount of dish soap directly to the stain. Leave 5 minutes. Rinse with cold water. Machine wash cold.' },
              { type: 'Sweat', method: 'Soak in cold water with white vinegar (1:4 ratio) for 30 minutes before washing. Avoid hot water — heat sets sweat stains permanently.' },
              { type: 'Ink', method: 'Apply rubbing alcohol to the stain with a cotton ball, blotting gently. Rinse with cold water. Do not rub.' },
              { type: 'Mud or dirt', method: 'Let it dry completely. Brush off dry mud. Then soak in cold water before machine washing. Never rub wet mud — it spreads the stain.' },
            ].map(({ type, method }) => (
              <div key={type} style={{ padding: '1.25rem', border: '1px solid var(--sand)' }}>
                <div style={{ fontSize: '.72rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--ink)', marginBottom: '.5rem' }}>{type}</div>
                <p style={{ fontSize: '.8rem', color: 'var(--stone2)', lineHeight: 1.75, margin: 0 }}>{method}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={SECTION}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={H2}>Care FAQ</h2>
          <div itemScope itemType="https://schema.org/FAQPage">
            {CARE_FAQS.map(({ q, a }, i) => (
              <CareFaqItem key={i} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(2.5rem,5vw,4rem) 0' }}>
        <div className="container" style={{ maxWidth: 860, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn btn-dark">Shop SNERA Collection</Link>
          <Link to="/size-guide" className="btn btn-outline">View Size Guide</Link>
        </div>
      </section>
    </>
  );
}

function CareFaqItem({ q, a }) {
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
