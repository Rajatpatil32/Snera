/**
 * useSEO — Central SEO hook for SNERA
 *
 * Changes made:
 *  1. priceValidUntil is now dynamic (1 year from today) instead of hardcoded '2026-12-31'
 *  2. aggregateRating added to productSchema (renders star ratings in Google results)
 *  3. This is the single source of truth for product schema — SEOHead.jsx no longer builds its own
 */

const SITE  = 'https://snera.in';
const BRAND = 'SNERA';
const LOGO  = `${SITE}/images/logo.png`;
const IG    = 'https://instagram.com/snera.store';

// ─── Image URL helper ─────────────────────────────────────────────────────────
function absImg(path) {
  if (!path) return `${SITE}/og-image.jpg`;
  if (path.startsWith('http')) return path;
  return `${SITE}${path}`;
}

// ─── Dynamic date helper — 1 year from today ──────────────────────────────────
function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Organisation (emitted on every page) ─────────────────────────────────────
export function orgSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: BRAND,
    url: SITE,
    logo: {
      '@type': 'ImageObject',
      url: LOGO,
      width: 200,
      height: 60,
    },
    description:
      'Premium essentials crafted for those who believe the quietest statement is often the loudest.',
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    sameAs: [IG],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@snera.in',
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

// ─── WebSite (sitelinks search box) ───────────────────────────────────────────
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: BRAND,
    url: SITE,
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── BreadcrumbList ───────────────────────────────────────────────────────────
export function breadcrumbSchema(crumbs = []) {
   if (!crumbs.length || crumbs.length < 2) return null;
  
  // Guard: every item must have name and url
  const valid = crumbs.every(b => b.name && b.url);
  if (!valid) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `${SITE}${b.url}`,
    })),
  };
}

// ─── Product ──────────────────────────────────────────────────────────────────
export function productSchema(product) {
  if (!product) return null;

  const allImages = product.colorGroups?.length
    ? product.colorGroups.flatMap(g => g.images || [])
    : product.images || [];

  const inStock = product.isActive !== false;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE}/product/${product.slug}#product`,
    name: product.name,
    description: product.description || '',
    // Use slug as SKU — human-readable and stable. Add a real `sku` field in the
    // Product model and swap `product.slug` for `product.sku` once available.
    sku: product.sku || product.slug,
    ...(product.fabric && { material: product.fabric }),
    brand: {
      '@type': 'Brand',
      name: BRAND,
      '@id': `${SITE}/#organization`,
    },
    image: allImages.length ? allImages.map(absImg) : [`${SITE}/og-image.jpg`],
    // ── aggregateRating: shows star ratings in Google search results ───────────
    // Requires avgRating (Number 1–5) and reviewCount (Number) on the product.
    // Add these fields to the Product model and populate them from user reviews.
    ...(product.reviewCount && product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      '@id': `${SITE}/product/${product.slug}#offer`,
      priceCurrency: 'INR',
      price: product.price,
      // Dynamic — always 1 year ahead, never stale
      ...(product.comparePrice && { priceValidUntil: oneYearFromNow() }),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE}/product/${product.slug}`,
      seller: { '@id': `${SITE}/#organization` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    ...(product.sizes?.length && {
      additionalProperty: product.sizes.map(sz => ({
        '@type': 'PropertyValue',
        name: 'Size',
        value: sz,
      })),
    }),
  };
}

// ─── FAQ (product detail page) ────────────────────────────────────────────────
export function faqSchema(product) {
  if (!product) return null;
  const faqs = [
    {
      q: `What sizes are available for ${product.name}?`,
      a: product.sizes?.length
        ? `${product.name} is available in sizes: ${product.sizes.join(', ')}.`
        : 'Please check the product page for available sizes.',
    },
    {
      q: `What is the fabric of ${product.name}?`,
      a: product.fabric
        ? `${product.name} is made from ${product.fabric}.`
        : 'Please refer to the product description for fabric details.',
    },
    {
      q: 'What is your return policy?',
      a: 'We accept returns within 7 days of delivery on eligible items. Items must be unused and in original packaging. Visit our Refund Policy page for full details.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery takes 5–7 business days. Express delivery (2–3 days) is also available. Orders are processed within 1–2 business days.',
    },
    {
      q: 'Is Cash on Delivery available?',
      a: 'We currently accept all major credit/debit cards, UPI, and net banking through our secure payment gateway.',
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// ─── ItemList (category/shop pages) ───────────────────────────────────────────
export function itemListSchema(products = [], categoryName = 'All Products') {
  if (!products.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${BRAND} — ${categoryName}`,
    url: `${SITE}/shop`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/product/${p.slug}`,
      name: p.name,
    })),
  };
}

// ─── WebPage ──────────────────────────────────────────────────────────────────
export function webPageSchema({ name, description, url, dateModified, hasBreadcrumb = false }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE}${url}#webpage`,
    url: `${SITE}${url}`,
    name,
    description,
    isPartOf: { '@id': `${SITE}/#website` },
    ...(dateModified && { dateModified }),
    // Only reference breadcrumb if the page actually has one
    ...(hasBreadcrumb && { breadcrumb: { '@id': `${SITE}${url}#breadcrumb` } }),
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE}/#organization` },
  };
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export default function useSEO({
  type = 'webpage',
  product = null,
  products = [],
  breadcrumbs = [],
  pageUrl = '/',
  pageName = BRAND,
  pageDescription = '',
  categoryName = 'All Products',
}) {
  const schemas = [orgSchema(), websiteSchema()];

  const crumbSchema = breadcrumbSchema(breadcrumbs);
  if (crumbSchema) schemas.push(crumbSchema);

  schemas.push(webPageSchema({ name: pageName, description: pageDescription, url: pageUrl, hasBreadcrumb: breadcrumbs.length >= 2 }));

  if (type === 'product' && product) {
    schemas.push(productSchema(product));
    schemas.push(faqSchema(product));
  }

  if (type === 'shop' && products.length) {
    schemas.push(itemListSchema(products, categoryName));
  }

  return schemas.filter(Boolean);
}