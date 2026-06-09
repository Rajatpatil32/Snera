import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/**
 * NotFoundPage — 404 with noindex to prevent crawl waste.
 * Linked from App.jsx as the catch-all route instead of redirect.
 * A real 404 page (not a redirect) is better for SEO:
 *  - signals to Google the URL doesn't exist
 *  - reduces crawl budget waste from redirect chains
 *  - preserves link equity on the canonical pages
 */
export default function NotFoundPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Helmet>
        <title>Page Not Found | SNERA</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="This page could not be found. Browse the SNERA collection." />
      </Helmet>

      <div style={{
        minHeight: '100vh',
        paddingTop: 'var(--nav-h)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 2rem',
        background: 'var(--white)',
      }}>
        <span style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(4rem, 15vw, 10rem)',
          fontWeight: 300,
          color: 'rgba(28,27,24,.07)',
          lineHeight: 1,
          marginBottom: '1rem',
          display: 'block',
        }}>404</span>

        <span className="label" style={{ marginBottom: '1rem' }}>Page Not Found</span>

        <h1 style={{
          fontFamily: 'var(--serif)',
          fontWeight: 300,
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          letterSpacing: '-.01em',
          marginBottom: '1.25rem',
          lineHeight: 1.2,
        }}>
          This page doesn't exist
        </h1>

        <p style={{
          fontSize: '.85rem',
          color: 'var(--stone2)',
          lineHeight: 1.8,
          maxWidth: '40ch',
          marginBottom: '2.5rem',
        }}>
          The page you're looking for has moved or never existed. Head back to the shop.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-dark">Browse Collection</Link>
          <Link to="/" className="btn btn-outline">Go Home</Link>
        </div>
      </div>
    </>
  );
}