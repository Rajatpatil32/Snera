import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import API from '../utils/api';

export default function Navbar() {
  const { count, dispatch } = useCart();
  const [scrolled, setScrolled]       = useState(false);
  const [mobOpen, setMobOpen]         = useState(false);
  const [collections, setCollections] = useState([]);
  const [colOpen, setColOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobOpen]);

  useEffect(() => {
    API.get('/collections')
      .then(r => setCollections(r.data.collections || r.data || []))
      .catch(() => {});
  }, []);

  const openCart = () => dispatch({ type: 'OPEN' });
  const closeMob = () => { setMobOpen(false); setColOpen(false); };

  const NAV_LINKS = [
    ['Shop', '/shop'],
    ['About', '/about'],
    ['Blog', '/blog'],
    ['Track Order', '/track-order'],
  ];

  return (
    <>
      <nav id="navbar" className={scrolled ? 'scrolled' : ''} style={{
        position:'fixed',top:0,left:0,right:0,zIndex:900,
        height:'var(--nav-h)',
        background: scrolled ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.9)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(108,92,231,.12)' : 'transparent'}`,
        boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,.04)' : 'none',
        transition:'all var(--t)',
        display:'flex',alignItems:'center'
      }}>
        <div className="nav-inner" style={{
          width:'100%',display:'flex',alignItems:'center',
          justifyContent:'space-between',
          padding:'0 clamp(1.25rem,4vw,3rem)'
        }}>
          {/* Logo with T-Shirt Icon */}
          <Link to="/" className="nav-logo" style={{
            display:'flex',alignItems:'center',gap:'.6rem',
            fontFamily:'var(--sans)',fontSize:'1.5rem',fontWeight:700,
            letterSpacing:'.18em',textTransform:'uppercase',color:'var(--ink)'
          }}>
            <svg viewBox="0 0 24 24" style={{width:24,height:24,fill:'none',stroke:'var(--accent)',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}}>
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
            </svg>
            <span>SNERA</span>
          </Link>

          {/* Desktop nav */}
          <ul style={{display:'flex',alignItems:'center',gap:'2.2rem'}} className="nav-menu-desktop">
            {NAV_LINKS.map(([label, to]) => (
              <li key={label}>
                <NavLink to={to} style={({ isActive }) => ({
                  fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',
                  fontWeight: isActive ? 600 : 500,color: isActive ? 'var(--accent)' : 'var(--stone2)',
                  position:'relative',paddingBottom:'2px',
                  transition:'color var(--t)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent'
                })}>{label}</NavLink>
              </li>
            ))}

            {/* Collections dropdown */}
            {collections.length > 0 && (
              <li style={{position:'relative'}}
                onMouseEnter={() => setColOpen(true)}
                onMouseLeave={() => setColOpen(false)}
              >
                <button style={{
                  fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',
                  fontWeight:500,color:'var(--stone2)',background:'none',border:'none',
                  cursor:'pointer',paddingBottom:'2px',fontFamily:'var(--sans)',
                  borderBottom:'2px solid transparent',transition:'color var(--t)'
                }}>Collections ▾</button>

                {colOpen && (
                  <ul style={{
                    position:'absolute',top:'100%',left:0,
                    background:'var(--white)',border:'1px solid rgba(108,92,231,.12)',
                    borderRadius:'var(--radius-sm)',
                    minWidth:190,padding:'.6rem 0',listStyle:'none',
                    boxShadow:'0 15px 35px rgba(0,0,0,.1)',zIndex:10
                  }}>
                    {collections.map(col => (
                      <li key={col._id}>
                        <Link to={`/collection/${col.slug}`} style={{
                          display:'flex',alignItems:'center',gap:'.5rem',
                          padding:'.6rem 1.2rem',
                          fontSize:'.7rem',letterSpacing:'.1em',textTransform:'uppercase',
                          fontWeight:500,color:'var(--ink)',transition:'all var(--t)'
                        }}>
                          {col.icon && <span>{col.icon}</span>}
                          {col.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>

          <div style={{display:'flex',alignItems:'center',gap:'1.25rem'}}>
            {/* Prominent CTA for Custom Design */}
            <a href="#concept" className="btn btn-gradient btn-pulse nav-cta-btn" style={{
              padding:'.55rem 1.3rem',fontSize:'.68rem'
            }}>
              ✨ Design Your Tee
            </a>

            <button
              onClick={openCart}
              aria-label="Open cart"
              style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:40,height:40,position:'relative',color:'var(--ink)',
                borderRadius:'50%',background:'var(--off2)',
                transition:'all var(--t)',border:'none',cursor:'pointer'
              }}
            >
              <svg viewBox="0 0 24 24" style={{width:20,height:20,stroke:'currentColor',fill:'none',strokeWidth:1.8}}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {count > 0 && (
                <span style={{
                  position:'absolute',top:-2,right:-2,width:18,height:18,
                  borderRadius:'50%',background:'var(--gradient)',color:'var(--white)',
                  fontSize:'.52rem',fontWeight:700,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(108,92,231,.4)'
                }}>{count > 99 ? '99+' : count}</span>
              )}
            </button>

            <button
              className="nav-ham"
              aria-label="Menu"
              onClick={() => setMobOpen(o => !o)}
              style={{
                display:'none',flexDirection:'column',gap:5,padding:6,
                background:'none',border:'none',cursor:'pointer'
              }}
            >
              <span style={{display:'block',width:22,height:2,background:'var(--ink)',borderRadius:1,transition:'var(--t)'}}/>
              <span style={{display:'block',width:22,height:2,background:'var(--ink)',borderRadius:1,transition:'var(--t)'}}/>
              <span style={{display:'block',width:22,height:2,background:'var(--ink)',borderRadius:1,transition:'var(--t)'}}/>
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
          gap:'1.75rem', overflowY:'auto', padding:'2rem 0'
        }}
      >
        <a href="#concept" onClick={closeMob} className="btn btn-gradient btn-pulse" style={{
          padding:'.8rem 2rem',fontSize:'.8rem'
        }}>
          ✨ Design Your Tee
        </a>

        {NAV_LINKS.map(([label, to]) => (
          <Link key={label} to={to} onClick={closeMob} style={{
            fontFamily:'var(--sans)',fontSize:'1.5rem',fontWeight:600,
            letterSpacing:'.04em',color:'var(--ink)'
          }}>{label}</Link>
        ))}

        {collections.length > 0 && (
          <div style={{textAlign:'center'}}>
            <p style={{
              fontSize:'.66rem',letterSpacing:'.18em',textTransform:'uppercase',
              color:'var(--stone2)',marginBottom:'.75rem',fontWeight:600
            }}>Collections</p>
            {collections.map(col => (
              <Link key={col._id} to={`/collection/${col.slug}`} onClick={closeMob} style={{
                display:'block',padding:'.4rem',
                fontFamily:'var(--sans)',fontSize:'1.2rem',fontWeight:500,color:'var(--ink)'
              }}>
                {col.icon && <span style={{marginRight:'.4rem'}}>{col.icon}</span>}
                {col.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){
          .nav-menu-desktop{display:none!important}
          .nav-cta-btn{display:none!important}
          .nav-ham{display:flex!important}
        }
      `}</style>
    </>
  );
}