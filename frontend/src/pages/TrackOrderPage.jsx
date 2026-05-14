import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../utils/api';
import SEOHead from '../components/SEOHead';

const STATUS_STEPS = ['pending','confirmed','processing','shipped','delivered'];
const STATUS_LABELS = {
  pending:    'Order Placed',
  confirmed:  'Order Confirmed',
  processing: 'Being Prepared',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled'
};

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNum, setOrderNum] = useState(searchParams.get('order') || '');
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const track = async (e) => {
    e?.preventDefault();
    if (!orderNum.trim()) return;
    setLoading(true); setError(''); setOrder(null);
    try {
      const r = await API.get(`/orders/track/${orderNum.trim().toUpperCase()}`);
      setOrder(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found. Check the order number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if order number in URL
  useEffect(() => {
    if (searchParams.get('order')) track();
  }, []); // eslint-disable-line

  const stepIdx = order ? STATUS_STEPS.indexOf(order.status) : -1;

  const openCourier = () => {
    if (order?.courierTrackingUrl) {
      window.open(order.courierTrackingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <SEOHead title="Track Your Order | SNERA" canonical="https://snera.in/track-order" noindex={true} />

      <div style={{paddingTop:'var(--nav-h)'}}>
        {/* Header */}
        <div style={{background:'var(--off)',borderBottom:'1px solid var(--sand)',padding:'clamp(2rem,4vw,3.5rem) 0'}}>
          <div className="container">
            <div className="breadcrumb" style={{marginBottom:'1rem'}}>
              <Link to="/">Home</Link><span>/</span>
              <span style={{color:'var(--ink)'}}>Track Order</span>
            </div>
            <h1 style={{
              fontFamily:'var(--serif)',fontWeight:300,
              fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-.01em'
            }}>Track your <em style={{fontStyle:'italic',color:'var(--accent)'}}>order.</em></h1>
            <p style={{fontSize:'.86rem',color:'var(--stone2)',marginTop:'.5rem'}}>Enter your order number to see real-time status.</p>
          </div>
        </div>

        <div className="container" style={{paddingTop:'3rem',paddingBottom:'5rem',maxWidth:640}}>
          {/* Search form */}
          <form onSubmit={track} style={{display:'flex',gap:0,marginBottom:'3rem'}}>
            <input
              type="text"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              placeholder="e.g. SNR01001"
              className="form-input"
              style={{flex:1,borderRight:'none'}}
            />
            <button type="submit" className="btn btn-dark" disabled={loading} style={{whiteSpace:'nowrap'}}>
              {loading ? '...' : 'Track'}
            </button>
          </form>

          {error && (
            <div style={{
              background:'#FEF2F2',border:'1px solid #FECACA',
              padding:'1rem 1.25rem',marginBottom:'2rem',
              fontSize:'.82rem',color:'#991B1B'
            }}>{error}</div>
          )}

          {order && (
            <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
              {/* Order info */}
              <div style={{border:'1px solid var(--sand)',background:'var(--white)'}}>
                <div style={{
                  padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--sand)',
                  display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.75rem'
                }}>
                  <div>
                    <div style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--stone)',marginBottom:'.2rem'}}>Order Number</div>
                    <div style={{fontFamily:'var(--serif)',fontSize:'1.3rem',fontWeight:400}}>{order.orderNumber}</div>
                  </div>
                  <span className={`status-badge status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>

                <div style={{padding:'1.25rem 1.5rem'}}>
                  <div style={{fontSize:'.7rem',color:'var(--stone2)',marginBottom:'.25rem'}}>
                    Placed for <strong style={{color:'var(--ink)',fontWeight:500}}>{order.customer.name}</strong>
                  </div>
                  <div style={{fontSize:'.7rem',color:'var(--stone2)'}}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              {order.status !== 'cancelled' && (
                <div style={{border:'1px solid var(--sand)',background:'var(--white)',padding:'1.75rem 1.5rem'}}>
                  <h3 style={{fontSize:'.62rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--stone)',marginBottom:'1.75rem'}}>Shipment Status</h3>
                  <div style={{position:'relative'}}>
                    {/* Progress bar */}
                    <div style={{
                      position:'absolute',top:10,left:10,right:10,height:1,
                      background:'var(--sand)',zIndex:0
                    }}>
                      <div style={{
                        height:'100%',
                        background:'var(--ink)',
                        width: stepIdx >= 0 ? `${(stepIdx / (STATUS_STEPS.length-1)) * 100}%` : '0%',
                        transition:'width .5s var(--ease)'
                      }}/>
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',position:'relative',zIndex:1}}>
                      {STATUS_STEPS.map((step, i) => {
                        const done    = i <= stepIdx;
                        const current = i === stepIdx;
                        return (
                          <div key={step} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.6rem',flex:1}}>
                            <div style={{
                              width:20,height:20,borderRadius:'50%',border:'1.5px solid',
                              background: done ? 'var(--ink)' : 'var(--white)',
                              borderColor: done ? 'var(--ink)' : 'var(--sand)',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              transition:'all .3s',
                              boxShadow: current ? '0 0 0 4px rgba(28,27,24,.12)' : 'none'
                            }}>
                              {done && <svg viewBox="0 0 24 24" style={{width:10,height:10,stroke:'var(--white)',fill:'none',strokeWidth:2.5}}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>}
                            </div>
                            <span style={{
                              fontSize:'.52rem',letterSpacing:'.12em',textTransform:'uppercase',
                              color: done ? 'var(--ink)' : 'var(--stone)',textAlign:'center',
                              fontWeight: current ? 600 : 400
                            }}>{STATUS_LABELS[step]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking ID / AWB */}
              {order.trackingId && (
                <div style={{
                  border: '1px solid var(--sand)', background: 'var(--white)',
                  padding: '1.5rem',
                }}>
                  <h3 style={{ fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '1rem' }}>
                    Shipment Tracking
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '.3rem' }}>
                        {order.courier} · AWB Number
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '.08em', color: 'var(--ink)' }}>
                        {order.trackingId}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
                      {order.courierTrackingUrl && (
                        <button onClick={openCourier} className="btn btn-accent" style={{ fontSize: '.62rem', padding: '.7rem 1.3rem' }}>
                          Track on {order.courier} ↗
                        </button>
                      )}
                    </div>
                  </div>
                  {order.courierTrackingUrl && (
                    <div style={{ marginTop: '1rem', padding: '.75rem', background: 'var(--off)', fontSize: '.72rem', color: 'var(--stone2)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'var(--stone)', fill: 'none', strokeWidth: 1.5, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Direct tracking link: <a href={order.courierTrackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{order.courierTrackingUrl}</a>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div style={{border:'1px solid var(--sand)',background:'var(--white)'}}>
                <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--sand)'}}>
                  <h3 style={{fontSize:'.62rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--stone)'}}>Items Ordered</h3>
                </div>
                <div style={{padding:'1rem 1.5rem',display:'flex',flexDirection:'column',gap:'.65rem'}}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem'}}>
                      <span>{item.name} — Size {item.size}</span>
                      <span style={{color:'var(--stone)'}}>× {item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/shop" className="btn btn-ghost" style={{alignSelf:'flex-start'}}>← Continue Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}