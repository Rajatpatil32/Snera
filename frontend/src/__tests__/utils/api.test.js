/**
 * UTILITY FUNCTION TESTS
 * Tests: fmt(), getImageUrl(), GLYPHS, BKGS arrays
 */

import { fmt, getImageUrl, GLYPHS, BKGS } from '../../utils/api';

describe('fmt() — currency formatter', () => {

  test('✓ formats integer as INR currency', () => {
    const result = fmt(1299);
    expect(result).toContain('1,299');
    expect(result).toMatch(/₹/);
  });

  test('✓ formats zero', () => {
    const result = fmt(0);
    expect(result).toContain('0');
  });

  test('✓ formats large number with commas (Indian system)', () => {
    const result = fmt(12999);
    // Indian system: 12,999
    expect(result).toContain('12,999');
  });

  test('✓ formats decimal — rounds to 0 decimal places', () => {
    const result = fmt(999.99);
    // maximumFractionDigits: 0 — should not show decimals
    expect(result).not.toContain('.');
  });

  test('✓ returns string', () => {
    expect(typeof fmt(500)).toBe('string');
  });
});

describe('getImageUrl() — image URL resolver', () => {

  test('✓ returns null for null input', () => {
    expect(getImageUrl(null)).toBeNull();
  });

  test('✓ returns null for undefined input', () => {
    expect(getImageUrl(undefined)).toBeNull();
  });

  test('✓ returns http URLs unchanged', () => {
    const url = 'http://cdn.example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  test('✓ returns https URLs unchanged', () => {
    const url = 'https://cdn.example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  test('✓ prepends base URL to relative path', () => {
    const result = getImageUrl('/uploads/snera_123.jpg');
    expect(result).toContain('/uploads/snera_123.jpg');
  });

  test('✓ handles paths with subdirectories', () => {
    const result = getImageUrl('/uploads/products/tee.webp');
    expect(result).toContain('/uploads/products/tee.webp');
  });
});

describe('GLYPHS — design glyphs array', () => {

  test('✓ is a non-empty array', () => {
    expect(Array.isArray(GLYPHS)).toBe(true);
    expect(GLYPHS.length).toBeGreaterThan(0);
  });

  test('✓ contains only strings', () => {
    GLYPHS.forEach(g => expect(typeof g).toBe('string'));
  });

  test('✓ contains the default glyph ◈', () => {
    expect(GLYPHS).toContain('◈');
  });
});

describe('BKGS — background colors array', () => {

  test('✓ is a non-empty array', () => {
    expect(Array.isArray(BKGS)).toBe(true);
    expect(BKGS.length).toBeGreaterThan(0);
  });

  test('✓ all values are valid CSS hex colors', () => {
    BKGS.forEach(bg => {
      expect(bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
