import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';

/**
 * AboutPage — /about
 *
 * This page exists primarily to give Google a clear, crawlable, text-rich
 * page that unambiguously associates the entity "SNERA" with:
 *   - snera.in (the official website)
 *   - a fashion brand (not SNERA Infotech, SNERA Build Craft, etc.)
 *   - India
 *   - Instagram: instagram.com/snera.store
 *
 * Every heading and paragraph on this page is written to reinforce
 * those entity signals. Do not make this page generic.
 */

export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const schemas = useSEO({
    type: 'webpage',
    webPageType: 'AboutPage',
    pageUrl: '/about',
    pageName: 'About SNERA | Indian Fashion Brand — snera.in',
    pageDescription: 'SNERA is an Indian fashion brand founded in 2026. We design and sell premium minimal essentials for men and women exclusively at snera.in.',
    datePublished: '2026-01-01',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'About SNERA', url: '/about' },
    ],
  });

  return (
    <>
      <SEOHead
        title="About SNERA | Indian Fashion Brand — snera.in"
        description="SNERA is an Indian fashion brand founded in 2026. We design and sell premium minimal essentials for men and women exclusively at snera.in."
        url="https://snera.in/about"
        schemas={schemas}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 'calc(var(--nav-h) + clamp(3rem,6vw,5rem))',
        paddingBottom: 'clamp(3rem,6vw,5rem)',
        borderBottom: '1px solid var(--sand)',
      }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <span className="label" style={{ marginBottom: '.75rem', display: 'block' }}>About Us</span>
          <h1 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1,
            letterSpacing: '-.02em', marginBottom: '1.5rem',
          }}>
            SNERA is an Indian fashion brand.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>This is our story.</em>
          </h1>
          <p style={{ fontSize: '.9rem', color: 'var(--stone2)', lineHeight: 1.85, maxWidth: '55ch' }}>
            SNERA (snera.in) is a premium minimal fashion brand founded in India in 2026.
            We design and sell essentials for men and women — clothing that is quiet in
            appearance but deliberate in craft. Every SNERA product is made to last,
            not to trend.
          </p>
        </div>
      </section>

      {/* ── WHAT IS SNERA ────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0', borderBottom: '1px solid var(--sand)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', letterSpacing: '-.01em',
            marginBottom: '1.25rem',
          }}>
            What is SNERA?
          </h2>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>SNERA is an Indian fashion brand</strong> — not
            a tech company, not a construction firm, not a boutique by another name.
            SNERA designs and sells clothing: tops, bottoms, outerwear, and accessories for
            men and women across India.
          </p>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' }}>
            The official SNERA website is <a href="https://snera.in" style={{ color: 'var(--ink)', fontWeight: 500 }}>snera.in</a>.
            All SNERA products are available exclusively at snera.in. SNERA does not
            operate physical retail stores.
          </p>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85 }}>
            SNERA on Instagram:{' '}
            <a
              href="https://www.instagram.com/snera.store/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ink)', fontWeight: 500 }}
            >
              @snera.store
            </a>
          </p>
        </div>
      </section>

      {/* ── THE BRAND ────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0', borderBottom: '1px solid var(--sand)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', letterSpacing: '-.01em',
            marginBottom: '1.25rem',
          }}>
            The SNERA philosophy
          </h2>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' }}>
            SNERA was built on one idea: that the quietest statement is often the loudest.
            We don't design for trends. We design wardrobe pillars — pieces that exist across
            seasons and outlast the impulse that bought them.
          </p>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85, marginBottom: '1rem' }}>
            Every SNERA garment is sourced from premium fabrics and cut with intentional
            simplicity. Minimal detailing. Clean lines. Consistent fit. These are the
            principles that define every piece in the SNERA collection.
          </p>
          <p style={{ fontSize: '.88rem', color: 'var(--stone2)', lineHeight: 1.85 }}>
            <em>"Wear less. Mean more."</em> — SNERA
          </p>
        </div>
      </section>

      {/* ── QUICK FACTS ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0', borderBottom: '1px solid var(--sand)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(1.5rem,3.5vw,2.4rem)', letterSpacing: '-.01em',
            marginBottom: '2rem',
          }}>
            SNERA at a glance
          </h2>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="about-dl">
            {[
              ['Brand name', 'SNERA'],
              ['Type', 'Indian fashion brand'],
              ['Founded', '2026'],
              ['Country', 'India'],
              ['Official website', 'snera.in'],
              ['Instagram', '@snera.store'],
              ['Products', 'Tops, Bottoms, Outerwear, Accessories'],
              ['Ships to', 'All of India'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '1.25rem', border: '1px solid var(--sand)' }}>
                <dt style={{ fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.4rem', fontWeight: 500 }}>{k}</dt>
                <dd style={{ fontSize: '.88rem', color: 'var(--ink)', fontWeight: 500, margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 0' }}>
        <div className="container" style={{ maxWidth: 760, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn btn-dark">Shop SNERA Collection</Link>
          <Link to="/contact" className="btn btn-outline">Contact SNERA</Link>
        </div>
      </section>

      <style>{`
        .about-dl { @media(max-width:600px) { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
