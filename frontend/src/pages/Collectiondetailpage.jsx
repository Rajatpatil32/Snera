import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import API from '../utils/api';
import { getImageUrl, fmt } from '../utils/api';

export default function CollectionDetailPage() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    API.get(`/collections/slug/${slug}`)
      .then(r => setCollection(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader-ring"/>
    </div>
  );
  if (!collection) return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p>Collection not found.</p>
      <Link to="/shop" style={{ fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--ink)' }}>Back to Shop</Link>
    </div>
  );

  const seo = collection.seo || {};

  return (
    <>
      <Helmet>
        <title>{seo.metaTitle || collection.name} | SNERA</title>
        <meta name="description" content={seo.metaDescription || collection.description || `Shop the ${collection.name} collection at SNERA.`} />
        <meta property="og:title" content={seo.ogTitle || collection.name} />
        <meta property="og:description" content={seo.ogDescription || collection.description} />
        {(seo.ogImage || collection.image) && <meta property="og:image" content={seo.ogImage || collection.image} />}
        {seo.canonicalUrl && <link rel="canonical" href={seo.canonicalUrl} />}
      </Helmet>

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        {collection.image ? (
          <div style={{ height: 'clamp(200px,35vw,420px)', overflow: 'hidden', position: 'relative' }}>
            <img src={collection.image} alt={collection.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.5))',
              display: 'flex', alignItems: 'flex-end',
              padding: 'clamp(1.5rem,4vw,3rem)'
            }}>
              <div>
                {collection.icon && <span style={{ fontSize: '2rem', display: 'block', marginBottom: '.5rem' }}>{collection.icon}</span>}
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 300, color: '#fff', letterSpacing: '.04em' }}>{collection.name}</h1>
                {collection.description && <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', marginTop: '.5rem', maxWidth: 500 }}>{collection.description}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 'clamp(3rem,8vw,5rem) clamp(1.25rem,4vw,3rem)', textAlign: 'center', background: 'var(--off,#faf9f7)', borderBottom: '1px solid var(--sand,#e8e3db)' }}>
            {collection.icon && <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{collection.icon}</span>}
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300 }}>{collection.name}</h1>
            {collection.description && <p style={{ color: 'var(--stone2,#999)', maxWidth: 500, margin: '1rem auto 0', fontSize: '.9rem' }}>{collection.description}</p>}
          </div>
        )}

        {/* Products */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(1.5rem,4vw,3rem)' }}>
          {!collection.products?.length ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--stone2,#999)' }}>
              <p>No products in this collection yet.</p>
              <Link to="/shop" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--ink)', color: 'var(--ink)' }}>Browse Shop</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.5rem' }}>
              {collection.products.map(product => (
                <Link key={product._id} to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ aspectRatio: '3/4', overflow: 'hidden', marginBottom: '.75rem', background: 'var(--off,#faf9f7)' }}>
                    <img src={getImageUrl(product.images?.[0])} alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                  <p style={{ fontSize: '.78rem', letterSpacing: '.04em', marginBottom: '.25rem' }}>{product.name}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--stone2,#999)' }}>{fmt(product.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}