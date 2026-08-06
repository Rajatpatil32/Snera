import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';
import ProductDesignComposer from './ProductDesignComposer';
import DesignPlacer from './DesignPlacer';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS = ['Men', 'Women', 'Unisex'];
const SIZES_ALL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BADGES = ['', 'New', 'Sale'];
const GLYPHS = ['◈', '◇', '△', '◯', '⬡', '◻', '◆'];
const MIN_IMAGES = 3; // minimum per colour group

// Popular fashion colours with preset hex
const COLOUR_PRESETS = [
  { name: 'Black', hex: '#1C1B18' },
  { name: 'White', hex: '#F8F7F4' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Olive', hex: '#5C5A2E' },
  { name: 'Sage Green', hex: '#7C9070' },
  { name: 'Dusty Pink', hex: '#D4A5A5' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Charcoal', hex: '#3A3A3A' },
  { name: 'Cream', hex: '#F5F0E8' },
  { name: 'Burgundy', hex: '#6B2D3E' },
  { name: 'Sky Blue', hex: '#7EB3D0' },
  { name: 'Stone', hex: '#A09D96' },
];

const emptyForm = {
  name: '', category: 'Tops', gender: 'Unisex',
  price: '', comparePrice: '',
  description: '', fabric: '', careInstructions: '',
  sizes: ['S', 'M', 'L', 'XL'], soldSizes: [],
  glyph: '◈', badge: 'New',
  isActive: true, isFeatured: false,
  tags: '', weight: 220,
  colorGroups: [], // legacy: uploaded photos per colour
  images: [],      // legacy fallback
  // ── Design mode: one artwork positioned on global mockups ────────────────
  designMode: false,
  designUrl: '',
  placement: null,
  designColors: [], // [{ mockup, name, hex, isDefault, image? }]
  // ── SEO ──────────────────────────────────────────────────────────────────
  seo: {
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    keywords: '', // comma-separated in the form, stored as array
    ogTitle: '',
    ogDescription: '',
    canonicalUrl: '',
    noIndex: false,
  },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem', background: 'var(--off)', border: '1px solid var(--sand)' }}>
      <div>
        <div style={{ fontSize: '.75rem', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: '.65rem', color: 'var(--stone)', marginTop: '.15rem' }}>{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!on)} style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? 'var(--ink)' : 'var(--sand2)', position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
      </button>
    </div>
  );
}

// ─── Per-colour image slot ────────────────────────────────────────────────────
function ImgSlot({ url, index, onRemove, onMakePrimary }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--off)', border: '1px solid var(--sand)', overflow: 'hidden' }}
    >
      {url ? (
        <>
          <img src={getImageUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(28,27,24,.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.35rem',
            opacity: hov ? 1 : 0, transition: 'opacity .18s',
          }}>
            {index > 0 && (
              <button type="button" onClick={() => onMakePrimary(index)} style={smBtn('#fff', '#1C1B18')}>
                ★ Primary
              </button>
            )}
            <button type="button" onClick={() => onRemove(index)} style={smBtn('#dc2626', '#fff')}>
              × Remove
            </button>
          </div>
          {index === 0 && (
            <span style={{ position: 'absolute', top: 5, left: 5, background: 'var(--ink)', color: '#fff', fontSize: '.44rem', letterSpacing: '.14em', padding: '.18rem .45rem' }}>PRIMARY</span>
          )}
          <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: '.5rem', padding: '.1rem .3rem', borderRadius: 2 }}>{index + 1}</span>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.3rem' }}>
          <span style={{ fontSize: '1.2rem', opacity: .18 }}>◈</span>
          <span style={{ fontSize: '.56rem', color: 'var(--stone)', letterSpacing: '.06em' }}>{index < MIN_IMAGES ? `Req. ${index + 1}` : `Opt. ${index + 1}`}</span>
        </div>
      )}
    </div>
  );
}
const smBtn = (bg, color) => ({
  background: bg, color, border: 'none', cursor: 'pointer', fontSize: '.58rem',
  fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase',
  padding: '.28rem .65rem', fontFamily: 'var(--sans)', width: '100%', maxWidth: 110,
});

