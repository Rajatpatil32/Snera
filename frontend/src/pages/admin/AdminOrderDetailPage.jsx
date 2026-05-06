import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { fmt } from '../../utils/api';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

export default function AdminOrderDetailPage() {
  const { id }    = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  // Editable fields
  const [status,     setStatus]     = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [courier,    setCourier]    = useState('');

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then(r => {
        setOrder(r.data);
        setStatus(r.data.status);
        setTrackingId(r.data.trackingId || '');
        setCourier(r.data.courier || 'Blue Dart');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await API.patch(`/orders/${id}`, { status, trackingId, courier });
      setOrder(r.data);
      setMsg('✓ Order updated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.error || 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="loader-ring"/></div>;
  if (!order)  return <div style={{color:'var(--stone)'}}>Order not found</div>;

  return (
    <>
      <div className="admin-header">
        <div>
          <Link to="/admin/orders" style={{fontSize:'.65rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--stone)'}}>← Back to Orders</Link>
          <h1 className="admin-title" style={{marginTop:'.4rem'}}>{order.orderNumber}</h1>
        </div>
        <span className={`status-badge status-${order.status}`} style={{fontSize:'.6rem',padding:'.3rem .8rem'}}>{order.status}</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'1.5rem',alignItems:'start'}}>
        {/* Left — order info */}
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>

          {/* Customer */}
          <div className="admin-card">
            <h3 style={{fontFamily:'var(--serif)',fontWeight:400,fontSize:'1rem',marginBottom:'1rem',paddingBottom:'.75rem',borderBottom:'1px solid var(--sand)'}}>Customer</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem'}}>
              {[
                ['Name',    order.customer.name],
                ['Email',   order.customer.email],
                ['Phone',   order.customer.phone],
                ['Placed',  new Date(order.createdAt).toLocaleString('en-IN')],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{fontSize:'.58rem',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--stone)',marginBottom:'.2rem'}}>{l}</div>
                  <div style={{fontSize:'.82rem',color:'var(--ink2)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="admin-card">
            <h3 style={{fontFamily:'var(--serif)',fontWeight:400,fontSize:'1rem',marginBottom:'1rem',paddingBottom:'.75rem',borderBottom:'1px solid var(--sand)'}}>Shipping Address</h3>
            <p style={{fontSize:'.82rem',color:'var(--ink2)',lineHeight:1.8}}>
              {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br/>
              {order.address.city}, {order.address.state} — {order.address.pincode}
            </p>
          </div>

          {/* Items */}
          <div className="admin-card" style={{padding:0}}>
            <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--sand)'}}>
              <h3 style={{fontFamily:'var(--serif)',fontWeight:400,fontSize:'1rem'}}>Items Ordered</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{item.name}</td>
                    <td>{item.size}</td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.price)}</td>
                    <td style={{fontWeight:500}}>{fmt(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{textAlign:'right',fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',color:'var(--stone)',paddingTop:'1rem'}}>Subtotal</td>
                  <td style={{fontWeight:500,paddingTop:'1rem'}}>{fmt(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{textAlign:'right',fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',color:'var(--stone)'}}>Shipping</td>
                  <td>{fmt(order.shippingFee)}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{textAlign:'right',fontSize:'.78rem',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:600,paddingTop:'.5rem'}}>Total</td>
                  <td style={{fontWeight:600,fontSize:'1rem',paddingTop:'.5rem'}}>{fmt(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right — manage */}
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          {/* Update status */}
          <div className="admin-card">
            <h3 style={{fontFamily:'var(--serif)',fontWeight:400,fontSize:'1rem',marginBottom:'1.1rem'}}>Manage Order</h3>

            <div style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
              <div className="form-group">
                <label className="form-label">Order Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Courier</label>
                <select className="form-select" value={courier} onChange={e => setCourier(e.target.value)}>
                  {['Blue Dart','DTDC','Delhivery','Ekart','India Post'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tracking ID</label>
                <input
                  type="text" className="form-input"
                  value={trackingId} placeholder="e.g. 12345678"
                  onChange={e => setTrackingId(e.target.value)}
                />
              </div>

              {msg && (
                <p style={{
                  fontSize:'.75rem',
                  color: msg.startsWith('✓') ? 'var(--success)' : 'var(--error)',
                  padding:'.6rem .9rem',
                  background: msg.startsWith('✓') ? 'rgba(61,122,86,.08)' : 'rgba(176,64,64,.08)',
                  border: `1px solid ${msg.startsWith('✓') ? 'rgba(61,122,86,.25)' : 'rgba(176,64,64,.25)'}`
                }}>{msg}</p>
              )}

              <button
                className="btn btn-dark"
                onClick={save}
                disabled={saving}
                style={{width:'100%',justifyContent:'center',opacity:saving?.7:1}}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Payment info */}
          <div className="admin-card">
            <h3 style={{fontFamily:'var(--serif)',fontWeight:400,fontSize:'1rem',marginBottom:'1rem'}}>Payment</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
              {[
                ['Method',  order.payment?.method],
                ['Status',  order.payment?.status],
                ['Razorpay ID', order.payment?.razorpayPaymentId || '—'],
              ].map(([l,v]) => (
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'.78rem'}}>
                  <span style={{color:'var(--stone)'}}>{l}</span>
                  <span style={{fontWeight:500,textTransform:'capitalize'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .order-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
