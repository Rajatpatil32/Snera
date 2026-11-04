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
    <footer style={{background:'var(--off)',color:'var(--ink)',borderTop:'1px solid var(--sand)'}}>
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
              <span className="label">Join The Club</span>
              <h3 style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:'clamp(1.5rem,3vw,2.2rem)',letterSpacing:'-.02em',color:'var(--ink)'}}>
                Get Exclusive Custom Drops & <span className="gradient-text">10% Off First Tee.</span>
              </h3>
              <p style={{fontSize:'.88rem',color:'var(--stone2)',marginTop:'.65rem',lineHeight:1.75}}>
                New custom apparel releases, design inspiration, and VIP discounts directly to your inbox.
              </p>
            </div>
            <form onSubmit={handleNL} style={{display:'flex',gap:0}}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                style={{
                  flex:1,border:'1px solid var(--sand)',borderRight:'none',
                  padding:'.9rem 1.2rem',borderRadius:'var(--radius-sm) 0 0 var(--radius-sm)',
                  fontFamily:'var(--sans)',fontSize:'.85rem',fontWeight:400,
                  background:'var(--white)',color:'var(--ink)',outline:'none'
                }}
              />
              <button type="submit" className="btn btn-gradient" style={{whiteSpace:'nowrap',borderRadius:'0 var(--radius-sm) var(--radius-sm) 0',padding:'.9rem 1.8rem'}}>
                {submitted ? '✓ Subscribed' : 'Subscribe'}
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
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',fontFamily:'var(--sans)',fontSize:'1.4rem',fontWeight:700,letterSpacing:'.18em',marginBottom:'1rem',color:'var(--ink)'}}>
              <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:'none',stroke:'var(--accent)',strokeWidth:2}}>
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
              </svg>
              <span>SNERA</span>
            </div>
            <p style={{fontSize:'.82rem',color:'var(--stone2)',lineHeight:1.8,maxWidth:'32ch'}}>
              India's premium customizable t-shirt brand. Engineered with 220 GSM super-combed cotton for uncompromised quality.
            </p>
            <div style={{marginTop:'1.2rem',display:'flex',gap:'1rem',alignItems:'center'}}>
              <a
                href="https://www.instagram.com/snera.store/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SNERA on Instagram"
                style={{fontSize:'.78rem',color:'var(--accent)',fontWeight:600,letterSpacing:'.08em',display:'flex',alignItems:'center',gap:'.4rem',transition:'color var(--t)'}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                @snera.store
              </a>
            </div>
          </div>
          {[
            {head:'Shop Apparel', links:[['New Arrivals','/shop'],['Men\'s Tees','/shop?gender=Men'],['Women\'s Tees','/shop?gender=Women'],['Unisex Collection','/shop?gender=Unisex'],['Custom Printing','/custom']]},
            {head:'Customer Care', links:[['Track Order','/track-order'],['Returns & Refunds','/refund-policy'],['Contact Us','/contact'],['Size Guide','/size-guide'],['Care Guide','/care-guide']]},
            {head:'Legal & Policy', links:[['Privacy Policy','/privacy-policy'],['Terms & Conditions','/terms'],['Shipping Policy','/shipping-policy']]},
          ].map(col => (
            <div key={col.head}>
              <span className="label" style={{marginBottom:'.8rem'}}>{col.head}</span>
              <ul style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} style={{fontSize:'.82rem',color:'var(--stone2)',transition:'color var(--t)'}}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop:'1.75rem',borderTop:'1px solid var(--sand)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'
        }}>
          <p style={{fontSize:'.72rem',color:'var(--stone)',letterSpacing:'.06em'}}>
            © {new Date().getFullYear()} SNERA. All rights reserved. Made with ❤️ in India.
          </p>
          <div style={{display:'flex',gap:'1.5rem'}}>
            {[['Privacy','/privacy-policy'],['Terms','/terms'],['Shipping','/shipping-policy']].map(([label, to]) => (
              <Link key={label} to={to} style={{fontSize:'.72rem',color:'var(--stone)',letterSpacing:'.06em',transition:'color var(--t)'}}>{label}</Link>
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
          footer form input { border-radius: var(--radius-sm) !important; border-right: 1px solid var(--sand) !important; margin-bottom: .5rem; }
          footer form button { border-radius: var(--radius-sm) !important; width: 100%; justify-content: center; }
        }
      `}</style>
    </footer>
  );
}