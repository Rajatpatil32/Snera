import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmt, getImageUrl, BKGS } from '../utils/api';

export default function ProductCard({ product, index = 0, showFlip = false }) {
  const navigate = useNavigate();
  const bg = BKGS[index % BKGS.length];

  // ── Colour state ────────────────────────────────────────────────────────────
  // Design-mode products bake one composite per colour server-side; present
  // them through the same shape colorGroups already uses here.
  const colorGroups = product.colorGroups?.length
    ? product.colorGroups
    : (product.designMode && product.designColors?.length
        ? product.designColors.map(c => ({ name: c.name, hex: c.hex, images: c.image ? [c.image] : [], isDefault: c.isDefault }))
        : []);
  const hasGroups = colorGroups.length > 0;
  const defaultIdx = hasGroups
    ? Math.max(0, colorGroups.findIndex(g => g.isDefault))
    : 0;

  const [activeColour, setActiveColour] = useState(defaultIdx);
  const [imgIdx, setImgIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Active group data
  const activeGroup = hasGroups ? colorGroups[activeColour] : null;
  const images = activeGroup?.images?.length
    ? activeGroup.images
    : product.images || [];

  const primaryImage = images[imgIdx] || images[0] || null;
  const secondaryImage = images[1] || null; // back / hover image

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
   background: `
  radial-gradient(circle at top, rgba(255,255,255,0.45), transparent 60%),
  linear-gradient(145deg, #ffffff 0%, #ffffff 100%)
`,
    perspective: '1000px',
    overflow: 'hidden',
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
                transition: 'all .7s ease-in-out',
                filter: flipped ? 'brightness(.92)' : 'brightness(1)',
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
                transition: 'all .7s ease-in-out',
                filter: flipped ? 'brightness(1.08)' : 'brightness(.95)',
                opacity: flipped ? 1 : 0,
                transform: flipped ? 'scale(1.08)' : 'scale(1)',
              }}
            />
          </div>
        ) : (
          /* Normal (no flip) rendering — used on detail page & cards with no secondary image */
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
              <span className="prod-glyph">{product.glyph || '◈'}</span>
            </div>
          )
        )}

        {/* Badge */}
        {product.badge && (
          <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}

        {/* Quick view overlay */}
        <div className="prod-overlay">
          <button className="qv-btn" onClick={e => { e.stopPropagation(); go(); }}>Quick View</button>
        </div>
      </div>

      {/* ── Info row ── */}
      <div style={{ paddingTop: '.65rem' }}>
        <div className="prod-cat">{product.category}</div>
        <div className="prod-name">{product.name}</div>

        {/* Colour swatches — only shown if product has multiple colour groups */}
        {hasGroups && colorGroups.length > 1 && (
          <div
            style={{ display: 'flex', gap: '.38rem', alignItems: 'center', marginBottom: '.42rem', flexWrap: 'wrap' }}
            onClick={e => e.stopPropagation()} // prevent card nav when clicking swatch
          >
            {colorGroups.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={e => switchColour(e, i)}
                title={g.name}
                aria-label={`${g.name}${activeColour === i ? ' (selected)' : ''}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: g.hex,
                  border: activeColour === i
                    ? '2px solid var(--ink)'
                    : '1.5px solid rgba(0,0,0,.18)',
                  cursor: 'pointer',
                  transition: 'transform .15s, border-color .15s',
                  transform: activeColour === i ? 'scale(1.22)' : 'scale(1)',
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            ))}
            {/* Active colour name */}
            <span style={{ fontSize: '.58rem', color: 'var(--stone)', letterSpacing: '.06em', marginLeft: '.1rem' }}>
              {colorGroups[activeColour]?.name}
            </span>
          </div>
        )}

        {/* Single colour name label */}
        {hasGroups && colorGroups.length === 1 && (
          <div style={{ fontSize: '.6rem', color: 'var(--stone)', letterSpacing: '.08em', marginBottom: '.35rem' }}>
            {colorGroups[0].name}
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