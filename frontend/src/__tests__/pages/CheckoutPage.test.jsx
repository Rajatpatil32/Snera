/**
 * CHECKOUT PAGE TESTS
 * Tests: empty cart redirect, form fields, validation, shipping logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from '../../context/CartContext';
import CheckoutPage from '../../pages/CheckoutPage';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get:  jest.fn(),
  },
  fmt: (n) => `₹${n.toLocaleString('en-IN')}`,
}));

function renderCheckout(cartItems = []) {
  // Pre-seed localStorage so CartProvider loads synchronously
  if (cartItems.length > 0) {
    localStorage.setItem('snera_cart', JSON.stringify(cartItems));
  } else {
    localStorage.removeItem('snera_cart');
  }
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/checkout']}>
        <CartProvider>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/shop"     element={<div>Shop Page</div>} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

afterEach(() => localStorage.clear());

const mockProduct = {
  _id: 'p1', name: 'SNERA Essential Tee',
  price: 1299, images: [], glyph: '◈',
};

// Pre-built localStorage cart format
const cartItems = [{
  key: 'p1_M', id: 'p1',
  name: 'SNERA Essential Tee', price: 1299,
  size: 'M', qty: 1, image: null, glyph: '◈',
}];

describe('CheckoutPage — empty cart', () => {

  test('✓ shows empty cart message when no items', () => {
    renderCheckout([]);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('✓ shows Continue Shopping link when cart empty', () => {
    renderCheckout([]);
    expect(screen.getByText(/continue shopping/i)).toBeInTheDocument();
  });
});

describe('CheckoutPage — with items', () => {

  test('✓ renders checkout heading', () => {
    renderCheckout(cartItems);
    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
  });

  test('✓ renders Contact section', () => {
    renderCheckout(cartItems);
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  test('✓ renders Shipping Address section', () => {
    renderCheckout(cartItems);
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
  });

  test('✓ renders Order Summary section', () => {
    renderCheckout(cartItems);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  test('✓ shows product name in summary', () => {
    renderCheckout(cartItems);
    expect(screen.getByText('SNERA Essential Tee')).toBeInTheDocument();
  });

  test('✓ renders all required form inputs', () => {
    renderCheckout(cartItems);
    expect(screen.getByPlaceholderText(/aarav shah/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/9876543210/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/flat \/ house/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mumbai/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/400001/i)).toBeInTheDocument();
  });
});

describe('CheckoutPage — form validation', () => {

  test('✓ shows validation errors on empty submit', async () => {
    renderCheckout(cartItems);
    const submitBtn = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  test('✓ validates phone number format', async () => {
    renderCheckout(cartItems);

    fireEvent.change(screen.getByPlaceholderText(/aarav shah/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/you@email.com/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/9876543210/i), { target: { value: '123' } }); // bad phone

    const submitBtn = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/valid 10-digit phone/i)).toBeInTheDocument();
    });
  });

  test('✓ validates pincode format', async () => {
    renderCheckout(cartItems);

    fireEvent.change(screen.getByPlaceholderText(/aarav shah/i),    { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/you@email.com/i), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByPlaceholderText(/9876543210/i),    { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText(/flat \/ house/i), { target: { value: '12 Main St' } });
    fireEvent.change(screen.getByPlaceholderText(/mumbai/i),        { target: { value: 'Mumbai' } });
    // State — find by label
    const stateInput = screen.getByPlaceholderText(/maharashtra/i);
    fireEvent.change(stateInput, { target: { value: 'MH' } });
    fireEvent.change(screen.getByPlaceholderText(/400001/i), { target: { value: '12' } }); // bad pincode

    fireEvent.click(screen.getByRole('button', { name: /pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid 6-digit pincode/i)).toBeInTheDocument();
    });
  });
});

describe('CheckoutPage — shipping fee logic', () => {

  test('✓ shows free shipping for orders >= ₹999', async () => {
    // mockProduct.price = 1299 >= 999 → free shipping
    renderCheckout(cartItems);
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  test('✓ shows shipping fee for orders < ₹999', async () => {
    const cheapProduct = { ...mockProduct, price: 500 };
    renderCheckout([{ product: cheapProduct, size: 'S', qty: 1 }]);
    await waitFor(() => {
      // Free text should NOT be present
      expect(screen.queryByText('Free')).toBeNull();
    });
  });
});
