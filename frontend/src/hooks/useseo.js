/**
 * useSEO — Central SEO hook for SNERA
 *
 * Single source of truth for all structured data / JSON-LD on the site.
 *
 * Schemas emitted per page type:
 *  - All pages:    Organization, WebSite, BreadcrumbList (if ≥2 crumbs), WebPage
 *  - product:      + Product, FAQPage
 *  - shop:         + ItemList
 *  - home:         + ClothingStore (LocalBusiness subtype)
 *  - contact:      + ContactPage WebPage subtype
 */

const SITE = 'https://snera.in';
const BRAND = 'SNERA';
const LOGO = `${SITE}/images/logo.webp`;
const LOGO_PNG = `${SITE}/images/logo.png`;
const IG = 'https://www.instagram.com/snera.store/';

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
    legalName: 'SNERA',
    alternateName: ['SNERA Fashion', 'SNERA Brand', 'snera.in'],
    url: SITE,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE}/#logo`,
      url: LOGO_PNG,
      contentUrl: LOGO_PNG,
      width: 512,
      height: 512,
      caption: 'SNERA — Official Indian Fashion Brand',
    },
    image: {
      '@type': 'ImageObject',
      url: `${SITE}/images/og-image.webp`,
      width: 1200,
      height: 630,
    },
    description:
      'SNERA is an Indian fashion brand offering premium minimal essentials for men and women. Founded in India, all products are designed and sold exclusively at snera.in.',
    slogan: 'Wear less. Mean more.',
    foundingDate: '2026',
    foundingLocation: {
      '@type': 'Place',
      name: 'India',
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    naics: '448120',
    isicV4: '4771',
    knowsAbout: ['Indian fashion', 'minimal clothing', 'premium essentials', "men's fashion India", "women's fashion India"],
    keywords: 'SNERA, SNERA fashion brand, SNERA clothing, snera.in, Indian fashion brand',
    brand: {
      '@type': 'Brand',
      '@id': `${SITE}/#brand`,
      name: BRAND,
      logo: LOGO_PNG,
      description: 'SNERA is a premium minimal Indian fashion brand. Official website: snera.in.',
      url: SITE,
      slogan: 'Wear less. Mean more.',
    },
    sameAs: [
      IG,
      'https://www.instagram.com/snera.store/',
      SITE,
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'contact@snera.in',
        availableLanguage: ['English', 'Hindi'],
        contactOption: 'TollFree',
        areaServed: 'IN',
      },
    ],
  };
}

// ─── ClothingStore / LocalBusiness (home page only) ───────────────────────────
export function clothingStoreSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['ClothingStore', 'OnlineStore'],
    '@id': `${SITE}/#store`,
    name: BRAND,
    url: SITE,
    logo: LOGO_PNG,
    image: `${SITE}/images/og-image.webp`,
    description:
      'SNERA — premium minimal Indian fashion brand. Shop essentials for men and women online. Free shipping above ₹999.',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Credit Card, Debit Card, UPI, Net Banking',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    parentOrganization: { '@id': `${SITE}/#organization` },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'SNERA Collection',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Tops' },
        { '@type': 'OfferCatalog', name: 'Bottoms' },
        { '@type': 'OfferCatalog', name: 'Outerwear' },
        { '@type': 'OfferCatalog', name: 'Accessories' },
      ],
    },
    sameAs: [IG, SITE],
  };
}