// ─── Colour Group Card ────────────────────────────────────────────────────────
function ColourGroupCard({
  group, index, isDefault, totalGroups,
  onChange, onDelete, onSetDefault, onUpload, onOpenComposer,
}) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(true);

  const pct = Math.min(100, Math.round((group.images.length / MIN_IMAGES) * 100));
  const needed = Math.max(0, MIN_IMAGES - group.images.length);

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      arr.forEach(f => fd.append('images', f));
      const r = await API.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(index, { ...group, images: [...group.images, ...r.data.urls] });
    } catch (err) { alert('Upload failed: ' + (err.response?.data?.error || err.message)); }
    finally { setUploading(false); }
  };

  const removeImg = (i) => onChange(index, { ...group, images: group.images.filter((_, j) => j !== i) });
  const makePrimaryImg = (i) => {
    const imgs = [...group.images];
    const [item] = imgs.splice(i, 1);
    imgs.unshift(item);
    onChange(index, { ...group, images: imgs });
  };

  const toggleSoldSize = (sz) => {
    const s = group.soldSizes || [];
    onChange(index, { ...group, soldSizes: s.includes(sz) ? s.filter(x => x !== sz) : [...s, sz] });
  };

  // Slots: always show at least MIN_IMAGES + 1 empty for adding
  const slots = Array.from({ length: Math.max(MIN_IMAGES + 1, group.images.length + 1) });

  return (
    <div style={{ border: `1.5px solid ${isDefault ? 'var(--ink)' : 'var(--sand)'}`, background: 'var(--white)', marginBottom: '1rem' }}>

      {/* ── Group header ── */}
      <div style={{ padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem', borderBottom: '1px solid var(--sand)', background: isDefault ? 'var(--ink)' : 'var(--off)' }}>
        {/* Swatch */}
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: group.hex, border: '2px solid rgba(255,255,255,.6)', flexShrink: 0 }} />

        {/* Name + hex */}
        <div style={{ flex: 1, display: 'flex', gap: '.65rem', alignItems: 'center' }}>
          <input
            value={group.name}
            onChange={e => onChange(index, { ...group, name: e.target.value })}
            placeholder="Colour name"
            style={{
              fontSize: '.8rem', fontWeight: 500, background: 'transparent', border: 'none',
              color: isDefault ? '#fff' : 'var(--ink)', outline: 'none', width: 120,
              fontFamily: 'var(--sans)',
            }}
          />
          <input
            type="color"
            value={group.hex}
            onChange={e => onChange(index, { ...group, hex: e.target.value })}
            title="Pick colour swatch"
            style={{ width: 28, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3, padding: 0, background: 'transparent' }}
          />
          <span style={{ fontSize: '.62rem', color: isDefault ? 'rgba(255,255,255,.5)' : 'var(--stone)', fontFamily: 'monospace' }}>{group.hex}</span>
        </div>

        {/* Progress bar */}
        <div style={{ width: 80 }}>
          <div style={{ height: 4, background: isDefault ? 'rgba(255,255,255,.2)' : 'var(--sand)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : '#8B7355', transition: 'width .3s' }} />
          </div>
          <span style={{ fontSize: '.54rem', color: isDefault ? 'rgba(255,255,255,.55)' : 'var(--stone)', marginTop: 2, display: 'block' }}>
            {group.images.length}/{MIN_IMAGES} images
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          {!isDefault && (
            <button type="button" onClick={() => onSetDefault(index)} title="Set as default colour" style={{
              fontSize: '.56rem', letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '.25rem .6rem', border: '1px solid var(--sand)', cursor: 'pointer',
              fontFamily: 'var(--sans)', background: 'transparent', color: 'var(--stone2)',
              transition: 'all var(--t)',
            }}>Set Default</button>
          )}
          {isDefault && (
            <span style={{ fontSize: '.54rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Default</span>
          )}
          <button type="button" onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDefault ? 'rgba(255,255,255,.6)' : 'var(--stone)', fontSize: '1rem', padding: '.1rem .3rem' }}>
            {open ? '▲' : '▼'}
          </button>
          {totalGroups > 1 && (
            <button type="button" onClick={() => onDelete(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDefault ? 'rgba(255,255,255,.5)' : 'var(--stone)', fontSize: '1.1rem', padding: '.1rem .3rem' }}>×</button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>

          {/* Upload buttons row */}
          <div style={{ display: 'flex', gap: '.65rem' }}>
            <label style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '.7rem', border: `1.5px dashed ${uploading ? 'var(--accent)' : 'var(--sand2)'}`,
              cursor: uploading ? 'not-allowed' : 'pointer', background: 'var(--off)',
              fontSize: '.68rem', color: 'var(--stone2)', transition: 'all .2s',
            }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => handleFiles(e.target.files)} />
              📁 {uploading ? 'Uploading…' : `Direct Upload (${group.images.length} / min ${MIN_IMAGES})`}
            </label>
            <button type="button" onClick={() => onOpenComposer(index)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '.7rem', border: '1.5px dashed var(--accent)', cursor: 'pointer',
              background: 'rgba(139,115,85,.04)', fontSize: '.68rem', color: 'var(--accent)',
              fontFamily: 'var(--sans)', transition: 'all .2s',
            }}>
              🎨 Design Composer
            </button>
          </div>

          {/* Image grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '.5rem' }}>
            {slots.map((_, i) => (
              <ImgSlot
                key={i}
                url={group.images[i] || null}
                index={i}
                onRemove={removeImg}
                onMakePrimary={makePrimaryImg}
              />
            ))}
          </div>

          {/* Validation hint */}
          {needed > 0 && (
            <p style={{ fontSize: '.66rem', color: 'var(--accent)', margin: 0 }}>
              ⚠ Add {needed} more image{needed !== 1 ? 's' : ''} to this colour
            </p>
          )}

          {/* Sold-out sizes for this colour */}
          <div>
            <div style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.45rem' }}>
              Sold Out Sizes (for {group.name || 'this colour'})
            </div>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
              {SIZES_ALL.map(sz => (
                <button key={sz} type="button" onClick={() => toggleSoldSize(sz)} style={{
                  width: 38, height: 38, border: '1px solid', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: '.7rem', fontWeight: 500,
                  background: (group.soldSizes || []).includes(sz) ? '#FEE2E2' : 'transparent',
                  color: (group.soldSizes || []).includes(sz) ? 'var(--error)' : 'var(--stone2)',
                  borderColor: (group.soldSizes || []).includes(sz) ? '#FECACA' : 'var(--sand)',
                  transition: 'all var(--t)',
                }}>{sz}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    API.get('/collections').then(r => setCategories((r.data.collections || []).map(c => c.name)));
  }, []);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [composerFor, setComposerFor] = useState(null); // index of colour group
  const [showPreset, setShowPreset] = useState(false);

  // ── Design mode state ────────────────────────────────────────────────────
  const [mockups, setMockups] = useState([]);
  const [designUploading, setDesignUploading] = useState(false);
  const [showPlacer, setShowPlacer] = useState(false);
  useEffect(() => {
    API.get('/mockups').then(r => setMockups(r.data.mockups || [])).catch(() => setMockups([]));
  }, []);

  const uploadDesign = async (file) => {
    setDesignUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('designUrl', res.data.url);
    } catch (err) {
      setError('Design upload failed: ' + (err.response?.data?.error || err.message));
    } finally { setDesignUploading(false); }
  };

  const toggleDesignColor = (mockup) => setForm(f => {
    const exists = f.designColors.some(c => c.mockup === mockup._id);
    let designColors;
    if (exists) {
      designColors = f.designColors.filter(c => c.mockup !== mockup._id);
      if (designColors.length && !designColors.some(c => c.isDefault)) designColors[0].isDefault = true;
    } else {
      designColors = [...f.designColors, {
        mockup: mockup._id, name: mockup.name, hex: mockup.hex, isDefault: f.designColors.length === 0,
      }];
    }
    return { ...f, designColors };
  });
  const setDefaultDesignColor = (mockupId) => setForm(f => ({
    ...f, designColors: f.designColors.map(c => ({ ...c, isDefault: c.mockup === mockupId })),
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSize = (sz, field) =>
    setForm(f => ({ ...f, [field]: f[field].includes(sz) ? f[field].filter(s => s !== sz) : [...f[field], sz] }));

  // Load product if editing
  useEffect(() => {
    if (!isEdit) return;
    API.get('/products/admin/all').then(r => {
      const p = (r.data.products || []).find(x => x._id === id);
      if (!p) return;
      // If old product has flat images but no colorGroups, migrate to one group
      let colorGroups = p.colorGroups?.length ? p.colorGroups : [];
      if (!colorGroups.length && p.images?.length) {
        colorGroups = [{ name: 'Default', hex: '#1C1B18', images: p.images, soldSizes: [], isDefault: true }];
      }
      setForm({
        ...emptyForm, ...p, price: p.price || '', comparePrice: p.comparePrice || '', tags: (p.tags || []).join(', '), colorGroups,
        seo: {
          metaTitle: p.seo?.metaTitle || '',
          metaDescription: p.seo?.metaDescription || '',
          focusKeyword: p.seo?.focusKeyword || '',
          keywords: (p.seo?.keywords || []).join(', '),
          ogTitle: p.seo?.ogTitle || '',
          ogDescription: p.seo?.ogDescription || '',
          canonicalUrl: p.seo?.canonicalUrl || '',
          noIndex: p.seo?.noIndex || false,
        },
      });
    });
  }, [id, isEdit]);

  // Colour group helpers
  const addColour = (preset = null) => {
    const g = preset
      ? { name: preset.name, hex: preset.hex, images: [], soldSizes: [], isDefault: false }
      : { name: 'New Colour', hex: '#888888', images: [], soldSizes: [], isDefault: false };
    setForm(f => {
      const groups = [...f.colorGroups, g];
      if (groups.length === 1) groups[0].isDefault = true;
      return { ...f, colorGroups: groups };
    });
    setShowPreset(false);
  };

  const updateGroup = (i, val) => setForm(f => { const g = [...f.colorGroups]; g[i] = val; return { ...f, colorGroups: g }; });
  const deleteGroup = (i) => setForm(f => {
    const g = f.colorGroups.filter((_, j) => j !== i);
    if (g.length && !g.some(x => x.isDefault)) g[0].isDefault = true;
    return { ...f, colorGroups: g };
  });
  const setDefault = (i) => setForm(f => ({
    ...f, colorGroups: f.colorGroups.map((g, j) => ({ ...g, isDefault: j === i }))
  }));

  // Validation
  const groupErrors = form.colorGroups.map(g => g.images.length < MIN_IMAGES);
  const hasGroupError = groupErrors.some(Boolean);

  // Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Product name is required');
    if (!form.price || isNaN(+form.price)) return setError('Valid price required');
    if (!form.description.trim()) return setError('Description is required');
    if (form.designMode) {
      if (!form.designUrl) return setError('Upload a design artwork');
      if (!form.placement) return setError('Position the design on a mockup first');
      if (!form.designColors.length) return setError('Select at least one T-shirt colour');
    } else {
      if (!form.colorGroups.length) return setError('Add at least one colour group with images');
      if (hasGroupError) return setError(`Each colour needs at least ${MIN_IMAGES} images`);
    }

    setSaving(true); setError(''); setSuccess('');
    const payload = {
      ...form,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      // Also keep flat images = primary colour's images (for backwards compat)
      images: form.designMode
        ? [(form.designColors.find(c => c.isDefault) || form.designColors[0])?.image].filter(Boolean)
        : (form.colorGroups.find(g => g.isDefault) || form.colorGroups[0])?.images || [],
      seo: {
        ...form.seo,
        keywords: form.seo.keywords
          ? form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
      },
    };
    try {
      if (isEdit) {
        await API.put(`/products/${id}`, payload);
        setSuccess('✓ Product updated');
      } else {
        await API.post('/products', payload);
        setSuccess('✓ Product created');
        setTimeout(() => navigate('/admin/products'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <button onClick={() => navigate('/admin/products')} style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            ← Products
          </button>
          <h1 className="admin-title" style={{ marginTop: '.4rem' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Basic info */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.25rem' }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="SNERA Essential Tee" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                      {categories.map(c => <option key={c}>{c}</option>)}
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
                  <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the product…" style={{ minHeight: 96 }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fabric</label>
                    <input className="form-input" value={form.fabric} onChange={e => set('fabric', e.target.value)} placeholder="100% Cotton, 220 GSM" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Care</label>
                    <input className="form-input" value={form.careInstructions} onChange={e => set('careInstructions', e.target.value)} placeholder="Machine wash cold" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="tee, essential, summer" />
                </div>
              </div>
            </div>

            {/* Sizes (global) */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1rem' }}>Available Sizes</h3>
              <p style={{ fontSize: '.68rem', color: 'var(--stone2)', marginBottom: '.75rem' }}>
                These apply globally. Per-colour sold-out sizes are set inside each colour group.
              </p>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {SIZES_ALL.map(sz => (
                  <button key={sz} type="button" onClick={() => toggleSize(sz, 'sizes')} style={{
                    width: 42, height: 42, border: '1px solid', cursor: 'pointer',
                    fontFamily: 'var(--sans)', fontSize: '.72rem', fontWeight: 500,
                    background: form.sizes.includes(sz) ? 'var(--ink)' : 'transparent',
                    color: form.sizes.includes(sz) ? 'var(--white)' : 'var(--stone2)',
                    borderColor: form.sizes.includes(sz) ? 'var(--ink)' : 'var(--sand)',
                    transition: 'all var(--t)',
                  }}>{sz}</button>
                ))}
              </div>
            </div>

            {/* ── DESIGN MODE ── */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1rem' }}>Design-Based Product</h3>
              <Toggle
                on={form.designMode}
                onChange={v => set('designMode', v)}
                label="Use a design overlaid on global mockups"
                desc="Upload one artwork, position it once, and reuse it across every T-shirt colour — no per-colour photo uploads."
              />

              {form.designMode && (
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Design artwork */}
                  <div>
                    <label className="form-label">Design Artwork (transparent PNG)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {form.designUrl && (
                        <img src={getImageUrl(form.designUrl)} alt="Design" style={{ width: 70, height: 70, objectFit: 'contain', background: 'var(--off)', border: '1px solid var(--sand)' }} />
                      )}
                      <input type="file" accept="image/png" disabled={designUploading}
                        onChange={e => e.target.files[0] && uploadDesign(e.target.files[0])} style={{ fontSize: '.72rem' }} />
                      {designUploading && <span style={{ fontSize: '.68rem', color: 'var(--stone)' }}>Uploading…</span>}
                    </div>
                  </div>

                  {/* Colours available for this product */}
                  <div>
                    <label className="form-label">T-Shirt Colours</label>
                    {mockups.length === 0 ? (
                      <p style={{ fontSize: '.7rem', color: 'var(--stone2)' }}>
                        No global mockups yet — add them under <strong>T-Shirt Mockups</strong> in the sidebar first.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                        {mockups.map(m => {
                          const entry = form.designColors.find(c => c.mockup === m._id);
                          return (
                            <button key={m._id} type="button" onClick={() => toggleDesignColor(m)} style={{
                              display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .7rem',
                              border: `1px solid ${entry ? 'var(--ink)' : 'var(--sand)'}`,
                              background: entry ? 'var(--ink)' : 'transparent',
                              color: entry ? 'var(--white)' : 'var(--stone2)',
                              cursor: 'pointer', fontSize: '.7rem', fontFamily: 'var(--sans)',
                            }}>
                              <span style={{ width: 12, height: 12, borderRadius: '50%', background: m.hex, border: '1px solid rgba(255,255,255,.3)' }} />
                              {m.name}
                              {entry && (
                                <span
                                  onClick={e => { e.stopPropagation(); setDefaultDesignColor(m._id); }}
                                  title="Set as default"
                                  style={{ marginLeft: '.3rem', fontSize: '.85rem' }}
                                >{entry.isDefault ? '★' : '☆'}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Placement */}
                  <div>
                    <button type="button" className="btn btn-dark" style={{ fontSize: '.62rem' }}
                      disabled={!form.designUrl || !form.designColors.length}
                      onClick={() => setShowPlacer(true)}>
                      {form.placement ? 'Edit Placement' : 'Position Design'}
                    </button>
                    {!form.designUrl && <p style={{ fontSize: '.65rem', color: 'var(--stone2)', marginTop: '.4rem' }}>Upload a design first.</p>}
                    {form.designUrl && !form.designColors.length && <p style={{ fontSize: '.65rem', color: 'var(--stone2)', marginTop: '.4rem' }}>Select at least one colour first.</p>}
                    {form.placement && <p style={{ fontSize: '.65rem', color: 'var(--stone)', marginTop: '.4rem' }}>Placement saved. The composed preview per colour bakes automatically when you save the product.</p>}
                  </div>
                </div>
              )}
            </div>

            {showPlacer && (
              <DesignPlacer
                designUrl={form.designUrl}
                mockupImage={mockups.find(m => m._id === (form.designColors.find(c => c.isDefault)?.mockup || form.designColors[0]?.mockup))?.image}
                initialPlacement={form.placement}
                onSave={(placement) => { set('placement', placement); setShowPlacer(false); }}
                onCancel={() => setShowPlacer(false)}
              />
            )}

            {/* ── COLOUR GROUPS (legacy — per-colour photo uploads) ── */}
            {!form.designMode && (
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>Colour Groups &amp; Images</h3>
                  <p style={{ fontSize: '.68rem', color: 'var(--stone2)', marginTop: '.2rem' }}>
                    Each colour has its own image set (min {MIN_IMAGES} per colour)
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowPreset(p => !p)} className="btn btn-dark" style={{ fontSize: '.6rem', padding: '.55rem 1rem' }}>
                    + Add Colour
                  </button>
                  {showPreset && (
                    <div style={{
                      position: 'absolute', top: '110%', right: 0, zIndex: 50,
                      background: 'var(--white)', border: '1px solid var(--sand)',
                      boxShadow: '0 8px 28px rgba(0,0,0,.12)',
                      width: 240, padding: '.75rem',
                    }}>
                      <div style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.6rem' }}>Quick Presets</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.35rem', marginBottom: '.6rem' }}>
                        {COLOUR_PRESETS.map(p => (
                          <button key={p.name} type="button" onClick={() => addColour(p)} style={{
                            display: 'flex', alignItems: 'center', gap: '.5rem',
                            padding: '.4rem .6rem', border: '1px solid var(--sand)', cursor: 'pointer',
                            background: 'transparent', fontFamily: 'var(--sans)',
                            fontSize: '.68rem', color: 'var(--ink2)',
                            transition: 'background var(--t)',
                          }}>
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.hex, border: '1px solid rgba(0,0,0,.15)', flexShrink: 0 }} />
                            {p.name}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => addColour()} style={{
                        width: '100%', padding: '.45rem', border: '1px dashed var(--sand2)',
                        cursor: 'pointer', background: 'var(--off)', fontFamily: 'var(--sans)',
                        fontSize: '.65rem', color: 'var(--stone2)',
                      }}>+ Custom colour</button>
                    </div>
                  )}
                </div>
              </div>

              {form.colorGroups.length === 0 ? (
                <div style={{ border: '1.5px dashed var(--sand2)', padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🎨</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--stone)', lineHeight: 1.7 }}>
                    No colours yet.<br />Click <strong>+ Add Colour</strong> to create your first colour group.
                  </div>
                </div>
              ) : (
                form.colorGroups.map((g, i) => (
                  <ColourGroupCard
                    key={i}
                    group={g}
                    index={i}
                    isDefault={g.isDefault}
                    totalGroups={form.colorGroups.length}
                    onChange={updateGroup}
                    onDelete={deleteGroup}
                    onSetDefault={setDefault}
                    onUpload={() => { }}
                    onOpenComposer={(gi) => setComposerFor(gi)}
                  />
                ))
              )}
            </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Pricing */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Pricing</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1299" min="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Compare Price (₹)</label>
                  <input className="form-input" type="number" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} placeholder="1599" />
                </div>
                {form.price && form.comparePrice && +form.comparePrice > +form.price && (
                  <div style={{ background: 'rgba(139,115,85,.1)', border: '1px solid rgba(139,115,85,.25)', padding: '.6rem .9rem', fontSize: '.72rem', color: 'var(--accent)' }}>
                    {Math.round((1 - form.price / form.comparePrice) * 100)}% discount shown
                  </div>
                )}
              </div>
            </div>

            {/* Display */}
            <div className="admin-card">
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1.1rem' }}>Display</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <div style={{ display: 'flex', gap: '.35rem' }}>
                    {BADGES.map(b => (
                      <button key={b || 'none'} type="button" onClick={() => set('badge', b)} style={{
                        padding: '.28rem .7rem', border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--sans)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500,
                        background: form.badge === b ? 'var(--ink)' : 'transparent',
                        color: form.badge === b ? 'var(--white)' : 'var(--stone2)',
                        borderColor: form.badge === b ? 'var(--ink)' : 'var(--sand)',
                        transition: 'all var(--t)',
                      }}>{b || 'None'}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Placeholder Glyph</label>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    {GLYPHS.map(g => (
                      <button key={g} type="button" onClick={() => set('glyph', g)} style={{
                        width: 36, height: 36, border: '1px solid', cursor: 'pointer',
                        fontFamily: 'var(--serif)', fontSize: '1.1rem',
                        background: form.glyph === g ? 'var(--ink)' : 'transparent',
                        color: form.glyph === g ? 'var(--white)' : 'var(--stone2)',
                        borderColor: form.glyph === g ? 'var(--ink)' : 'var(--sand)',
                        transition: 'all var(--t)',
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <Toggle on={form.isActive} onChange={v => set('isActive', v)} label="Visible in Store" />
                <Toggle on={form.isFeatured} onChange={v => set('isFeatured', v)} label="Featured on Homepage" />
              </div>
            </div>

            {/* Colour summary */}
            {form.colorGroups.length > 0 && (
              <div className="admin-card">
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '.9rem', marginBottom: '.85rem' }}>Colour Summary</h3>
                {form.colorGroups.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.55rem' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: g.hex, border: '1px solid var(--sand)', flexShrink: 0 }} />
                    <span style={{ fontSize: '.78rem', flex: 1 }}>{g.name || 'Unnamed'}</span>
                    <span style={{
                      fontSize: '.58rem', letterSpacing: '.1em',
                      color: g.images.length >= MIN_IMAGES ? 'var(--success)' : 'var(--accent)',
                      fontWeight: 500,
                    }}>
                      {g.images.length}/{MIN_IMAGES}
                      {g.isDefault && <span style={{ color: 'var(--stone)', marginLeft: '.3rem' }}>· default</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <div className="admin-card">
              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '.8rem', marginBottom: '1rem', fontSize: '.78rem', color: '#991B1B' }}>{error}</div>}
              {success && <div style={{ background: 'rgba(61,122,86,.08)', border: '1px solid rgba(61,122,86,.3)', padding: '.8rem', marginBottom: '1rem', fontSize: '.78rem', color: 'var(--success)' }}>{success}</div>}
              {hasGroupError && (
                <div style={{ background: 'rgba(139,115,85,.08)', border: '1px solid rgba(139,115,85,.25)', padding: '.75rem', marginBottom: '1rem', fontSize: '.72rem', color: 'var(--accent)', lineHeight: 1.6 }}>
                  Each colour group needs at least {MIN_IMAGES} images.
                </div>
              )}
              <button
                type="submit" className="btn btn-dark"
                style={{ width: '100%', justifyContent: 'center', opacity: (saving || hasGroupError) ? 0.6 : 1 }}
                disabled={saving || hasGroupError}
              >
                {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              {isEdit && (
                <button type="button" onClick={() => navigate('/admin/products')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '.75rem', display: 'flex' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════════
          SEO SECTION — full width below the two-column product grid
      ══════════════════════════════════════════════════════════════════ */}
      <form onSubmit={e => e.preventDefault()} style={{ marginTop: '1.5rem' }}>
        <div className="admin-card">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>🔍 SEO Settings</h3>
              <p style={{ fontSize: '.68rem', color: 'var(--stone2)', marginTop: '.25rem' }}>
                Controls how this product appears on Google, WhatsApp shares, and social media.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '.62rem', padding: '.45rem .9rem' }}
              onClick={() => {
                const slug = form.name
                  ? `/product/${form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
                  : '/product/product-slug';
                setForm(f => ({
                  ...f,
                  seo: {
                    ...f.seo,
                    metaTitle: f.seo.metaTitle || `${f.name} — Buy Online | SNERA`,
                    metaDescription: f.seo.metaDescription || (f.description?.slice(0, 155) || ''),
                    ogTitle: f.seo.ogTitle || `${f.name} | SNERA`,
                    ogDescription: f.seo.ogDescription || (f.description?.slice(0, 200) || ''),
                    canonicalUrl: f.seo.canonicalUrl || `https://snera.in${slug}`,
                  },
                }));
              }}
            >
              ✨ Auto-fill from product info
            </button>
          </div>

          {/* Google SERP Preview */}
          <div style={{ background: 'var(--off)', border: '1px solid var(--sand)', padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.75rem' }}>Google Search Preview</div>
            <div style={{ fontSize: '.78rem', color: '#1a7340', marginBottom: '.15rem' }}>
              snera.in/product/{form.name ? form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'product-slug'}
            </div>
            <div style={{ fontSize: '1.05rem', color: '#1a0dab', marginBottom: '.2rem', lineHeight: 1.3 }}>
              {(form.seo.metaTitle || form.name || 'Product Title — SNERA').slice(0, 60)}
            </div>
            <div style={{ fontSize: '.82rem', color: '#4d5156', lineHeight: 1.6 }}>
              {(form.seo.metaDescription || form.description || 'Product description will appear here…').slice(0, 160)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>

            {/* Focus Keyword */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">🎯 Focus Keyword
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— the single keyword you most want to rank for</span>
              </label>
              <input className="form-input" value={form.seo.focusKeyword}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, focusKeyword: e.target.value } }))}
                placeholder="e.g. oversized t-shirt india" />
              {form.seo.focusKeyword && (
                <div style={{ fontSize: '.66rem', marginTop: '.35rem' }}>
                  {form.seo.metaTitle?.toLowerCase().includes(form.seo.focusKeyword.toLowerCase())
                    ? <span style={{ color: 'var(--success)' }}>✅ Focus keyword found in Meta Title</span>
                    : <span style={{ color: 'var(--accent)' }}>⚠ Add focus keyword to Meta Title for better ranking</span>}
                </div>
              )}
            </div>

            {/* Meta Title */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                <label className="form-label" style={{ margin: 0 }}>📌 SEO Meta Title
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— ideal 50–60 chars</span>
                </label>
                <span style={{
                  fontSize: '.65rem', fontWeight: 500, padding: '.15rem .5rem', borderRadius: 100,
                  background: form.seo.metaTitle.length === 0 ? 'var(--off)' : form.seo.metaTitle.length <= 60 ? 'rgba(61,122,86,.1)' : '#FEF2F2',
                  color: form.seo.metaTitle.length === 0 ? 'var(--stone)' : form.seo.metaTitle.length <= 60 ? 'var(--success)' : '#991B1B',
                  border: `1px solid ${form.seo.metaTitle.length <= 60 ? 'rgba(61,122,86,.25)' : '#FECACA'}`,
                }}>{form.seo.metaTitle.length}/60</span>
              </div>
              <input className="form-input" value={form.seo.metaTitle}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))}
                placeholder="SNERA Essential Tee — Premium Cotton T-Shirt | Buy Online India"
                maxLength={80}
                style={form.seo.metaTitle.length > 60 ? { borderColor: 'var(--error)' } : {}} />
              <div style={{ fontSize: '.63rem', color: 'var(--stone)', marginTop: '.3rem' }}>Formula: <strong>Product Name + Benefit + Brand</strong></div>
            </div>

            {/* Meta Description */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                <label className="form-label" style={{ margin: 0 }}>📝 SEO Meta Description
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— ideal 140–160 chars</span>
                </label>
                <span style={{
                  fontSize: '.65rem', fontWeight: 500, padding: '.15rem .5rem', borderRadius: 100,
                  background: form.seo.metaDescription.length === 0 ? 'var(--off)' : form.seo.metaDescription.length <= 160 ? 'rgba(61,122,86,.1)' : '#FEF2F2',
                  color: form.seo.metaDescription.length === 0 ? 'var(--stone)' : form.seo.metaDescription.length <= 160 ? 'var(--success)' : '#991B1B',
                  border: `1px solid ${form.seo.metaDescription.length <= 160 ? 'rgba(61,122,86,.25)' : '#FECACA'}`,
                }}>{form.seo.metaDescription.length}/160</span>
              </div>
              <textarea className="form-textarea" value={form.seo.metaDescription}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, metaDescription: e.target.value } }))}
                placeholder="Shop SNERA Essential Tee — ultra-soft 240gsm cotton, relaxed fit. Free shipping above ₹999. Easy 7-day returns."
                rows={3} maxLength={200}
                style={{ minHeight: 72, ...(form.seo.metaDescription.length > 160 ? { borderColor: 'var(--error)' } : {}) }} />
              <div style={{ fontSize: '.63rem', color: 'var(--stone)', marginTop: '.3rem' }}>Include focus keyword naturally. End with a CTA: "Shop now", "Free shipping", "Order today".</div>
            </div>

            {/* SEO Keywords */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">🔑 SEO Keywords
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— comma-separated · 5–10 recommended</span>
              </label>
              <input className="form-input" value={form.seo.keywords}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, keywords: e.target.value } }))}
                placeholder="oversized t-shirt india, cotton tee, snera tshirt, minimal streetwear, buy tshirt online india" />
              {form.seo.keywords && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginTop: '.45rem' }}>
                  {form.seo.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                    <span key={k} style={{ fontSize: '.62rem', padding: '.2rem .6rem', background: 'var(--off)', border: '1px solid var(--sand)', color: 'var(--stone2)' }}>{k}</span>
                  ))}
                </div>
              )}
            </div>

            {/* OG Title */}
            <div className="form-group">
              <label className="form-label">📱 OG Title
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— WhatsApp / Instagram share</span>
              </label>
              <input className="form-input" value={form.seo.ogTitle}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, ogTitle: e.target.value } }))}
                placeholder="SNERA Essential Tee | Shop Now" />
            </div>

            {/* OG Description */}
            <div className="form-group">
              <label className="form-label">📱 OG Description
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— WhatsApp / Instagram share</span>
              </label>
              <input className="form-input" value={form.seo.ogDescription}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, ogDescription: e.target.value } }))}
                placeholder="Premium 240gsm cotton. Free shipping above ₹999." />
            </div>

            {/* Canonical URL */}
            <div className="form-group">
              <label className="form-label">🔗 Canonical URL
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--stone)', marginLeft: '.4rem' }}>— leave blank unless you have duplicate pages</span>
              </label>
              <input className="form-input" value={form.seo.canonicalUrl}
                onChange={e => setForm(f => ({ ...f, seo: { ...f.seo, canonicalUrl: e.target.value } }))}
                placeholder="https://snera.in/product/snera-essential-tee" />
            </div>

            {/* No Index */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', gridColumn: '1 / -1', padding: '.85rem', background: 'rgba(220,38,38,.04)', border: '1px solid rgba(220,38,38,.12)' }}>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, seo: { ...f.seo, noIndex: !f.seo.noIndex } }))}
                style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: form.seo.noIndex ? '#DC2626' : 'var(--sand2)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: form.seo.noIndex ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
              </button>
              <div>
                <div style={{ fontSize: '.75rem', fontWeight: 500, color: form.seo.noIndex ? '#991B1B' : 'var(--ink)' }}>
                  No Index — Hide this product from Google
                </div>
                <div style={{ fontSize: '.62rem', color: 'var(--stone)', marginTop: '.1rem' }}>
                  {form.seo.noIndex
                    ? '⚠ Google will NOT index this page. Use only for draft/test products.'
                    : 'Google will index and rank this product page normally.'}
                </div>
              </div>
            </div>

            {/* SEO Checklist */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--off)', border: '1px solid var(--sand)', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.75rem' }}>SEO Checklist</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem' }}>
                {[
                  { ok: !!form.name, label: 'Product name filled' },
                  { ok: !!form.seo.focusKeyword, label: 'Focus keyword set' },
                  { ok: form.seo.metaTitle.length >= 30 && form.seo.metaTitle.length <= 60, label: `Meta title 30–60 chars (${form.seo.metaTitle.length})` },
                  { ok: !!form.seo.focusKeyword && form.seo.metaTitle.toLowerCase().includes(form.seo.focusKeyword.toLowerCase()), label: 'Focus keyword in meta title' },
                  { ok: form.seo.metaDescription.length >= 100 && form.seo.metaDescription.length <= 160, label: `Meta desc 100–160 chars (${form.seo.metaDescription.length})` },
                  { ok: !!form.seo.focusKeyword && form.seo.metaDescription.toLowerCase().includes(form.seo.focusKeyword.toLowerCase()), label: 'Focus keyword in meta desc' },
                  { ok: form.seo.keywords.split(',').filter(Boolean).length >= 3, label: 'At least 3 keywords added' },
                  { ok: !!form.seo.ogTitle, label: 'OG Title set (WhatsApp)' },
                  { ok: form.designMode ? (form.designUrl && form.placement && form.designColors.length > 0) : (form.colorGroups.length > 0 && form.colorGroups.some(g => g.images.length > 0)), label: 'Product images uploaded' },
                  { ok: !!form.description, label: 'Description filled' },
                ].map(({ ok, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.68rem', padding: '.3rem .5rem', background: ok ? 'rgba(61,122,86,.06)' : 'transparent', color: ok ? 'var(--success)' : 'var(--stone)' }}>
                    <span style={{ flexShrink: 0 }}>{ok ? '✅' : '❌'}</span>{label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </form>
      {composerFor !== null && (
        <ProductDesignComposer
          onComposed={url => {
            updateGroup(composerFor, { ...form.colorGroups[composerFor], images: [...form.colorGroups[composerFor].images, url] });
            setComposerFor(null);
          }}
          onCancel={() => setComposerFor(null)}
        />
      )}

      <style>{`@media(max-width:900px){form>div{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}