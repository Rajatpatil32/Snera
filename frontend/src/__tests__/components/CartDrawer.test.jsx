/**
 * CART DRAWER COMPONENT TESTS
 * Tests: empty state, item display, qty controls, remove, checkout nav
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import CartDrawer from '../../components/CartDrawer';

function CartOpener() {
  const { dispatch } = useCart();
  React.useEffect(() => { dispatch({ type: 'OPEN' }); }, []); // eslint-disable-line
  return null;
}

function renderDrawer(preloadedItems = []) {
  // Pre-seed localStorage so CartProvider loads items synchronously on mount
  if (preloadedItems.length > 0) {
    localStorage.setItem('snera_cart', JSON.stringify(preloadedItems));
  } else {
    localStorage.removeItem('snera_cart');
  }
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartOpener />
        <CartDrawer />
      </CartProvider>
    </MemoryRouter>
  );
}

const mockProduct = {
  _id: 'p1', name: 'SNERA Essential Tee',
  price: 1299, images: [], glyph: '◈',
};

// Pre-built cart items (matching what CartContext stores in localStorage)
const seededItems = [{
  key:   'p1_M',
  id:    'p1',
  name:  'SNERA Essential Tee',
  price: 1299,
  size:  'M',
  qty:   2,
  image: null,
  glyph: '◈',
}];

afterEach(() => localStorage.clear());

describe('CartDrawer — empty state', () => {

  test('✓ shows empty cart message', async () => {
    renderDrawer([]);
    await waitFor(() => expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument());
  });

  test('✓ shows "Continue Shopping" button when empty', async () => {
    renderDrawer([]);
    await waitFor(() => expect(screen.getByText(/continue shopping/i)).toBeInTheDocument());
  });

  test('✓ does not show checkout button when empty', async () => {
    renderDrawer([]);
    await waitFor(() => expect(screen.queryByText(/proceed to checkout/i)).toBeNull());
  });
});

describe('CartDrawer — with items', () => {

  test('✓ renders product name', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText('SNERA Essential Tee')).toBeInTheDocument());
  });

  test('✓ renders size label', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText(/size: m/i)).toBeInTheDocument());
  });

  test('✓ renders quantity', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  test('✓ shows subtotal', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText(/subtotal/i)).toBeInTheDocument());
  });

  test('✓ shows checkout button', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText(/proceed to checkout/i)).toBeInTheDocument());
  });

  test('✓ shows remove button for each item', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText('Remove')).toBeInTheDocument());
  });
});

describe('CartDrawer — controls', () => {

  test('✓ close button is present', async () => {
    renderDrawer([]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close cart/i })).toBeInTheDocument();
    });
  });

  test('✓ qty increase button present', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText('+')).toBeInTheDocument());
  });

  test('✓ qty decrease button present', async () => {
    renderDrawer(seededItems);
    await waitFor(() => expect(screen.getByText('−')).toBeInTheDocument());
  });

  test('✓ clicking remove removes item', async () => {
    renderDrawer(seededItems);
    await waitFor(() => screen.getByText('Remove'));
    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument());
  });
});

describe('CartDrawer — open/close state', () => {

  test('✓ drawer has open class when open', async () => {
    renderDrawer([]);
    await waitFor(() => {
      const aside = screen.getByRole('complementary');
      expect(aside.className).toContain('open');
    });
  });
});
