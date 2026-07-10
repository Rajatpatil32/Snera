import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/collections/admin/all')
      .then(r => setCollections(r.data.collections || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setName(''); setDescription(''); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await API.put(`/collections/${editingId}`, { name, description });
      } else {
        await API.post('/collections', { name, description });
      }
      resetForm();
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  const edit = (c) => { setEditingId(c._id); setName(c.name); setDescription(c.description || ''); };

  const toggleActive = async (c) => {
    await API.put(`/collections/${c._id}`, { isActive: !c.isActive });
    load();
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    try {
      await API.delete(`/collections/${c._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete collection');
    }
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">
          Collections{' '}
          <span style={{ fontSize: '1rem', color: 'var(--stone)', fontFamily: 'var(--sans)', fontWeight: 300 }}>
            ({collections.length})
          </span>
        </h1>
      </div>

      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={submit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 220px' }}>
            <label className="form-label">Collection Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hoodies" required />
          </div>
          <div className="form-group" style={{ flex: '2 1 300px' }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional short description" />
          </div>
          <button type="submit" className="btn btn-dark" disabled={saving} style={{ fontSize: '.62rem' }}>
            {editingId ? 'Update Collection' : '+ Add Collection'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm} style={{ fontSize: '.62rem' }}>Cancel</button>
          )}
        </form>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="page-loader" style={{ minHeight: 200 }}><div className="loader-ring" /></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--stone)', padding: '3rem' }}>No collections yet.</td></tr>
              ) : collections.map(c => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.slug}</td>
                  <td>
                    <button onClick={() => toggleActive(c)} className="btn btn-ghost" style={{ fontSize: '.6rem' }}>
                      {c.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td style={{ display: 'flex', gap: '.5rem' }}>
                    <button onClick={() => edit(c)} className="btn btn-ghost" style={{ fontSize: '.6rem' }}>Edit</button>
                    <button onClick={() => remove(c)} className="btn btn-ghost" style={{ fontSize: '.6rem', color: '#b3261e' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}