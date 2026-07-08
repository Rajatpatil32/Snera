import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ adminId: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await API.post('/auth/login', form);
      localStorage.setItem('snera_admin_token', r.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'var(--off)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'2rem'
    }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'2.5rem'}}>
          <div style={{
            fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:500,
            letterSpacing:'.25em', textTransform:'uppercase', color:'var(--ink)'
          }}>SNERA</div>
          <div style={{
            fontSize:'.6rem', letterSpacing:'.22em', textTransform:'uppercase',
            color:'var(--stone)', marginTop:'.4rem'
          }}>Admin Panel</div>
        </div>

        {/* Card */}
        <div style={{background:'var(--white)', border:'1px solid var(--sand)', padding:'2.5rem'}}>
          <h1 style={{
            fontFamily:'var(--serif)', fontWeight:300, fontSize:'1.6rem',
            marginBottom:'1.75rem', color:'var(--ink)'
          }}>Sign in</h1>

          {error && (
            <div style={{
              background:'#FEF2F2', border:'1px solid #FECACA',
              padding:'.85rem 1rem', marginBottom:'1.25rem',
              fontSize:'.78rem', color:'#991B1B'
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'1.1rem'}}>
            <div className="form-group">
              <label className="form-label" htmlFor="adminId">Admin ID</label>
              <input
                id="adminId" type="text" className="form-input"
                value={form.adminId} placeholder="admin"
                onChange={e => setForm(f => ({...f, adminId: e.target.value}))}
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-input"
                value={form.password} placeholder="••••••••"
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                required
              />
            </div>
            <button
              type="submit" className="btn btn-dark"
              style={{width:'100%', justifyContent:'center', marginTop:'.5rem', opacity: loading ? .7 : 1}}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* <p style={{textAlign:'center', marginTop:'1.5rem', fontSize:'.68rem', color:'var(--stone)'}}>
          Default: admin / snera@admin123
        </p> */}
      </div>
    </div>
  );
}
