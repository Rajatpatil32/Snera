import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';

const CATEGORIES = ['Fashion Tips', 'Care Guide', 'Trending', 'Lifestyle', 'Behind the Scenes'];

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  category: 'Fashion Tips',
  tags: '',
  author: 'SNERA Team',
  isPublished: false,
  relatedProducts: [],
  seo: {
    metaTitle: '', metaDescription: '', focusKeyword: '', keywords: '',
    ogTitle: '', ogDescription: '', ogImage: '', canonicalUrl: '', noIndex: false,
  },
};

export default function AdminBlogFormPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm]       = useState(emptyForm);
  const [allProducts, setAll] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    API.get('/products/admin/all').then(r => setAll(r.data.products || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    API.get(`/blog/admin/${id}`)
      .then(r => {
        const b = r.data;
        setForm({
          title: b.title || '',
          excerpt: b.excerpt || '',
          content: b.content || '',
          featuredImage: b.featuredImage || '',
          category: b.category || 'Fashion Tips',
          tags: (b.tags || []).join(', '),
          author: b.author || 'SNERA Team',
          isPublished: b.isPublished || false,
          relatedProducts: (b.relatedProducts || []).map(p => p._id || p),
          seo: {
            metaTitle: b.seo?.metaTitle || '', metaDescription: b.seo?.metaDescription || '',
            focusKeyword: b.seo?.focusKeyword || '', keywords: (b.seo?.keywords || []).join(', '),
            ogTitle: b.seo?.ogTitle || '', ogDescription: b.seo?.ogDescription || '',
            ogImage: b.seo?.ogImage || '', canonicalUrl: b.seo?.canonicalUrl || '',
            noIndex: b.seo?.noIndex || false,
          },
        });
      })
      .catch(() => setError('Failed to load blog post'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSeo = (k, v) => setForm(f => ({ ...f, seo: { ...f.seo, [k]: v } }));
  const toggleProduct = (pid) => setForm(f => ({
    ...f, relatedProducts: f.relatedProducts.includes(pid)
      ? f.relatedProducts.filter(x => x !== pid) : [...f.relatedProducts, pid],
  }));

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('featuredImage', res.data.url);
    } catch (err) {
      setError('Image upload failed: ' + (err.response?.data?.error || err.message));
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())          return setError('Title is required');
    if (!form.excerpt.trim())        return setError('Excerpt is required');
    if (!form.content.trim())        return setError('Content is required');
    if (!form.featuredImage)         return setError('Featured image is required');
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        seo: { ...form.seo, keywords: form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean) },
      };
      if (isEdit) {
        await API.put(`/blog/admin/${id}`, payload);
        setSuccess('Post updated!');
      } else {
        await API.post('/blog/admin', payload);
        setSuccess('Post created!');
        setTimeout(() => navigate('/admin/blog'), 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const label = { display: 'block', fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--stone,#666)', marginBottom: '.4rem' };
  const input = { width: '100%', padding: '.55rem .75rem', border: '1px solid var(--sand,#e8e3db)', fontSize: '.85rem', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box', background: 'var(--white,#fff)' };
  const card  = { border: '1px solid var(--sand,#e8e3db)', padding: '1.5rem', marginBottom: '1.25rem', background: 'var(--white,#fff)' };

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="loader-ring" />
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/blog')}
          style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone,#666)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: '.75rem' }}>
          ← Blog Posts
        </button>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.8rem' }}>
          {isEdit ? 'Edit Post' : 'New Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div>
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Post Content</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={label}>Title *</label>
                  <input style={input} value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. 5 Ways to Style an Oversized Tee" required />
                </div>

                <div>
                  <label style={label}>Excerpt * <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(short summary shown on cards, ~150 chars)</span></label>
                  <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }}
                    value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                    placeholder="One or two sentences that make someone want to click…" maxLength={220} />
                </div>

                <div>
                  <label style={label}>Content * <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(HTML — supports &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;ul&gt;&lt;li&gt;, &lt;a&gt;, &lt;img&gt;)</span></label>
                  <textarea style={{ ...input, minHeight: 320, resize: 'vertical', fontFamily: 'monospace', fontSize: '.8rem' }}
                    value={form.content} onChange={e => set('content', e.target.value)}
                    placeholder={'<p>Start writing your post…</p>\n<h2>A subheading</h2>\n<p>More content, <strong>bold text</strong>, etc.</p>'} />
                </div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Featured Image *</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {form.featuredImage && (
                  <img src={getImageUrl(form.featuredImage)} alt="preview" style={{ width: 100, height: 70, objectFit: 'cover', border: '1px solid var(--sand,#e8e3db)' }} />
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
                  onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} style={{ fontSize: '.75rem' }} />
                {uploading && <span style={{ fontSize: '.7rem', color: 'var(--stone2,#999)' }}>Uploading…</span>}
              </div>
            </div>

            {/* Related Products */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>Related Products</h3>
                  <p style={{ fontSize: '.68rem', color: 'var(--stone2,#999)', marginTop: '.15rem' }}>
                    {form.relatedProducts.length} selected — shown at the end of the post
                  </p>
                </div>
                {form.relatedProducts.length > 0 && (
                  <button type="button" onClick={() => set('relatedProducts', [])}
                    style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                    Clear all
                  </button>
                )}
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                style={{ ...input, marginBottom: '1rem' }} />
              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--sand,#e8e3db)' }}>
                {filteredProducts.length === 0 ? (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '.8rem' }}>No products found</p>
                ) : filteredProducts.map(p => {
                  const checked = form.relatedProducts.includes(p._id);
                  return (
                    <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem .9rem', cursor: 'pointer', borderBottom: '1px solid var(--sand,#e8e3db)', background: checked ? 'rgba(28,27,24,.03)' : 'transparent' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleProduct(p._id)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#1a1a1a' }} />
                      {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '.8rem', fontWeight: checked ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      </div>
                      {checked && <span style={{ color: '#2d7a3a', fontSize: '.7rem', flexShrink: 0 }}>✓</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SEO */}
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>SEO Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={label}>Meta Title <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(50-60 chars)</span></label>
                  <input style={input} value={form.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)}
                    placeholder={`${form.title || 'Post Title'} | SNERA Blog`} maxLength={80} />
                </div>
                <div>
                  <label style={label}>Meta Description <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(140-160 chars)</span></label>
                  <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={form.seo.metaDescription}
                    onChange={e => setSeo('metaDescription', e.target.value)} placeholder="Describe this post for search engines…" maxLength={200} />
                </div>
                <div>
                  <label style={label}>Focus Keyword</label>
                  <input style={input} value={form.seo.focusKeyword} onChange={e => setSeo('focusKeyword', e.target.value)}
                    placeholder="e.g. custom t-shirt printing india" />
                </div>
                <div>
                  <label style={label}>Keywords <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(comma-separated)</span></label>
                  <input style={input} value={form.seo.keywords} onChange={e => setSeo('keywords', e.target.value)}
                    placeholder="custom tees, oversized fit, cotton care" />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div>
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <div>
                  <label style={label}>Category</label>
                  <select style={input} value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Tags <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(comma-separated)</span></label>
                  <input style={input} value={form.tags} onChange={e => set('tags', e.target.value)}
                    placeholder="styling, oversized, cotton" />
                </div>
                <div>
                  <label style={label}>Author</label>
                  <input style={input} value={form.author} onChange={e => set('author', e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem', background: 'var(--off,#faf9f7)', border: '1px solid var(--sand,#e8e3db)' }}>
                  <div>
                    <p style={{ fontSize: '.78rem', fontWeight: 500 }}>Published</p>
                    <p style={{ fontSize: '.65rem', color: '#999', marginTop: '.1rem' }}>Visible on the public blog</p>
                  </div>
                  <button type="button" onClick={() => set('isPublished', !form.isPublished)} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: form.isPublished ? 'var(--ink,#1a1a1a)' : 'var(--sand,#e8e3db)',
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: form.isPublished ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>
              </div>
            </div>

            <div style={card}>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '.75rem', marginBottom: '1rem', fontSize: '.78rem', color: '#991B1B' }}>{error}</div>
              )}
              {success && (
                <div style={{ background: 'rgba(61,122,86,.08)', border: '1px solid rgba(61,122,86,.3)', padding: '.75rem', marginBottom: '1rem', fontSize: '.78rem', color: '#2d7a3a' }}>{success}</div>
              )}
              <button type="submit" disabled={saving} style={{
                width: '100%', padding: '.75rem', background: 'var(--ink,#1a1a1a)', color: '#fff',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase',
                fontFamily: 'var(--sans)', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving…' : isEdit ? 'Update Post' : form.isPublished ? 'Publish Post' : 'Save Draft'}
              </button>
              <button type="button" onClick={() => navigate('/admin/blog')} style={{
                width: '100%', padding: '.65rem', background: 'none',
                border: '1px solid var(--sand,#e8e3db)', cursor: 'pointer', marginTop: '.65rem',
                fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase',
                fontFamily: 'var(--sans)', color: 'var(--stone,#666)',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`@media(max-width:768px){form>div{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}