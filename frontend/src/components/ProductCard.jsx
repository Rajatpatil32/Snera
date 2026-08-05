import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmt, getImageUrl, BKGS } from '../utils/api';

export default function ProductCard({ product, index = 0, showFlip = false }) {
  const navigate = useNavigate();

  // ── Colour state ────────────────────────────────────────────────────────────
  const hasGroups = product.colorGroups?.length > 0;
  const defaultIdx = hasGroups
    ? Math.max(0, product.colorGroups.findIndex(g => g.isDefault))
    : 0;

  const [activeColour, setActiveColour] = useState(defaultIdx);
  const [imgIdx, setImgIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Active group data
  const activeGroup = hasGroups ? product.colorGroups[activeColour] : null;
  const images = activeGroup?.images?.length
    ? activeGroup.images
    : product.images || [];

  const primaryImage = images[imgIdx] || images[0] || null;
  const secondaryImage = images[1] || null;

  const switchColour = useCallback((e, i) => {
    e.stopPropagation();
    setActiveColour(i);
    setImgIdx(0);
    setFlipped(false);
  }, []);

  const go = () => {
    const query = hasGroups ? `?colour=${activeColour}` : '';
    navigate(`/product/${product.slug}${query}`);
  };

  const handleMouseEnter = () => { if (showFlip && secondaryImage) setFlipped(true); };
  const handleMouseLeave = () => { if (showFlip) setFlipped(false); };

  return (
    <article
      className="prod-card reveal"
      onClick={go}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && go()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => {
        if (showFlip && secondaryImage) setFlipped(true);
      }}
      onTouchEnd={() => {
        if (showFlip) setFlipped(false);
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${product.name}`}
    >
      {/* ── Image area ── */}
      <div
        className="prod-card-img"
        style={{
          background: 'linear-gradient(135deg, rgba(108,92,231,.05) 0%, rgba(232,67,147,.03) 100%)',
          perspective: '1000px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Flip wrapper — only mounted when showFlip + secondaryImage exist */}
        {showFlip && secondaryImage ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* First Image */}
            <img
              src={getImageUrl(primaryImage)}
              alt={`${product.name}${activeGroup ? ` — ${activeGroup.name}` : ''}`}
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all .6s var(--ease)',
                filter: flipped ? 'brightness(.94)' : 'brightness(1)',
                opacity: flipped ? 0 : 1,
                transform: flipped ? 'scale(1.08)' : 'scale(1)',
              }}
            />

            {/* Second Image */}
            <img
              src={getImageUrl(secondaryImage)}
              alt={`${product.name} — back view`}
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all .6s var(--ease)',
                filter: flipped ? 'brightness(1.04)' : 'brightness(.94)',
                opacity: flipped ? 1 : 0,
                transform: flipped ? 'scale(1.08)' : 'scale(1)',
              }}
            />
          </div>
        ) : (
          primaryImage ? (
            <img
              src={getImageUrl(primaryImage)}
              alt={`${product.name}${activeGroup ? ` — ${activeGroup.name}` : ''}`}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .55s var(--ease)' }}
            />
          ) : (
            <div className="prod-card-inner">
              <span className="prod-glyph">👕</span>
            </div>
          )
        )}

        {/* Badge */}
        {product.badge ? (
          <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        ) : (
          <span className="prod-badge" style={{ background: 'var(--gradient)', color: '#fff' }}>
            220 GSM
          </span>
        )}

        {/* Quick view overlay */}
        <div className="prod-overlay">
          <button className="qv-btn" onClick={e => { e.stopPropagation(); go(); }}>
            Customise & View
          </button>
        </div>
      </div>

      {/* ── Info row ── */}
      <div style={{ paddingTop: '.75rem' }}>
        <div className="prod-cat">{product.category || 'Custom Tee'}</div>
        <div className="prod-name">{product.name}</div>

        {/* Colour swatches */}
        {hasGroups && product.colorGroups.length > 1 && (
          <div
            style={{ display: 'flex', gap: '.4rem', alignItems: 'center', marginBottom: '.45rem', flexWrap: 'wrap' }}
            onClick={e => e.stopPropagation()}
          >
            {product.colorGroups.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={e => switchColour(e, i)}
                title={g.name}
                aria-label={`${g.name}${activeColour === i ? ' (selected)' : ''}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: g.hex,
                  border: activeColour === i
                    ? '2px solid var(--accent)'
                    : '1.5px solid rgba(0,0,0,.15)',
                  boxShadow: activeColour === i ? '0 0 0 2px rgba(108,92,231,.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'transform .2s var(--ease-spring), border-color .15s',
                  transform: activeColour === i ? 'scale(1.25)' : 'scale(1)',
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            ))}
            <span style={{ fontSize: '.6rem', color: 'var(--stone)', letterSpacing: '.04em', marginLeft: '.2rem', fontWeight: 500 }}>
              {product.colorGroups[activeColour]?.name}
            </span>
          </div>
        )}

        {hasGroups && product.colorGroups.length === 1 && (
          <div style={{ fontSize: '.62rem', color: 'var(--stone)', letterSpacing: '.06em', marginBottom: '.35rem', fontWeight: 500 }}>
            {product.colorGroups[0].name}
          </div>
        )}

        <div className="prod-price-row">
          <span className="prod-price">{fmt(product.price)}</span>
          {product.comparePrice && (
            <span className="prod-price-was">{fmt(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}