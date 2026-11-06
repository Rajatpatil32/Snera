import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getImageUrl } from '../../utils/api';

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').replace(/^"|"$/g, ''); });
    return row;
  }).filter(r => r.name);
}

const REQUIRED   = ['name', 'price', 'category', 'description'];

// Every field the Product model supports — use TRUE/FALSE for booleans
const SAMPLE_CSV = `name,price,comparePrice,category,gender,description,fabric,careInstructions,sizes,sizePricing,soldSizes,tags,badge,glyph,weight,isActive,isFeatured,seo.metaTitle,seo.metaDescription,seo.focusKeyword,seo.keywords,seo.ogTitle,seo.ogDescription,seo.canonicalUrl,seo.noIndex
SNERA Essential Tee,1299,1599,Tops,Unisex,Premium cotton tee with relaxed fit,100% Cotton 220gsm,Machine wash cold,S|M|L|XL,XL:50|XXL:100,,cotton tee minimal,New,◈,220,TRUE,FALSE,SNERA Essential Tee | Buy Online India,Premium 100% cotton tee with relaxed fit. Free shipping above ₹999.,oversized tee india,"oversized tee,cotton tee,snera",SNERA Essential Tee | Shop Now,Premium cotton tee — shop now,,FALSE
SNERA Relaxed Cargo,2499,,Bottoms,Men,Utility cargo with 6 pockets,98% Cotton 2% Spandex,Hand wash cold,S|M|L|XL|XXL,,XXL,cargo pants streetwear,New,◈,280,TRUE,TRUE,SNERA Relaxed Cargo | Utility Pants India,6-pocket utility cargo. Relaxed fit. Free shipping above ₹999.,cargo pants india,"cargo pants,utility pants,snera",SNERA Relaxed Cargo | Shop Now,Utility cargo pants — shop now,,FALSE
SNERA Custom Photo Mug,499,,Gifts,Unisex,Ceramic mug printed with your own photo or design,"Ceramic, dishwasher safe","Not microwave safe",,,,mug gift photo,New,◈,350,TRUE,FALSE,Custom Photo Mug | Personalised Gifts India,Print your own photo on a ceramic mug. Free shipping above ₹999.,custom photo mug india,"photo mug,custom mug,personalised gift",Custom Photo Mug | Shop Now,Personalised photo mug — shop now,,FALSE`;

const COLOUR_PRESETS = [
  { name: 'Black',      hex: '#1C1B18' },
  { name: 'White',      hex: '#F8F7F4' },
  { name: 'Navy',       hex: '#1B2A4A' },
  { name: 'Olive',      hex: '#5C5A2E' },
  { name: 'Sage Green', hex: '#7C9070' },
  { name: 'Dusty Pink', hex: '#D4A5A5' },
  { name: 'Camel',      hex: '#C19A6B' },
  { name: 'Charcoal',   hex: '#3A3A3A' },
  { name: 'Cream',      hex: '#F5F0E8' },
  { name: 'Burgundy',   hex: '#6B2D3E' },
  { name: 'Sky Blue',   hex: '#7EB3D0' },
  { name: 'Stone',      hex: '#A09D96' },
];

// ─── ImgSlot — exactly same as AdminProductFormPage ──────────────────────────
const smBtn = (bg, color) => ({
  background: bg, color, border: 'none', cursor: 'pointer', fontSize: '.58rem',
  fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase',
  padding: '.28rem .65rem', fontFamily: 'var(--sans)', width: '100%', maxWidth: 110,
});

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
              <button type="button" onClick={() => onMakePrimary(index)} style={smBtn('#fff', '#1C1B18')}>★ Primary</button>
            )}
            <button type="button" onClick={() => onRemove(index)} style={smBtn('#dc2626', '#fff')}>× Remove</button>
          </div>
          {index === 0 && (
            <span style={{ position: 'absolute', top: 5, left: 5, background: 'var(--ink)', color: '#fff', fontSize: '.44rem', letterSpacing: '.14em', padding: '.18rem .45rem' }}>PRIMARY</span>
          )}
          <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: '.5rem', padding: '.1rem .3rem', borderRadius: 2 }}>{index + 1}</span>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.3rem' }}>
          <span style={{ fontSize: '1.2rem', opacity: .18 }}>◈</span>
          <span style={{ fontSize: '.56rem', color: 'var(--stone)', letterSpacing: '.06em' }}>{`Image ${index + 1}`}</span>
        </div>
      )}
    </div>
  );
}

