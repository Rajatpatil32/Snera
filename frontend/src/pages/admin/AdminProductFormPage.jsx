import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';
import ProductDesignComposer from './ProductDesignComposer';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const GENDERS    = ['Men', 'Women', 'Unisex'];
const SIZES_ALL  = ['XS','S','M','L','XL','XXL'];
const BADGES     = ['', 'New', 'Sale'];
const GLYPHS     = ['◈','◇','△','◯','⬡','◻','◆'];
const MIN_IMAGES = 3; // minimum per colour group

// Popular fashion colours with preset hex
const COLOUR_PRESETS = [
  { name:'Black',       hex:'#1C1B18' },
  { name:'White',       hex:'#F8F7F4' },
  { name:'Navy',        hex:'#1B2A4A' },
  { name:'Olive',       hex:'#5C5A2E' },
  { name:'Sage Green',  hex:'#7C9070' },
  { name:'Dusty Pink',  hex:'#D4A5A5' },
  { name:'Camel',       hex:'#C19A6B' },
  { name:'Charcoal',    hex:'#3A3A3A' },
  { name:'Cream',       hex:'#F5F0E8' },
  { name:'Burgundy',    hex:'#6B2D3E' },
  { name:'Sky Blue',    hex:'#7EB3D0' },
  { name:'Stone',       hex:'#A09D96' },
];

