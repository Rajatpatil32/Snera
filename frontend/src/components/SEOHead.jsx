import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title = 'SNERA — Premium Essentials',
  description = 'Premium essentials crafted for those who believe the quietest statement is often the loudest. Shop SNERA — minimal, timeless fashion.',
  image = 'https://snera.in/og-image.jpg',
  url = 'https://snera.in',
  product = null,    // pass Product object for product structured data
  breadcrumbs = [], // [{ name, url }]
}) {
  const fullTitle = title.includes('SNERA') ? title : `${title} — SNERA`;

  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map(i => `https://snera.in${i}`) || [],
    sku: product._id,
    brand: { '@type': 'Brand', name: 'SNERA' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: `${url}/product/${product.slug}`,
    }
  } : null;

  const breadcrumbSchema = breadcrumbs.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `https://snera.in${b.url}`
    }))
  } : null;

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SNERA',
    url: 'https://snera.in',
    logo: 'https://snera.in/logo.png',
    sameAs: ['https://instagram.com/sneraofficial']
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content={product ? 'product' : 'website'} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:url"         content={url} />
      <meta property="og:site_name"   content="SNERA" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      {productSchema   && <script type="application/ld+json">{JSON.stringify(productSchema)}</script>}
      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
    </Helmet>
  );
}