// ─── ColourGroupCard — same as AdminProductFormPage but no composer ────────────
function ColourGroupCard({ group, index, isDefault, totalGroups, onChange, onDelete, onSetDefault }) {
  const fileRef    = useRef();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen]           = useState(true);
  const [showPreset, setShowPreset] = useState(false);


  // ── Direct upload ──
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

  const removeImg     = (i) => onChange(index, { ...group, images: group.images.filter((_, j) => j !== i) });
  const makePrimaryImg = (i) => {
    const imgs = [...group.images];
    const [item] = imgs.splice(i, 1);
    imgs.unshift(item);
    onChange(index, { ...group, images: imgs });
  };

  const slots = Array.from({ length: Math.max(4, group.images.length + 1) });

  return (
    <div style={{ border: `1.5px solid ${isDefault ? 'var(--ink)' : 'var(--sand)'}`, background: 'var(--white)', marginBottom: '1rem' }}>

      {/* Header */}
      <div style={{ padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem', borderBottom: '1px solid var(--sand)', background: isDefault ? 'var(--ink)' : 'var(--off)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: group.hex, border: '2px solid rgba(255,255,255,.6)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', gap: '.65rem', alignItems: 'center' }}>
          <input
            value={group.name}
            onChange={e => onChange(index, { ...group, name: e.target.value })}
            placeholder="Colour name"
            style={{ fontSize: '.8rem', fontWeight: 500, background: 'transparent', border: 'none', color: isDefault ? '#fff' : 'var(--ink)', outline: 'none', width: 120, fontFamily: 'var(--sans)' }}
          />
          <input
            type="color" value={group.hex}
            onChange={e => onChange(index, { ...group, hex: e.target.value })}
            style={{ width: 28, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3, padding: 0, background: 'transparent' }}
          />
          <span style={{ fontSize: '.62rem', color: isDefault ? 'rgba(255,255,255,.5)' : 'var(--stone)', fontFamily: 'monospace' }}>{group.hex}</span>
        </div>

        {/* Image count */}
        <div style={{ width: 80 }}>
          <span style={{ fontSize: '.54rem', color: isDefault ? 'rgba(255,255,255,.55)' : 'var(--stone)', marginTop: 2, display: 'block' }}>
            {group.images.length} image{group.images.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          {!isDefault && (
            <button type="button" onClick={() => onSetDefault(index)} style={{ fontSize: '.56rem', letterSpacing: '.12em', textTransform: 'uppercase', padding: '.25rem .6rem', border: '1px solid var(--sand)', cursor: 'pointer', fontFamily: 'var(--sans)', background: 'transparent', color: 'var(--stone2)' }}>
              Set Default
            </button>
          )}
          {isDefault && <span style={{ fontSize: '.54rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Default</span>}
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

          {/* ── TWO UPLOAD OPTIONS ── */}
          <div style={{ display: 'flex', gap: '.65rem' }}>

            {/* Option 1: Direct Upload */}
            <label style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '.7rem', border: `1.5px dashed ${uploading ? 'var(--accent)' : 'var(--sand2)'}`,
              cursor: uploading ? 'not-allowed' : 'pointer', background: 'var(--off)',
              fontSize: '.68rem', color: 'var(--stone2)', transition: 'all .2s',
            }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={e => handleFiles(e.target.files)}
              />
              📁 {uploading ? 'Uploading…' : `Direct Upload (${group.images.length})`}
            </label>

            {/* Option 2: Design Composer — opens ProductDesignComposer via parent */}
            <button
              type="button"
              onClick={() => {
                // signal parent to open composer for this group index
                onChange(index, { ...group, _openComposer: true });
              }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                padding: '.7rem', border: '1.5px dashed var(--accent)', cursor: 'pointer',
                background: 'rgba(139,115,85,.04)', fontSize: '.68rem', color: 'var(--accent)',
                fontFamily: 'var(--sans)', transition: 'all .2s',
              }}
            >
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
        </div>
      )}
    </div>
  );
}

