import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API, { fmt } from '../../utils/api';

const STATUSES = ['all','pending','confirmed','processing','shipped','delivered','cancelled'];

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (filter !== 'all') params.status = filter;
      const r = await API.get('/orders', { params });
      setOrders(r.data.orders || []);
      setPages(r.data.pages  || 1);
      setTotal(r.data.total  || 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">Orders <span style={{fontSize:'1rem',color:'var(--stone)',fontFamily:'var(--sans)',fontWeight:300}}>({total})</span></h1>
      </div>

      {/* Status filter tabs */}
      <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',
            padding:'.3rem .8rem',border:'1px solid',cursor:'pointer',fontFamily:'var(--sans)',fontWeight:500,
            background: filter === s ? 'var(--ink)' : 'transparent',
            color:      filter === s ? 'var(--white)' : 'var(--stone2)',
            borderColor:filter === s ? 'var(--ink)' : 'var(--sand)',
            transition:'all var(--t)'
          }}>{s}</button>
        ))}
      </div>

      <div className="admin-card" style={{padding:0}}>
        {loading ? (
          <div className="page-loader" style={{minHeight:200}}><div className="loader-ring"/></div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={9} style={{textAlign:'center',color:'var(--stone)',padding:'3rem'}}>No orders found</td></tr>
                ) : orders.map(o => (
                  <tr key={o._id}>
                    <td><Link to={`/admin/orders/${o._id}`} style={{fontWeight:600,color:'var(--ink)',fontFamily:'var(--sans)'}}>{o.orderNumber}</Link></td>
                    <td>
                      <div style={{fontWeight:500}}>{o.customer?.name}</div>
                      <div style={{fontSize:'.68rem',color:'var(--stone)'}}>{o.customer?.email}</div>
                    </td>
                    <td style={{color:'var(--stone2)'}}>{o.customer?.phone}</td>
                    <td>{o.items?.length}</td>
                    <td style={{fontWeight:500}}>{fmt(o.total)}</td>
                    <td><span style={{
                      fontSize:'.55rem',letterSpacing:'.12em',textTransform:'uppercase',
                      color: o.payment?.status === 'paid' ? 'var(--success)' : 'var(--accent)'
                    }}>{o.payment?.status}</span></td>
                    <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                    <td style={{color:'var(--stone)',fontSize:'.72rem'}}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link to={`/admin/orders/${o._id}`} style={{
                        fontSize:'.58rem',letterSpacing:'.14em',textTransform:'uppercase',
                        color:'var(--accent)',fontWeight:500
                      }}>Manage →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{display:'flex',gap:'.4rem',marginTop:'1.25rem',justifyContent:'flex-end'}}>
          {Array.from({length:pages},(_,i)=>i+1).map(n => (
            <button key={n} onClick={() => fetch(n)} style={{
              width:32,height:32,border:'1px solid',cursor:'pointer',fontFamily:'var(--sans)',fontSize:'.72rem',
              background: n === page ? 'var(--ink)' : 'transparent',
              color:      n === page ? 'var(--white)' : 'var(--stone2)',
              borderColor:n === page ? 'var(--ink)' : 'var(--sand)',
              transition:'all var(--t)'
            }}>{n}</button>
          ))}
        </div>
      )}
    </>
  );
}
