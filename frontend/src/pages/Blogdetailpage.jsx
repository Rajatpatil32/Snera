import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import API from '../utils/api';
import { getImageUrl } from '../utils/api';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog]           = useState(null);
  const [related, setRelated]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    API.get(`/blog/slug/${slug}`)
      .then(r => {
        setBlog(r.data);
        return API.get(`/blog?category=${encodeURIComponent(r.data.category)}&limit=3`);
      })
      .then(r => setRelated(r.data.data.filter(b => b.slug !== slug)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader-ring"/>
    </div>
  );
  if (!blog) return (
    <div style={{ paddingTop: 'var(--nav-h)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p>Post not found.</p>
      <Link to="/blog" style={{ fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--ink)' }}>← Back to Blog</Link>
    </div>
  );

  const seo = blog.seo || {};

  return (
    <>
      <Helmet>
        <title>{seo.metaTitle || blog.title} | SNERA</title>
        <meta name="description" content={seo.metaDescription || blog.excerpt} />
        <meta property="og:title" content={seo.ogTitle || blog.title} />
        <meta property="og:description" content={seo.ogDescription || blog.excerpt} />
        <meta property="og:image" content={seo.ogImage || blog.featuredImage} />
        <meta property="og:type" content="article" />
        {seo.canonicalUrl && <link rel="canonical" href={seo.canonicalUrl} />}
        {seo.noIndex && <meta name="robots" content="noindex" />}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: blog.title, description: blog.excerpt,
          image: blog.featuredImage,
          author: { '@type': 'Organization', name: blog.author || 'SNERA' },
          datePublished: blog.publishedAt, dateModified: blog.updatedAt,
          publisher: { '@type': 'Organization', name: 'SNERA', logo: { '@type': 'ImageObject', url: 'https://snera.in/images/logo.png' } }
        })}</script>
      </Helmet>

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero Image */}
        <div style={{ height: 'clamp(280px,45vw,520px)', overflow: 'hidden', position: 'relative' }}>
          <img src={blog.featuredImage} alt={blog.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55))',
            display: 'flex', alignItems: 'flex-end',
            padding: 'clamp(1.5rem,4vw,3rem)'
          }}>
            <div>
              <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginBottom: '.5rem' }}>
                {blog.category} · {blog.readTime} min read
              </p>
              <h1 style={{
                fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,4vw,2.8rem)',
                fontWeight: 300, color: '#fff', maxWidth: 700, lineHeight: 1.3
              }}>{blog.title}</h1>
              <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.6)', marginTop: '.5rem' }}>
                {blog.author} · {new Date(blog.publishedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(1.5rem,4vw,3rem)', display: 'grid', gridTemplateColumns: '1fr 260px', gap: '3rem' }} className="blog-detail-grid">
          {/* Article */}
          <article>
            <div
              style={{ lineHeight: 1.9, fontSize: '.9rem', color: 'var(--stone,#555)' }}
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--sand,#e8e3db)' }}>
                {blog.tags.map(tag => (
                  <Link key={tag} to={`/blog?tag=${tag}`} style={{
                    display: 'inline-block', marginRight: '.5rem', marginBottom: '.5rem',
                    padding: '.25rem .75rem', border: '1px solid var(--sand,#e8e3db)',
                    fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase',
                    color: 'var(--stone2,#999)', textDecoration: 'none'
                  }}>#{tag}</Link>
                ))}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <Link to="/blog" style={{ fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--ink)' }}>
                ← Back to Blog
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside>
            {/* Share */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '1rem' }}>Share</p>
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                {[
                  ['Twitter / X', `https://twitter.com/intent/tweet?url=${window.location.href}&text=${encodeURIComponent(blog.title)}`],
                  ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`],
                  ['Pinterest', `https://pinterest.com/pin/create/button/?url=${window.location.href}&description=${encodeURIComponent(blog.excerpt)}`],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase',
                    padding: '.4rem .75rem', border: '1px solid var(--sand,#e8e3db)',
                    color: 'var(--ink)', textDecoration: 'none'
                  }}>{label}</a>
                ))}
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} style={{
                  fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase',
                  padding: '.4rem .75rem', border: '1px solid var(--sand,#e8e3db)',
                  color: 'var(--ink)', background: 'none', cursor: 'pointer'
                }}>Copy Link</button>
              </div>
            </div>

            {/* Related Products */}
            {blog.relatedProducts?.length > 0 && (
              <div>
                <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '1rem' }}>Featured Products</p>
                {blog.relatedProducts.map(product => (
                  <Link key={product._id} to={`/product/${product.slug}`} style={{
                    display: 'flex', gap: '.75rem', alignItems: 'center',
                    marginBottom: '1rem', textDecoration: 'none', color: 'inherit'
                  }}>
                    <img src={getImageUrl(product.images?.[0])} alt={product.name}
                      style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '.75rem', fontWeight: 500 }}>{product.name}</p>
                      <p style={{ fontSize: '.7rem', color: 'var(--stone2,#999)' }}>₹{product.price?.toLocaleString('en-IN')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section style={{ borderTop: '1px solid var(--sand,#e8e3db)', padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,4vw,3rem)', background: 'var(--off,#faf9f7)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <p style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '2rem', textAlign: 'center' }}>More from {blog.category}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '2rem' }}>
                {related.slice(0, 3).map(post => (
                  <Link key={post._id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={post.featuredImage} alt={post.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', marginBottom: '.75rem' }} />
                    <p style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '.4rem' }}>{post.readTime} min read</p>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 400 }}>{post.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .blog-detail-grid { grid-template-columns: 1fr 260px; }
        @media(max-width:768px){ .blog-detail-grid { grid-template-columns: 1fr; } }
        .blog-detail-grid article img { max-width: 100%; height: auto; }
        .blog-detail-grid article h2,.blog-detail-grid article h3 { font-family: var(--serif); font-weight: 400; }
        .blog-detail-grid article blockquote { border-left: 2px solid var(--ink); padding-left: 1rem; font-style: italic; color: var(--stone2,#999); }
      `}</style>
    </>
  );
}