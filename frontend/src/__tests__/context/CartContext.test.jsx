/**
 * CART CONTEXT TESTS
 * Tests: add, remove, quantity change, clear, persist, toast
 */

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

// Helper: consumer component
function CartConsumer({ onRender }) {
  const cart = useCart();
  onRender && onRender(cart);
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="total">{cart.total}</span>
      <span data-testid="items">{cart.items.length}</span>
      <span data-testid="open">{cart.isOpen ? 'open' : 'closed'}</span>
    </div>
  );
}

const mockProduct = {
  _id:    'prod_001',
  name:   'SNERA Essential Tee',
  price:  1299,
  images: [],
  glyph:  '◈',
};

function renderCart(onRender) {
  return render(
    <CartProvider>
      <CartConsumer onRender={onRender} />
    </CartProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CartContext — initial state', () => {

  test('✓ starts empty', () => {
    renderCart();
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
    expect(screen.getByTestId('items').textContent).toBe('0');
  });

  test('✓ drawer starts closed', () => {
    renderCart();
    expect(screen.getByTestId('open').textContent).toBe('closed');
  });
});

describe('CartContext — ADD action', () => {

  let cart;
  beforeEach(() => {
    renderCart(c => { cart = c; });
  });

  test('✓ adds item and increments count', () => {
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('items').textContent).toBe('1');
  });

  test('✓ calculates total correctly', () => {
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 2 } }));
    expect(screen.getByTestId('total').textContent).toBe('2598');
  });

  test('✓ merges duplicate item (same product + size) into qty', () => {
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
    expect(screen.getByTestId('items').textContent).toBe('1'); // still 1 line item
    expect(screen.getByTestId('count').textContent).toBe('2'); // but qty = 2
  });

  test('✓ treats same product different size as separate line items', () => {
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'L', qty: 1 } }));
    expect(screen.getByTestId('items').textContent).toBe('2');
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});

describe('CartContext — REMOVE action', () => {

  let cart;
  beforeEach(() => {
    renderCart(c => { cart = c; });
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
  });

  test('✓ removes item from cart', () => {
    const key = `${mockProduct._id}_M`;
    act(() => cart.dispatch({ type: 'REMOVE', payload: key }));
    expect(screen.getByTestId('items').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  test('✓ ignores remove for non-existent key', () => {
    act(() => cart.dispatch({ type: 'REMOVE', payload: 'nonexistent_key' }));
    expect(screen.getByTestId('items').textContent).toBe('1'); // unchanged
  });
});

describe('CartContext — CHANGE_QTY action', () => {

  let cart;
  beforeEach(() => {
    renderCart(c => { cart = c; });
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 2 } }));
  });

  test('✓ increases qty', () => {
    const key = `${mockProduct._id}_M`;
    act(() => cart.dispatch({ type: 'CHANGE_QTY', payload: { key, delta: 1 } }));
    expect(screen.getByTestId('count').textContent).toBe('3');
  });

  test('✓ decreases qty', () => {
    const key = `${mockProduct._id}_M`;
    act(() => cart.dispatch({ type: 'CHANGE_QTY', payload: { key, delta: -1 } }));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  test('✓ removes item when qty reaches 0', () => {
    const key = `${mockProduct._id}_M`;
    act(() => cart.dispatch({ type: 'CHANGE_QTY', payload: { key, delta: -2 } }));
    expect(screen.getByTestId('items').textContent).toBe('0');
  });
});

describe('CartContext — CLEAR action', () => {

  let cart;
  beforeEach(() => {
    renderCart(c => { cart = c; });
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 3 } }));
  });

  test('✓ clears all items', () => {
    act(() => cart.dispatch({ type: 'CLEAR' }));
    expect(screen.getByTestId('items').textContent).toBe('0');
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });
});

describe('CartContext — drawer OPEN/CLOSE', () => {

  let cart;
  beforeEach(() => { renderCart(c => { cart = c; }); });

  test('✓ opens drawer', () => {
    act(() => cart.dispatch({ type: 'OPEN' }));
    expect(screen.getByTestId('open').textContent).toBe('open');
  });

  test('✓ closes drawer', () => {
    act(() => cart.dispatch({ type: 'OPEN' }));
    act(() => cart.dispatch({ type: 'CLOSE' }));
    expect(screen.getByTestId('open').textContent).toBe('closed');
  });
});

describe('CartContext — localStorage persistence', () => {

  test('✓ persists cart to localStorage on add', () => {
    let cart;
    renderCart(c => { cart = c; });
    act(() => cart.dispatch({ type: 'ADD', payload: { product: mockProduct, size: 'M', qty: 1 } }));
    const stored = JSON.parse(localStorage.getItem('snera_cart'));
    expect(stored).toBeDefined();
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('SNERA Essential Tee');
  });

  test('✓ loads cart from localStorage on mount', () => {
    localStorage.setItem('snera_cart', JSON.stringify([{
      key: 'prod_001_S', id: 'prod_001',
      name: 'SNERA Essential Tee', price: 1299,
      size: 'S', qty: 2, image: null, glyph: '◈',
    }]));

    renderCart();
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});
