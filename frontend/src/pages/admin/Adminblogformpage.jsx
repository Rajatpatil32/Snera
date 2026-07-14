import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../utils/api';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  icon: '',
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
  products: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: '',
  },
};

export default function AdminCollectionFormPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm]         = useState(emptyForm);
  const [allProducts, setAll]   = useState([]);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [search, setSearch]     = useState('');

  // Load all products for the multi-select
  useEffect(() => {
    API.get('/products/admin/all')
      .then(r => setAll(r.data.products || []))
      .catch(() => {});
  }, []);

  // Load collection if editing
  useEffect(() => {
    if (!isEdit) return;
    API.get('/collections/admin/all')
      .then(r => {
        const col = r.data.find(c => c._id === id);
        if (!col) return;
        setForm({
          name:         col.name         || '',
          description:  col.description  || '',
          image:        col.image        || '',
          icon:         col.icon         || '',
          displayOrder: col.displayOrder || 0,
          isActive:     col.isActive     ?? true,
          isFeatured:   col.isFeatured   || false,
          products:     (col.products || []).map(p => p._id || p),
          seo: {
            metaTitle:       col.seo?.metaTitle       || '',
            metaDescription: col.seo?.metaDescription || '',
            keywords:        col.seo?.keywords        || [],
            ogTitle:         col.seo?.ogTitle         || '',
            ogDescription:   col.seo?.ogDescription   || '',
            ogImage:         col.seo?.ogImage         || '',
            canonicalUrl:    col.seo?.canonicalUrl    || '',
          },
        });
      })
      .catch(() => setError('Failed to load collection'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSeo = (k, v) => setForm(f => ({ ...f, seo: { ...f.seo, [k]: v } }));

  const toggleProduct = (pid) => {
    setForm(f => ({
      ...f,
      products: f.products.includes(pid)
        ? f.products.filter(x => x !== pid)
        : [...f.products, pid],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Collection name is required');
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        seo: {
          ...form.seo,
          keywords: typeof form.seo.keywords === 'string'
            ? form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean)
            : form.seo.keywords,
        },
      };
      if (isEdit) {
        await API.put(`/collections/admin/${id}`, payload);
        setSuccess('Collection updated!');
      } else {
        await API.post('/collections/admin', payload);
        setSuccess('Collection created!');
        setTimeout(() => navigate('/admin/collections'), 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Styles ──
  const label = {
    display: 'block', fontSize: '.6rem', letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--stone,#666)', marginBottom: '.4rem',
  };
  const input = {
    width: '100%', padding: '.55rem .75rem',
    border: '1px solid var(--sand,#e8e3db)', fontSize: '.85rem',
    outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box',
    background: 'var(--white,#fff)',
  };
  const card = {
    border: '1px solid var(--sand,#e8e3db)',
    padding: '1.5rem', marginBottom: '1.25rem',
    background: 'var(--white,#fff)',
  };

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="loader-ring" />
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/collections')}
          style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone,#666)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: '.75rem' }}>
          ← Collections
        </button>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.8rem' }}>
          {isEdit ? 'Edit Collection' : 'New Collection'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div>

            {/* Basic Info */}
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Basic Information</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={label}>Collection Name *</label>
                  <input style={input} value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Summer Essentials" required />
                </div>

                <div>
                  <label style={label}>Description</label>
                  <textarea style={{ ...input, minHeight: 80, resize: 'vertical' }}
                    value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Describe what makes this collection special…" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.75rem' }}>
                  <div>
                    <label style={label}>Banner Image URL</label>
                    <input style={input} value={form.image} onChange={e => set('image', e.target.value)}
                      placeholder="https://…" type="url" />
                  </div>
                  <div>
                    <label style={label}>Icon / Emoji</label>
                    <input style={{ ...input, width: 64, textAlign: 'center', fontSize: '1.4rem', padding: '.3rem' }}
                      value={form.icon} onChange={e => set('icon', e.target.value)}
                      placeholder="👗" maxLength={2} />
                  </div>
                </div>

                {/* Image preview */}
                {form.image && (
                  <div style={{ height: 140, overflow: 'hidden', border: '1px solid var(--sand,#e8e3db)' }}>
                    <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>Products</h3>
                  <p style={{ fontSize: '.68rem', color: 'var(--stone2,#999)', marginTop: '.15rem' }}>
                    {form.products.length} selected
                  </p>
                </div>
                {form.products.length > 0 && (
                  <button type="button" onClick={() => set('products', [])}
                    style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                    Clear all
                  </button>
                )}
              </div>

              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{ ...input, marginBottom: '1rem' }}
              />

              <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--sand,#e8e3db)' }}>
                {filteredProducts.length === 0 ? (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '.8rem' }}>No products found</p>
                ) : filteredProducts.map(p => {
                  const checked = form.products.includes(p._id);
                  return (
                    <label key={p._id} style={{
                      display: 'flex', alignItems: 'center', gap: '.75rem',
                      padding: '.6rem .9rem', cursor: 'pointer',
                      borderBottom: '1px solid var(--sand,#e8e3db)',
                      background: checked ? 'rgba(28,27,24,.03)' : 'transparent',
                      transition: 'background .15s',
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleProduct(p._id)}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#1a1a1a' }} />
                      {p.images?.[0] && (
                        <img src={p.images[0].startsWith('http') ? p.images[0] : p.images[0]}
                          alt="" style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '.8rem', fontWeight: checked ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: '.68rem', color: '#999' }}>₹{p.price?.toLocaleString('en-IN')} · {p.category}</p>
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
                  <input style={{ ...input, borderColor: form.seo.metaTitle.length > 60 ? '#dc2626' : undefined }}
                    value={form.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)}
                    placeholder={`${form.name || 'Collection Name'} | SNERA`} maxLength={80} />
                  <p style={{ fontSize: '.62rem', color: form.seo.metaTitle.length > 60 ? '#dc2626' : '#bbb', marginTop: '.25rem' }}>
                    {form.seo.metaTitle.length}/60
                  </p>
                </div>

                <div>
                  <label style={label}>Meta Description <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(140-160 chars)</span></label>
                  <textarea style={{ ...input, minHeight: 70, resize: 'vertical', borderColor: form.seo.metaDescription.length > 160 ? '#dc2626' : undefined }}
                    value={form.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)}
                    placeholder="Describe this collection for search engines…" maxLength={200} />
                  <p style={{ fontSize: '.62rem', color: form.seo.metaDescription.length > 160 ? '#dc2626' : '#bbb', marginTop: '.25rem' }}>
                    {form.seo.metaDescription.length}/160
                  </p>
                </div>

                <div>
                  <label style={label}>Keywords <span style={{ textTransform: 'none', letterSpacing: 0, color: '#bbb' }}>(comma-separated)</span></label>
                  <input style={input}
                    value={Array.isArray(form.seo.keywords) ? form.seo.keywords.join(', ') : form.seo.keywords}
                    onChange={e => setSeo('keywords', e.target.value)}
                    placeholder="summer collection, cotton tops, snera fashion" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div>
                    <label style={label}>OG Title</label>
                    <input style={input} value={form.seo.ogTitle} onChange={e => setSeo('ogTitle', e.target.value)}
                      placeholder="OG title for social shares" />
                  </div>
                  <div>
                    <label style={label}>OG Image URL</label>
                    <input style={input} value={form.seo.ogImage} onChange={e => setSeo('ogImage', e.target.value)}
                      placeholder="https://…" type="url" />
                  </div>
                </div>

                <div>
                  <label style={label}>Canonical URL</label>
                  <input style={input} value={form.seo.canonicalUrl} onChange={e => setSeo('canonicalUrl', e.target.value)}
                    placeholder={`https://snera.in/collection/${form.name.toLowerCase().replace(/\s+/g,'-') || 'slug'}`}
                    type="url" />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div>

            {/* Settings */}
            <div style={card}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Settings</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <div>
                  <label style={label}>Display Order</label>
                  <input style={input} type="number" value={form.displayOrder}
                    onChange={e => set('displayOrder', Number(e.target.value))} min={0} />
                  <p style={{ fontSize: '.62rem', color: '#bbb', marginTop: '.25rem' }}>Lower = shown first</p>
                </div>

                {/* Active toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem', background: 'var(--off,#faf9f7)', border: '1px solid var(--sand,#e8e3db)' }}>
                  <div>
                    <p style={{ fontSize: '.78rem', fontWeight: 500 }}>Active</p>
                    <p style={{ fontSize: '.65rem', color: '#999', marginTop: '.1rem' }}>Visible in navbar & shop</p>
                  </div>
                  <button type="button" onClick={() => set('isActive', !form.isActive)} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: form.isActive ? 'var(--ink,#1a1a1a)' : 'var(--sand,#e8e3db)',
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: form.isActive ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>

                {/* Featured toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem', background: 'var(--off,#faf9f7)', border: '1px solid var(--sand,#e8e3db)' }}>
                  <div>
                    <p style={{ fontSize: '.78rem', fontWeight: 500 }}>Featured</p>
                    <p style={{ fontSize: '.65rem', color: '#999', marginTop: '.1rem' }}>Show on homepage</p>
                  </div>
                  <button type="button" onClick={() => set('isFeatured', !form.isFeatured)} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: form.isFeatured ? 'var(--ink,#1a1a1a)' : 'var(--sand,#e8e3db)',
                    position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: form.isFeatured ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Selected products summary */}
            {form.products.length > 0 && (
              <div style={card}>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '.9rem', marginBottom: '.85rem' }}>
                  Selected ({form.products.length})
                </h3>
                {form.products.slice(0, 5).map(pid => {
                  const p = allProducts.find(x => x._id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.6rem' }}>
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" style={{ width: 32, height: 32, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <p style={{ fontSize: '.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <button type="button" onClick={() => toggleProduct(pid)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1rem', flexShrink: 0 }}>×</button>
                    </div>
                  );
                })}
                {form.products.length > 5 && (
                  <p style={{ fontSize: '.68rem', color: '#999' }}>+{form.products.length - 5} more selected</p>
                )}
              </div>
            )}

            {/* Save */}
            <div style={card}>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '.75rem', marginBottom: '1rem', fontSize: '.78rem', color: '#991B1B' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(61,122,86,.08)', border: '1px solid rgba(61,122,86,.3)', padding: '.75rem', marginBottom: '1rem', fontSize: '.78rem', color: '#2d7a3a' }}>
                  {success}
                </div>
              )}
              <button type="submit" disabled={saving} style={{
                width: '100%', padding: '.75rem', background: 'var(--ink,#1a1a1a)', color: '#fff',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase',
                fontFamily: 'var(--sans)', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving…' : isEdit ? 'Update Collection' : 'Create Collection'}
              </button>
              <button type="button" onClick={() => navigate('/admin/collections')} style={{
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