import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { fmt, getImageUrl } from '../../utils/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

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

  const deleteProduct = async (id) => {
    if (!window.confirm('Archive this product? It will be hidden from the store.')) return;
    setDeleting(id);
    await API.delete(`/products/${id}`);
    setDeleting(null);
    load();
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
        <Link to="/admin/products/new" className="btn btn-dark" style={{ fontSize: '.62rem' }}>
          + Add Product
        </Link>
      </div>

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
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--stone)', padding: '3rem' }}>
                      No products yet.{' '}
                      <Link to="/admin/products/new" style={{ color: 'var(--accent)' }}>Add your first product →</Link>
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id}>
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