const emptyForm = {
  name:'', category:'Tops', gender:'Unisex',
  price:'', comparePrice:'',
  description:'', fabric:'', careInstructions:'',
  sizes:['S','M','L','XL'], soldSizes:[],
  glyph:'◈', badge:'New',
  isActive:true, isFeatured:false,
  tags:'', weight:220,
  colorGroups:[], // primary data
  images:[],      // legacy fallback
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.75rem', background:'var(--off)', border:'1px solid var(--sand)' }}>
      <div>
        <div style={{ fontSize:'.75rem', fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontSize:'.65rem', color:'var(--stone)', marginTop:'.15rem' }}>{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!on)} style={{
        width:40, height:22, borderRadius:11, border:'none', cursor:'pointer',
        background: on ? 'var(--ink)' : 'var(--sand2)', position:'relative', transition:'background .2s', flexShrink:0,
      }}>
        <span style={{ position:'absolute', top:3, left: on ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'white', transition:'left .2s' }}/>
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
      style={{ position:'relative', aspectRatio:'3/4', background:'var(--off)', border:'1px solid var(--sand)', overflow:'hidden' }}
    >
      {url ? (
        <>
          <img src={getImageUrl(url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          <div style={{
            position:'absolute', inset:0, background:'rgba(28,27,24,.5)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.35rem',
            opacity: hov ? 1 : 0, transition:'opacity .18s',
          }}>
            {index > 0 && (
              <button type="button" onClick={() => onMakePrimary(index)} style={smBtn('#fff','#1C1B18')}>
                ★ Primary
              </button>
            )}
            <button type="button" onClick={() => onRemove(index)} style={smBtn('#dc2626','#fff')}>
              × Remove
            </button>
          </div>
          {index === 0 && (
            <span style={{ position:'absolute', top:5, left:5, background:'var(--ink)', color:'#fff', fontSize:'.44rem', letterSpacing:'.14em', padding:'.18rem .45rem' }}>PRIMARY</span>
          )}
          <span style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,.45)', color:'#fff', fontSize:'.5rem', padding:'.1rem .3rem', borderRadius:2 }}>{index+1}</span>
        </>
      ) : (
        <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.3rem' }}>
          <span style={{ fontSize:'1.2rem', opacity:.18 }}>◈</span>
          <span style={{ fontSize:'.56rem', color:'var(--stone)', letterSpacing:'.06em' }}>{index < MIN_IMAGES ? `Req. ${index+1}` : `Opt. ${index+1}`}</span>
        </div>
      )}
    </div>
  );
}
const smBtn = (bg, color) => ({
  background:bg, color, border:'none', cursor:'pointer', fontSize:'.58rem',
  fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase',
  padding:'.28rem .65rem', fontFamily:'var(--sans)', width:'100%', maxWidth:110,
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

  const removeImg      = (i) => onChange(index, { ...group, images: group.images.filter((_,j) => j !== i) });
  const makePrimaryImg = (i) => {
    const imgs = [...group.images];
    const [item] = imgs.splice(i, 1);
    imgs.unshift(item);
    onChange(index, { ...group, images: imgs });
  };

  const toggleSoldSize = (sz) => {
    const s = group.soldSizes || [];
    onChange(index, { ...group, soldSizes: s.includes(sz) ? s.filter(x=>x!==sz) : [...s, sz] });
  };

  // Slots: always show at least MIN_IMAGES + 1 empty for adding
  const slots = Array.from({ length: Math.max(MIN_IMAGES + 1, group.images.length + 1) });

  return (
    <div style={{ border: `1.5px solid ${isDefault ? 'var(--ink)' : 'var(--sand)'}`, background:'var(--white)', marginBottom:'1rem' }}>

      {/* ── Group header ── */}
      <div style={{ padding:'.85rem 1.1rem', display:'flex', alignItems:'center', gap:'.85rem', borderBottom:'1px solid var(--sand)', background: isDefault ? 'var(--ink)' : 'var(--off)' }}>
        {/* Swatch */}
        <div style={{ width:28, height:28, borderRadius:'50%', background:group.hex, border:'2px solid rgba(255,255,255,.6)', flexShrink:0 }}/>

        {/* Name + hex */}
        <div style={{ flex:1, display:'flex', gap:'.65rem', alignItems:'center' }}>
          <input
            value={group.name}
            onChange={e => onChange(index, { ...group, name: e.target.value })}
            placeholder="Colour name"
            style={{
              fontSize:'.8rem', fontWeight:500, background:'transparent', border:'none',
              color: isDefault ? '#fff' : 'var(--ink)', outline:'none', width:120,
              fontFamily:'var(--sans)',
            }}
          />
          <input
            type="color"
            value={group.hex}
            onChange={e => onChange(index, { ...group, hex: e.target.value })}
            title="Pick colour swatch"
            style={{ width:28, height:22, border:'none', cursor:'pointer', borderRadius:3, padding:0, background:'transparent' }}
          />
          <span style={{ fontSize:'.62rem', color: isDefault ? 'rgba(255,255,255,.5)' : 'var(--stone)', fontFamily:'monospace' }}>{group.hex}</span>
        </div>

        {/* Progress bar */}
        <div style={{ width:80 }}>
          <div style={{ height:4, background: isDefault ? 'rgba(255,255,255,.2)' : 'var(--sand)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: pct >= 100 ? 'var(--success)' : '#8B7355', transition:'width .3s' }}/>
          </div>
          <span style={{ fontSize:'.54rem', color: isDefault ? 'rgba(255,255,255,.55)' : 'var(--stone)', marginTop:2, display:'block' }}>
            {group.images.length}/{MIN_IMAGES} images
          </span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'.4rem', alignItems:'center' }}>
          {!isDefault && (
            <button type="button" onClick={() => onSetDefault(index)} title="Set as default colour" style={{
              fontSize:'.56rem', letterSpacing:'.12em', textTransform:'uppercase',
              padding:'.25rem .6rem', border:'1px solid var(--sand)', cursor:'pointer',
              fontFamily:'var(--sans)', background:'transparent', color:'var(--stone2)',
              transition:'all var(--t)',
            }}>Set Default</button>
          )}
          {isDefault && (
            <span style={{ fontSize:'.54rem', letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.6)' }}>Default</span>
          )}
          <button type="button" onClick={() => setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', color: isDefault ? 'rgba(255,255,255,.6)' : 'var(--stone)', fontSize:'1rem', padding:'.1rem .3rem' }}>
            {open ? '▲' : '▼'}
          </button>
          {totalGroups > 1 && (
            <button type="button" onClick={() => onDelete(index)} style={{ background:'none', border:'none', cursor:'pointer', color: isDefault ? 'rgba(255,255,255,.5)' : 'var(--stone)', fontSize:'1.1rem', padding:'.1rem .3rem' }}>×</button>
          )}
        </div>
      </div>

      {open && (
        <div style={{ padding:'1rem 1.1rem', display:'flex', flexDirection:'column', gap:'.9rem' }}>

          {/* Upload buttons row */}
          <div style={{ display:'flex', gap:'.65rem' }}>
            <label style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
              padding:'.7rem', border:`1.5px dashed ${uploading ? 'var(--accent)' : 'var(--sand2)'}`,
              cursor: uploading ? 'not-allowed' : 'pointer', background:'var(--off)',
              fontSize:'.68rem', color:'var(--stone2)', transition:'all .2s',
            }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => handleFiles(e.target.files)}/>
              📁 {uploading ? 'Uploading…' : `Direct Upload (${group.images.length} / min ${MIN_IMAGES})`}
            </label>
            <button type="button" onClick={() => onOpenComposer(index)} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
              padding:'.7rem', border:'1.5px dashed var(--accent)', cursor:'pointer',
              background:'rgba(139,115,85,.04)', fontSize:'.68rem', color:'var(--accent)',
              fontFamily:'var(--sans)', transition:'all .2s',
            }}>
              🎨 Design Composer
            </button>
          </div>

          {/* Image grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'.5rem' }}>
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
            <p style={{ fontSize:'.66rem', color:'var(--accent)', margin:0 }}>
              ⚠ Add {needed} more image{needed!==1?'s':''} to this colour
            </p>
          )}

          {/* Sold-out sizes for this colour */}
          <div>
            <div style={{ fontSize:'.58rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--stone)', marginBottom:'.45rem' }}>
              Sold Out Sizes (for {group.name || 'this colour'})
            </div>
            <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
              {SIZES_ALL.map(sz => (
                <button key={sz} type="button" onClick={() => toggleSoldSize(sz)} style={{
                  width:38, height:38, border:'1px solid', cursor:'pointer',
                  fontFamily:'var(--sans)', fontSize:'.7rem', fontWeight:500,
                  background:  (group.soldSizes||[]).includes(sz) ? '#FEE2E2' : 'transparent',
                  color:       (group.soldSizes||[]).includes(sz) ? 'var(--error)' : 'var(--stone2)',
                  borderColor: (group.soldSizes||[]).includes(sz) ? '#FECACA' : 'var(--sand)',
                  transition:'all var(--t)',
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
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,         setForm]         = useState(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [composerFor,  setComposerFor]  = useState(null); // index of colour group
  const [showPreset,   setShowPreset]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSize = (sz, field) =>
    setForm(f => ({ ...f, [field]: f[field].includes(sz) ? f[field].filter(s=>s!==sz) : [...f[field],sz] }));

  // Load product if editing
  useEffect(() => {
    if (!isEdit) return;
    API.get('/products/admin/all').then(r => {
      const p = (r.data.products||[]).find(x => x._id === id);
      if (!p) return;
      // If old product has flat images but no colorGroups, migrate to one group
      let colorGroups = p.colorGroups?.length ? p.colorGroups : [];
      if (!colorGroups.length && p.images?.length) {
        colorGroups = [{ name:'Default', hex:'#1C1B18', images: p.images, soldSizes:[], isDefault:true }];
      }
      setForm({ ...emptyForm, ...p, price:p.price||'', comparePrice:p.comparePrice||'', tags:(p.tags||[]).join(', '), colorGroups });
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

  const updateGroup = (i, val) => setForm(f => { const g=[...f.colorGroups]; g[i]=val; return {...f,colorGroups:g}; });
  const deleteGroup = (i)       => setForm(f => {
    const g = f.colorGroups.filter((_,j)=>j!==i);
    if (g.length && !g.some(x=>x.isDefault)) g[0].isDefault = true;
    return { ...f, colorGroups: g };
  });
  const setDefault  = (i)       => setForm(f => ({
    ...f, colorGroups: f.colorGroups.map((g,j) => ({ ...g, isDefault: j===i }))
  }));

  // Validation
  const groupErrors = form.colorGroups.map(g => g.images.length < MIN_IMAGES);
  const hasGroupError = groupErrors.some(Boolean);

  // Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())               return setError('Product name is required');
    if (!form.price || isNaN(+form.price)) return setError('Valid price required');
    if (!form.description.trim())         return setError('Description is required');
    if (!form.colorGroups.length)         return setError('Add at least one colour group with images');
    if (hasGroupError)                    return setError(`Each colour needs at least ${MIN_IMAGES} images`);

    setSaving(true); setError(''); setSuccess('');
    const payload = {
      ...form,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      tags:         form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      // Also keep flat images = primary colour's images (for backwards compat)
      images:       (form.colorGroups.find(g=>g.isDefault)||form.colorGroups[0])?.images || [],
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
          <button onClick={() => navigate('/admin/products')} style={{ fontSize:'.65rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)' }}>
            ← Products
          </button>
          <h1 className="admin-title" style={{ marginTop:'.4rem' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Basic info */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.25rem' }}>Basic Information</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="SNERA Essential Tee" required/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e=>set('category',e.target.value)}>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={e=>set('gender',e.target.value)}>
                      {GENDERS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the product…" style={{ minHeight:96 }}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fabric</label>
                    <input className="form-input" value={form.fabric} onChange={e=>set('fabric',e.target.value)} placeholder="100% Cotton, 220 GSM"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Care</label>
                    <input className="form-input" value={form.careInstructions} onChange={e=>set('careInstructions',e.target.value)} placeholder="Machine wash cold"/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="tee, essential, summer"/>
                </div>
              </div>
            </div>

            {/* Sizes (global) */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1rem' }}>Available Sizes</h3>
              <p style={{ fontSize:'.68rem', color:'var(--stone2)', marginBottom:'.75rem' }}>
                These apply globally. Per-colour sold-out sizes are set inside each colour group.
              </p>
              <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                {SIZES_ALL.map(sz=>(
                  <button key={sz} type="button" onClick={()=>toggleSize(sz,'sizes')} style={{
                    width:42, height:42, border:'1px solid', cursor:'pointer',
                    fontFamily:'var(--sans)', fontSize:'.72rem', fontWeight:500,
                    background:  form.sizes.includes(sz)?'var(--ink)':'transparent',
                    color:       form.sizes.includes(sz)?'var(--white)':'var(--stone2)',
                    borderColor: form.sizes.includes(sz)?'var(--ink)':'var(--sand)',
                    transition:'all var(--t)',
                  }}>{sz}</button>
                ))}
              </div>
            </div>

            {/* ── COLOUR GROUPS ── */}
            <div className="admin-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <div>
                  <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem' }}>Colour Groups &amp; Images</h3>
                  <p style={{ fontSize:'.68rem', color:'var(--stone2)', marginTop:'.2rem' }}>
                    Each colour has its own image set (min {MIN_IMAGES} per colour)
                  </p>
                </div>
                <div style={{ position:'relative' }}>
                  <button type="button" onClick={()=>setShowPreset(p=>!p)} className="btn btn-dark" style={{ fontSize:'.6rem', padding:'.55rem 1rem' }}>
                    + Add Colour
                  </button>
                  {showPreset && (
                    <div style={{
                      position:'absolute', top:'110%', right:0, zIndex:50,
                      background:'var(--white)', border:'1px solid var(--sand)',
                      boxShadow:'0 8px 28px rgba(0,0,0,.12)',
                      width:240, padding:'.75rem',
                    }}>
                      <div style={{ fontSize:'.58rem', letterSpacing:'.2em', textTransform:'uppercase', color:'var(--stone)', marginBottom:'.6rem' }}>Quick Presets</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.35rem', marginBottom:'.6rem' }}>
                        {COLOUR_PRESETS.map(p=>(
                          <button key={p.name} type="button" onClick={()=>addColour(p)} style={{
                            display:'flex', alignItems:'center', gap:'.5rem',
                            padding:'.4rem .6rem', border:'1px solid var(--sand)', cursor:'pointer',
                            background:'transparent', fontFamily:'var(--sans)',
                            fontSize:'.68rem', color:'var(--ink2)',
                            transition:'background var(--t)',
                          }}>
                            <span style={{ width:14, height:14, borderRadius:'50%', background:p.hex, border:'1px solid rgba(0,0,0,.15)', flexShrink:0 }}/>
                            {p.name}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={()=>addColour()} style={{
                        width:'100%', padding:'.45rem', border:'1px dashed var(--sand2)',
                        cursor:'pointer', background:'var(--off)', fontFamily:'var(--sans)',
                        fontSize:'.65rem', color:'var(--stone2)',
                      }}>+ Custom colour</button>
                    </div>
                  )}
                </div>
              </div>

              {form.colorGroups.length === 0 ? (
                <div style={{ border:'1.5px dashed var(--sand2)', padding:'2.5rem', textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>🎨</div>
                  <div style={{ fontSize:'.82rem', color:'var(--stone)', lineHeight:1.7 }}>
                    No colours yet.<br/>Click <strong>+ Add Colour</strong> to create your first colour group.
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
                    onUpload={() => {}}
                    onOpenComposer={(gi) => setComposerFor(gi)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Pricing */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.1rem' }}>Pricing</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="1299" min="0" required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Compare Price (₹)</label>
                  <input className="form-input" type="number" value={form.comparePrice} onChange={e=>set('comparePrice',e.target.value)} placeholder="1599"/>
                </div>
                {form.price && form.comparePrice && +form.comparePrice > +form.price && (
                  <div style={{ background:'rgba(139,115,85,.1)', border:'1px solid rgba(139,115,85,.25)', padding:'.6rem .9rem', fontSize:'.72rem', color:'var(--accent)' }}>
                    {Math.round((1-form.price/form.comparePrice)*100)}% discount shown
                  </div>
                )}
              </div>
            </div>

            {/* Display */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.1rem' }}>Display</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <div style={{ display:'flex', gap:'.35rem' }}>
                    {BADGES.map(b=>(
                      <button key={b||'none'} type="button" onClick={()=>set('badge',b)} style={{
                        padding:'.28rem .7rem', border:'1px solid', cursor:'pointer',
                        fontFamily:'var(--sans)', fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:500,
                        background:  form.badge===b?'var(--ink)':'transparent',
                        color:       form.badge===b?'var(--white)':'var(--stone2)',
                        borderColor: form.badge===b?'var(--ink)':'var(--sand)',
                        transition:'all var(--t)',
                      }}>{b||'None'}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Placeholder Glyph</label>
                  <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
                    {GLYPHS.map(g=>(
                      <button key={g} type="button" onClick={()=>set('glyph',g)} style={{
                        width:36, height:36, border:'1px solid', cursor:'pointer',
                        fontFamily:'var(--serif)', fontSize:'1.1rem',
                        background:  form.glyph===g?'var(--ink)':'transparent',
                        color:       form.glyph===g?'var(--white)':'var(--stone2)',
                        borderColor: form.glyph===g?'var(--ink)':'var(--sand)',
                        transition:'all var(--t)',
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <Toggle on={form.isActive}   onChange={v=>set('isActive',v)}   label="Visible in Store"/>
                <Toggle on={form.isFeatured} onChange={v=>set('isFeatured',v)} label="Featured on Homepage"/>
              </div>
            </div>

            {/* Colour summary */}
            {form.colorGroups.length > 0 && (
              <div className="admin-card">
                <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'.9rem', marginBottom:'.85rem' }}>Colour Summary</h3>
                {form.colorGroups.map((g,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'.65rem', marginBottom:'.55rem' }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:g.hex, border:'1px solid var(--sand)', flexShrink:0 }}/>
                    <span style={{ fontSize:'.78rem', flex:1 }}>{g.name||'Unnamed'}</span>
                    <span style={{
                      fontSize:'.58rem', letterSpacing:'.1em',
                      color: g.images.length >= MIN_IMAGES ? 'var(--success)' : 'var(--accent)',
                      fontWeight:500,
                    }}>
                      {g.images.length}/{MIN_IMAGES}
                      {g.isDefault && <span style={{ color:'var(--stone)', marginLeft:'.3rem' }}>· default</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <div className="admin-card">
              {error   && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', padding:'.8rem', marginBottom:'1rem', fontSize:'.78rem', color:'#991B1B' }}>{error}</div>}
              {success && <div style={{ background:'rgba(61,122,86,.08)', border:'1px solid rgba(61,122,86,.3)', padding:'.8rem', marginBottom:'1rem', fontSize:'.78rem', color:'var(--success)' }}>{success}</div>}
              {hasGroupError && (
                <div style={{ background:'rgba(139,115,85,.08)', border:'1px solid rgba(139,115,85,.25)', padding:'.75rem', marginBottom:'1rem', fontSize:'.72rem', color:'var(--accent)', lineHeight:1.6 }}>
                  Each colour group needs at least {MIN_IMAGES} images.
                </div>
              )}
              <button
                type="submit" className="btn btn-dark"
                style={{ width:'100%', justifyContent:'center', opacity:(saving||hasGroupError)?0.6:1 }}
                disabled={saving || hasGroupError}
              >
                {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              {isEdit && (
                <button type="button" onClick={()=>navigate('/admin/products')} className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:'.75rem', display:'flex' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Design composer overlay */}
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