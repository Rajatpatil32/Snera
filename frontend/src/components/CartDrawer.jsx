import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fmt, getImageUrl } from '../utils/api';

export default function CartDrawer() {
  const { items, isOpen, total, dispatch } = useCart();
  const navigate = useNavigate();

  const close    = () => dispatch({ type: 'CLOSE' });
  const remove   = (key) => dispatch({ type: 'REMOVE', payload: key });
  const chQty    = (key, delta) => dispatch({ type: 'CHANGE_QTY', payload: { key, delta } });

  const goCheckout = () => { close(); navigate('/checkout'); };

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-ov${isOpen ? ' open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`cart-drw${isOpen ? ' open' : ''}`} aria-label="Shopping cart">
        {/* Header */}
        <div style={{
          padding:'1.6rem clamp(1.25rem,4vw,1.75rem)',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          borderBottom:'1px solid rgba(108,92,231,.1)'
        }}>
          <h2 style={{fontFamily:'var(--sans)',fontSize:'1.2rem',fontWeight:700,letterSpacing:'.03em',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span>Your Cart</span>
            {items.length > 0 && (
              <span style={{
                fontSize:'.72rem',background:'var(--gradient)',color:'var(--white)',
                padding:'.15rem .55rem',borderRadius:'12px',fontWeight:700
              }}>{items.length}</span>
            )}
          </h2>
          <button onClick={close} aria-label="Close cart" style={{
            width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',
            color:'var(--stone)',borderRadius:'50%',background:'var(--off2)',
            transition:'color var(--t)',border:'none',cursor:'pointer'
          }}>
            <svg viewBox="0 0 24 24" style={{width:16,height:16,stroke:'currentColor',fill:'none',strokeWidth:2}}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'1.1rem clamp(1.25rem,4vw,1.75rem)'}}>
          {items.length === 0 ? (
            <div style={{
              height:'100%',display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:'1rem',textAlign:'center'
            }}>
              <div style={{
                width:72,height:72,borderRadius:'50%',background:'var(--gradient-subtle)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.2rem'
              }}>
                👕
              </div>
              <p style={{fontSize:'.88rem',color:'var(--stone2)',letterSpacing:'.02em',lineHeight:1.6,fontWeight:500}}>
                Your cart is empty.<br/>Add your custom tee!
              </p>
              <button className="btn btn-gradient" style={{fontSize:'.7rem',padding:'.7rem 1.6rem'}} onClick={close}>
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.key} style={{
                display:'grid',gridTemplateColumns:'76px 1fr auto',
                gap:'.9rem',padding:'1.1rem 0',
                borderBottom:'1px solid rgba(108,92,231,.08)',alignItems:'start'
              }}>
                {/* Image */}
                <div style={{aspectRatio:'3/4',background:'var(--gradient-card)',borderRadius:'var(--radius-sm)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {item.image
                    ? <img src={getImageUrl(item.image)} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span style={{fontSize:'1.8rem'}}>👕</span>
                  }
                </div>

                {/* Info */}
                <div>
                  <div style={{fontSize:'.84rem',fontWeight:600,color:'var(--ink)',marginBottom:'.2rem'}}>{item.name}</div>
                  <div style={{fontSize:'.72rem',color:'var(--stone2)',marginBottom:'.4rem',display:'flex',flexDirection:'column',gap:'.15rem'}}>
                    <span>Size: <strong style={{color:'var(--ink)'}}>{item.size}</strong></span>
                    {item.colour && (
                      <span style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                        {item.colourHex && <span style={{width:10,height:10,borderRadius:'50%',background:item.colourHex,border:'1px solid rgba(0,0,0,.15)',display:'inline-block',flexShrink:0}}/>}
                        {item.colour}
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:'.85rem',fontWeight:700,color:'var(--ink)',marginBottom:'.45rem'}}>{fmt(item.price)}</div>
                  {/* Qty control */}
                  <div style={{display:'flex',alignItems:'center',gap:'.45rem'}}>
                    <button onClick={() => chQty(item.key, -1)} style={{
                      width:26,height:26,borderRadius:4,border:'1px solid var(--sand)',
                      fontSize:'.85rem',color:'var(--stone2)',display:'flex',
                      alignItems:'center',justifyContent:'center',background:'var(--white)',cursor:'pointer',
                      transition:'all var(--t)'
                    }}>−</button>
                    <span style={{fontSize:'.8rem',minWidth:20,textAlign:'center',fontWeight:700}}>{item.qty}</span>
                    <button onClick={() => chQty(item.key, 1)} style={{
                      width:26,height:26,borderRadius:4,border:'1px solid var(--sand)',
                      fontSize:'.85rem',color:'var(--stone2)',display:'flex',
                      alignItems:'center',justifyContent:'center',background:'var(--white)',cursor:'pointer',
                      transition:'all var(--t)'
                    }}>+</button>
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => remove(item.key)} style={{
                  fontSize:'.6rem',letterSpacing:'.1em',textTransform:'uppercase',
                  color:'var(--stone)',cursor:'pointer',fontWeight:600,
                  background:'none',border:'none',
                  transition:'color var(--t)',paddingBottom:2,
                  fontFamily:'var(--sans)'
                }}>Remove</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding:'1.4rem clamp(1.25rem,4vw,1.75rem)',
            borderTop:'1px solid rgba(108,92,231,.1)',
            display:'flex',flexDirection:'column',gap:'.9rem',
            background:'rgba(255,255,255,.5)'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'.72rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--stone)',fontWeight:600}}>Subtotal</span>
              <span style={{fontSize:'1.15rem',fontWeight:700,color:'var(--ink)'}}>{fmt(total)}</span>
            </div>
            <p style={{fontSize:'.72rem',color:'var(--stone2)',textAlign:'center'}}>Shipping & taxes calculated at checkout</p>
            <button className="btn btn-gradient btn-pulse" style={{width:'100%',justifyContent:'center',padding:'1rem'}} onClick={goCheckout}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </aside>
    </>
  );
}