// ─── WebSite (sitelinks search box) ───────────────────────────────────────────
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: BRAND,
    alternateName: 'SNERA Fashion',
    url: SITE,
    description: 'Official website of SNERA — premium minimal Indian fashion brand.',
    inLanguage: 'en-IN',
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
  if (!crumbs.length) return null;

  // Guard: every item must have name and url
  const valid = crumbs.every(b => b.name && b.url);
  if (!valid) return null;

  // Normalise: category filter params should resolve to /shop for canonical breadcrumb URL
  const normalisedCrumbs = crumbs.map(b => ({
    ...b,
    // /shop?category=X → /shop (filter state isn't a separate canonical page)
    url: b.url.startsWith('/shop?') ? '/shop' : b.url,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${SITE}${normalisedCrumbs[normalisedCrumbs.length - 1].url}#breadcrumb`,
    itemListElement: normalisedCrumbs.map((b, i) => ({
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

        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN'
        },

        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'INR'
        },

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
        ? `${product.name} is available in sizes: ${product.sizes.join(', ')}. Size chart is available on the product page.`
        : 'Please check the product page for available sizes.',
    },
    {
      q: `What is the fabric of ${product.name}?`,
      a: product.fabric
        ? `${product.name} is made from ${product.fabric}. We source premium fabrics to ensure comfort and durability.`
        : 'Please refer to the product description for fabric details.',
    },
    {
      q: `What is the price of ${product.name}?`,
      a: `${product.name} is priced at ₹${product.price}${product.comparePrice ? ` (original price ₹${product.comparePrice})` : ''}. Free shipping on orders above ₹999.`,
    },
    {
      q: 'What is your return policy?',
      a: 'We accept returns within 7 days of delivery on eligible items. Items must be unused and in original packaging. Refunds are processed within 5–7 business days. Visit our Refund Policy page for full details.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery takes 5–7 business days across India. Express delivery (2–3 days) is available at checkout. Orders are dispatched within 24–48 hours.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'SNERA accepts all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay payment gateway.',
    },
    {
      q: `Is ${product.name} available for cash on delivery?`,
      a: 'We currently support prepaid orders via card, UPI, and net banking for a smoother experience.',
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE}/product/${product.slug}#faq`,
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// ─── Generic FAQ (home page / shop page) ──────────────────────────────────────
export function genericFaqSchema(pageId = 'home') {
  const faqs = [
    {
      q: 'What is SNERA?',
      a: 'SNERA is a premium minimal Indian fashion brand offering essentials for men and women. Every piece is designed with a quiet confidence — crafted in India, built to last.',
    },
    {
      q: 'Does SNERA offer free shipping?',
      a: 'Yes. SNERA offers free standard shipping on all orders above ₹999 across India. Express delivery (2–3 business days) is also available at checkout.',
    },
    {
      q: 'What is SNERA\'s return and exchange policy?',
      a: 'SNERA accepts returns within 7 days of delivery for eligible items in original, unused condition. Refunds are processed within 5–7 business days to your original payment method. Sale items and customised products are not eligible.',
    },
    {
      q: 'How do I track my SNERA order?',
      a: 'You can track your order anytime on the Track Order page at snera.in/track-order using your order ID and registered email.',
    },
    {
      q: 'What payment methods does SNERA accept?',
      a: 'SNERA accepts all major credit/debit cards, UPI, net banking, and wallets via the Razorpay payment gateway. All transactions are secured with SSL encryption.',
    },
    {
      q: 'Does SNERA ship across India?',
      a: 'Yes, SNERA ships to all major cities and towns across India. International shipping is not available at this time.',
    },
    {
      q: 'How do I find the right size at SNERA?',
      a: 'Each product page includes available sizes. If you\'re between sizes, we recommend sizing up. You can also contact our team at contact@snera.in for guidance.',
    },
    {
      q: 'How can I contact SNERA customer support?',
      a: 'You can reach the SNERA team at contact@snera.in or via the Contact page at snera.in/contact. We respond within 24–48 hours, Monday to Saturday.',
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE}/#${pageId}-faq`,
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
export function webPageSchema({ name, description, url, dateModified, datePublished, breadcrumbId, type = 'WebPage' }) {
  const pageUrl = `${SITE}${url}`;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': `${SITE}/#organization` },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    breadcrumb: breadcrumbId ? { '@id': breadcrumbId } : undefined,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'ReadAction',
      target: [pageUrl],
    },
  };
}

// ─── Speakable schema (voice search / AI assistant) ──────────────────────────
export function speakableSchema(pageUrl, selectors = ['h1', 'h2', '.speakable']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE}${pageUrl}#speakable`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: selectors,
    },
    url: `${SITE}${pageUrl}`,
  };
}
export default function useSEO({
  type = 'webpage',
  product = null,
  products = [],
  breadcrumbs = [],
  pageUrl = '/',
  pageName = BRAND,
  pageDescription = '',
  categoryName = 'All Products',
  datePublished = null,
  dateModified = null,
  webPageType = 'WebPage',
}) {
  const schemas = [orgSchema(), websiteSchema()];

  const crumbSchema = breadcrumbSchema(breadcrumbs);
  if (crumbSchema) schemas.push(crumbSchema);

  // Derive breadcrumb @id for cross-reference in WebPage schema
  const normalisedLastUrl = breadcrumbs.length
    ? (breadcrumbs[breadcrumbs.length - 1].url.startsWith('/shop?')
      ? '/shop'
      : breadcrumbs[breadcrumbs.length - 1].url)
    : pageUrl;
  const breadcrumbId = crumbSchema ? `${SITE}${normalisedLastUrl}#breadcrumb` : undefined;

  schemas.push(webPageSchema({
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    datePublished,
    dateModified,
    breadcrumbId,
    type: webPageType,
  }));

  if (type === 'home') {
    schemas.push(clothingStoreSchema());
    schemas.push(genericFaqSchema('home'));
    schemas.push(speakableSchema('/', ['h1', 'h2', '.speakable', '#hero p']));
  }

  if (type === 'product' && product) {
    schemas.push(productSchema(product));
    schemas.push(faqSchema(product));
    schemas.push(speakableSchema(`/product/${product.slug}`, ['h1', '.product-desc', '.speakable']));
  }

  if (type === 'shop' && products.length) {
    schemas.push(itemListSchema(products, categoryName));
    schemas.push(genericFaqSchema('shop'));
  }

  return schemas.filter(Boolean);
}