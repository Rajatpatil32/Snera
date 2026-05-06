/**
 * TRACK ORDER PAGE TESTS
 * Tests: form render, search, result display, error state
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TrackOrderPage from '../../pages/TrackOrderPage';

// Mock API
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
  fmt: (n) => `₹${n}`,
}));

import API from '../../utils/api';

function renderTrack(search = '') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/track-order${search}`]}>
        <Routes>
          <Route path="/track-order" element={<TrackOrderPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('TrackOrderPage — rendering', () => {

  test('✓ renders page heading', () => {
    renderTrack();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('✓ renders order number input', () => {
    renderTrack();
    expect(screen.getByPlaceholderText(/SNR01001/i)).toBeInTheDocument();
  });

  test('✓ renders Track button', () => {
    renderTrack();
    expect(screen.getByRole('button', { name: /track/i })).toBeInTheDocument();
  });

  test('✓ renders breadcrumb nav', () => {
    renderTrack();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Track Order')).toBeInTheDocument();
  });
});

describe('TrackOrderPage — successful tracking', () => {

  const mockOrder = {
    orderNumber: 'SNR01001',
    status: 'shipped',
    trackingId: 'BD99887766',
    courier: 'Blue Dart',
    customer: { name: 'Aarav Shah' },
    items: [{ name: 'SNERA Essential Tee', size: 'M', qty: 1 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    API.get.mockResolvedValue({ data: mockOrder });
  });

  test('✓ shows order number after successful search', async () => {
    renderTrack();
    fireEvent.change(screen.getByPlaceholderText(/SNR01001/i), { target: { value: 'SNR01001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText('SNR01001')).toBeInTheDocument();
    });
  });

  test('✓ shows shipment status section', async () => {
    renderTrack();
    fireEvent.change(screen.getByPlaceholderText(/SNR01001/i), { target: { value: 'SNR01001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText(/shipment status/i)).toBeInTheDocument();
    });
  });

  test('✓ shows tracking ID when present', async () => {
    renderTrack();
    fireEvent.change(screen.getByPlaceholderText(/SNR01001/i), { target: { value: 'SNR01001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText('BD99887766')).toBeInTheDocument();
    });
  });

  test('✓ shows ordered items', async () => {
    renderTrack();
    fireEvent.change(screen.getByPlaceholderText(/SNR01001/i), { target: { value: 'SNR01001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText(/SNERA Essential Tee/i)).toBeInTheDocument();
    });
  });
});

describe('TrackOrderPage — error state', () => {

  beforeEach(() => {
    API.get.mockRejectedValue({ response: { data: { error: 'Order not found' } } });
  });

  test('✓ shows error message for invalid order number', async () => {
    renderTrack();
    fireEvent.change(screen.getByPlaceholderText(/SNR01001/i), { target: { value: 'SNR99999' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    });
  });
});
