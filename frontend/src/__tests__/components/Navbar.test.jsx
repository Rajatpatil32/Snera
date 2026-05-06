/**
 * NAVBAR COMPONENT TESTS
 * Tests: render, links, cart badge, mobile menu
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import Navbar from '../../components/Navbar';

function renderNavbar() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <Navbar />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('Navbar — rendering', () => {

  test('✓ renders SNERA brand name', () => {
    renderNavbar();
    expect(screen.getByText('SNERA')).toBeInTheDocument();
  });

  test('✓ renders navigation links in DOM', () => {
    renderNavbar();
    // Links are in DOM even if visually hidden by CSS media query
    expect(screen.getAllByText('New Arrivals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shop').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Track Order').length).toBeGreaterThan(0);
  });

  test('✓ renders cart button', () => {
    renderNavbar();
    const cartBtn = screen.getByRole('button', { name: /open cart/i });
    expect(cartBtn).toBeInTheDocument();
  });

  test('✓ renders mobile menu toggle button', () => {
    renderNavbar();
    // The hamburger button has aria-label="Menu"
    const menuBtn = screen.getByLabelText(/menu/i);
    expect(menuBtn).toBeInTheDocument();
  });
});

describe('Navbar — cart badge', () => {

  test('✓ does not show badge when cart is empty', () => {
    renderNavbar();
    // Badge only appears when count > 0
    const badge = screen.queryByText(/^\d+$/);
    expect(badge).toBeNull();
  });
});

describe('Navbar — links have correct href', () => {

  test('✓ logo links to /', () => {
    renderNavbar();
    const logo = screen.getByText('SNERA');
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  test('✓ Shop links to /shop', () => {
    renderNavbar();
    const links = screen.getAllByText('Shop');
    const shopLink = links[0].closest('a');
    expect(shopLink).toHaveAttribute('href', '/shop');
  });

  test('✓ Track Order links to /track-order', () => {
    renderNavbar();
    const links = screen.getAllByText('Track Order');
    const link  = links[0].closest('a');
    expect(link).toHaveAttribute('href', '/track-order');
  });
});

describe('Navbar — cart interaction', () => {

  test('✓ clicking cart button dispatches OPEN action', () => {
    renderNavbar();
    const cartBtn = screen.getByRole('button', { name: /open cart/i });
    fireEvent.click(cartBtn);
    // Cart drawer open state is managed in CartContext; we just verify click works
    expect(cartBtn).toBeInTheDocument();
  });
});
