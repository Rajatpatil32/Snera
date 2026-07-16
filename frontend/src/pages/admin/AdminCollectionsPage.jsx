import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    API.get('/collections/admin/all')
      .then(r => setCollections(r.data.collections || r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    await API.delete(`/collections/admin/${id}`);
    setCollections(collections.filter(c => c._id !== id));
  };

  const handleToggleActive = async (col) => {
    const r = await API.put(`/collections/admin/${col._id}`, { ...col, isActive: !col.isActive });
    const updated = r.data.collection || r.data;
    setCollections(collections.map(c => c._id === col._id ? updated : c));
  };

  const filtered = collections.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const TH = { fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--stone2,#999)', padding: '.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--sand,#e8e3db)', fontWeight: 400 };
  const TD = { padding: '.75rem 1rem', fontSize: '.8rem', verticalAlign: 'middle', borderBottom: '1px solid var(--sand,#e8e3db)' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.6rem' }}>Collections</h1>
          <p style={{ color: 'var(--stone2,#999)', fontSize: '.8rem', marginTop: '.25rem' }}>Organise products into curated collections</p>
        </div>
        <Link to="/admin/collections/new" style={{
          display: 'inline-block', padding: '.6rem 1.25rem',
          background: 'var(--ink,#1a1a1a)', color: '#fff',
          fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', textDecoration: 'none'
        }}>+ New Collection</Link>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search collections…"
          style={{ padding: '.5rem .75rem', border: '1px solid var(--sand,#e8e3db)', fontSize: '.8rem', minWidth: 200, outline: 'none' }}
        />
      </div>

      {loading ? <p style={{ color: 'var(--stone2,#999)' }}>Loading…</p> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--stone2,#999)' }}>
          <p>No collections yet.</p>
          <Link to="/admin/collections/new" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '.66rem', letterSpacing: '.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--ink)', color: 'var(--ink)' }}>Create your first</Link>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Collection</th>
              <th style={TH}>Products</th>
              <th style={TH}>Featured</th>
              <th style={TH}>Status</th>
              <th style={TH}>Order</th>
              <th style={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(col => (
              <tr key={col._id}>
                <td style={TD}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {col.icon && <span style={{ fontSize: '1.2rem' }}>{col.icon}</span>}
                    {col.name}
                  </strong>
                  {col.description && <span style={{ fontSize: '.72rem', color: 'var(--stone2,#999)' }}>{col.description.slice(0,50)}…</span>}
                </td>
                <td style={{ ...TD, color: 'var(--stone2,#999)' }}>{col.products?.length || 0}</td>
                <td style={TD}>
                  <span style={{
                    fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase',
                    padding: '.2rem .5rem',
                    background: col.isFeatured ? '#e6f4ea' : 'transparent',
                    color: col.isFeatured ? '#2d7a3a' : 'var(--stone2,#999)',
                    border: `1px solid ${col.isFeatured ? '#2d7a3a' : 'var(--sand,#e8e3db)'}`
                  }}>{col.isFeatured ? 'Yes' : 'No'}</span>
                </td>
                <td style={TD}>
                  <button onClick={() => handleToggleActive(col)}
                    style={{
                      padding: '.25rem .75rem', fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase',
                      border: 'none', cursor: 'pointer',
                      background: col.isActive ? '#e6f4ea' : '#fef3cd',
                      color: col.isActive ? '#2d7a3a' : '#856404'
                    }}>
                    {col.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={{ ...TD, color: 'var(--stone2,#999)' }}>{col.displayOrder}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <Link to={`/admin/collections/${col._id}/edit`} style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink)', borderBottom: '1px solid var(--ink)' }}>Edit</Link>
                    <Link to={`/collection/${col.slug}`} target="_blank" style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone2,#999)', borderBottom: '1px solid var(--stone2,#999)' }}>View</Link>
                    <button onClick={() => handleDelete(col._id)} style={{ fontSize: '.66rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #c0392b' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}