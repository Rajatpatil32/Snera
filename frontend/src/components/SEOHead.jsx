import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEOHead — renders all meta tags and structured data for a page.
 *
 * Changes made:
 *  - Removed the inline productSchema builder that was duplicating what useseo.js already builds.
 *    Previously, a product page emitted TWO Product JSON-LD blocks (one from here, one from useSEO).
 *    Now SEOHead only renders schemas passed in via the `schemas` prop (built by useSEO hook).
 *  - breadcrumbSchema builder also removed from here for same reason — useSEO handles it.
 *  - All other meta tag behaviour is unchanged.
 */
export default function SEOHead({
  title = 'SNERA — Premium Essentials',
  description = 'Premium essentials crafted for those who believe the quietest statement is often the loudest. Shop SNERA — minimal, timeless fashion.',
  image = 'https://snera.in/images/og-image.webp',
  url = 'https://snera.in',
  noindex = false,                       // used by Checkout / Order success / Track order
  canonical: canonicalOverride = null,
  product = null,    // kept for og:type + product price meta only (NOT for schema generation)
  schemas = [],      // all JSON-LD comes from useSEO hook, not built here
}) {
  const fullTitle = title.includes('SNERA') ? title : `${title} — SNERA`;

  // ── Use product.seo overrides when present ────────────────────────────────
  const metaTitle       = product?.seo?.metaTitle       || fullTitle;
  const metaDescription = product?.seo?.metaDescription || description;
  const metaKeywords    = product?.seo?.keywords?.length
    ? product.seo.keywords.join(', ')
    : null;
  const ogTitle         = product?.seo?.ogTitle         || metaTitle;
  const ogDescription   = product?.seo?.ogDescription   || metaDescription;
  const canonical       = product?.seo?.canonicalUrl    || canonicalOverride || url;
  const noIndex         = product?.seo?.noIndex         || noindex;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      <meta
        name="robots"
        content={noIndex
          ? 'noindex, nofollow'
          : 'index, follow, max-image-preview:large, max-snippet:-1'
        }
      />

      {/* Keywords — only rendered when set in admin */}
      {metaKeywords && <meta name="keywords" content={metaKeywords} />}

      {/* Open Graph */}
      <meta property="og:type"         content={product ? 'product' : 'website'} />
      <meta property="og:title"        content={ogTitle} />
      <meta property="og:description"  content={ogDescription} />
      <meta property="og:image"        content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt"    content={ogTitle} />
      <meta property="og:url"          content={canonical} />
      <meta property="og:site_name"    content="SNERA" />
      <meta property="og:locale"       content="en_IN" />

      {/* Product pricing for Facebook/Meta shopping */}
      {product && <meta property="product:price:amount"   content={product.price} />}
      {product && <meta property="product:price:currency" content="INR" />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@snera_official" />
      <meta name="twitter:creator"     content="@snera_official" />
      <meta name="twitter:title"       content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image"       content={image} />
      <meta name="twitter:image:alt"   content={ogTitle} />

      {/* hreflang — per-page, matches canonical */}
      <link rel="alternate" hreflang="en-IN"    href={canonical} />
      <link rel="alternate" hreflang="x-default" href={canonical} />

      {/* All structured data comes from the useSEO hook via the schemas prop */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
}