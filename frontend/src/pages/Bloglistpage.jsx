import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import API from '../utils/api';

export default function BlogListPage() {
  const [blogs, setBlogs]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage        = parseInt(searchParams.get('page')) || 1;
  const selectedCategory   = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    let url = `/blog?page=${currentPage}&limit=9`;
    if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
    API.get(url)
      .then(r => { setBlogs(r.data.data); setPagination(r.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    API.get('/blog/categories/list').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const setCategory = (cat) => setSearchParams(cat ? { category: cat, page: 1 } : {});
  const goPage      = (p)   => setSearchParams(selectedCategory ? { category: selectedCategory, page: p } : { page: p });

  return (
    <>
      <Helmet>
        <title>Fashion &amp; Style Blog | SNERA</title>
        <meta name="description" content="Discover fashion tips, care guides, style inspiration and behind-the-scenes stories from SNERA." />
        <link rel="canonical" href="https://snera.in/blog" />
        {(currentPage > 1 || selectedCategory) && <meta name="robots" content="noindex, follow" />}
        {blogs.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': 'https://snera.in/blog#collection',
            name: 'SNERA Blog',
            description: 'Fashion tips, fabric care guides, and behind-the-scenes stories from SNERA.',
            url: 'https://snera.in/blog',
            isPartOf: { '@id': 'https://snera.in/#website' },
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: blogs.map((b, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `https://snera.in/blog/${b.slug}`,
                name: b.title,
              })),
            },
          })}</script>
        )}
      </Helmet>

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        <div style={{
          background: 'var(--off, #faf9f7)',
          padding: 'clamp(3rem,8vw,6rem) clamp(1.25rem,4vw,3rem)',
          textAlign: 'center',
          borderBottom: '1px solid var(--sand, #e8e3db)'
        }}>
          <p style={{ fontSize: '.66rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone2, #999)', marginBottom: '.75rem' }}>Journal</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 300, letterSpacing: '.04em', color: 'var(--ink, #1a1a1a)' }}>
            Stories &amp; Style
          </h1>
        </div>

        <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto', padding: 'clamp(1.25rem,4vw,3rem)' }}>
          {/* Sidebar */}
          <aside style={{ width: 200, flexShrink: 0, marginRight: '3rem' }} className="blog-sidebar-hide">
            <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '1rem' }}>Categories</p>
            <button
              onClick={() => setCategory('')}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '.4rem 0',
                fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase',
                color: !selectedCategory ? 'var(--ink)' : 'var(--stone2,#999)',
                background: 'none', border: 'none', cursor: 'pointer', borderBottom: !selectedCategory ? '1px solid var(--ink)' : '1px solid transparent'
              }}
            >All Posts ({pagination.count})</button>
            {categories.map(cat => (
              <button key={cat.name}
                onClick={() => setCategory(cat.name)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '.4rem 0',
                  fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase',
                  color: selectedCategory === cat.name ? 'var(--ink)' : 'var(--stone2,#999)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: selectedCategory === cat.name ? '1px solid var(--ink)' : '1px solid transparent'
                }}
              >{cat.name} ({cat.count})</button>
            ))}
          </aside>

          {/* Main */}
          <main style={{ flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--stone2,#999)' }}>Loading…</div>
            ) : blogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <p style={{ color: 'var(--stone2,#999)', marginBottom: '1rem' }}>No posts found.</p>
                <button onClick={() => setCategory('')} style={{ fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--ink)' }}>View all posts</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '2rem' }}>
                  {blogs.map(blog => (
                    <article key={blog._id} style={{ borderBottom: '1px solid var(--sand,#e8e3db)', paddingBottom: '1.5rem' }}>
                      <Link to={`/blog/${blog.slug}`}>
                        <div style={{ aspectRatio: '16/9', overflow: 'hidden', marginBottom: '1rem' }}>
                          <img src={blog.featuredImage} alt={blog.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </div>
                      </Link>
                      <p style={{ fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--stone2,#999)', marginBottom: '.5rem' }}>
                        {blog.category} · {blog.readTime} min read
                      </p>
                      <Link to={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.4, marginBottom: '.75rem' }}>{blog.title}</h2>
                      </Link>
                      <p style={{ fontSize: '.82rem', color: 'var(--stone2,#999)', lineHeight: 1.7, marginBottom: '1rem' }}>
                        {blog.excerpt.length > 120 ? blog.excerpt.slice(0, 120) + '…' : blog.excerpt}
                      </p>
                      <Link to={`/blog/${blog.slug}`} style={{
                        fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase',
                        color: 'var(--ink)', borderBottom: '1px solid var(--ink)', paddingBottom: '2px'
                      }}>Read More</Link>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                    <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}
                      style={{ fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}>← Prev</button>
                    <span style={{ fontSize: '.7rem', color: 'var(--stone2,#999)' }}>{currentPage} / {pagination.total}</span>
                    <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === pagination.total}
                      style={{ fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', opacity: currentPage === pagination.total ? 0.4 : 1 }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <style>{`@media(max-width:768px){.blog-sidebar-hide{display:none}}`}</style>
    </>
  );
}