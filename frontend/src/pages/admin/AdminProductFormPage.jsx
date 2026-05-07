import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';
import ProductDesignComposer from './ProductDesignComposer';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Accessories'];
const GENDERS    = ['Men', 'Women', 'Unisex'];
const SIZES_ALL  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BADGES     = ['', 'New', 'Sale'];
const GLYPHS     = ['◈', '◇', '△', '◯', '⬡', '◻', '◆'];
const MIN_IMAGES = 3;

const emptyForm = {
  name: '', category: 'Tops', gender: 'Unisex',
  price: '', comparePrice: '',
  description: '', fabric: '', careInstructions: '',
  sizes: ['S','M','L','XL'], soldSizes: [],
  glyph: '◈', badge: 'New',
  isActive: true, isFeatured: false,
  tags: '', weight: 220, images: [],
};

// ─── Toggle switch component ───────────────────────────────────────────────────
function Toggle({ on, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.75rem', background:'var(--off)', border:'1px solid var(--sand)' }}>
      <div>
        <div style={{ fontSize:'.75rem', fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontSize:'.65rem', color:'var(--stone)', marginTop:'.15rem' }}>{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!on)} style={{
        width:40, height:22, borderRadius:11, border:'none', cursor:'pointer',
        background: on ? 'var(--ink)' : 'var(--sand2)',
        position:'relative', transition:'background .2s', flexShrink:0,
      }}>
        <span style={{
          position:'absolute', top:3, left: on ? 21 : 3,
          width:16, height:16, borderRadius:'50%', background:'white',
          transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)',
        }}/>
      </button>
    </div>
  );
}

// ─── Image slot (empty placeholder or filled) ─────────────────────────────────
function ImageSlot({ img, index, isPrimary, onRemove, onMove, total }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ position:'relative', aspectRatio:'3/4', background:'var(--off)', overflow:'hidden', border:'1px solid var(--sand)' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {img ? (
        <>
          <img
            src={getImageUrl(img)}
            alt={`Product ${index+1}`}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
          />
          {/* Hover controls */}
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(28,27,24,.5)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.4rem',
            opacity: hover ? 1 : 0, transition:'opacity .2s',
          }}>
            {index > 0 && (
              <button type="button" onClick={() => onMove(index, index-1)} style={ctrlBtn('#FFF','#1C1B18')}>← Make Primary</button>
            )}
            <button type="button" onClick={() => onRemove(index)} style={ctrlBtn('#dc2626','#fff')}>× Remove</button>
          </div>
          {isPrimary && (
            <span style={{ position:'absolute', top:6, left:6, background:'var(--ink)', color:'#fff', fontSize:'.46rem', letterSpacing:'.14em', padding:'.18rem .5rem', textTransform:'uppercase' }}>
              Primary
            </span>
          )}
          <span style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,.45)', color:'#fff', fontSize:'.5rem', padding:'.12rem .35rem', borderRadius:2 }}>
            {index + 1}
          </span>
        </>
      ) : (
        <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.4rem' }}>
          <span style={{ fontSize:'1.4rem', opacity:.25 }}>◈</span>
          <span style={{ fontSize:'.58rem', color:'var(--stone)', letterSpacing:'.06em' }}>
            {index < MIN_IMAGES ? `Required ${index+1}` : `Optional ${index+1}`}
          </span>
        </div>
      )}
    </div>
  );
}

const ctrlBtn = (bg, color) => ({
  background: bg, color, border:'none', cursor:'pointer',
  fontSize:'.6rem', fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase',
  padding:'.3rem .75rem', fontFamily:'var(--sans)', width:'100%',
  maxWidth:130,
});

