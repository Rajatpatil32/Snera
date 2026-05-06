import React, { useEffect, useState, useCallback, useRef } from 'react';
import API, { getImageUrl } from '../../utils/api';

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/avif';

export default function AdminImagesPage() {
  const [images,    setImages]    = useState([]);   // [{ filename, url, size, uploadedAt, product? }]
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected,  setSelected]  = useState(new Set()); // selected filenames
  const [filter,    setFilter]    = useState('all'); // all | unassigned
  const [search,    setSearch]    = useState('');
  const [preview,   setPreview]   = useState(null); // { url, filename }
  const [msg,       setMsg]       = useState({ text:'', type:'' });
  const [deleting,  setDeleting]  = useState(false);
  const [assigning, setAssigning] = useState(null); // filename being assigned
  const [assignTo,  setAssignTo]  = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileInput = useRef();

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text:'', type:'' }), 3000);
  };

  // ── Load images list from backend /uploads directory ──────────────────────
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const [imgRes, prodRes] = await Promise.all([
        API.get('/upload/list'),
        API.get('/products/admin/all'),
      ]);
      const allProducts  = prodRes.data.products || [];
      setProducts(allProducts);

      // Build a map of imageUrl → product name for assignment display
      const assignMap = {};
      allProducts.forEach(p => {
        (p.images || []).forEach(img => {
          assignMap[img] = { id: p._id, name: p.name };
        });
      });

      const imgs = (imgRes.data.images || []).map(img => ({
        ...img,
        assigned: assignMap[img.url] || null,
      }));
      setImages(imgs);
    } catch {
      // If /upload/list doesn't exist yet, show empty state gracefully
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  // ── Upload files ───────────────────────────────────────────────────────────
  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const res = await API.post('/upload/multiple', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notify(`✓ ${res.data.urls.length} image${res.data.urls.length !== 1 ? 's' : ''} uploaded`);
      await loadImages();
    } catch (err) {
      notify('✗ Upload failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => uploadFiles(Array.from(e.target.files));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    uploadFiles(files);
  };

  // ── Copy URL to clipboard ──────────────────────────────────────────────────
  const copyUrl = (url) => {
    navigator.clipboard.writeText(getImageUrl(url));
    notify('✓ URL copied to clipboard');
  };

  // ── Select / deselect ─────────────────────────────────────────────────────
  const toggleSelect = (filename) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(filename) ? next.delete(filename) : next.add(filename);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map(i => i.filename)));
  const clearSelection = () => setSelected(new Set());

  // ── Delete single image ────────────────────────────────────────────────────
  const deleteImage = async (filename) => {
    if (!window.confirm(`Delete "${filename}"?\nThis cannot be undone.`)) return;
    try {
      await API.delete(`/upload/${encodeURIComponent(filename)}`);
      notify('✓ Image deleted');
      await loadImages();
      setSelected(prev => { const n = new Set(prev); n.delete(filename); return n; });
    } catch (err) {
      notify('✗ Delete failed: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} selected image${selected.size !== 1 ? 's' : ''}?\nThis cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(f => API.delete(`/upload/${encodeURIComponent(f)}`)));
      notify(`✓ ${selected.size} images deleted`);
      setSelected(new Set());
      await loadImages();
    } catch (err) {
      notify('✗ Bulk delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Assign image to product ────────────────────────────────────────────────
  const assignImage = async (filename, url) => {
    if (!assignTo) return;
    try {
      const product = products.find(p => p._id === assignTo);
      if (!product) return;
      const newImages = [...new Set([...(product.images || []), url])];
      await API.put(`/products/${assignTo}`, { images: newImages });
      notify(`✓ Image assigned to "${product.name}"`);
      setAssigning(null);
      setAssignTo('');
      await loadImages();
    } catch (err) {
      notify('✗ Assignment failed', 'error');
    }
  };

  // ── Remove image from product ──────────────────────────────────────────────
  const unassignImage = async (url, productId) => {
    try {
      const product = products.find(p => p._id === productId);
      if (!product) return;
      const newImages = (product.images || []).filter(i => i !== url);
      await API.put(`/products/${productId}`, { images: newImages });
      notify('✓ Image unassigned');
      await loadImages();
    } catch (err) {
      notify('✗ Unassign failed', 'error');
    }
  };

  // ── Filter & search ────────────────────────────────────────────────────────
  const filtered = images.filter(img => {
    if (filter === 'unassigned' && img.assigned) return false;
    if (filter === 'assigned'   && !img.assigned) return false;
    if (search && !img.filename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSizeMB = images.reduce((s, i) => s + (i.size || 0), 0) / (1024 * 1024);

  return (
    <>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">
            Image Library
            <span style={{ fontSize: '1rem', color: 'var(--stone)', fontFamily: 'var(--sans)', fontWeight: 300, marginLeft: '.75rem' }}>
              ({images.length} images · {totalSizeMB.toFixed(1)} MB)
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              style={{
                fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase',
                padding: '.6rem 1.1rem', border: '1px solid #FECACA', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontWeight: 500, background: '#FEF2F2',
                color: '#991B1B', transition: 'all var(--t)', opacity: deleting ? .6 : 1,
              }}
            >
              {deleting ? 'Deleting...' : `Delete ${selected.size} selected`}
            </button>
          )}
          <button
            onClick={() => fileInput.current?.click()}
            className="btn btn-dark"
            style={{ fontSize: '.62rem' }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload Images'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED}
            multiple
            hidden
            onChange={handleFileInput}
          />
        </div>
      </div>

      {/* Notification */}
      {msg.text && (
        <div style={{
          padding: '.8rem 1.1rem', marginBottom: '1.25rem',
          fontSize: '.78rem', fontWeight: 400,
          background: msg.type === 'error' ? '#FEF2F2' : 'rgba(61,122,86,.08)',
          border: `1px solid ${msg.type === 'error' ? '#FECACA' : 'rgba(61,122,86,.3)'}`,
          color: msg.type === 'error' ? '#991B1B' : 'var(--success)',
        }}>{msg.text}</div>
      )}

      {/* Drag-and-drop upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && fileInput.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--ink)' : 'var(--sand2)'}`,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: dragOver ? 'rgba(28,27,24,.03)' : 'transparent',
          marginBottom: '1.5rem',
          transition: 'all var(--t)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.5, flexShrink: 0 }}>
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        <span style={{ fontSize: '.78rem', color: 'var(--stone2)' }}>
          {uploading
            ? 'Uploading, please wait...'
            : 'Drop images here or click to upload · JPEG, PNG, WebP, AVIF · max 5MB each'}
        </span>
      </div>

      {/* Filters + search + bulk actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '.35rem' }}>
          {[['all', 'All'], ['assigned', 'Assigned'], ['unassigned', 'Unassigned']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase',
                padding: '.28rem .8rem', border: '1px solid', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontWeight: 500,
                background:  filter === val ? 'var(--ink)' : 'transparent',
                color:       filter === val ? 'var(--white)' : 'var(--stone2)',
                borderColor: filter === val ? 'var(--ink)' : 'var(--sand)',
                transition: 'all var(--t)',
              }}
            >{label} {val === 'all' ? `(${images.length})` : val === 'assigned' ? `(${images.filter(i => i.assigned).length})` : `(${images.filter(i => !i.assigned).length})`}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="form-input"
            style={{ width: 220, padding: '.5rem .85rem', fontSize: '.75rem' }}
          />

          {/* Select all / clear */}
          {filtered.length > 0 && (
            selected.size === filtered.length
              ? <button onClick={clearSelection} className="btn-ghost btn" style={{ fontSize: '.6rem' }}>Clear selection</button>
              : <button onClick={selectAll}      className="btn-ghost btn" style={{ fontSize: '.6rem' }}>Select all ({filtered.length})</button>
          )}
        </div>
      </div>

      {/* Image grid */}
      {loading ? (
        <div className="page-loader" style={{ minHeight: 200 }}><div className="loader-ring" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--stone)' }}>
          <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, stroke: 'var(--sand2)', fill: 'none', strokeWidth: 1, margin: '0 auto 1rem' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <p style={{ fontSize: '.85rem' }}>
            {search ? 'No images match your search.' : images.length === 0 ? 'No images uploaded yet.' : 'No images in this filter.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map(img => (
            <ImageCard
              key={img.filename}
              img={img}
              selected={selected.has(img.filename)}
              onToggle={() => toggleSelect(img.filename)}
              onPreview={() => setPreview(img)}
              onCopy={() => copyUrl(img.url)}
              onDelete={() => deleteImage(img.filename)}
              onAssignOpen={() => { setAssigning(img.filename); setAssignTo(''); }}
              onUnassign={() => unassignImage(img.url, img.assigned?.id)}
              assigning={assigning === img.filename}
              assignTo={assignTo}
              setAssignTo={setAssignTo}
              products={products}
              onAssignConfirm={() => assignImage(img.filename, img.url)}
              onAssignCancel={() => { setAssigning(null); setAssignTo(''); }}
            />
          ))}
        </div>
      )}

      {/* Full preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(28,27,24,.85)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', background: 'var(--white)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: 'var(--stone2)', fontFamily: 'monospace' }}>{preview.filename}</span>
              <button
                onClick={() => setPreview(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', fontSize: '1.2rem', lineHeight: 1 }}
              >×</button>
            </div>
            <img
              src={getImageUrl(preview.url)}
              alt={preview.filename}
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: 'var(--off)' }}
            />
            <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-dark" style={{ fontSize: '.62rem' }} onClick={() => copyUrl(preview.url)}>
                Copy URL
              </button>
              {preview.assigned && (
                <span style={{ fontSize: '.72rem', color: 'var(--stone2)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  Assigned to: <strong style={{ color: 'var(--ink)' }}>{preview.assigned.name}</strong>
                </span>
              )}
              {preview.size && (
                <span style={{ fontSize: '.72rem', color: 'var(--stone)', marginLeft: 'auto' }}>
                  {(preview.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Individual image card ─────────────────────────────────────────────────────
function ImageCard({
  img, selected, onToggle, onPreview, onCopy,
  onDelete, onAssignOpen, onUnassign,
  assigning, assignTo, setAssignTo, products,
  onAssignConfirm, onAssignCancel,
}) {
  return (
    <div style={{
      border: `1px solid ${selected ? 'var(--ink)' : 'var(--sand)'}`,
      background: 'var(--white)',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color var(--t)',
      position: 'relative',
    }}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        title="Select"
        style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          width: 22, height: 22,
          background: selected ? 'var(--ink)' : 'rgba(255,255,255,.9)',
          border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--sand2)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--t)',
        }}
      >
        {selected && (
          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: 'white', fill: 'none', strokeWidth: 2.5 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>

      {/* Image thumbnail */}
      <div
        onClick={onPreview}
        style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', background: 'var(--off)', position: 'relative' }}
      >
        <img
          src={getImageUrl(img.url)}
          alt={img.filename}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s var(--ease)' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {img.assigned && (
          <span style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(28,27,24,.75)',
            color: 'white', fontSize: '.48rem', letterSpacing: '.14em',
            textTransform: 'uppercase', padding: '.18rem .45rem',
          }}>Assigned</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '.7rem .8rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        <div style={{
          fontSize: '.62rem', color: 'var(--stone2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'monospace',
        }} title={img.filename}>
          {img.filename}
        </div>

        {img.size && (
          <div style={{ fontSize: '.58rem', color: 'var(--stone)' }}>
            {(img.size / 1024).toFixed(1)} KB
          </div>
        )}

        {img.assigned && (
          <div style={{ fontSize: '.58rem', color: 'var(--accent)', letterSpacing: '.04em' }}>
            → {img.assigned.name}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '.35rem', marginTop: '.25rem', flexWrap: 'wrap' }}>
          <button onClick={onCopy} style={btnStyle('#EDE8E0', 'var(--stone2)')}>Copy URL</button>
          {img.assigned
            ? <button onClick={onUnassign} style={btnStyle('#FEF3C7', '#92400E')}>Unassign</button>
            : <button onClick={onAssignOpen} style={btnStyle('#DBEAFE', '#1E40AF')}>Assign</button>
          }
          <button onClick={onDelete} style={btnStyle('#FEF2F2', '#991B1B')}>Delete</button>
        </div>

        {/* Assign panel */}
        {assigning && (
          <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <select
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}
              className="form-select"
              style={{ fontSize: '.7rem', padding: '.4rem .6rem' }}
            >
              <option value="">— select product —</option>
              {products.filter(p => p.isActive).map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '.35rem' }}>
              <button
                onClick={onAssignConfirm}
                disabled={!assignTo}
                style={btnStyle(assignTo ? 'var(--ink)' : 'var(--sand)', assignTo ? 'var(--white)' : 'var(--stone)')}
              >Confirm</button>
              <button onClick={onAssignCancel} style={btnStyle('transparent', 'var(--stone2)')}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle = (bg, color) => ({
  fontSize: '.52rem', letterSpacing: '.12em', textTransform: 'uppercase',
  padding: '.22rem .5rem', border: '1px solid rgba(0,0,0,.08)',
  cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600,
  background: bg, color, transition: 'opacity .15s',
});
