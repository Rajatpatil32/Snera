import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export function OrderSuccessPage() {
  const [params] = useSearchParams();
  const orderNum = params.get('order') || '';

  return (
    <>
      <SEOHead title="Order Confirmed — SNERA"/>
      <div style={{
        paddingTop:'var(--nav-h)',
        minHeight:'80vh',
        display:'flex',alignItems:'center',justifyContent:'center',
        textAlign:'center', padding:'var(--nav-h) 2rem 4rem'
      }}>
        <div style={{maxWidth:480}}>
          {/* Checkmark */}
          <div style={{
            width:72,height:72,borderRadius:'50%',
            background:'rgba(61,122,86,.12)',
            display:'flex',alignItems:'center',justifyContent:'center',
            margin:'0 auto 2rem'
          }}>
            <svg viewBox="0 0 24 24" style={{width:32,height:32,stroke:'var(--success)',fill:'none',strokeWidth:1.8}}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h1 style={{fontFamily:'var(--serif)',fontWeight:300,fontSize:'clamp(2rem,4vw,3rem)',marginBottom:'.75rem'}}>
            Order <em style={{fontStyle:'italic',color:'var(--accent)'}}>confirmed.</em>
          </h1>

          <p style={{fontSize:'.88rem',color:'var(--stone2)',lineHeight:1.8,marginBottom:'2rem'}}>
            Thank you for your order! We've received your request and will begin processing it shortly. 
            A confirmation will be sent to your email.
          </p>

          {orderNum && (
            <div style={{
              background:'var(--off)',border:'1px solid var(--sand)',
              padding:'1.25rem 1.75rem',marginBottom:'2rem',
              display:'inline-block'
            }}>
              <div style={{fontSize:'.58rem',letterSpacing:'.22em',textTransform:'uppercase',color:'var(--stone)',marginBottom:'.35rem'}}>Order Number</div>
              <div style={{fontFamily:'var(--serif)',fontSize:'1.5rem',fontWeight:400,letterSpacing:'.05em'}}>{orderNum}</div>
            </div>
          )}

          <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
            {orderNum && (
              <Link to={`/track-order?order=${orderNum}`} className="btn btn-outline">Track Order</Link>
            )}
            <Link to="/shop" className="btn btn-dark">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
}
