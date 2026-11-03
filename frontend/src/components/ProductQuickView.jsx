import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { fmt, getImageUrl } from '../utils/api';
import { useCart } from '../context/CartContext';

export default function ProductQuickView({ product, initialColour = 0, onClose }) {
  const { dispatch, toast } = useCart();

  // Design-mode products expose colours via designColors — same mapping as ProductDetailPage
  const colorGroups = product.colorGroups?.length
    ? product.colorGroups
    : (product.designMode && product.designColors?.length
        ? product.designColors.map(c => ({
            name: c.name, hex: c.hex, images: c.image ? [c.image] : [],
            soldSizes: c.soldSizes || [], isDefault: c.isDefault,
          }))
        : []);
  const hasGroups = colorGroups.length > 0;

  const [activeColour, setActiveColour] = useState(Math.min(initialColour, Math.max(colorGroups.length - 1, 0)));
  const [activeImg, setActiveImg] = useState(0);
  const [selSize, setSelSize] = useState('');
  const [qty, setQty] = useState(1);

  const activeGroup = hasGroups ? colorGroups[activeColour] : null;
  const images = activeGroup?.images?.length ? activeGroup.images : product.images || [];
  const soldSizes = activeGroup?.soldSizes?.length ? activeGroup.soldSizes : product.soldSizes || [];
  const isSold = sz => soldSizes.includes(sz);
  const requiresSize = (product.sizes || []).length > 0;
  const sizeExtra = sz => (product.sizePricing || []).find(sp => sp.size === sz)?.extraPrice || 0;
  const finalPrice = product.price + sizeExtra(selSize);
  const finalCompare = product.comparePrice ? product.comparePrice + sizeExtra(selSize) : null;

  // Pre-select first available size whenever the colour changes
  useEffect(() => {
    setSelSize((product.sizes || []).find(s => !soldSizes.includes(s)) || '');
    setActiveImg(0);
    // eslint-disable-next-line
  }, [activeColour]);

  // Esc to close + lock page scroll while open
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const addToCart = () => {
    if (requiresSize && !selSize) return;
    dispatch({
      type: 'ADD',
      payload: {
        product: { ...product, images: images.length ? images : product.images },
        size: requiresSize ? selSize : null,
        qty,
        price: finalPrice,
        colour: activeGroup ? { name: activeGroup.name, hex: activeGroup.hex, image: images[0] } : undefined,
      },
    });
    toast(`${product.name}${activeGroup ? ` (${activeGroup.name})` : ''} added`);
    onClose();
    dispatch({ type: 'OPEN' });
  };

  const label = { fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone)' };

  return createPortal(
    <div className="qvm-backdrop" onClick={onClose}>
      <div className="qvm" role="dialog" aria-modal="true" aria-label={product.name} onClick={e => e.stopPropagation()}>
        <button type="button" className="qvm-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Images */}
        <div className="qvm-media">
          <div className="qvm-main">
            {images[activeImg]
              ? <img key={images[activeImg]} src={getImageUrl(images[activeImg])} alt={product.name} className="qvm-img" />
              : <span style={{ fontSize: '6rem', color: 'rgba(28,27,24,.08)' }}>{product.glyph || '◈'}</span>}
            {product.badge && (
              <span className={`prod-badge prod-badge-${product.badge.toLowerCase()}`} style={{ position: 'absolute', top: '1rem', left: '1rem' }}>{product.badge}</span>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setActiveImg(i)} style={{
                  width: 54, height: 72, padding: 0, overflow: 'hidden', background: 'none', cursor: 'pointer',
                  border: `1px solid ${i === activeImg ? 'var(--ink)' : 'var(--sand)'}`,
                }}>
                  <img src={getImageUrl(img)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="qvm-info">
          <div style={label}>{product.category}{product.gender ? ` · ${product.gender}` : ''}</div>
          <h2 style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 'clamp(1.3rem,2.4vw,1.8rem)', lineHeight: 1.2, margin: '.4rem 0 .8rem' }}>{product.name}</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{fmt(finalPrice)}</span>
            {finalCompare && <span style={{ fontSize: '.9rem', color: 'var(--stone)', textDecoration: 'line-through' }}>{fmt(finalCompare)}</span>}
            {finalCompare && (
              <span style={{ fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600, padding: '.2rem .55rem', background: 'var(--accent)', color: 'var(--white)', borderRadius: 4 }}>
                {Math.round((1 - finalPrice / finalCompare) * 100)}% off
              </span>
            )}
          </div>

          {product.description && (
            <p style={{ fontSize: '.84rem', color: 'var(--stone2)', lineHeight: 1.75, marginBottom: '1.2rem' }}>{product.description}</p>
          )}

          {hasGroups && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ ...label, marginBottom: '.55rem' }}>Colour · <span style={{ color: 'var(--ink)', letterSpacing: '.04em', textTransform: 'none', fontSize: '.78rem' }}>{activeGroup?.name}</span></div>
              <div style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap' }}>
                {colorGroups.map((g, i) => (
                  <button key={i} type="button" onClick={() => setActiveColour(i)} title={g.name} aria-label={g.name} style={{
                    width: 26, height: 26, borderRadius: '50%', background: g.hex, cursor: 'pointer', padding: 0,
                    border: i === activeColour ? '2px solid var(--ink)' : '1.5px solid rgba(0,0,0,.2)',
                    boxShadow: i === activeColour ? '0 0 0 2px var(--white),0 0 0 3.5px var(--ink)' : 'none',
                    transition: 'all .18s',
                  }} />
                ))}
              </div>
            </div>
          )}

          {requiresSize && (
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ ...label, marginBottom: '.55rem' }}>Size</div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {product.sizes.map(sz => (
                  <button key={sz} type="button" disabled={isSold(sz)} onClick={() => setSelSize(sz)} style={{
                    minWidth: 40, height: 40, padding: '0 .5rem', border: '1px solid', fontSize: '.7rem', fontWeight: 500,
                    fontFamily: 'var(--sans)', cursor: isSold(sz) ? 'not-allowed' : 'pointer', transition: 'all var(--t)',
                    background: selSize === sz ? 'var(--ink)' : 'transparent',
                    color: selSize === sz ? 'var(--white)' : 'var(--stone2)',
                    borderColor: selSize === sz ? 'var(--ink)' : 'var(--sand)',
                    opacity: isSold(sz) ? .4 : 1, textDecoration: isSold(sz) ? 'line-through' : 'none',
                  }}>{sz}{sizeExtra(sz) > 0 && !isSold(sz) ? ` +${fmt(sizeExtra(sz))}` : ''}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--sand)' }}>
              <button type="button" onClick={() => qty > 1 && setQty(q => q - 1)} style={{ width: 34, height: 40, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>−</button>
              <span style={{ width: 38, textAlign: 'center', fontSize: '.83rem', fontWeight: 500 }}>{qty}</span>
              <button type="button" onClick={() => qty < 10 && setQty(q => q + 1)} style={{ width: 34, height: 40, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>+</button>
            </div>
            <button type="button" className="btn btn-gradient" onClick={addToCart} disabled={requiresSize && !selSize}
              style={{ flex: 1, justifyContent: 'center', padding: '.95rem', opacity: requiresSize && !selSize ? .5 : 1 }}>
              Add to Cart
            </button>
          </div>

          {(product.fabric || product.careInstructions) && (
            <div style={{ borderTop: '1px solid var(--sand)', paddingTop: '.9rem', fontSize: '.76rem', color: 'var(--stone2)', display: 'grid', gap: '.3rem' }}>
              {product.fabric && <div><strong style={{ color: 'var(--ink)', fontWeight: 500 }}>Fabric:</strong> {product.fabric}</div>}
              {product.careInstructions && <div><strong style={{ color: 'var(--ink)', fontWeight: 500 }}>Care:</strong> {product.careInstructions}</div>}
            </div>
          )}

          <Link to={`/product/${product.slug}${hasGroups ? `?colour=${activeColour}` : ''}`} onClick={onClose}
            style={{ display: 'inline-block', marginTop: '1rem', fontSize: '.72rem', fontWeight: 600, color: 'var(--accent)' }}>
            View full details →
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}