// ─── Upload mode tab ──────────────────────────────────────────────────────────
function ModeTab({ active, onClick, icon, title, desc, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:'.5rem',
        padding:'1.1rem .75rem', flex:1,
        border: `1.5px solid ${active ? 'var(--ink)' : 'var(--sand)'}`,
        background: active ? 'var(--ink)' : 'transparent',
        cursor:'pointer', transition:'all var(--t)', position:'relative',
        fontFamily:'var(--sans)',
      }}
    >
      <span style={{ fontSize:'1.8rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize:'.72rem', fontWeight:600, letterSpacing:'.04em', color: active ? '#fff' : 'var(--ink)', marginBottom:'.2rem' }}>{title}</div>
        <div style={{ fontSize:'.62rem', color: active ? 'rgba(255,255,255,.65)' : 'var(--stone2)', lineHeight:1.5 }}>{desc}</div>
      </div>
      {badge && (
        <span style={{
          position:'absolute', top:6, right:6,
          fontSize:'.46rem', letterSpacing:'.14em', textTransform:'uppercase',
          background: active ? '#8B7355' : 'var(--accent)', color:'#fff',
          padding:'.15rem .4rem',
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminProductFormPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [form,         setForm]         = useState(emptyForm);
  const [uploadMode,   setUploadMode]   = useState('direct'); // 'direct' | 'composer'
  const [showComposer, setShowComposer] = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [ftpStatus,    setFtpStatus]    = useState(null);
  const [dragActive,   setDragActive]   = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSize = (sz, field) =>
    setForm(f => ({ ...f, [field]: f[field].includes(sz) ? f[field].filter(s=>s!==sz) : [...f[field],sz] }));

  // Load product for edit + FTP status
  useEffect(() => {
    API.get('/upload/status').then(r => setFtpStatus(r.data)).catch(() => {});
    if (!isEdit) return;
    API.get('/products/admin/all')
      .then(r => {
        const p = (r.data.products || []).find(x => x._id === id);
        if (!p) return;
        setForm({ ...emptyForm, ...p, price: p.price||'', comparePrice: p.comparePrice||'', tags:(p.tags||[]).join(', ') });
      });
  }, [id, isEdit]);

  // Upload files handler
  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      arr.forEach(f => fd.append('images', f));
      const r = await API.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, images: [...f.images, ...r.data.urls] }));
      setSuccess(`✓ ${r.data.count} image${r.data.count!==1?'s':''} uploaded${r.data.storage==='ftp'?' to FTP':' locally'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally { setUploading(false); }
  };

  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_,idx)=>idx!==i) }));
  const moveImage   = (from, to) => {
    setForm(f => {
      const imgs = [...f.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...f, images: imgs };
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  // Save product
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())        return setError('Product name is required');
    if (!form.price||isNaN(+form.price)) return setError('Valid price required');
    if (!form.description.trim()) return setError('Description is required');
    if (form.images.length < MIN_IMAGES) return setError(`Please upload at least ${MIN_IMAGES} product images`);

    setSaving(true); setError(''); setSuccess('');
    const payload = {
      ...form,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      tags:         form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
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

  const needed = Math.max(0, MIN_IMAGES - form.images.length);
  const slots  = Array.from({ length: Math.max(MIN_IMAGES, form.images.length + 1) });

  return (
    <>
      <div className="admin-header">
        <div>
          <button
            onClick={() => navigate('/admin/products')}
            style={{ fontSize:'.65rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)' }}
          >← Products</button>
          <h1 className="admin-title" style={{ marginTop:'.4rem' }}>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        {/* FTP badge */}
        {ftpStatus && (
          <div style={{
            display:'flex', alignItems:'center', gap:'.5rem',
            padding:'.45rem .9rem', border:`1px solid ${ftpStatus.ftp.configured?'rgba(61,122,86,.3)':'var(--sand)'}`,
            background: ftpStatus.ftp.configured ? 'rgba(61,122,86,.06)' : 'var(--off)',
            fontSize:'.65rem', color: ftpStatus.ftp.configured ? 'var(--success)' : 'var(--stone)',
          }}>
            <span>{ftpStatus.ftp.configured ? '🟢' : '⚫'}</span>
            {ftpStatus.ftp.configured
              ? `FTP: ${ftpStatus.ftp.host}`
              : 'FTP: Not configured (local storage)'}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.5rem', alignItems:'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Basic info */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.25rem' }}>Basic Information</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. SNERA Essential Tee" required/>
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
                  <textarea className="form-textarea" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the product..." style={{ minHeight:100 }}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fabric</label>
                    <input className="form-input" value={form.fabric} onChange={e=>set('fabric',e.target.value)} placeholder="100% Cotton, 220 GSM"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Care Instructions</label>
                    <input className="form-input" value={form.careInstructions} onChange={e=>set('careInstructions',e.target.value)} placeholder="Machine wash cold"/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="tee, essential, summer"/>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.25rem' }}>Sizes</h3>
              <div style={{ marginBottom:'1rem' }}>
                <label className="form-label" style={{ marginBottom:'.5rem' }}>Available Sizes</label>
                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                  {SIZES_ALL.map(sz=>(
                    <button key={sz} type="button" onClick={()=>toggleSize(sz,'sizes')} style={{
                      width:42, height:42, border:'1px solid', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'.72rem', fontWeight:500,
                      background: form.sizes.includes(sz)?'var(--ink)':'transparent',
                      color:      form.sizes.includes(sz)?'var(--white)':'var(--stone2)',
                      borderColor:form.sizes.includes(sz)?'var(--ink)':'var(--sand)',
                      transition:'all var(--t)',
                    }}>{sz}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom:'.5rem', color:'var(--error)' }}>Sold Out Sizes</label>
                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                  {form.sizes.map(sz=>(
                    <button key={sz} type="button" onClick={()=>toggleSize(sz,'soldSizes')} style={{
                      width:42, height:42, border:'1px solid', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'.72rem', fontWeight:500,
                      background:  form.soldSizes.includes(sz)?'#FEE2E2':'transparent',
                      color:       form.soldSizes.includes(sz)?'var(--error)':'var(--stone2)',
                      borderColor: form.soldSizes.includes(sz)?'#FECACA':'var(--sand)',
                      transition:'all var(--t)',
                    }}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── IMAGES ── */}
            <div className="admin-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
                <div>
                  <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem' }}>Product Images</h3>
                  <p style={{ fontSize:'.68rem', color: needed>0?'var(--error)':'var(--success)', marginTop:'.2rem' }}>
                    {form.images.length}/{MIN_IMAGES} required
                    {needed > 0 && ` — add ${needed} more`}
                    {form.images.length >= MIN_IMAGES && form.images.length < 10 && ' ✓ — add more if you like'}
                  </p>
                </div>
                {form.images.length > 0 && (
                  <span style={{ fontSize:'.58rem', color:'var(--stone)', letterSpacing:'.1em' }}>
                    {form.images.length} image{form.images.length!==1?'s':''}
                    {ftpStatus?.ftp.configured ? ' · FTP' : ' · Local'}
                  </span>
                )}
              </div>

              {/* Mode tabs */}
              <div style={{ display:'flex', gap:'.75rem', marginBottom:'1.25rem' }}>
                <ModeTab
                  active={uploadMode==='direct'}
                  onClick={() => setUploadMode('direct')}
                  icon="📁"
                  title="Direct Upload"
                  desc={`Upload ready product photos (min ${MIN_IMAGES})`}
                />
                <ModeTab
                  active={uploadMode==='composer'}
                  onClick={() => setUploadMode('composer')}
                  icon="🎨"
                  title="Design Composer"
                  desc={`Place design on product (min ${MIN_IMAGES})`}
                  badge="Pro"
                />
              </div>

              {/* Direct upload zone */}
              {uploadMode === 'direct' && (
                <div
                  onDrop={handleDrop}
                  onDragOver={e=>{e.preventDefault();setDragActive(true);}}
                  onDragLeave={()=>setDragActive(false)}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragActive?'var(--ink)':'var(--sand2)'}`,
                    padding:'2rem 1rem', textAlign:'center', cursor:'pointer',
                    background: dragActive?'rgba(28,27,24,.03)':'transparent',
                    marginBottom:'1.25rem', transition:'all var(--t)',
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple hidden
                    onChange={e=>handleFiles(e.target.files)}
                  />
                  <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>📸</div>
                  <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--ink)', marginBottom:'.3rem' }}>
                    {uploading ? 'Uploading...' : `Drop images here or click to browse`}
                  </div>
                  <div style={{ fontSize:'.7rem', color:'var(--stone2)' }}>
                    JPEG, PNG, WebP, AVIF · Max 8 MB each · Upload as many as you want
                    {ftpStatus?.ftp.configured && <span style={{ color:'var(--success)', display:'block', marginTop:'.3rem' }}>✓ Images will upload to {ftpStatus.ftp.host}</span>}
                  </div>
                </div>
              )}

              {/* Design composer trigger */}
              {uploadMode === 'composer' && (
                <button
                  type="button"
                  onClick={()=>setShowComposer(true)}
                  style={{
                    width:'100%', padding:'1.75rem', marginBottom:'1.25rem',
                    border:'1.5px dashed var(--accent)', cursor:'pointer',
                    background:'rgba(139,115,85,.04)', fontFamily:'var(--sans)',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:'.6rem',
                    transition:'all var(--t)',
                  }}
                >
                  <span style={{ fontSize:'1.75rem' }}>🎨</span>
                  <div style={{ fontSize:'.8rem', fontWeight:500, color:'var(--ink)' }}>
                    Open Design Composer
                  </div>
                  <div style={{ fontSize:'.7rem', color:'var(--stone2)', textAlign:'center', lineHeight:1.6 }}>
                    Upload plain product photo + your graphic/logo<br/>
                    Position, scale and blend — then save the composed image<br/>
                    Compose {MIN_IMAGES}+ images (different angles, variants)
                  </div>
                </button>
              )}

              {/* Image grid — always visible regardless of mode */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'.65rem' }}>
                {slots.map((_, i) => (
                  <ImageSlot
                    key={i}
                    img={form.images[i] || null}
                    index={i}
                    isPrimary={i===0}
                    total={form.images.length}
                    onRemove={removeImage}
                    onMove={moveImage}
                  />
                ))}
              </div>

              {form.images.length > 0 && (
                <p style={{ fontSize:'.65rem', color:'var(--stone)', marginTop:'.75rem', lineHeight:1.6 }}>
                  💡 Drag to reorder is coming soon. Use the "← Make Primary" button to set the main image. First image is the primary display image.
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
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
                  <input className="form-input" type="number" value={form.comparePrice} onChange={e=>set('comparePrice',e.target.value)} placeholder="1599 (for strikethrough)" min="0"/>
                </div>
                {form.price && form.comparePrice && +form.comparePrice > +form.price && (
                  <div style={{ background:'rgba(139,115,85,.1)', border:'1px solid rgba(139,115,85,.25)', padding:'.6rem .9rem', fontSize:'.72rem', color:'var(--accent)' }}>
                    {Math.round((1-form.price/form.comparePrice)*100)}% discount shown to customers
                  </div>
                )}
              </div>
            </div>

            {/* Display */}
            <div className="admin-card">
              <h3 style={{ fontFamily:'var(--serif)', fontWeight:400, fontSize:'1rem', marginBottom:'1.1rem' }}>Display Options</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <div style={{ display:'flex', gap:'.4rem' }}>
                    {BADGES.map(b=>(
                      <button key={b||'none'} type="button" onClick={()=>set('badge',b)} style={{
                        padding:'.28rem .75rem', border:'1px solid', cursor:'pointer',
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
                  <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                    {GLYPHS.map(g=>(
                      <button key={g} type="button" onClick={()=>set('glyph',g)} style={{
                        width:38, height:38, border:'1px solid', cursor:'pointer',
                        fontFamily:'var(--serif)', fontSize:'1.1rem',
                        background:  form.glyph===g?'var(--ink)':'transparent',
                        color:       form.glyph===g?'var(--white)':'var(--stone2)',
                        borderColor: form.glyph===g?'var(--ink)':'var(--sand)',
                        transition:'all var(--t)',
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
                <Toggle on={form.isActive}   onChange={v=>set('isActive',v)}   label="Visible in Store" desc="Show product to shoppers"/>
                <Toggle on={form.isFeatured} onChange={v=>set('isFeatured',v)} label="Featured on Homepage" desc="Show in New Arrivals section"/>
              </div>
            </div>

            {/* Save */}
            <div className="admin-card">
              {error   && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', padding:'.8rem 1rem', marginBottom:'1rem', fontSize:'.78rem', color:'#991B1B' }}>{error}</div>}
              {success && <div style={{ background:'rgba(61,122,86,.08)', border:'1px solid rgba(61,122,86,.3)', padding:'.8rem 1rem', marginBottom:'1rem', fontSize:'.78rem', color:'var(--success)' }}>{success}</div>}

              {needed > 0 && (
                <div style={{ background:'rgba(139,115,85,.08)', border:'1px solid rgba(139,115,85,.25)', padding:'.75rem 1rem', marginBottom:'1rem', fontSize:'.72rem', color:'var(--accent)', lineHeight:1.6 }}>
                  📸 Add {needed} more image{needed!==1?'s':''} to save. Min {MIN_IMAGES} required.
                </div>
              )}

              <button
                type="submit"
                className="btn btn-dark"
                style={{ width:'100%', justifyContent:'center', opacity:(saving||uploading)?0.7:1 }}
                disabled={saving || uploading || needed > 0}
              >
                {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
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

      {/* Composer overlay */}
      {showComposer && (
        <ProductDesignComposer
          onComposed={url => {
            setForm(f => ({ ...f, images: [...f.images, url] }));
            setShowComposer(false);
          }}
          onCancel={() => setShowComposer(false)}
        />
      )}

      <style>{`
        @media(max-width:900px){ form>div{grid-template-columns:1fr!important} }
      `}</style>
    </>
  );
}
