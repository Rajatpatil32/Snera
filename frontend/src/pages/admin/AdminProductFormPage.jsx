import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../../utils/api';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const GENDERS    = ['Men', 'Women', 'Unisex'];
const SIZES_ALL  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BADGES     = ['', 'New', 'Sale'];
const GLYPHS     = ['◈', '◇', '△', '◯', '⬡', '◻', '◆'];

const defaultForm = {
  name: '', category: 'Tops', gender: 'Unisex',
  price: '', comparePrice: '',
  description: '', fabric: '', careInstructions: '',
  sizes: ['S', 'M', 'L', 'XL'], soldSizes: [],
  glyph: '◈', badge: 'New',
  isActive: true, isFeatured: false,
  tags: '', weight: 220,
  images: [],
};

export default function AdminProductFormPage() {
  const { id }    = useParams();   // undefined = create, has value = edit
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);

  const [form,      setForm]      = useState(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  // Load product if editing
  useEffect(() => {
    if (!isEdit) return;
    API.get(`/products/admin/all`)
      .then(r => {
        const p = r.data.products.find(x => x._id === id);
        if (!p) return;
        setForm({
          ...defaultForm, ...p,
          price: p.price || '',
          comparePrice: p.comparePrice || '',
          tags: (p.tags || []).join(', '),
        });
      });
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleSize = (sz, field) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(sz)
        ? f[field].filter(s => s !== sz)
        : [...f[field], sz]
    }));
  };

  // Upload images to backend
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const r = await API.post('/upload/multiple', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, images: [...f.images, ...r.data.urls] }));
    } catch (err) {
      setError('Image upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from, to) => {
    setForm(f => {
      const imgs = [...f.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...f, images: imgs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');

    // Validate
    if (!form.name.trim())        return setError('Product name is required'), setSaving(false);
    if (!form.price || isNaN(+form.price)) return setError('Valid price is required'), setSaving(false);
    if (!form.description.trim()) return setError('Description is required'),   setSaving(false);

    const payload = {
      ...form,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      tags:         form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      if (isEdit) {
        await API.put(`/products/${id}`, payload);
        setSuccess('✓ Product updated successfully');
      } else {
        await API.post('/products', payload);
        setSuccess('✓ Product created successfully');
        setTimeout(() => navigate('/admin/products'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <button
            onClick={() => navigate('/admin/products')}
            style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}
          >← Back to Products</button>
          <h1 className="admin-title" style={{ marginTop: '.4rem' }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Basic info */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. SNERA Essential Tee" required/>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the product..." style={{ minHeight: 100 }}/>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fabric</label>
                    <input className="form-input" value={form.fabric} onChange={e => set('fabric', e.target.value)} placeholder="e.g. 100% Cotton, 220 GSM"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Care Instructions</label>
                    <input className="form-input" value={form.careInstructions} onChange={e => set('careInstructions', e.target.value)} placeholder="e.g. Machine wash cold"/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. tee, essential, summer"/>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Sizes</h3>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ marginBottom: '.5rem' }}>Available Sizes</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {SIZES_ALL.map(sz => (
                    <button
                      key={sz} type="button"
                      onClick={() => toggleSize(sz, 'sizes')}
                      style={{
                        width: 42, height: 42, border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--sans)', fontSize: '.72rem', fontWeight: 500,
                        background: form.sizes.includes(sz) ? 'var(--ink)' : 'transparent',
                        color:      form.sizes.includes(sz) ? 'var(--white)' : 'var(--stone2)',
                        borderColor:form.sizes.includes(sz) ? 'var(--ink)' : 'var(--sand)',
                        transition: 'all var(--t)'
                      }}
                    >{sz}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '.5rem', color: 'var(--error)' }}>Sold Out Sizes</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {form.sizes.map(sz => (
                    <button
                      key={sz} type="button"
                      onClick={() => toggleSize(sz, 'soldSizes')}
                      style={{
                        width: 42, height: 42, border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--sans)', fontSize: '.72rem', fontWeight: 500,
                        background: form.soldSizes.includes(sz) ? '#FEE2E2' : 'transparent',
                        color:      form.soldSizes.includes(sz) ? 'var(--error)' : 'var(--stone2)',
                        borderColor:form.soldSizes.includes(sz) ? '#FECACA' : 'var(--sand)',
                        transition: 'all var(--t)'
                      }}
                    >{sz}</button>
                  ))}
                </div>
                <p style={{ fontSize: '.65rem', color: 'var(--stone)', marginTop: '.4rem' }}>
                  Selected sizes will show as crossed out on the storefront.
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Product Images</h3>

              {/* Image grid */}
              {form.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '.75rem', marginBottom: '1rem' }}>
                  {form.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--off)', overflow: 'hidden' }}>
                      <img src={getImageUrl(img)} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>

                      {/* Controls overlay */}
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '.35rem', opacity: 0, transition: 'opacity .2s'
                      }} className="img-overlay">
                        {i > 0 && (
                          <button type="button" onClick={() => moveImage(i, i - 1)} style={{
                            background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer',
                            fontSize: '.6rem', padding: '.2rem .5rem', letterSpacing: '.1em'
                          }}>← Move</button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} style={{
                          background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer',
                          fontSize: '.6rem', padding: '.2rem .5rem', letterSpacing: '.1em'
                        }}>Remove</button>
                      </div>

                      {i === 0 && (
                        <span style={{
                          position: 'absolute', top: 4, left: 4,
                          background: 'var(--ink)', color: 'var(--white)',
                          fontSize: '.48rem', letterSpacing: '.12em', padding: '.15rem .4rem'
                        }}>PRIMARY</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '.6rem', padding: '1.75rem', border: '1.5px dashed var(--sand2)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? 'var(--off)' : 'transparent',
                transition: 'background .2s'
              }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleImageUpload} disabled={uploading}/>
                <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.5 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize: '.72rem', color: 'var(--stone)', textAlign: 'center', letterSpacing: '.04em' }}>
                  {uploading ? 'Uploading...' : 'Click to upload images (JPEG, PNG, WebP · max 5MB each)'}
                </span>
              </label>

              <style>{`.img-overlay:hover { opacity: 1 !important; } div:hover > .img-overlay { opacity: 1; }`}</style>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Pricing */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Pricing</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1299" min="0" step="1" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Compare Price (₹)</label>
                  <input className="form-input" type="number" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} placeholder="1599 (optional)" min="0" step="1"/>
                  <p style={{ fontSize: '.65rem', color: 'var(--stone)', marginTop: '.3rem' }}>
                    Original price for strike-through display
                  </p>
                </div>
                {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                  <div style={{ background: 'rgba(139,115,85,.1)', border: '1px solid rgba(139,115,85,.25)', padding: '.65rem .9rem', fontSize: '.72rem', color: 'var(--accent)' }}>
                    {Math.round((1 - form.price / form.comparePrice) * 100)}% discount displayed to shoppers
                  </div>
                )}
              </div>
            </div>

            {/* Display options */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Display Options</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {BADGES.map(b => (
                      <button key={b || 'none'} type="button" onClick={() => set('badge', b)} style={{
                        padding: '.28rem .75rem', border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500,
                        background: form.badge === b ? 'var(--ink)' : 'transparent',
                        color:      form.badge === b ? 'var(--white)' : 'var(--stone2)',
                        borderColor:form.badge === b ? 'var(--ink)' : 'var(--sand)',
                        transition: 'all var(--t)'
                      }}>{b || 'None'}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Placeholder Glyph</label>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    {GLYPHS.map(g => (
                      <button key={g} type="button" onClick={() => set('glyph', g)} style={{
                        width: 38, height: 38, border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--serif)', fontSize: '1.1rem',
                        background: form.glyph === g ? 'var(--ink)' : 'transparent',
                        color:      form.glyph === g ? 'var(--white)' : 'var(--stone2)',
                        borderColor:form.glyph === g ? 'var(--ink)' : 'var(--sand)',
                        transition: 'all var(--t)'
                      }}>{g}</button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                {[
                  { key: 'isActive',   label: 'Visible on Store',  desc: 'Show product to shoppers' },
                  { key: 'isFeatured', label: 'Featured on Homepage', desc: 'Show in "New Arrivals" section' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '.75rem', background: 'var(--off)', border: '1px solid var(--sand)'
                  }}>
                    <div>
                      <div style={{ fontSize: '.75rem', fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: '.65rem', color: 'var(--stone)', marginTop: '.15rem' }}>{desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => set(key, !form[key])}
                      style={{
                        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                        background: form[key] ? 'var(--ink)' : 'var(--sand2)',
                        position: 'relative', transition: 'background .2s', flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: form[key] ? 21 : 3,
                        width: 16, height: 16, borderRadius: '50%', background: 'white',
                        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)'
                      }}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="admin-card">
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '.8rem 1rem', marginBottom: '1rem', fontSize: '.78rem', color: '#991B1B' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(61,122,86,.08)', border: '1px solid rgba(61,122,86,.3)', padding: '.8rem 1rem', marginBottom: '1rem', fontSize: '.78rem', color: 'var(--success)' }}>
                  {success}
                </div>
              )}
              <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', opacity: saving ? .7 : 1 }} disabled={saving || uploading}>
                {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '.75rem', display: 'flex' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <style>{`
        @media(max-width:900px){
          form > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
