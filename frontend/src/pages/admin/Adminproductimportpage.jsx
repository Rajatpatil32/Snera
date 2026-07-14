import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    // handle quoted commas
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

// ─── Required CSV columns ─────────────────────────────────────────────────────
const REQUIRED = ['name', 'price', 'category', 'description'];
const OPTIONAL = ['compareprice', 'gender', 'fabric', 'careinstructions', 'sizes', 'tags', 'badge', 'weight'];
const SAMPLE_CSV = `name,price,comparePrice,category,gender,description,fabric,careInstructions,sizes,tags,badge
SNERA Essential Tee,1299,1599,Tops,Unisex,Premium cotton tee with relaxed fit,100% Cotton 220gsm,Machine wash cold,S|M|L|XL,cotton tee minimal,New
SNERA Relaxed Cargo,2499,,Bottoms,Men,Utility cargo with 6 pockets,98% Cotton 2% Spandex,Hand wash cold,S|M|L|XL|XXL,cargo pants streetwear,`;

// ─── Image Upload Dialog ──────────────────────────────────────────────────────
function ImageUploadDialog({ product, onDone, onSkip }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState([]);
  const [colorName, setColorName] = useState('Default');
  const [colorHex, setColorHex]   = useState('#1C1B18');
  const fileRef = useRef();

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      arr.forEach(f => fd.append('images', f));
      const r = await API.post('/upload/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploaded(prev => [...prev, ...r.data.urls]);
    } catch (e) { alert('Upload failed: ' + e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!uploaded.length) return onSkip();
    const colorGroups = [{
      name: colorName, hex: colorHex,
      images: uploaded, soldSizes: [], isDefault: true
    }];
    await API.put(`/products/${product.id}`, { images: uploaded, colorGroups });
    onDone(uploaded.length);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: '#999', marginBottom: '.4rem' }}>Upload Images</p>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.4rem', lineHeight: 1.3 }}>{product.name}</h2>
          <p style={{ fontSize: '.75rem', color: '#999', marginTop: '.25rem' }}>Add at least 3 images (or skip to add later)</p>
        </div>

        {/* Colour */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '.4rem', color: '#666' }}>Colour Name</label>
            <input value={colorName} onChange={e => setColorName(e.target.value)}
              style={{ width: '100%', padding: '.5rem .75rem', border: '1px solid #e8e3db', fontSize: '.85rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '.4rem', color: '#666' }}>Swatch</label>
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
              style={{ width: 44, height: 36, border: '1px solid #e8e3db', cursor: 'pointer', padding: 2 }} />
          </div>
        </div>

        {/* Drop zone */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: `2px dashed ${uploading ? '#8B7355' : '#e8e3db'}`,
          padding: '2rem', cursor: uploading ? 'wait' : 'pointer', marginBottom: '1.25rem',
          background: uploading ? 'rgba(139,115,85,.04)' : '#faf9f7', transition: 'all .2s'
        }}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
          <span style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>📷</span>
          <span style={{ fontSize: '.78rem', color: '#999' }}>{uploading ? 'Uploading…' : 'Drag & drop or click to select images'}</span>
          <span style={{ fontSize: '.68rem', color: '#bbb', marginTop: '.25rem' }}>JPG, PNG, WebP supported</span>
        </label>

        {/* Preview thumbnails */}
        {uploaded.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: '.5rem', marginBottom: '1.25rem' }}>
            {uploaded.map((url, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '3/4', background: '#faf9f7' }}>
                <img src={url.startsWith('http') ? url : `${window.location.origin}${url}`} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && (
                  <span style={{ position: 'absolute', top: 3, left: 3, background: '#1a1a1a', color: '#fff', fontSize: '.42rem', letterSpacing: '.1em', padding: '.15rem .4rem' }}>PRIMARY</span>
                )}
                <button onClick={() => setUploaded(prev => prev.filter((_,j) => j !== i))}
                  style={{ position: 'absolute', top: 3, right: 3, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '.7rem', color: uploaded.length >= 3 ? '#2d7a3a' : '#856404', marginBottom: '1.25rem' }}>
          {uploaded.length >= 3 ? `✅ ${uploaded.length} images ready` : `⚠ ${uploaded.length}/3 — add ${3 - uploaded.length} more for best results`}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={handleSave} disabled={uploading}
            style={{ flex: 1, padding: '.75rem', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            {uploaded.length ? `Save ${uploaded.length} Image${uploaded.length > 1 ? 's' : ''}` : 'Save (no images)'}
          </button>
          <button onClick={onSkip}
            style={{ padding: '.75rem 1.25rem', background: 'none', color: '#999', border: '1px solid #e8e3db', cursor: 'pointer', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProductImportPage() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [step, setStep]         = useState('upload');   // upload | preview | importing | images | done
  const [rows, setRows]         = useState([]);
  const [errors, setErrors]     = useState([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState([]);         // { name, id, status }
  const [imageQueue, setImageQueue] = useState([]);     // products waiting for images
  const [imageIdx, setImageIdx] = useState(0);
  const [imageCounts, setImageCounts] = useState({});   // id → count
  const [dragOver, setDragOver] = useState(false);

  // ── Parse file ──
  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      if (!parsed.length) return setErrors(['CSV is empty or has no valid rows.']);

      // Validate required cols
      const firstRow = parsed[0];
      const missing = REQUIRED.filter(k => !(k in firstRow));
      if (missing.length) return setErrors([`Missing required columns: ${missing.join(', ')}`]);

      setRows(parsed);
      setErrors([]);
      setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Google Sheets CSV URL ──
  const [sheetUrl, setSheetUrl] = useState('');
  const loadSheet = async () => {
    // Convert Google Sheet share URL → CSV export URL
    let url = sheetUrl.trim();
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return setErrors(['Invalid Google Sheet URL. Share the sheet and paste the link.']);
    const sheetId = match[1];
    const gid = url.match(/gid=(\d+)/)?.[1] || '0';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
      const r = await fetch(csvUrl);
      if (!r.ok) throw new Error('Could not fetch sheet. Make sure it is shared as "Anyone with the link can view".');
      const text = await r.text();
      handleFile(new File([text], 'sheet.csv', { type: 'text/csv' }));
    } catch (e) { setErrors([e.message]); }
  };

  // ── Import ──
  const handleImport = async () => {
    setImporting(true); setStep('importing');
    try {
      const r = await API.post('/products/admin/bulk-import', { products: rows });
      const results = r.data.results;
      setImported(results);
      const successful = results.filter(r => r.status === 'ok');
      setImageQueue(successful);
      setImageIdx(0);
      setStep(successful.length ? 'images' : 'done');
    } catch (e) {
      setErrors([e.response?.data?.error || e.message]);
      setStep('preview');
    } finally { setImporting(false); }
  };

  // ── Image dialog callbacks ──
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

  // ─── UI ───────────────────────────────────────────────────────────────────
  const TH = { fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#999', padding: '.6rem .75rem', textAlign: 'left', borderBottom: '1px solid #e8e3db', fontWeight: 400, whiteSpace: 'nowrap' };
  const TD = { padding: '.55rem .75rem', fontSize: '.78rem', borderBottom: '1px solid #f4f2ef', verticalAlign: 'top' };

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/products')}
          style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#999', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '.75rem', fontFamily: 'var(--sans)' }}>
          ← Products
        </button>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.8rem' }}>Bulk Import Products</h1>
        <p style={{ color: '#999', fontSize: '.82rem', marginTop: '.25rem' }}>Upload CSV or import from Google Sheets — then add images for each product</p>
      </div>

      {/* ── STEP: Upload ── */}
      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Google Sheets */}
          <div style={{ border: '1px solid #e8e3db', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📊</span>
              <div>
                <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem' }}>Import from Google Sheets</h3>
                <p style={{ fontSize: '.72rem', color: '#999', marginTop: '.15rem' }}>Share your sheet → copy link → paste below</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <input
                value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                style={{ flex: 1, padding: '.6rem .75rem', border: '1px solid #e8e3db', fontSize: '.82rem', outline: 'none' }}
              />
              <button onClick={loadSheet}
                style={{ padding: '.6rem 1.25rem', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Load Sheet
              </button>
            </div>
            <p style={{ fontSize: '.68rem', color: '#bbb', marginTop: '.6rem' }}>
              Make sure the sheet is set to "Anyone with the link can view" before importing.
            </p>
          </div>

          <div style={{ textAlign: 'center', color: '#ccc', fontSize: '.8rem' }}>— or —</div>

          {/* CSV Upload */}
          <div
            style={{ border: `2px dashed ${dragOver ? '#8B7355' : '#e8e3db'}`, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(139,115,85,.04)' : '#faf9f7', transition: 'all .2s' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📁</div>
            <p style={{ fontSize: '.9rem', color: '#666', marginBottom: '.4rem' }}>Drag & drop your CSV file here</p>
            <p style={{ fontSize: '.72rem', color: '#bbb' }}>or click to browse</p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', fontSize: '.8rem', color: '#991B1B' }}>
              {errors.map((e,i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Sample + Column guide */}
          <div style={{ border: '1px solid #e8e3db', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem' }}>CSV Format Guide</h3>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(SAMPLE_CSV);
                  a.download = 'snera_products_template.csv';
                  a.click();
                }}
                style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', background: 'none', border: '1px solid #e8e3db', padding: '.4rem .9rem', cursor: 'pointer', color: '#666' }}
              >⬇ Download Template</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
              <thead>
                <tr>
                  <th style={TH}>Column</th>
                  <th style={TH}>Required</th>
                  <th style={TH}>Example</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['name',             true,  'SNERA Essential Tee'],
                  ['price',            true,  '1299'],
                  ['category',         true,  'Tops / Bottoms / Outerwear / Accessories'],
                  ['description',      true,  'Premium cotton tee with relaxed fit'],
                  ['comparePrice',     false, '1599'],
                  ['gender',           false, 'Unisex / Men / Women'],
                  ['fabric',           false, '100% Cotton 220gsm'],
                  ['careInstructions', false, 'Machine wash cold'],
                  ['sizes',            false, 'S,M,L,XL  (comma separated)'],
                  ['tags',             false, 'cotton,tee,minimal  (comma separated)'],
                  ['badge',            false, 'New / Sale'],
                ].map(([col, req, ex]) => (
                  <tr key={col}>
                    <td style={{ ...TD, fontFamily: 'monospace', color: '#1a1a1a' }}>{col}</td>
                    <td style={TD}>{req ? <span style={{ color: '#2d7a3a', fontSize: '.65rem' }}>Required</span> : <span style={{ color: '#999', fontSize: '.65rem' }}>Optional</span>}</td>
                    <td style={{ ...TD, color: '#999' }}>{ex}</td>
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
              <p style={{ fontSize: '.72rem', color: '#999', marginTop: '.2rem' }}>Review before importing. Images will be added after.</p>
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => { setStep('upload'); setRows([]); }}
                style={{ padding: '.6rem 1rem', background: 'none', border: '1px solid #e8e3db', cursor: 'pointer', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#666' }}>
                ← Back
              </button>
              <button onClick={handleImport}
                style={{ padding: '.6rem 1.5rem', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                Import {rows.length} Products →
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', marginBottom: '1rem', fontSize: '.8rem', color: '#991B1B' }}>
              {errors.map((e,i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div style={{ overflowX: 'auto', border: '1px solid #e8e3db' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ background: '#faf9f7' }}>
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
                    <td style={{ ...TD, color: '#bbb' }}>{i + 1}</td>
                    <td style={{ ...TD, fontWeight: 500 }}>{row.name}</td>
                    <td style={TD}>₹{row.price}{row.compareprice && <span style={{ color: '#999', marginLeft: '.4rem', textDecoration: 'line-through' }}>₹{row.compareprice}</span>}</td>
                    <td style={TD}>{row.category}</td>
                    <td style={TD}>{row.gender || 'Unisex'}</td>
                    <td style={{ ...TD, color: '#999' }}>{row.sizes || 'S,M,L,XL'}</td>
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
          <p style={{ color: '#999', fontSize: '.8rem', marginTop: '.5rem' }}>This may take a moment</p>
        </div>
      )}

      {/* ── STEP: Images dialog ── */}
      {step === 'images' && imageQueue[imageIdx] && (
        <>
          {/* Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#999', marginBottom: '.4rem' }}>
              <span>Adding images — product {imageIdx + 1} of {imageQueue.length}</span>
              <span>{Math.round(((imageIdx) / imageQueue.length) * 100)}% complete</span>
            </div>
            <div style={{ height: 4, background: '#e8e3db', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${(imageIdx / imageQueue.length) * 100}%`, background: '#1a1a1a', borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>

          <ImageUploadDialog
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
            <p style={{ color: '#999' }}>
              {imported.filter(r => r.status === 'ok').length} of {imported.length} products created successfully.
            </p>
          </div>

          {/* Results table */}
          <div style={{ border: '1px solid #e8e3db', overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#faf9f7' }}>
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
                        ? <span style={{ color: '#2d7a3a', fontSize: '.68rem' }}>✅ Created</span>
                        : <span style={{ color: '#991B1B', fontSize: '.68rem' }}>❌ {r.error}</span>}
                    </td>
                    <td style={TD}>
                      {r.status === 'ok'
                        ? <span style={{ color: imageCounts[r.id] ? '#2d7a3a' : '#856404', fontSize: '.68rem' }}>
                            {imageCounts[r.id] ? `${imageCounts[r.id]} uploaded` : 'No images yet'}
                          </span>
                        : '—'}
                    </td>
                    <td style={TD}>
                      {r.status === 'ok' && (
                        <a href={`/admin/products/${r.id}/edit`}
                          style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a1a1a', borderBottom: '1px solid #1a1a1a' }}>Edit</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/admin/products')}
              style={{ padding: '.75rem 2rem', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              Go to Products
            </button>
            <button onClick={() => { setStep('upload'); setRows([]); setImported([]); setImageQueue([]); setImageIdx(0); setImageCounts({}); setSheetUrl(''); }}
              style={{ padding: '.75rem 2rem', background: 'none', color: '#666', border: '1px solid #e8e3db', cursor: 'pointer', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}