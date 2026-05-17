import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title = 'SNERA — Premium Essentials',
  description = 'Premium essentials crafted for those who believe the quietest statement is often the loudest. Shop SNERA — minimal, timeless fashion.',
  image = 'https://snera.in/og-image.jpg',
  url = 'https://snera.in',
  product = null,    // pass Product object for product structured data
  breadcrumbs = [], // [{ name, url }]
  schemas = [],     // extra JSON-LD schemas from useSEO hook
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
  const canonical       = product?.seo?.canonicalUrl    || url;
  const noIndex         = product?.seo?.noIndex         || false;

  // ── Product structured data ───────────────────────────────────────────────
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://snera.in/product/${product.slug}#product`,
    name: metaTitle,
    description: metaDescription,
    image: (() => {
      const imgs = product.colorGroups?.length
        ? product.colorGroups.flatMap(g => g.images || [])
        : product.images || [];
      return imgs.length
        ? imgs.map(i => i.startsWith('http') ? i : `https://snera.in${i}`)
        : ['https://snera.in/og-image.jpg'];
    })(),
    sku: product._id,
    ...(product.fabric && { material: product.fabric }),
    brand: { '@type': 'Brand', name: 'SNERA', '@id': 'https://snera.in/#organization' },
    offers: {
      '@type': 'Offer',
      '@id': `https://snera.in/product/${product.slug}#offer`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.isActive !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://snera.in/product/${product.slug}`,
      seller: { '@id': 'https://snera.in/#organization' },
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
  } : null;

  // ── Breadcrumb structured data ────────────────────────────────────────────
  const breadcrumbSchema = breadcrumbs.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `https://snera.in${b.url}`,
    })),
  } : null;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />

      {/* Robots — noIndex controlled per-product from admin SEO settings */}
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
      <meta property="og:url"          content={canonical} />
      <meta property="og:site_name"    content="SNERA" />
      <meta property="og:locale"       content="en_IN" />

      {/* Product pricing for Facebook/Meta shopping */}
      {product && <meta property="product:price:amount"   content={product.price} />}
      {product && <meta property="product:price:currency" content="INR" />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@snera_official" />
      <meta name="twitter:title"       content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image"       content={image} />

      {/* Structured Data — schemas from useSEO hook (org, website, webpage, FAQ, itemList) */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}

      {/* Structured Data — product + breadcrumb (built from props) */}
      {productSchema    && <script type="application/ld+json">{JSON.stringify(productSchema)}</script>}
      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
    </Helmet>
  );
}