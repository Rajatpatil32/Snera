import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import useSEO from '../hooks/useseo';
import NotFoundPage from './NotFoundPage';
import { SEO_PAGES, SEO_GROUPS } from '../data/seoPages';

const SITE = 'https://snera.in';
const WA_NUMBER = '919826992021';

// FAQs that are true for every page (match the site FAQ / Shipping Policy)
const SHARED_FAQS = [
  ['How long does delivery take?', 'Your order is printed and dispatched within 24–48 hours and reaches you in 5–7 business days anywhere in India.'],
  ['Can I see a preview before you print?', 'Yes. We share a digital preview on WhatsApp and print only after you approve it.'],
];

export default function SeoLandingPage() {
  const { slug } = useParams();
  const page = slug ? SEO_PAGES.find(p => p.slug === slug) : null;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const url = slug ? `/custom/${slug}` : '/custom';
  const hubTitle = 'Custom T-Shirt Printing in India — On Demand | SNERA';
  const hubDesc = 'Custom and on-demand t-shirt printing in India: t-shirts, hoodies, mugs and more for groups, events, brands and gifts. No minimum order. Free shipping above ₹999.';
  const name = page ? page.title : hubTitle;
  const desc = page ? page.desc : hubDesc;

  const schemas = useSEO({
    type: 'webpage',
    pageUrl: url,
    pageName: name,
    pageDescription: desc,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Custom Printing', url: '/custom' },
      ...(page ? [{ name: page.h1, url }] : []),
    ],
  });

  if (slug && !page) return <NotFoundPage />;

  if (page) {
    const faqs = [...page.faqs, ...SHARED_FAQS];
    schemas.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
    schemas.push({
      '@context': 'https://schema.org', '@type': 'Service',
      name: page.h1, description: page.desc, serviceType: 'Custom t-shirt printing',
      provider: { '@id': `${SITE}/#organization` }, areaServed: { '@type': 'Country', name: 'India' },
      url: `${SITE}${url}`,
    });
  }

  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const card = { border: '1px solid var(--sand)', background: 'var(--white)', padding: '1.25rem 1.4rem', borderRadius: 'var(--radius)' };

  return (
    <>
      <SEOHead title={name} description={desc} url={`${SITE}${url}`} schemas={schemas} />
      <div style={{ background: 'var(--white)', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>

        {/* Header */}
        <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--sand)', padding: 'clamp(3rem,6vw,5rem) 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <nav aria-label="Breadcrumb" style={{ fontSize: '.72rem', color: 'var(--stone)', marginBottom: '1rem' }}>
              <Link to="/">Home</Link> / <Link to="/custom">Custom Printing</Link>{page && <> / <span>{page.h1}</span></>}
            </nav>
            <h1 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 'clamp(1.8rem,4.2vw,3rem)', lineHeight: 1.12, marginBottom: '1rem' }}>
              {page ? page.h1 : 'Custom & On-Demand T-Shirt Printing in India'}
            </h1>
            <p className="speakable" style={{ fontSize: '1rem', color: 'var(--stone2)', lineHeight: 1.8, maxWidth: 720 }}>
              {page ? page.intro : 'SNERA prints t-shirts, hoodies and gifts only after you order them. Pick a use below, or describe your idea and we will turn it into a print-ready design. No minimum order, 220 GSM cotton, delivered across India in 5–7 business days.'}
            </p>
            <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', marginTop: '1.6rem' }}>
              <a href="/#concept" className="btn btn-gradient">Start your design</a>
              <a href={waLink(page ? `Hi SNERA, I want to order: ${page.h1}` : 'Hi SNERA, I want to order custom t-shirts')}
                 target="_blank" rel="noopener noreferrer" className="btn btn-outline">Order on WhatsApp</a>
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 900, padding: 'clamp(2.5rem,5vw,4rem) clamp(1.25rem,4vw,3rem)' }}>

          {page ? (
            <>
              <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>What you get</h2>
              <ul style={{ display: 'grid', gap: '.7rem', marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                {page.points.map(pt => <li key={pt} style={card}>✓ {pt}</li>)}
              </ul>

              <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>How it works</h2>
              <ol style={{ display: 'grid', gap: '.7rem', marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', counterReset: 'step' }}>
                {['Share your idea, text or artwork', 'Approve the digital preview on WhatsApp', 'We print on 220 GSM cotton and dispatch in 24–48 hours', 'Delivered across India in 5–7 business days'].map((t, i) => (
                  <li key={t} style={card}><strong style={{ color: 'var(--accent)' }}>{i + 1}.</strong> {t}</li>
                ))}
              </ol>

              <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>Frequently asked questions</h2>
              <div style={{ display: 'grid', gap: '.8rem', marginBottom: '3rem' }}>
                {faqs.map(([q, a]) => (
                  <div key={q} style={card}>
                    <h3 style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.95rem', marginBottom: '.4rem' }}>{q}</h3>
                    <p style={{ fontSize: '.86rem', color: 'var(--stone2)', lineHeight: 1.75 }}>{a}</p>
                  </div>
                ))}
              </div>

              <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>Related</h2>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                {page.related.map(r => {
                  const rp = SEO_PAGES.find(p => p.slug === r);
                  return rp && <Link key={r} to={`/custom/${r}`} className="btn btn-outline" style={{ fontSize: '.75rem' }}>{rp.h1}</Link>;
                })}
                <Link to="/custom" className="btn btn-outline" style={{ fontSize: '.75rem' }}>All custom printing</Link>
              </div>
            </>
          ) : (
            SEO_GROUPS.map(([g, label]) => (
              <section key={g} style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1rem' }}>{label}</h2>
                <ul style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
                  {SEO_PAGES.filter(p => p.group === g).map(p => (
                    <li key={p.slug}><Link to={`/custom/${p.slug}`} style={{ ...card, display: 'block', fontSize: '.88rem', fontWeight: 500 }}>{p.h1}</Link></li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}