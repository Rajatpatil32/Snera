/**
 * useCanonical — Canonical URL generator for SNERA
 *
 * Problem: React SPA generates many URL variants from query strings
 * (filters, pagination, colour params) that create duplicate-content
 * signals for Googlebot. This hook strips non-canonical params and
 * always returns the correct self-referencing canonical URL.
 *
 * Rules:
 *   /shop                      → https://snera.in/shop          (base)
 *   /shop?category=Tops        → https://snera.in/shop?category=Tops  (keep filter)
 *   /shop?category=Tops&page=1 → https://snera.in/shop?category=Tops  (strip page=1)
 *   /shop?category=Tops&page=2 → https://snera.in/shop?category=Tops&page=2 (keep page>1)
 *   /product/slug?colour=0     → https://snera.in/product/slug  (strip colour param)
 *   /product/slug?colour=1     → https://snera.in/product/slug  (strip colour param)
 *
 * Usage:
 *   const canonical = useCanonical();
 *   // or with overrides:
 *   const canonical = useCanonical({ override: 'https://snera.in/shop?category=Tops' });
 */

import { useLocation } from 'react-router-dom';

const SITE = 'https://snera.in';

// Params that are safe to keep in canonical (indexable filter dims)
const CANONICAL_PARAMS = new Set(['category', 'gender', 'collection']);

// Params that must NEVER appear in canonical (tracking, UI state, etc.)
const STRIP_PARAMS = new Set([
  'colour', 'color',  // product colour variant — not separate page
  'q',                // search — dynamic, not indexable
  'ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', // tracking
  'fbclid', 'gclid',  // ad click IDs
]);

export default function useCanonical({ override } = {}) {
  const location = useLocation();

  if (override) return override;

  const path   = location.pathname;
  const params = new URLSearchParams(location.search);

  // Build clean canonical params
  const cleanParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (STRIP_PARAMS.has(key)) continue;                 // strip noise
    if (!CANONICAL_PARAMS.has(key)) continue;            // only allow known canonical params
    // Strip page=1 (default page — same content as no page param)
    if (key === 'page' && value === '1') continue;
    cleanParams.append(key, value);
  }

  const qs = cleanParams.toString();
  return qs ? `${SITE}${path}?${qs}` : `${SITE}${path}`;
}