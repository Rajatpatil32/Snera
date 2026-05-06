import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { fmt } from '../../utils/api';

// ─── Mini chart bar ───────────────────────────────────────────────────────────
function MiniBar({ value, max, color = 'var(--ink)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height: 4, background: 'var(--sand)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .6s var(--ease)' }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, bar, barMax }) {
  return (
    <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)' }}>{label}</span>
        {icon && (
          <span style={{ fontSize: '1.1rem', opacity: .6 }}>{icon}</span>
        )}
      </div>
      <span style={{
        fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 300,
        color: color || 'var(--ink)', lineHeight: 1.1, marginTop: '.1rem',
      }}>{value}</span>
      {sub && <span style={{ fontSize: '.72rem', color: 'var(--stone2)', marginTop: '.15rem' }}>{sub}</span>}
      {bar !== undefined && <MiniBar value={bar} max={barMax} color={color || 'var(--ink)'} />}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/orders/stats/summary'),
      API.get('/products/admin/all'),
    ])
      .then(([s, p]) => {
        setStats(s.data);
        setProducts(p.data.products || []);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 300 }}>
      <div className="loader-ring" />
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '.85rem' }}>
      {error}
    </div>
  );

  const activeProducts  = products.filter(p => p.isActive).length;
  const featuredProducts = products.filter(p => p.isFeatured).length;
  const totalOrders     = stats.totalOrders || 0;

  return (
    <>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p style={{ fontSize: '.75rem', color: 'var(--stone2)', marginTop: '.2rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <Link to="/admin/orders"       className="btn btn-outline" style={{ fontSize: '.6rem', padding: '.6rem 1.2rem' }}>View Orders</Link>
          <Link to="/admin/products/new" className="btn btn-dark"    style={{ fontSize: '.6rem' }}>+ Add Product</Link>
        </div>
      </div>

      {/* ── Today's spotlight ── */}
      {stats.todayOrders > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, var(--ink) 0%, #2E2D29 100%)',
          color: 'var(--white)', padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔥</span>
          <div>
            <div style={{ fontSize: '.78rem', fontWeight: 500, letterSpacing: '.04em' }}>
              {stats.todayOrders} new order{stats.todayOrders !== 1 ? 's' : ''} today
            </div>
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.55)', marginTop: '.15rem' }}>
              Keep the momentum going!
            </div>
          </div>
          <Link to="/admin/orders" style={{
            marginLeft: 'auto', fontSize: '.6rem', letterSpacing: '.16em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.7)',
            borderBottom: '1px solid rgba(255,255,255,.3)', paddingBottom: 2,
          }}>Manage →</Link>
        </div>
      )}

      {/* ── Order stats ── */}
      <div style={{ marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)' }}>Order Overview</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard
          label="Total Orders" icon="📦"
          value={totalOrders}
          sub="All time"
          bar={totalOrders} barMax={totalOrders}
        />
        <StatCard
          label="Pending" icon="⏳"
          value={stats.pendingOrders}
          sub={stats.pendingOrders > 0 ? 'Need action' : 'All clear!'}
          color={stats.pendingOrders > 0 ? 'var(--accent)' : 'var(--success)'}
          bar={stats.pendingOrders} barMax={Math.max(totalOrders, 1)}
        />
        <StatCard
          label="Shipped" icon="🚚"
          value={stats.shippedOrders}
          sub="In transit"
          color="var(--ink)"
          bar={stats.shippedOrders} barMax={Math.max(totalOrders, 1)}
        />
        <StatCard
          label="Delivered" icon="✅"
          value={stats.deliveredOrders}
          sub="Successfully"
          color="var(--success)"
          bar={stats.deliveredOrders} barMax={Math.max(totalOrders, 1)}
        />
        <StatCard
          label="Cancelled" icon="❌"
          value={stats.cancelledOrders}
          sub="Refund check"
          color={stats.cancelledOrders > 0 ? 'var(--error)' : 'var(--stone)'}
          bar={stats.cancelledOrders} barMax={Math.max(totalOrders, 1)}
        />
        <StatCard
          label="Revenue" icon="₹"
          value={fmt(stats.totalRevenue)}
          sub="Paid orders only"
          color="var(--accent)"
        />
      </div>

      {/* ── Fulfilment rate ── */}
      {totalOrders > 0 && (
        <div className="admin-card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 500 }}>Fulfilment Rate</span>
            <span style={{ fontSize: '.78rem', color: 'var(--success)', fontWeight: 600 }}>
              {Math.round((stats.deliveredOrders / totalOrders) * 100)}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--sand)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.round((stats.deliveredOrders / totalOrders) * 100)}%`,
              background: 'linear-gradient(90deg, var(--success) 0%, #52A874 100%)',
              transition: 'width .8s var(--ease)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
            <span style={{ fontSize: '.62rem', color: 'var(--stone)' }}>0%</span>
            <span style={{ fontSize: '.62rem', color: 'var(--stone)' }}>100%</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Recent orders ── */}
        <div className="admin-card" style={{ padding: 0, gridColumn: '1 / -1' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem' }}>Recent Orders</h2>
            <Link to="/admin/orders" className="btn btn-ghost" style={{ fontSize: '.6rem' }}>View all →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {!stats.recentOrders?.length ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--stone)', padding: '3rem', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 300 }}>
                      No orders yet — share your store link!
                    </td>
                  </tr>
                ) : stats.recentOrders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <Link to={`/admin/orders/${o._id}`} style={{ fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace', letterSpacing: '.04em' }}>
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '.8rem' }}>{o.customer?.name}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--stone)' }}>{o.customer?.email}</div>
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{fmt(o.total)}</td>
                    <td>
                      <span style={{
                        fontSize: '.55rem', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600,
                        color: o.payment?.status === 'paid' ? 'var(--success)' : o.payment?.status === 'failed' ? 'var(--error)' : 'var(--accent)',
                      }}>
                        {o.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td><StatusPill status={o.status} /></td>
                    <td style={{ fontSize: '.72rem', color: 'var(--stone)' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Product stats ── */}
      <div style={{ marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)' }}>Catalogue</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Products" icon="👕" value={products.length}  sub="In database" />
        <StatCard label="Active"         icon="✅" value={activeProducts}   sub="Visible in store" color="var(--success)" />
        <StatCard label="Featured"       icon="⭐" value={featuredProducts} sub="On homepage" color="var(--accent)" />
        <StatCard label="Hidden"         icon="👁" value={products.length - activeProducts} sub="Archived" color="var(--stone)" />
      </div>

      {/* ── Quick actions ── */}
      <div className="admin-card">
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          {[
            { to: '/admin/products/new', label: '+ Add Product',     style: 'btn-dark' },
            { to: '/admin/images',       label: '🖼 Image Library',   style: 'btn-outline' },
            { to: '/admin/orders',       label: '📦 All Orders',      style: 'btn-outline' },
            { to: '/shop',              label: '🛍 View Store',       style: 'btn-ghost', external: true },
          ].map(({ to, label, style, external }) => (
            external
              ? <a key={label} href={to} target="_blank" rel="noopener noreferrer" className={`btn ${style}`} style={{ fontSize: '.6rem' }}>{label}</a>
              : <Link key={label} to={to} className={`btn ${style}`} style={{ fontSize: '.6rem' }}>{label}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
