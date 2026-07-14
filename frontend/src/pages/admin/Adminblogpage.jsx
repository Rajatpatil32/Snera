import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

export default function AdminBlogPage() {
  const [blogs, setBlogs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotal]  = useState(1);

  const fetch = async (p = page) => {
    setLoading(true);
    try {
      const r = await API.get(`/blog/admin/all?page=${p}&limit=10`);
      setBlogs(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(page); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    await API.delete(`/blog/admin/${id}`);
    setBlogs(blogs.filter(b => b._id !== id));
  };

  const handlePublish = async (id, current) => {
    const r = await API.patch(`/blog/admin/${id}/publish`, { isPublished: !current });
    setBlogs(blogs.map(b => b._id === id ? r.data : b));
  };

  const filtered = blogs.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'published' ? b.isPublished : !b.isPublished);
    return matchSearch && matchFilter;
  });

  const TH = { fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone2,#999)', padding: '.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--sand,#e8e3db)', fontWeight: 400 };
  const TD = { padding: '.75rem 1rem', fontSize: '.8rem', verticalAlign: 'middle', borderBottom: '1px solid var(--sand,#e8e3db)' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.6rem' }}>Blog Posts</h1>
          <p style={{ color: 'var(--stone2,#999)', fontSize: '.8rem', marginTop: '.25rem' }}>Manage articles and SEO content</p>
        </div>
        <Link to="/admin/blog/new" style={{
          display: 'inline-block', padding: '.6rem 1.25rem',
          background: 'var(--ink,#1a1a1a)', color: '#fff',
          fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none'
        }}>+ New Post</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search posts…"
          style={{ padding: '.5rem .75rem', border: '1px solid var(--sand,#e8e3db)', fontSize: '.8rem', minWidth: 200, outline: 'none' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '.5rem .75rem', border: '1px solid var(--sand,#e8e3db)', fontSize: '.8rem', background: '#fff', outline: 'none' }}>
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--stone2,#999)' }}>Loading…</p> : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Title</th>
                <th style={TH}>Category</th>
                <th style={TH}>Status</th>
                <th style={TH}>Views</th>
                <th style={TH}>Date</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td style={TD}>
                    <strong style={{ display: 'block', marginBottom: '.2rem' }}>{b.title}</strong>
                    <span style={{ fontSize: '.72rem', color: 'var(--stone2,#999)' }}>{b.excerpt?.slice(0,60)}…</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', padding: '.25rem .5rem', border: '1px solid var(--sand,#e8e3db)' }}>{b.category}</span>
                  </td>
                  <td style={TD}>
                    <button onClick={() => handlePublish(b._id, b.isPublished)}
                      style={{
                        padding: '.25rem .75rem', fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase',
                        border: 'none', cursor: 'pointer',
                        background: b.isPublished ? '#e6f4ea' : '#fef3cd',
                        color: b.isPublished ? '#2d7a3a' : '#856404'
                      }}>
                      {b.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td style={{ ...TD, color: 'var(--stone2,#999)' }}>{b.views || 0}</td>
                  <td style={{ ...TD, color: 'var(--stone2,#999)', fontSize: '.72rem' }}>
                    {new Date(b.publishedAt || b.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <Link to={`/admin/blog/${b._id}/edit`} style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink)', borderBottom: '1px solid var(--ink)' }}>Edit</Link>
                      <a href={`/blog/${b.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone2,#999)', borderBottom: '1px solid var(--stone2,#999)' }}>View</a>
                      <button onClick={() => handleDelete(b._id)} style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #c0392b' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                style={{ fontSize: '.66rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: '.7rem', color: 'var(--stone2,#999)' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                style={{ fontSize: '.66rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}