import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmt, getImageUrl, BKGS } from '../utils/api';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const bg = BKGS[index % BKGS.length];

  // ── Colour state ────────────────────────────────────────────────────────────
  // Determine active colour group index
  const hasGroups = product.colorGroups?.length > 0;
  const defaultIdx = hasGroups
    ? Math.max(0, product.colorGroups.findIndex(g => g.isDefault))
    : 0;

  const [activeColour, setActiveColour] = useState(defaultIdx);
  const [imgIdx,       setImgIdx]       = useState(0); // current image within colour group

  // Active group data
  const activeGroup = hasGroups ? product.colorGroups[activeColour] : null;
  const images      = activeGroup?.images?.length
    ? activeGroup.images
    : product.images || [];

  const primaryImage = images[imgIdx] || images[0] || null;

  // Switch colour: reset to first image of that group
  const switchColour = useCallback((e, i) => {
    e.stopPropagation();
    setActiveColour(i);
    setImgIdx(0);
  }, []);

  const go = () => {
    // Pass active colour as query param so detail page can pre-select it
    const query = hasGroups ? `?colour=${activeColour}` : '';
    navigate(`/product/${product.slug}${query}`);
  };

  return (
    <article
      className="prod-card reveal"
      onClick={go}
      onKeyDown={e => (e.key==='Enter'||e.key===' ') && go()}
      tabIndex={0}
      role="button"
      aria-label={`View ${product.name}`}
    >
      {/* ── Image area ── */}
      <div className="prod-card-img" style={{ background: bg }}>
        {primaryImage ? (
          <img
            src={getImageUrl(primaryImage)}
            alt={`${product.name}${activeGroup ? ` — ${activeGroup.name}` : ''}`}
            loading="lazy"
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .55s var(--ease)' }}
          />
        ) : (
          <div className="prod-card-inner">
            <span className="prod-glyph">{product.glyph || '◈'}</span>
          </div>
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
      <div style={{ paddingTop:'.65rem' }}>
        <div className="prod-cat">{product.category}</div>
        <div className="prod-name">{product.name}</div>

        {/* Colour swatches — only shown if product has multiple colour groups */}
        {hasGroups && product.colorGroups.length > 1 && (
          <div
            style={{ display:'flex', gap:'.38rem', alignItems:'center', marginBottom:'.42rem', flexWrap:'wrap' }}
            onClick={e => e.stopPropagation()} // prevent card nav when clicking swatch
          >
            {product.colorGroups.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={e => switchColour(e, i)}
                title={g.name}
                aria-label={`${g.name}${activeColour===i?' (selected)':''}`}
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
            <span style={{ fontSize:'.58rem', color:'var(--stone)', letterSpacing:'.06em', marginLeft:'.1rem' }}>
              {product.colorGroups[activeColour]?.name}
            </span>
          </div>
      )}

        {/* Single colour name label */}
        {hasGroups && product.colorGroups.length === 1 && (
          <div style={{ fontSize:'.6rem', color:'var(--stone)', letterSpacing:'.08em', marginBottom:'.35rem' }}>
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