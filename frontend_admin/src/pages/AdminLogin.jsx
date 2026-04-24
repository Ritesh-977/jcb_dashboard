import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { auth, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (auth?.role === 'admin') return <Navigate to="/users" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password }) });
      login(data.access_token);
      navigate('/users');
    } catch (err) {
      setError(err.message === 'Admin access required' ? 'Access denied: admin accounts only.' : err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>
            <div style={s.brandIcon}>J</div>
            <div>
              <div style={s.brandName}>JCB Admin</div>
              <div style={s.brandSub}>Management Portal</div>
            </div>
          </div>
          <h1 style={s.headline}>Manage your<br />team with ease.</h1>
          <p style={s.subline}>Control user access, permissions, and roles from one secure place.</p>
          <div style={s.features}>
            {['Role-based access control', 'Granular page permissions', 'Secure JWT authentication'].map((f) => (
              <div key={f} style={s.feature}>
                <div style={s.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.badge}>Admin Portal</span>
            <h2 style={s.title}>Welcome back</h2>
            <p style={s.desc}>Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }} placeholder="admin@jcb.com" required />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input className="form-input" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd((s) => !s)} style={s.eyeBtn} tabIndex={-1}>
                  {showPwd
                    ? <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
                    : <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.95rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 0.7s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  left: { flex: 1, background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' },
  leftInner: { maxWidth: 420, position: 'relative', zIndex: 1 },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' },
  brandIcon: { width: 42, height: 42, background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#fff', backdropFilter: 'blur(8px)' },
  brandName: { color: '#fff', fontWeight: 700, fontSize: '1rem' },
  brandSub: { color: '#a5b4fc', fontSize: '0.72rem' },
  headline: { fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '1rem' },
  subline: { color: '#c7d2fe', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' },
  features: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  feature: { display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0e7ff', fontSize: '0.9rem' },
  featureDot: { width: 8, height: 8, borderRadius: '50%', background: '#818cf8', flexShrink: 0 },
  right: { width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc' },
  card: { width: '100%', background: '#fff', borderRadius: 16, padding: '2.25rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  cardHeader: { marginBottom: '1.75rem' },
  badge: { display: 'inline-block', background: '#ede9fe', color: '#5b21b6', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px', marginBottom: '0.85rem', letterSpacing: '0.04em' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' },
  desc: { color: '#64748b', fontSize: '0.9rem' },
  field: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  eyeBtn: { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
};

// Hide left panel on small screens
const mediaStyle = `@media(max-width:640px){.login-left{display:none!important;}.login-right{max-width:100%!important;}}`;
document.head.insertAdjacentHTML('beforeend', `<style>${mediaStyle}</style>`);
