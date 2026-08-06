import React, { useEffect, useState, useCallback } from 'react';
import API, { getImageUrl } from '../../utils/api';

// ─── Global T-shirt mockup manager ─────────────────────────────────────────────
// These are the shared garment photos (one per colour) that every design-mode
// product overlays its artwork onto. Manage once, reuse everywhere.
export default function AdminMockupsPage() {
  const [mockups, setMockups]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]           = useState({ text: '', type: '' });
  const [form, setForm]         = useState({ name: '', hex: '#FFFFFF', image: '' });
  const [editingId, setEditingId] = useState(null);

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/mockups');
      setMockups(res.data.mockups || []);
    } catch {
      setMockups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, image: res.data.url }));
    } catch (err) {
      notify('✗ Upload failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => { setForm({ name: '', hex: '#FFFFFF', image: '' }); setEditingId(null); };

  const save = async () => {
    if (!form.name || !form.image) return notify('✗ Name and image are required', 'error');
    try {
      if (editingId) {
        await API.put(`/mockups/${editingId}`, form);
        notify('✓ Mockup updated');
      } else {
        await API.post('/mockups', form);
        notify('✓ Mockup added');
      }
      resetForm();
      await load();
    } catch (err) {
      notify('✗ Save failed: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const edit = (m) => { setForm({ name: m.name, hex: m.hex, image: m.image }); setEditingId(m._id); };

  const remove = async (id) => {
    if (!window.confirm('Delete this mockup? Products already using it keep their baked images, but you won\'t be able to select it again.')) return;
    try {
      await API.delete(`/mockups/${id}`);
      notify('✓ Mockup deleted');
      await load();
    } catch (err) {
      notify('✗ Delete failed', 'error');
    }
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">
          T-Shirt Mockups
          <span style={{ fontSize: '1rem', color: 'var(--stone)', fontFamily: 'var(--sans)', fontWeight: 300, marginLeft: '.75rem' }}>
            ({mockups.length} colours)
          </span>
        </h1>
      </div>

      {msg.text && (
        <div style={{
          padding: '.6rem .9rem', marginBottom: '1rem', fontSize: '.75rem',
          background: msg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          color: msg.type === 'error' ? '#991B1B' : '#166534',
          border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
        }}>{msg.text}</div>
      )}

      {/* Add / edit form */}
      <div style={{ border: '1px solid var(--sand)', background: 'var(--white)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone2)', display: 'block', marginBottom: '.3rem' }}>Colour name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Navy" className="form-input" style={{ fontSize: '.8rem', padding: '.5rem .7rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone2)', display: 'block', marginBottom: '.3rem' }}>Swatch</label>
          <input type="color" value={form.hex} onChange={e => setForm(f => ({ ...f, hex: e.target.value }))} style={{ width: 46, height: 38, border: '1px solid var(--sand)', cursor: 'pointer' }} />
        </div>
        <div>
          <label style={{ fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone2)', display: 'block', marginBottom: '.3rem' }}>Garment photo</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} style={{ fontSize: '.72rem' }} />
        </div>
        {form.image && (
          <img src={getImageUrl(form.image)} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--sand)' }} />
        )}
        <button className="btn btn-dark" style={{ fontSize: '.62rem' }} onClick={save} disabled={uploading}>
          {editingId ? 'Update Mockup' : 'Add Mockup'}
        </button>
        {editingId && <button className="btn" style={{ fontSize: '.62rem' }} onClick={resetForm}>Cancel</button>}
      </div>

      {loading ? (
        <p style={{ color: 'var(--stone)', fontSize: '.85rem' }}>Loading…</p>
      ) : mockups.length === 0 ? (
        <p style={{ color: 'var(--stone)', fontSize: '.85rem' }}>No mockups yet — add your first T-shirt colour above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {mockups.map(m => (
            <div key={m._id} style={{ border: '1px solid var(--sand)', background: 'var(--white)' }}>
              <div style={{ aspectRatio: '4/5', background: 'var(--off)', overflow: 'hidden' }}>
                <img src={getImageUrl(m.image)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '.6rem .7rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: m.hex, border: '1px solid var(--sand2)', display: 'inline-block' }} />
                  {m.name}
                </div>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <button onClick={() => edit(m)} style={btnStyle('#DBEAFE', '#1E40AF')}>Edit</button>
                  <button onClick={() => remove(m._id)} style={btnStyle('#FEF2F2', '#991B1B')}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const btnStyle = (bg, color) => ({
  fontSize: '.52rem', letterSpacing: '.12em', textTransform: 'uppercase',
  padding: '.22rem .5rem', border: '1px solid rgba(0,0,0,.08)',
  cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600,
  background: bg, color, transition: 'opacity .15s',
});