import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { auth, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (auth) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/auth/dashboard-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        .login-input {
          width: 100%; padding: 0.7rem 0.85rem 0.7rem 2.6rem;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 0.92rem; color: #0f172a; background: #f8fafc;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s;
          font-family: 'Inter', sans-serif;
        }
        .login-input:focus { border-color: #2bb5e8; box-shadow: 0 0 0 3px rgba(43,181,232,0.15); background: #fff; }
        .login-btn {
          width: 100%; padding: 0.75rem; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #0b1d3d 0%, #2bb5e8 100%);
          color: #fff; font-size: 0.95rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          font-family: 'Inter', sans-serif; letter-spacing: 0.01em;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(43,181,232,0.35); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .login-card { animation: fadeUp 0.4s ease; }
        @media (max-width: 768px) { .login-left { display: none !important; } .login-right { max-width: 100% !important; padding: 1.5rem !important; } }
      `}</style>

      <div style={s.page}>

        {/* ── Left panel ── */}
        <div className="login-left" style={s.left}>
          <div style={s.brandTop}>
            <div style={s.brandIcon}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div style={s.brandName}>JCB Sentiment</div>
              <div style={s.brandSub}>Analytics Dashboard</div>
            </div>
          </div>

          <div style={s.leftInner}>
            <h1 style={s.headline}>
              Understand your<br />
              <span style={{ color: '#2bb5e8' }}>audience better.</span>
            </h1>
            <p style={s.subline}>
              Real-time sentiment analysis across social platforms. Track campaigns, monitor comments, and uncover trends — all in one place.
            </p>

            {/* Feature list */}
            <div style={s.features}>
              {[
                { icon: '📊', text: 'Campaign performance overview' },
                { icon: '💬', text: 'Facebook & Instagram comment analysis' },
                { icon: '📈', text: 'Sentiment trend tracking' },
              ].map(({ icon, text }) => (
                <div key={text} style={s.featureItem}>
                  <span style={s.featureIcon}>{icon}</span>
                  <span style={s.featureText}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="login-right" style={s.right}>
          <div className="login-card" style={s.card}>

            {/* Mobile brand */}
            <div style={{ display: 'none', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', ...s.mobileBrand }}>
              <div style={{ ...s.brandIcon, width: 36, height: 36 }}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0b1d3d' }}>JCB Sentiment</span>
            </div>

            <div style={s.cardTop}>
              <span style={s.badge}>Dashboard Access</span>
              <h2 style={s.title}>Welcome back</h2>
              <p style={s.desc}>Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <svg style={s.fieldIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input className="login-input" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
              </div>

              {/* Password */}
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <svg style={s.fieldIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input className="login-input" type={showPwd ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ paddingRight: '2.6rem' }} required />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} tabIndex={-1}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPwd
                      ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18" /></svg>
                      : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div style={s.errorBox}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button className="login-btn" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 0.7s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p style={s.footer}>© {new Date().getFullYear()} JCB Dashboard. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },

  // Left
  left: { flex: 1, background: 'linear-gradient(145deg, #0b1d3d 0%, #0d2a52 55%, #0e3060 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden' },
  brandTop: { position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' },
  leftInner: { maxWidth: 440, position: 'relative', zIndex: 1, paddingTop: '4.25rem' },
  brandIcon: { width: 46, height: 46, borderRadius: '12px', background: 'linear-gradient(135deg, #2bb5e8, #1a8ab5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(43,181,232,0.35)' },
  brandName: { color: '#fff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' },
  brandSub: { color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 500, marginTop: '0.1rem' },
  headline: { fontSize: 'clamp(1.9rem, 3vw, 2.7rem)', fontWeight: 800, color: '#fff', lineHeight: 1.18, marginBottom: '1.1rem', letterSpacing: '-0.02em' },
  subline: { color: '#93c5fd', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2.25rem' },
  features: { display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  featureIcon: { fontSize: '1.1rem', width: 36, height: 36, background: 'rgba(255,255,255,0.07)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { color: '#bfdbfe', fontSize: '0.9rem', fontWeight: 500 },
  statsRow: { display: 'flex', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' },
  stat: { textAlign: 'center' },
  statValue: { color: '#fff', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' },
  statLabel: { color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 500, marginTop: '0.15rem' },

  // Right
  right: { width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', background: '#f1f5f9' },
  card: { width: '100%', background: '#fff', borderRadius: '18px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.09)', border: '1px solid #e2e8f0' },
  mobileBrand: { '@media(maxWidth:768px)': { display: 'flex' } },
  cardTop: { marginBottom: '2rem' },
  badge: { display: 'inline-block', background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.8rem', borderRadius: '999px', marginBottom: '0.9rem', letterSpacing: '0.04em' },
  title: { fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.02em' },
  desc: { color: '#64748b', fontSize: '0.9rem' },
  field: { marginBottom: '1.15rem' },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' },
  fieldIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.85rem', marginBottom: '1rem' },
  footer: { textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '1.75rem' },
};