// ─── Per-product image dialog (shown after bulk import) ───────────────────────
function ImageDialog({ product, onDone, onSkip }) {
  const [colorGroups, setColorGroups] = useState([
    { name: 'Default', hex: '#1C1B18', images: [], soldSizes: [], isDefault: true }
  ]);
  const [saving, setSaving]     = useState(false);
  const [showPreset, setShowPreset] = useState(false);
  const [composerFor, setComposerFor] = useState(null);

  const updateGroup = (i, val) => {
    // detect if Design Composer was triggered
    if (val._openComposer) {
      const clean = { ...val };
      delete clean._openComposer;
      setColorGroups(g => { const n = [...g]; n[i] = clean; return n; });
      setComposerFor(i);
      return;
    }
    setColorGroups(g => { const n = [...g]; n[i] = val; return n; });
  };

  const deleteGroup = (i) => setColorGroups(g => {
    const n = g.filter((_, j) => j !== i);
    if (n.length && !n.some(x => x.isDefault)) n[0].isDefault = true;
    return n;
  });

  const setDefault = (i) => setColorGroups(g =>
    g.map((x, j) => ({ ...x, isDefault: j === i }))
  );

  const addColour = (preset = null) => {
    const g = preset
      ? { name: preset.name, hex: preset.hex, images: [], soldSizes: [], isDefault: false }
      : { name: 'New Colour', hex: '#888888', images: [], soldSizes: [], isDefault: false };
    setColorGroups(prev => [...prev, g]);
    setShowPreset(false);
  };

  const totalImages = colorGroups.reduce((s, g) => s + g.images.length, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const allImages = (colorGroups.find(g => g.isDefault) || colorGroups[0])?.images || [];
      await API.put(`/products/${product.id}`, { images: allImages, colorGroups });
      onDone(totalImages);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2rem 1rem', overflowY: 'auto',
    }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: 680, padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone2)', marginBottom: '.4rem' }}>
            Upload Images for
          </p>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.5rem' }}>{product.name}</h2>
          <p style={{ fontSize: '.75rem', color: 'var(--stone2)', marginTop: '.3rem' }}>
            Add colour groups and their images — same as the product form.
          </p>
        </div>

        {/* Colour Groups */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)' }}>
              Colour Groups ({colorGroups.length})
            </span>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowPreset(p => !p)}
                style={{ padding: '.4rem .9rem', background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>
                + Add Colour
              </button>
              {showPreset && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 50,
                  background: 'var(--white)', border: '1px solid var(--sand)',
                  boxShadow: '0 8px 28px rgba(0,0,0,.12)', width: 240, padding: '.75rem',
                }}>
                  <div style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.6rem' }}>Quick Presets</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.35rem', marginBottom: '.6rem' }}>
                    {COLOUR_PRESETS.map(p => (
                      <button key={p.name} type="button" onClick={() => addColour(p)} style={{
                        display: 'flex', alignItems: 'center', gap: '.5rem',
                        padding: '.4rem .6rem', border: '1px solid var(--sand)', cursor: 'pointer',
                        background: 'transparent', fontFamily: 'var(--sans)', fontSize: '.68rem', color: 'var(--ink2)',
                      }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.hex, border: '1px solid rgba(0,0,0,.15)', flexShrink: 0 }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => addColour()} style={{
                    width: '100%', padding: '.45rem', border: '1px dashed var(--sand2)',
                    cursor: 'pointer', background: 'var(--off)', fontFamily: 'var(--sans)', fontSize: '.65rem', color: 'var(--stone2)',
                  }}>+ Custom colour</button>
                </div>
              )}
            </div>
          </div>

          {colorGroups.map((g, i) => (
            <ColourGroupCard
              key={i}
              group={g}
              index={i}
              isDefault={g.isDefault}
              totalGroups={colorGroups.length}
              onChange={updateGroup}
              onDelete={deleteGroup}
              onSetDefault={setDefault}
            />
          ))}
        </div>

        {/* Summary */}
        <p style={{ fontSize: '.72rem', color: 'var(--success)', marginBottom: '1.25rem' }}>
          {`✅ ${totalImages} images across ${colorGroups.length} colour${colorGroups.length > 1 ? 's' : ''} — ready to save`}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={handleSave} disabled={saving || !totalImages}
            style={{
              flex: 1, padding: '.75rem', background: 'var(--ink)', color: '#fff', border: 'none',
              cursor: (saving || !totalImages) ? 'not-allowed' : 'pointer',
              fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'var(--sans)',
              opacity: (saving || !totalImages) ? 0.6 : 1,
            }}>
            {saving ? 'Saving…' : totalImages ? `Save ${totalImages} Images` : 'Upload Images First'}
          </button>
          <button onClick={onSkip}
            style={{ padding: '.75rem 1.25rem', background: 'none', color: 'var(--stone2)', border: '1px solid var(--sand)', cursor: 'pointer', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>
            Skip →
          </button>
        </div>

        {/* ProductDesignComposer integration */}
        {composerFor !== null && (() => {
          // Lazy-load composer only when needed
          const ProductDesignComposer = React.lazy(() => import('./ProductDesignComposer'));
          return (
            <React.Suspense fallback={null}>
              <ProductDesignComposer
                onComposed={url => {
                  setColorGroups(g => {
                    const n = [...g];
                    n[composerFor] = { ...n[composerFor], images: [...n[composerFor].images, url] };
                    return n;
                  });
                  setComposerFor(null);
                }}
                onCancel={() => setComposerFor(null)}
              />
            </React.Suspense>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProductImportPage() {
  const navigate  = useNavigate();
  const fileRef   = useRef();

  const [step, setStep]           = useState('upload');
  const [rows, setRows]           = useState([]);
  const [errors, setErrors]       = useState([]);
  const [imported, setImported]   = useState([]);
  const [imageQueue, setImageQueue] = useState([]);
  const [imageIdx, setImageIdx]   = useState(0);
  const [imageCounts, setImageCounts] = useState({});
  const [dragOver, setDragOver]   = useState(false);
  const [sheetUrl, setSheetUrl]   = useState('');

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target.result);
      if (!parsed.length) return setErrors(['CSV is empty or has no valid rows.']);
      const missing = REQUIRED.filter(k => !(k in parsed[0]));
      if (missing.length) return setErrors([`Missing required columns: ${missing.join(', ')}`]);
      setRows(parsed); setErrors([]); setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const loadSheet = async () => {
    const url   = sheetUrl.trim();
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return setErrors(['Invalid Google Sheet URL. Share the sheet and paste the link.']);
    const sheetId = match[1];
    const gid     = url.match(/gid=(\d+)/)?.[1] || '0';
    const csvUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
      const r = await fetch(csvUrl);
      if (!r.ok) throw new Error('Could not fetch sheet. Make sure it is shared as "Anyone with the link can view".');
      handleFile(new File([await r.text()], 'sheet.csv', { type: 'text/csv' }));
    } catch (e) { setErrors([e.message]); }
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const r = await API.post('/products/admin/bulk-import', { products: rows });
      const results = r.data.results;
      setImported(results);
      const successful = results.filter(x => x.status === 'ok');
      setImageQueue(successful);
      setImageIdx(0);
      setStep(successful.length ? 'images' : 'done');
    } catch (e) {
      setErrors([e.response?.data?.error || e.message]);
      setStep('preview');
    }
  };

  const handleImageDone = (count) => {
    setImageCounts(prev => ({ ...prev, [imageQueue[imageIdx].id]: count }));
    const next = imageIdx + 1;
    if (next >= imageQueue.length) setStep('done');
    else setImageIdx(next);
  };

  const handleImageSkip = () => {
    const next = imageIdx + 1;
    if (next >= imageQueue.length) setStep('done');
    else setImageIdx(next);
  };

  const TH = { fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#999', padding: '.6rem .75rem', textAlign: 'left', borderBottom: '1px solid var(--sand)', fontWeight: 400, whiteSpace: 'nowrap' };
  const TD = { padding: '.55rem .75rem', fontSize: '.78rem', borderBottom: '1px solid var(--off)', verticalAlign: 'top' };

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/products')}
          style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '.75rem', fontFamily: 'var(--sans)' }}>
          ← Products
        </button>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.8rem' }}>Bulk Import Products</h1>
        <p style={{ color: 'var(--stone2)', fontSize: '.82rem', marginTop: '.25rem' }}>
          Upload CSV or import from Google Sheets — then add images (with colour groups + Design Composer) for each product
        </p>
      </div>

      {/* ── STEP: Upload ── */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Google Sheets */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📊</span>
              <div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem' }}>Import from Google Sheets</h3>
                <p style={{ fontSize: '.72rem', color: 'var(--stone2)', marginTop: '.15rem' }}>Share your sheet → copy link → paste below</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="form-input" style={{ flex: 1 }} />
              <button onClick={loadSheet}
                style={{ padding: '.6rem 1.25rem', background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
                Load Sheet
              </button>
            </div>
            <p style={{ fontSize: '.68rem', color: 'var(--stone)', marginTop: '.6rem' }}>
              Sheet must be set to <strong>"Anyone with the link can view"</strong>.
            </p>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--stone)', fontSize: '.8rem' }}>— or —</div>

          {/* CSV Drop Zone */}
          <div
            style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--sand)'}`, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(139,115,85,.04)' : 'var(--off)', transition: 'all .2s' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📁</div>
            <p style={{ fontSize: '.9rem', color: 'var(--stone)', marginBottom: '.4rem' }}>Drag & drop your CSV file here</p>
            <p style={{ fontSize: '.72rem', color: 'var(--stone2)' }}>or click to browse</p>
          </div>

          {errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', fontSize: '.8rem', color: '#991B1B' }}>
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Column Guide */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>CSV Format Guide</h3>
              <button
                onClick={() => { const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(SAMPLE_CSV); a.download = 'snera_products_template.csv'; a.click(); }}
                className="btn btn-ghost" style={{ fontSize: '.6rem', padding: '.4rem .9rem' }}>
                ⬇ Download Template
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
              <thead>
                <tr>
                  <th style={TH}>Column</th><th style={TH}>Required</th><th style={TH}>Example</th>
                </tr>
              </thead>
              <tbody>
                {[
                  // ── Core fields ──
                  ['name',                true,  'SNERA Essential Tee'],
                  ['price',               true,  '1299'],
                  ['category',            true,  'Any text — e.g. Tops, Gifts, Mugs'],
                  ['description',         true,  'Premium cotton tee with relaxed fit'],
                  // ── Product details ──
                  ['comparePrice',        false, '1599  (strike-through price)'],
                  ['gender',              false, 'Unisex / Men / Women'],
                  ['fabric',              false, '100% Cotton 220gsm  or  Ceramic, dishwasher safe'],
                  ['careInstructions',    false, 'Machine wash cold  or  Not dishwasher safe'],
                  ['sizes',               false, 'S,M,L,XL  or  S|M|L|XL — leave BLANK for no size (e.g. mugs, gifts)'],
                  ['sizePricing',         false, 'XL:50|XXL:100  (XL costs +₹50, XXL costs +₹100)'],
                  ['soldSizes',           false, 'XXL  (sizes currently out of stock)'],
                  ['tags',                false, 'cotton,tee,minimal'],
                  ['badge',               false, 'New / Sale / (leave blank = none)'],
                  ['glyph',               false, '◈  (placeholder icon before images load)'],
                  ['weight',              false, '220  (grams, used for shipping calc)'],
                  // ── Visibility ──
                  ['isActive',            false, 'TRUE / FALSE  — visible in shop (default TRUE)'],
                  ['isFeatured',          false, 'TRUE / FALSE  — show on homepage (default FALSE)'],
                  // ── SEO fields ──
                  ['seo.metaTitle',       false, 'SNERA Essential Tee | Buy Online India'],
                  ['seo.metaDescription', false, 'Short desc for Google (140–160 chars)'],
                  ['seo.focusKeyword',    false, 'oversized tee india'],
                  ['seo.keywords',        false, 'keyword1,keyword2,keyword3'],
                  ['seo.ogTitle',         false, 'Title for WhatsApp / social shares'],
                  ['seo.ogDescription',   false, 'Description for WhatsApp / social shares'],
                  ['seo.canonicalUrl',    false, 'https://snera.in/product/slug  (leave blank = auto)'],
                  ['seo.noIndex',         false, 'TRUE / FALSE  — hide from Google (default FALSE)'],
                ].map(([col, req, ex]) => (
                  <tr key={col}>
                    <td style={{ ...TD, fontFamily: 'monospace', color: 'var(--ink)' }}>{col}</td>
                    <td style={TD}>{req ? <span style={{ color: 'var(--success)', fontSize: '.65rem' }}>Required</span> : <span style={{ color: 'var(--stone)', fontSize: '.65rem' }}>Optional</span>}</td>
                    <td style={{ ...TD, color: 'var(--stone2)' }}>{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP: Preview ── */}
      {step === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.3rem' }}>Preview — {rows.length} product{rows.length !== 1 ? 's' : ''}</h2>
              <p style={{ fontSize: '.72rem', color: 'var(--stone2)', marginTop: '.2rem' }}>Review before importing. Colour groups + images will be added after.</p>
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => { setStep('upload'); setRows([]); }}
                className="btn btn-ghost" style={{ fontSize: '.66rem' }}>← Back</button>
              <button onClick={handleImport}
                className="btn btn-dark" style={{ fontSize: '.66rem' }}>Import {rows.length} Products →</button>
            </div>
          </div>

          {errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', marginBottom: '1rem', fontSize: '.8rem', color: '#991B1B' }}>
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div style={{ overflowX: 'auto', border: '1px solid var(--sand)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ background: 'var(--off)' }}>
                <tr>
                  <th style={TH}>#</th>
                  <th style={TH}>Name</th>
                  <th style={TH}>Price</th>
                  <th style={TH}>Category</th>
                  <th style={TH}>Gender</th>
                  <th style={TH}>Sizes</th>
                  <th style={TH}>Badge</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, color: 'var(--stone2)' }}>{i + 1}</td>
                    <td style={{ ...TD, fontWeight: 500 }}>{row.name}</td>
                    <td style={TD}>₹{row.price}{row.compareprice && <span style={{ color: 'var(--stone2)', marginLeft: '.4rem', textDecoration: 'line-through' }}>₹{row.compareprice}</span>}</td>
                    <td style={TD}>{row.category}</td>
                    <td style={TD}>{row.gender || 'Unisex'}</td>
                    <td style={{ ...TD, color: 'var(--stone2)' }}>{row.sizes || '— (no size)'}</td>
                    <td style={TD}>{row.badge || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP: Importing ── */}
      {step === 'importing' && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div className="loader-ring" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 300 }}>Creating {rows.length} products…</p>
          <p style={{ color: 'var(--stone2)', fontSize: '.8rem', marginTop: '.5rem' }}>This may take a moment</p>
        </div>
      )}

      {/* ── STEP: Images ── */}
      {step === 'images' && imageQueue[imageIdx] && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--stone2)', marginBottom: '.4rem' }}>
              <span>Adding images — product {imageIdx + 1} of {imageQueue.length}</span>
              <span>{Math.round((imageIdx / imageQueue.length) * 100)}% complete</span>
            </div>
            <div style={{ height: 4, background: 'var(--sand)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${(imageIdx / imageQueue.length) * 100}%`, background: 'var(--ink)', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>

          <ImageDialog
            product={imageQueue[imageIdx]}
            onDone={handleImageDone}
            onSkip={handleImageSkip}
          />
        </>
      )}

      {/* ── STEP: Done ── */}
      {step === 'done' && (
        <div>
          <div style={{ textAlign: 'center', padding: '3rem 1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '2rem', marginBottom: '.5rem' }}>Import Complete</h2>
            <p style={{ color: 'var(--stone2)' }}>
              {imported.filter(r => r.status === 'ok').length} of {imported.length} products created successfully.
            </p>
          </div>

          <div style={{ border: '1px solid var(--sand)', overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--off)' }}>
                <tr>
                  <th style={TH}>Product</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Images</th>
                  <th style={TH}>Action</th>
                </tr>
              </thead>
              <tbody>
                {imported.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...TD, fontWeight: 500 }}>{r.name}</td>
                    <td style={TD}>
                      {r.status === 'ok'
                        ? <span style={{ color: 'var(--success)', fontSize: '.68rem' }}>✅ Created</span>
                        : <span style={{ color: 'var(--error)', fontSize: '.68rem' }}>❌ {r.error}</span>}
                    </td>
                    <td style={TD}>
                      {r.status === 'ok'
                        ? <span style={{ color: imageCounts[r.id] ? 'var(--success)' : 'var(--accent)', fontSize: '.68rem' }}>
                            {imageCounts[r.id] ? `${imageCounts[r.id]} uploaded` : 'No images yet'}
                          </span>
                        : '—'}
                    </td>
                    <td style={TD}>
                      {r.status === 'ok' && (
                        <a href={`/admin/products/${r.id}/edit`}
                          style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink)', borderBottom: '1px solid var(--ink)' }}>
                          Edit
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> 

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/admin/products')} className="btn btn-dark" style={{ padding: '.75rem 2rem', fontSize: '.7rem' }}>
              Go to Products
            </button>
            <button onClick={() => { setStep('upload'); setRows([]); setImported([]); setImageQueue([]); setImageIdx(0); setImageCounts({}); setSheetUrl(''); }}
              className="btn btn-ghost" style={{ padding: '.75rem 2rem', fontSize: '.7rem' }}>
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}