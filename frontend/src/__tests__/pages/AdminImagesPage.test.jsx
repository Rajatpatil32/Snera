/**
 * ADMIN IMAGES PAGE TESTS
 * Tests: render, upload zone, filter tabs, select/deselect, copy URL, assign panel
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AdminImagesPage from '../../pages/admin/AdminImagesPage';

// ── Mock API ──────────────────────────────────────────────────────────────────
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
  },
  getImageUrl: (url) => url ? `http://localhost:5000${url}` : null,
  fmt: (n) => `₹${n}`,
}));

import API from '../../utils/api';

const mockImages = [
  { filename: 'snera_001.jpg', url: '/uploads/snera_001.jpg', size: 102400, uploadedAt: new Date().toISOString(), assigned: null },
  { filename: 'snera_002.jpg', url: '/uploads/snera_002.jpg', size: 204800, uploadedAt: new Date().toISOString(), assigned: { id: 'p1', name: 'Essential Tee' } },
  { filename: 'snera_003.png', url: '/uploads/snera_003.png', size: 51200,  uploadedAt: new Date().toISOString(), assigned: null },
];

const mockProducts = [
  { _id: 'p1', name: 'Essential Tee',    isActive: true, images: ['/uploads/snera_002.jpg'] },
  { _id: 'p2', name: 'Minimal Jogger',   isActive: true, images: [] },
  { _id: 'p3', name: 'Archived Product', isActive: false, images: [] },
];

function renderImages() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/admin/images']}>
        <Routes>
          <Route path="/admin/images" element={<AdminImagesPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

beforeEach(() => {
  API.get.mockImplementation((url) => {
    if (url === '/upload/list')        return Promise.resolve({ data: { images: mockImages, total: 3 } });
    if (url === '/products/admin/all') return Promise.resolve({ data: { products: mockProducts } });
    return Promise.resolve({ data: {} });
  });
  API.delete.mockResolvedValue({ data: { success: true } });
  API.put.mockResolvedValue({ data: {} });
  API.post.mockResolvedValue({ data: { urls: ['/uploads/new.jpg'] } });
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('AdminImagesPage — rendering', () => {

  test('✓ renders page heading', async () => {
    renderImages();
    await waitFor(() => expect(screen.getByText(/image library/i)).toBeInTheDocument());
  });

  test('✓ shows image count in heading', async () => {
    renderImages();
    await waitFor(() => expect(screen.getByText(/3 images/i)).toBeInTheDocument());
  });

  test('✓ renders upload button', async () => {
    renderImages();
    await waitFor(() => expect(screen.getByText(/\+ upload images/i)).toBeInTheDocument());
  });

  test('✓ renders drag-and-drop zone', async () => {
    renderImages();
    await waitFor(() => expect(screen.getByText(/drop images here/i)).toBeInTheDocument());
  });

  test('✓ renders filter tabs', async () => {
    renderImages();
    await waitFor(() => {
      expect(screen.getByText(/^all/i)).toBeInTheDocument();
      expect(screen.getByText(/^assigned/i)).toBeInTheDocument();
      expect(screen.getByText(/^unassigned/i)).toBeInTheDocument();
    });
  });

  test('✓ renders all image filenames', async () => {
    renderImages();
    await waitFor(() => {
      expect(screen.getByText('snera_001.jpg')).toBeInTheDocument();
      expect(screen.getByText('snera_002.jpg')).toBeInTheDocument();
      expect(screen.getByText('snera_003.png')).toBeInTheDocument();
    });
  });

  test('✓ shows "Assigned" badge on assigned images', async () => {
    renderImages();
    await waitFor(() => {
      const badges = screen.getAllByText('Assigned');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('✓ shows total size in MB', async () => {
    renderImages();
    await waitFor(() => {
      const mbEls = screen.getAllByText(/mb/i);
      expect(mbEls.length).toBeGreaterThan(0);
    });
  });
});

// ─── Filter tabs ──────────────────────────────────────────────────────────────
describe('AdminImagesPage — filter tabs', () => {

  test('✓ "Unassigned" filter hides assigned images', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));

    fireEvent.click(screen.getByText(/^unassigned/i));

    await waitFor(() => {
      expect(screen.getByText('snera_001.jpg')).toBeInTheDocument();
      expect(screen.queryByText('snera_002.jpg')).toBeNull(); // assigned → hidden
    });
  });

  test('✓ "Assigned" filter shows only assigned images', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_002.jpg'));

    // Click the 'Assigned' filter tab specifically (not the badge text)
    const filterTabs = screen.getAllByText(/^assigned/i);
    // The tab button contains "(1)" so use the one with count
    const assignedTab = filterTabs.find(el => el.textContent.includes('('));
    fireEvent.click(assignedTab || filterTabs[0]);

    await waitFor(() => {
      expect(screen.getByText('snera_002.jpg')).toBeInTheDocument();
      expect(screen.queryByText('snera_001.jpg')).toBeNull();
    });
  });

  test('✓ "All" filter shows everything', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));

    // First go to unassigned, then back to all
    fireEvent.click(screen.getByText(/^unassigned/i));
    fireEvent.click(screen.getByText(/^all/i));

    await waitFor(() => {
      expect(screen.getByText('snera_001.jpg')).toBeInTheDocument();
      expect(screen.getByText('snera_002.jpg')).toBeInTheDocument();
    });
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────
describe('AdminImagesPage — search', () => {

  test('✓ search filters by filename', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));

    fireEvent.change(screen.getByPlaceholderText(/search by filename/i), {
      target: { value: 'snera_001' }
    });

    expect(screen.getByText('snera_001.jpg')).toBeInTheDocument();
    expect(screen.queryByText('snera_002.jpg')).toBeNull();
    expect(screen.queryByText('snera_003.png')).toBeNull();
  });

  test('✓ search by extension', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_003.png'));

    fireEvent.change(screen.getByPlaceholderText(/search by filename/i), {
      target: { value: '.png' }
    });

    expect(screen.getByText('snera_003.png')).toBeInTheDocument();
    expect(screen.queryByText('snera_001.jpg')).toBeNull();
  });

  test('✓ empty search shows all images', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));

    const input = screen.getByPlaceholderText(/search by filename/i);
    fireEvent.change(input, { target: { value: 'nomatch' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getByText('snera_001.jpg')).toBeInTheDocument();
    expect(screen.getByText('snera_002.jpg')).toBeInTheDocument();
  });
});

// ─── Selection ────────────────────────────────────────────────────────────────
describe('AdminImagesPage — selection', () => {

  test('✓ "Select all" button appears and selects all', async () => {
    renderImages();
    await waitFor(() => screen.getByText(/select all/i));
    fireEvent.click(screen.getByText(/select all/i));
    await waitFor(() => expect(screen.getByText(/clear selection/i)).toBeInTheDocument());
  });

  test('✓ bulk delete button appears when items selected', async () => {
    renderImages();
    await waitFor(() => screen.getByText(/select all/i));
    fireEvent.click(screen.getByText(/select all/i));
    await waitFor(() => expect(screen.getByText(/delete \d+ selected/i)).toBeInTheDocument());
  });

  test('✓ "Clear selection" deselects all', async () => {
    renderImages();
    await waitFor(() => screen.getByText(/select all/i));
    fireEvent.click(screen.getByText(/select all/i));
    await waitFor(() => fireEvent.click(screen.getByText(/clear selection/i)));
    await waitFor(() => expect(screen.getByText(/select all/i)).toBeInTheDocument());
  });
});

// ─── Image actions ────────────────────────────────────────────────────────────
describe('AdminImagesPage — image actions', () => {

  test('✓ each image card has Copy URL button', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    const copyBtns = screen.getAllByText('Copy URL');
    expect(copyBtns.length).toBe(3);
  });

  test('✓ unassigned images have Assign button', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    const assignBtns = screen.getAllByText('Assign');
    expect(assignBtns.length).toBe(2); // 2 unassigned
  });

  test('✓ assigned images have Unassign button', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_002.jpg'));
    const unassignBtns = screen.getAllByText('Unassign');
    expect(unassignBtns.length).toBe(1);
  });

  test('✓ each image has Delete button', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    const deleteBtns = screen.getAllByText('Delete');
    expect(deleteBtns.length).toBe(3);
  });

  test('✓ clicking Assign opens product selector', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    fireEvent.click(screen.getAllByText('Assign')[0]);
    await waitFor(() => expect(screen.getByText(/select product/i)).toBeInTheDocument());
  });

  test('✓ assign panel shows only active products', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    fireEvent.click(screen.getAllByText('Assign')[0]);
    await waitFor(() => {
      expect(screen.getByText('Essential Tee')).toBeInTheDocument();
      expect(screen.getByText('Minimal Jogger')).toBeInTheDocument();
      expect(screen.queryByText('Archived Product')).toBeNull(); // inactive → hidden
    });
  });

  test('✓ Cancel closes assign panel', async () => {
    renderImages();
    await waitFor(() => screen.getByText('snera_001.jpg'));
    fireEvent.click(screen.getAllByText('Assign')[0]);
    await waitFor(() => fireEvent.click(screen.getByText('Cancel')));
    await waitFor(() => expect(screen.queryByText('Cancel')).toBeNull());
  });
});

// ─── API calls ────────────────────────────────────────────────────────────────
describe('AdminImagesPage — API integration', () => {

  test('✓ calls GET /upload/list on mount', async () => {
    renderImages();
    await waitFor(() => expect(API.get).toHaveBeenCalledWith('/upload/list'));
  });

  test('✓ calls GET /products/admin/all on mount', async () => {
    renderImages();
    await waitFor(() => expect(API.get).toHaveBeenCalledWith('/products/admin/all'));
  });

  test('✓ clicking Unassign calls PUT /products/:id', async () => {
    renderImages();
    await waitFor(() => screen.getByText('Unassign'));
    fireEvent.click(screen.getByText('Unassign'));
    await waitFor(() => expect(API.put).toHaveBeenCalledWith('/products/p1', expect.any(Object)));
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────
describe('AdminImagesPage — empty state', () => {

  test('✓ shows empty message when no images', async () => {
    API.get.mockImplementation((url) => {
      if (url === '/upload/list')        return Promise.resolve({ data: { images: [], total: 0 } });
      if (url === '/products/admin/all') return Promise.resolve({ data: { products: [] } });
      return Promise.resolve({ data: {} });
    });

    renderImages();
    await waitFor(() => expect(screen.getByText(/no images uploaded yet/i)).toBeInTheDocument());
  });
});
