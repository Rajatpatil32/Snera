import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import API from '../../utils/api';

const NAV_ITEMS = [
  { to: '/admin/dashboard',    label: 'Dashboard',    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, extra: <><polyline points="9 22 9 12 15 12 15 22"/></> },
  { to: '/admin/orders',       label: 'Orders',        icon: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></> },
  { to: '/admin/products',     label: 'Products',      icon: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 3h-2a2 2 0 0 0-4 0H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></> },
  { to: '/admin/products/new', label: 'Add Product',   icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
  { to: '/admin/images',       label: 'Image Library', icon: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></> },
  // 🆕 NEW MENU ITEMS
  { to: '/admin/blog',         label: 'Blog',          icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
  { to: '/admin/products/import', label: 'Bulk Import',   icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, extra: null },
  { to: '/admin/collections',  label: 'Collections',   icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
];

export default function AdminLayout() {
  const navigate  = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('snera_admin_token');
    if (!token) { navigate('/admin'); return; }
    API.get('/auth/verify')
      .then(() => setVerified(true))
      .catch(() => { localStorage.removeItem('snera_admin_token'); navigate('/admin'); });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('snera_admin_token');
    navigate('/admin');
  };

  if (!verified) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--off)'}}>
      <div className="loader-ring"/>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">SNERA</div>

        <nav className="admin-nav" style={{flex:1}}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <svg viewBox="0 0 24 24" style={{width:15,height:15,stroke:'currentColor',fill:'none',strokeWidth:1.5,flexShrink:0}}>
                {item.icon}{item.extra}
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            display:'flex', alignItems:'center', gap:'.75rem',
            padding:'.75rem 1.5rem', margin:'0',
            fontSize:'.68rem', letterSpacing:'.14em', textTransform:'uppercase',
            color:'rgba(255,255,255,.4)',
            background:'none', border:'none', cursor:'pointer', fontFamily:'var(--sans)',
            width:'100%', transition:'color var(--t)',
            borderTop:'1px solid rgba(255,255,255,.08)'
          }}
        >
          <svg viewBox="0 0 24 24" style={{width:15,height:15,stroke:'currentColor',fill:'none',strokeWidth:1.5}}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}