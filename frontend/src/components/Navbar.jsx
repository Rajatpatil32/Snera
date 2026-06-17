import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { count, dispatch } = useCart();
  const [scrolled, setScrolled]   = useState(false);
  const [mobOpen, setMobOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobOpen]);

  const openCart  = () => dispatch({ type: 'OPEN' });
  const closeMob  = () => setMobOpen(false);

  return (
    <>
      <nav id="navbar" className={scrolled ? 'scrolled' : ''} style={{
        position:'fixed',top:0,left:0,right:0,zIndex:900,
        height:'var(--nav-h)',
        background: scrolled ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.92)',
        backdropFilter:'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'var(--sand)' : 'transparent'}`,
        transition:'border-color var(--t),background var(--t)',
        display:'flex',alignItems:'center'
      }}>
        <div className="nav-inner" style={{
          width:'100%',display:'flex',alignItems:'center',
          justifyContent:'space-between',
          padding:'0 clamp(1.25rem,4vw,3rem)'
        }}>
          <Link to="/" className="nav-logo" style={{
            fontFamily:'var(--serif)',fontSize:'1.6rem',fontWeight:500,
            letterSpacing:'.2em',textTransform:'uppercase',color:'var(--ink)'
          }}>SNERA</Link>

          {/* Desktop nav */}
          <ul style={{display:'flex',alignItems:'center',gap:'2.5rem'}} className="nav-menu-desktop">
            {[['New Arrivals','/shop'],['Shop','/shop'],['About','/about'],['Track Order','/track-order']].map(([label, to]) => (
              <li key={label}>
                <NavLink to={to} style={({ isActive }) => ({
                  fontSize:'.66rem',letterSpacing:'.18em',textTransform:'uppercase',
                  fontWeight:400,color: isActive ? 'var(--ink)' : 'var(--stone2)',
                  position:'relative',paddingBottom:'2px',
                  transition:'color var(--t)',
                  borderBottom: isActive ? '1px solid var(--ink)' : '1px solid transparent'
                })}>{label}</NavLink>
              </li>
            ))}
          </ul>

          <div style={{display:'flex',alignItems:'center',gap:'1.25rem'}}>
            {/* Cart icon */}
            <button
              onClick={openCart}
              aria-label="Open cart"
              style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:36,height:36,position:'relative',color:'var(--ink)',
                transition:'opacity var(--t)',background:'none',border:'none',cursor:'pointer'
              }}
            >
              <svg viewBox="0 0 24 24" style={{width:18,height:18,stroke:'currentColor',fill:'none',strokeWidth:1.5}}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {count > 0 && (
                <span style={{
                  position:'absolute',top:-4,right:-4,width:16,height:16,
                  borderRadius:'50%',background:'var(--ink)',color:'var(--white)',
                  fontSize:'.48rem',fontWeight:600,
                  display:'flex',alignItems:'center',justifyContent:'center'
                }}>{count > 99 ? '99+' : count}</span>
              )}
            </button>

            {/* Hamburger */}
            <button
              className="nav-ham"
              aria-label="Menu"
              onClick={() => setMobOpen(o => !o)}
              style={{
                display:'none',flexDirection:'column',gap:5,padding:4,
                background:'none',border:'none',cursor:'pointer'
              }}
            >
              <span style={{display:'block',width:21,height:1,background:'var(--ink)',transition:'var(--t)'}}/>
              <span style={{display:'block',width:21,height:1,background:'var(--ink)',transition:'var(--t)'}}/>
              <span style={{display:'block',width:21,height:1,background:'var(--ink)',transition:'var(--t)'}}/>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mob-menu"
        style={{
          display: mobOpen ? 'flex' : 'none',
          position:'fixed',top:'var(--nav-h)',left:0,right:0,bottom:0,
          background:'var(--white)',zIndex:850,
          flexDirection:'column',alignItems:'center',justifyContent:'center',
          gap:'2.5rem',
          opacity: mobOpen ? 1 : 0,
          transition:'opacity .3s'
        }}
      >
        {[['New Arrivals','/shop'],['Shop','/shop'],['About','/about'],['Track Order','/track-order']].map(([label, to]) => (
          <Link key={label} to={to} onClick={closeMob} style={{
            fontFamily:'var(--serif)',fontSize:'2rem',fontWeight:300,
            letterSpacing:'.04em',color:'var(--ink)'
          }}>{label}</Link>
        ))}
      </div>

      <style>{`
        @media(max-width:768px){
          .nav-menu-desktop{display:none!important}
          .nav-ham{display:flex!important}
        }
      `}</style>
    </>
  );
}
