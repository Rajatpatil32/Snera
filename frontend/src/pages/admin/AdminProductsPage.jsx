import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../../utils/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState([]); // ids of checked products
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Bulk price update panel
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [bulkAmount,    setBulkAmount]    = useState('');
  const [bulkMode,      setBulkMode]      = useState('flat');      // 'flat' | 'percent'
  const [bulkDirection, setBulkDirection] = useState('increase');  // 'increase' | 'decrease'
  const [bulkIncludeCompare, setBulkIncludeCompare] = useState(true);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError,     setBulkError]     = useState('');

  const load = () => {
    setLoading(true);
    API.get('/products/admin/all')
      .then(r => setProducts(r.data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (product) => {
    await API.put(`/products/${product._id}`, { isActive: !product.isActive });
    load();
  };

  const submitBulkPrice = async () => {
    const amt = Number(bulkAmount);
    if (!amt || amt <= 0) { setBulkError('Enter a valid amount greater than 0'); return; }

    const verb  = bulkDirection === 'increase' ? 'increase' : 'decrease';
    const unit  = bulkMode === 'percent' ? '%' : '₹';
    if (!window.confirm(`${verb === 'increase' ? 'Increase' : 'Decrease'} the price of ALL ${products.length} products by ${unit}${amt}${bulkMode === 'percent' ? '' : ''}? This cannot be undone.`))
      return;

    setBulkSubmitting(true);
    setBulkError('');
    try {
      const res = await API.post('/products/admin/bulk-price-update', {
        amount: amt,
        direction: bulkDirection,
        mode: bulkMode,
        includeComparePrice: bulkIncludeCompare,
      });
      setShowBulkPrice(false);
      setBulkAmount('');
      load();
      window.alert(`Updated prices for ${res.data.updated} product(s).`);
    } catch (err) {
      setBulkError(err?.response?.data?.error || 'Failed to update prices');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Archive this product? It will be hidden from the store.')) return;
    setDeleting(id);
    await API.delete(`/products/${id}`);
    setDeleting(null);
    load();
  };

  // ── Multi-select + bulk delete ──────────────────────────────────────────
  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleSelectAll = () => setSelected(s => s.length === products.length ? [] : products.map(p => p._id));

  const deleteSelected = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Archive ${selected.length} selected product${selected.length !== 1 ? 's' : ''}? They will be hidden from the store.`)) return;
    setBulkDeleting(true);
    try {
      await API.post('/products/admin/bulk-archive', { ids: selected });
      setSelected([]);
      load();
    } catch (err) {
      window.alert(err?.response?.data?.error || 'Failed to archive selected products');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">
          Products{' '}
          <span style={{ fontSize: '1rem', color: 'var(--stone)', fontFamily: 'var(--sans)', fontWeight: 300 }}>
            ({products.length})
          </span>
        </h1>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting}
              className="btn"
              style={{
                fontSize: '.62rem', cursor: 'pointer', background: 'none',
                border: '1px solid var(--error)', color: 'var(--error)',
                fontFamily: 'var(--sans)', padding: '.6rem 1rem',
                opacity: bulkDeleting ? .6 : 1,
              }}
            >
              {bulkDeleting ? 'Archiving…' : `🗑 Archive Selected (${selected.length})`}
            </button>
          )}
          <button
            onClick={() => setShowBulkPrice(v => !v)}
            className="btn"
            style={{
              fontSize: '.62rem', cursor: 'pointer', background: 'none',
              border: '1px solid var(--stone)', color: 'var(--ink, #1C1B18)',
              fontFamily: 'var(--sans)', padding: '.6rem 1rem',
            }}
          >
            {showBulkPrice ? 'Close' : '⇅ Bulk Price Update'}
          </button>
          <Link to="/admin/products/new" className="btn btn-dark" style={{ fontSize: '.62rem' }}>
            + Add Product
          </Link>
        </div>
      </div>

      {showBulkPrice && (
        <div className="admin-card" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.35rem' }}>
              Direction
            </label>
            <select value={bulkDirection} onChange={e => setBulkDirection(e.target.value)} style={{ padding: '.5rem .6rem', border: '1px solid var(--stone)', fontFamily: 'var(--sans)', fontSize: '.75rem' }}>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.35rem' }}>
              Amount
            </label>
            <input
              type="number" min="0" step="any" value={bulkAmount}
              onChange={e => setBulkAmount(e.target.value)}
              placeholder={bulkMode === 'percent' ? 'e.g. 10' : 'e.g. 100'}
              style={{ padding: '.5rem .6rem', border: '1px solid var(--stone)', fontFamily: 'var(--sans)', fontSize: '.75rem', width: 120 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.35rem' }}>
              Type
            </label>
            <select value={bulkMode} onChange={e => setBulkMode(e.target.value)} style={{ padding: '.5rem .6rem', border: '1px solid var(--stone)', fontFamily: 'var(--sans)', fontSize: '.75rem' }}>
              <option value="flat">Flat ₹ amount</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'var(--stone2)' }}>
            <input type="checkbox" checked={bulkIncludeCompare} onChange={e => setBulkIncludeCompare(e.target.checked)} />
            Also adjust compare-at price
          </label>

          <button
            onClick={submitBulkPrice}
            disabled={bulkSubmitting}
            className="btn btn-dark"
            style={{ fontSize: '.62rem', opacity: bulkSubmitting ? .6 : 1 }}
          >
            {bulkSubmitting ? 'Applying…' : `Apply to all ${products.length} products`}
          </button>

          {bulkError && <div style={{ fontSize: '.7rem', color: 'var(--error)', width: '100%' }}>{bulkError}</div>}
        </div>
      )}

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="page-loader" style={{ minHeight: 200 }}>
            <div className="loader-ring" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selected.length === products.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Sizes</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--stone)', padding: '3rem' }}>
                      No products yet.{' '}
                      <Link to="/admin/products/new" style={{ color: 'var(--accent)' }}>Add your first product →</Link>
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} style={selected.includes(p._id) ? { background: 'rgba(28,27,24,.03)' } : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      {/* Thumbnail */}
                      <td>
                        <div style={{
                          width: 42, height: 56, background: 'var(--off)',
                          overflow: 'hidden', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {p.images?.[0]
                            ? <img src={getImageUrl(p.images[0])} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'rgba(28,27,24,.15)' }}>{p.glyph || '◈'}</span>
                          }
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--stone)' }}>/{p.slug}</div>
                      </td>

                      <td style={{ color: 'var(--stone2)' }}>{p.category}</td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{fmt(p.price)}</div>
                        {p.comparePrice && (
                          <div style={{ fontSize: '.68rem', color: 'var(--stone)', textDecoration: 'line-through' }}>{fmt(p.comparePrice)}</div>
                        )}
                      </td>

                      <td style={{ fontSize: '.72rem', color: 'var(--stone2)' }}>
                        {p.sizes?.join(', ')}
                      </td>

                      <td>
                        <button
                          onClick={() => toggleActive(p)}
                          style={{
                            fontSize: '.55rem', letterSpacing: '.12em', textTransform: 'uppercase',
                            padding: '.22rem .55rem', border: '1px solid', cursor: 'pointer',
                            fontFamily: 'var(--sans)', fontWeight: 600,
                            background: p.isActive ? 'rgba(61,122,86,.1)' : 'rgba(176,64,64,.08)',
                            color: p.isActive ? 'var(--success)' : 'var(--error)',
                            borderColor: p.isActive ? 'rgba(61,122,86,.3)' : 'rgba(176,64,64,.25)',
                            transition: 'all var(--t)'
                          }}
                        >
                          {p.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      <td>
                        <span style={{
                          fontSize: '.6rem', color: p.isFeatured ? 'var(--accent)' : 'var(--stone)'
                        }}>
                          {p.isFeatured ? '★ Yes' : '—'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                          <Link
                            to={`/admin/products/${p._id}/edit`}
                            style={{
                              fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase',
                              color: 'var(--accent)', fontWeight: 500
                            }}
                          >Edit</Link>
                          <button
                            onClick={() => deleteProduct(p._id)}
                            disabled={deleting === p._id}
                            style={{
                              fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase',
                              color: 'var(--error)', fontWeight: 500, cursor: 'pointer',
                              background: 'none', border: 'none', fontFamily: 'var(--sans)',
                              opacity: deleting === p._id ? .5 : 1
                            }}
                          >Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}