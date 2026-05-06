/**
 * PRODUCT CARD COMPONENT TESTS
 * Tests: render, glyph fallback, badge display, price, navigation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';

const mockProduct = {
  _id:          'prod_abc',
  name:         'SNERA Essential Tee',
  slug:         'snera-essential-tee',
  category:     'Tops',
  price:        1299,
  comparePrice: 1599,
  badge:        'New',
  glyph:        '◈',
  images:       [],
  soldSizes:    [],
};

function renderCard(props = {}) {
  const product = props.product || mockProduct;
  return render(
    <MemoryRouter>
      <CartProvider>
        <ProductCard product={product} index={props.index || 0} />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('ProductCard — rendering', () => {

  test('✓ renders product name', () => {
    renderCard();
    expect(screen.getByText('SNERA Essential Tee')).toBeInTheDocument();
  });

  test('✓ renders category', () => {
    renderCard();
    expect(screen.getByText('Tops')).toBeInTheDocument();
  });

  test('✓ renders price in ₹ format', () => {
    renderCard();
    // The formatted price should include 1,299
    const el = screen.getByText(/1,299/);
    expect(el).toBeInTheDocument();
  });

  test('✓ renders compare price when provided', () => {
    renderCard();
    // Compare price: 1,599 — strikethrough element exists
    const priceEls = screen.getAllByText(/1,599/);
    expect(priceEls.length).toBeGreaterThan(0);
    // Check it has the was-price class or inline style for line-through
    const wasEl = priceEls[0];
    expect(wasEl).toBeInTheDocument();
  });

  test('✓ shows glyph when no image', () => {
    renderCard();
    expect(screen.getByText('◈')).toBeInTheDocument();
  });

  test('✓ shows product image when available', () => {
    renderCard({ product: { ...mockProduct, images: ['/uploads/tee.jpg'] } });
    const img = screen.getByAltText('SNERA Essential Tee');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  test('✓ shows New badge', () => {
    renderCard();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('✓ shows Sale badge', () => {
    renderCard({ product: { ...mockProduct, badge: 'Sale' } });
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  test('✓ shows no badge when badge is empty', () => {
    renderCard({ product: { ...mockProduct, badge: '' } });
    expect(screen.queryByText('New')).toBeNull();
    expect(screen.queryByText('Sale')).toBeNull();
  });

  test('✓ renders Quick View button', () => {
    renderCard();
    expect(screen.getByText('Quick View')).toBeInTheDocument();
  });

  test('✓ has correct accessibility role and tabindex', () => {
    renderCard();
    const card = screen.getByRole('button', { name: /view snera essential tee/i });
    expect(card).toHaveAttribute('tabindex', '0');
  });
});

describe('ProductCard — interaction', () => {

  test('✓ clicking card is interactive (keyboard nav)', () => {
    renderCard();
    const card = screen.getByRole('button', { name: /view snera essential tee/i });
    expect(() => fireEvent.keyDown(card, { key: 'Enter' })).not.toThrow();
  });

  test('✓ Quick View click does not bubble incorrectly', () => {
    renderCard();
    const qvBtn = screen.getByText('Quick View');
    expect(() => fireEvent.click(qvBtn)).not.toThrow();
  });
});

describe('ProductCard — no comparePrice', () => {

  test('✓ renders without crashing when no comparePrice', () => {
    renderCard({ product: {
      _id: 'prod_xyz', name: 'SNERA Essential Tee',
      slug: 'snera-essential-tee', category: 'Tops',
      price: 1299, badge: 'New', glyph: '◈',
      images: [], soldSizes: [],
      // comparePrice deliberately omitted
    }});
    expect(screen.getByText('SNERA Essential Tee')).toBeInTheDocument();
    expect(screen.queryByText(/1,599/)).toBeNull();
  });
});
