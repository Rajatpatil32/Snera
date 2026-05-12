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
          borderBottom:'1px solid var(--sand)'
        }}>
          <h2 style={{fontFamily:'var(--serif)',fontSize:'1.3rem',fontWeight:400,letterSpacing:'.03em'}}>
            Your Cart {items.length > 0 && <span style={{fontSize:'.75rem',color:'var(--stone)',fontFamily:'var(--sans)',fontWeight:300}}>({items.length})</span>}
          </h2>
          <button onClick={close} aria-label="Close cart" style={{
            width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',
            color:'var(--stone)',transition:'color var(--t)',background:'none',border:'none',cursor:'pointer'
          }}>
            <svg viewBox="0 0 24 24" style={{width:15,height:15,stroke:'currentColor',fill:'none',strokeWidth:1.5}}>
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
              <svg viewBox="0 0 24 24" style={{width:38,height:38,stroke:'var(--sand2)',fill:'none',strokeWidth:1}}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p style={{fontSize:'.8rem',color:'var(--stone)',letterSpacing:'.04em',lineHeight:1.6}}>
                Your cart is empty.<br/>Add something beautiful.
              </p>
              <button className="btn btn-outline" style={{fontSize:'.6rem',padding:'.6rem 1.4rem'}} onClick={close}>
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.key} style={{
                display:'grid',gridTemplateColumns:'74px 1fr auto',
                gap:'.9rem',padding:'1.1rem 0',
                borderBottom:'1px solid var(--sand)',alignItems:'start'
              }}>
                {/* Image */}
                <div style={{aspectRatio:'3/4',background:'var(--off)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {item.image
                    ? <img src={getImageUrl(item.image)} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span style={{fontFamily:'var(--serif)',fontSize:'1.75rem',fontWeight:300,color:'rgba(28,27,24,.12)'}}>{item.glyph}</span>
                  }
                </div>

                {/* Info */}
                <div>
                  <div style={{fontSize:'.8rem',fontWeight:500,letterSpacing:'.02em',marginBottom:'.18rem'}}>{item.name}</div>
                  <div style={{fontSize:'.7rem',color:'var(--stone)',marginBottom:'.42rem',display:'flex',flexDirection:'column',gap:'.1rem'}}>
                    <span>Size: {item.size}</span>
                    {item.colour && (
                      <span style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                        {item.colourHex && <span style={{width:10,height:10,borderRadius:'50%',background:item.colourHex,border:'1px solid rgba(0,0,0,.18)',display:'inline-block',flexShrink:0}}/>}
                        {item.colour}
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:'.8rem',fontWeight:500,marginBottom:'.45rem'}}>{fmt(item.price)}</div>
                  {/* Qty control */}
                  <div style={{display:'flex',alignItems:'center',gap:'.45rem'}}>
                    <button onClick={() => chQty(item.key, -1)} style={{
                      width:24,height:24,border:'1px solid var(--sand)',
                      fontSize:'.8rem',color:'var(--stone2)',display:'flex',
                      alignItems:'center',justifyContent:'center',background:'none',cursor:'pointer',
                      transition:'color var(--t),border-color var(--t)'
                    }}>−</button>
                    <span style={{fontSize:'.76rem',minWidth:18,textAlign:'center',fontWeight:500}}>{item.qty}</span>
                    <button onClick={() => chQty(item.key, 1)} style={{
                      width:24,height:24,border:'1px solid var(--sand)',
                      fontSize:'.8rem',color:'var(--stone2)',display:'flex',
                      alignItems:'center',justifyContent:'center',background:'none',cursor:'pointer',
                      transition:'color var(--t),border-color var(--t)'
                    }}>+</button>
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => remove(item.key)} style={{
                  fontSize:'.56rem',letterSpacing:'.14em',textTransform:'uppercase',
                  color:'var(--stone)',cursor:'pointer',
                  borderBottom:'1px solid transparent',background:'none',border:'none',
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
            borderTop:'1px solid var(--sand)',
            display:'flex',flexDirection:'column',gap:'.9rem'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'.68rem',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--stone)'}}>Subtotal</span>
              <span style={{fontSize:'1.05rem',fontWeight:500}}>{fmt(total)}</span>
            </div>
            <p style={{fontSize:'.68rem',color:'var(--stone)',textAlign:'center'}}>Shipping calculated at checkout</p>
            <button className="btn btn-dark" style={{width:'100%',justifyContent:'center'}} onClick={goCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}