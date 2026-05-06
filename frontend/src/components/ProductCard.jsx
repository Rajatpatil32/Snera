import React from 'react';
import { useNavigate } from 'react-router-dom';
import { fmt, getImageUrl, BKGS } from '../utils/api';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const bg = BKGS[index % BKGS.length];

  const go = () => navigate(`/product/${product.slug}`);

  return (
    <article
      className="prod-card reveal"
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={go}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && go()}
      tabIndex={0}
      role="button"
      aria-label={`View ${product.name}`}
    >
      <div className="prod-card-img" style={{ background: bg }}>
        {product.images?.[0] ? (
          <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            loading="lazy"
            style={{ width:'100%', height:'100%', objectFit:'cover',
              transition:'transform .55s var(--ease)' }}
          />
        ) : (
          <div className="prod-card-inner">
            <span className="prod-glyph">{product.glyph || '◈'}</span>
          </div>
        )}

        {product.badge && (
          <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}

        <div className="prod-overlay">
          <button className="qv-btn" onClick={e => { e.stopPropagation(); go(); }}>
            Quick View
          </button>
        </div>
      </div>

      <div className="prod-cat">{product.category}</div>
      <div className="prod-name">{product.name}</div>
      <div className="prod-price-row">
        <span className="prod-price">{fmt(product.price)}</span>
        {product.comparePrice && (
          <span className="prod-price-was">{fmt(product.comparePrice)}</span>
        )}
      </div>
    </article>
  );
}
