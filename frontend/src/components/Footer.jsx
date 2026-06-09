import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNL = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <footer style={{background:'var(--off)',borderTop:'1px solid var(--sand)'}}>
      {/* Newsletter */}
      <div style={{borderBottom:'1px solid var(--sand)',padding:'clamp(2.5rem,5vw,4rem) 0'}}>
        <div className="container">
          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:'3rem',
            alignItems:'center'
          }}>
            <div>
              <span className="label">The Inner Circle</span>
              <h3 style={{fontFamily:'var(--serif)',fontWeight:300,fontSize:'clamp(1.5rem,3vw,2.2rem)',letterSpacing:'-.01em'}}>
                Dress code: <em style={{fontStyle:'italic',color:'var(--accent)'}}>early.</em>
              </h3>
              <p style={{fontSize:'.83rem',color:'var(--stone2)',marginTop:'.65rem',lineHeight:1.75}}>
                New drops, exclusive offers, and style dispatches — before anyone else.
              </p>
            </div>
            <form onSubmit={handleNL} style={{display:'flex',gap:0}}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex:1,border:'1px solid var(--sand)',borderRight:'none',
                  padding:'.82rem 1.1rem',
                  fontFamily:'var(--sans)',fontSize:'.8rem',fontWeight:300,
                  background:'var(--white)',color:'var(--ink)',outline:'none'
                }}
              />
              <button type="submit" className="btn btn-dark" style={{whiteSpace:'nowrap'}}>
                {submitted ? '✓ Joined' : 'Join'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container" style={{padding:'clamp(2rem,4vw,3.5rem) clamp(1.25rem,4vw,3rem)'}}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'2fr 1fr 1fr 1fr',
          gap:'2.5rem',
          marginBottom:'2.5rem'
        }}>
          <div>
            <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',fontWeight:500,letterSpacing:'.18em',marginBottom:'1rem'}}>SNERA</div>
            <p style={{fontSize:'.78rem',color:'var(--stone2)',lineHeight:1.8,maxWidth:'30ch'}}>
              Premium essentials crafted for those who believe the quietest statement is often the loudest.
            </p>
            <div style={{marginTop:'1rem',display:'flex',gap:'1rem',alignItems:'center'}}>
              <a
                href="https://www.instagram.com/snera.store/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SNERA on Instagram"
                style={{fontSize:'.72rem',color:'var(--stone2)',letterSpacing:'.08em',display:'flex',alignItems:'center',gap:'.4rem',transition:'color var(--t)'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @snera.store
              </a>
            </div>
          </div>
          {[
            {head:'Shop', links:[['New Arrivals','/shop'],['Men','/shop?gender=Men'],['Women','/shop?gender=Women']]},
            {head:'Help', links:[['Track Order','/track-order'],['Returns & Refunds','/refund-policy'],['Contact Us','/contact']]},
            {head:'Legal', links:[['Privacy Policy','/privacy-policy'],['Terms & Conditions','/terms'],['Shipping Policy','/shipping-policy']]},
          ].map(col => (
            <div key={col.head}>
              <span className="label">{col.head}</span>
              <ul style={{display:'flex',flexDirection:'column',gap:'.55rem'}}>
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} style={{fontSize:'.78rem',color:'var(--stone2)',transition:'color var(--t)'}}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop:'1.5rem',borderTop:'1px solid var(--sand)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'
        }}>
          <p style={{fontSize:'.65rem',color:'var(--stone)',letterSpacing:'.08em'}}>
            © {new Date().getFullYear()} SNERA. All rights reserved. Made in India.
          </p>
          <div style={{display:'flex',gap:'1.5rem'}}>
            {[['Privacy','/privacy-policy'],['Terms','/terms'],['Shipping','/shipping-policy']].map(([label, to]) => (
              <Link key={label} to={to} style={{fontSize:'.65rem',color:'var(--stone)',letterSpacing:'.08em',transition:'color var(--t)'}}>{label}</Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          footer .container > div:first-child { grid-template-columns: 1fr !important; }
          footer .container > div:nth-child(2) > div { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:480px){
          footer .container > div:nth-child(2) > div { grid-template-columns: 1fr !important; }
          footer form { flex-direction: column; }
        }
      `}</style>
    </footer>
  );
}