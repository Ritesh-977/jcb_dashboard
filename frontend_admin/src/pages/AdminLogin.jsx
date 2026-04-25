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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .admin-page { min-height: 100vh; background: #0a0a0f; display: flex; position: relative; overflow: hidden; }

        /* Grid lines background */
        .admin-page::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Glow orbs */
        .orb-1 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          top: -150px; left: -100px; pointer-events: none;
        }
        .orb-2 {
          position: absolute; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%);
          bottom: -100px; right: 200px; pointer-events: none;
        }

        /* Top bar */
        .admin-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.5rem 2.5rem; z-index: 10;
        }
        .admin-brand { display: flex; align-items: center; gap: 0.65rem; }
        .admin-brand-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; font-weight: 800; color: #fff;
          box-shadow: 0 0 20px rgba(99,102,241,0.5);
        }
        .admin-brand-name { color: #fff; font-weight: 700; font-size: 0.95rem; letter-spacing: -0.01em; }
        .admin-brand-sub { color: #6366f1; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .admin-topbar-badge {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.25);
          color: #f87171; font-size: 0.72rem; font-weight: 700;
          padding: 0.3rem 0.75rem; border-radius: 999px; letter-spacing: 0.05em;
        }
        .admin-topbar-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block; animation: blink 1.5s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* Main layout */
        .admin-main { display: flex; width: 100%; min-height: 100vh; align-items: stretch; }

        /* Left side — scattered text */
        .admin-left {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 7rem 3.5rem 3rem;
          position: relative; z-index: 1;
        }
        .admin-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          color: #6366f1; font-size: 0.78rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 1.25rem;
        }
        .admin-eyebrow-line { width: 28px; height: 2px; background: #6366f1; border-radius: 2px; }
        .admin-headline {
          font-size: clamp(2rem, 3.5vw, 3rem); font-weight: 800;
          color: #fff; line-height: 1.12; letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }
        .admin-headline span { color: #6366f1; }
        .admin-subline {
          color: #6b7280; font-size: 0.95rem; line-height: 1.7;
          max-width: 380px; margin-bottom: 3rem;
        }

        /* Access cards */
        .access-cards { display: flex; flex-direction: column; gap: 0.65rem; max-width: 340px; }
        .access-card {
          display: flex; align-items: center; gap: 0.85rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 0.75rem 1rem;
          transition: border-color 0.2s;
        }
        .access-card:hover { border-color: rgba(99,102,241,0.3); }
        .access-card-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .access-card-text { font-size: 0.82rem; color: #9ca3af; font-weight: 500; }
        .access-card-title { font-size: 0.85rem; color: #e5e7eb; font-weight: 600; margin-bottom: 0.1rem; }

        /* Bottom-left version tag */
        .admin-version {
          position: absolute; bottom: 2rem; left: 3.5rem;
          color: #374151; font-size: 0.72rem; font-weight: 500;
        }

        /* Divider */
        .admin-divider {
          width: 1px; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent);
          margin: 2rem 0; flex-shrink: 0;
        }

        /* Right side — form */
        .admin-right {
          width: 100%; max-width: 460px;
          display: flex; align-items: center; justify-content: center;
          padding: 7rem 3rem 3rem; position: relative; z-index: 1;
        }
        .admin-form-wrap { width: 100%; }
        .admin-form-title { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.35rem; }
        .admin-form-sub { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }

        /* Inputs */
        .admin-field { margin-bottom: 1rem; }
        .admin-label { display: block; font-size: 0.78rem; font-weight: 600; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.03em; text-transform: uppercase; }
        .admin-input-wrap { position: 'relative'; }
        .admin-input {
          width: 100%; padding: 0.75rem 0.85rem 0.75rem 2.6rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #f9fafb; font-size: 0.9rem;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: 'Inter', sans-serif;
        }
        .admin-input::placeholder { color: #4b5563; }
        .admin-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); background: rgba(255,255,255,0.06); }

        /* Submit button */
        .admin-submit {
          width: 100%; padding: 0.8rem; margin-top: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff; border: none; border-radius: 10px;
          font-size: 0.95rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          font-family: 'Inter', sans-serif; letter-spacing: 0.01em;
          transition: opacity 0.18s, transform 0.18s;
        }
        .admin-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .admin-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Error */
        .admin-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.25);
          color: #f87171; border-radius: 8px; padding: 0.65rem 0.85rem;
          font-size: 0.83rem; margin-bottom: 0.75rem;
        }

        /* Footer */
        .admin-form-footer { text-align: center; color: #374151; font-size: 0.72rem; margin-top: 1.75rem; }

        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .admin-form-wrap { animation: fadeUp 0.35s ease; }

        @media (max-width: 768px) {
          .admin-left { display: none; }
          .admin-divider { display: none; }
          .admin-right { max-width: 100%; padding: 5rem 1.5rem 2rem; }
          .admin-topbar { padding: 1.25rem 1.5rem; }
        }
      `}</style>

      <div className="admin-page">
        <div className="orb-1" />
        <div className="orb-2" />

        {/* Top bar */}
        <div className="admin-topbar">
          <div className="admin-brand">
            <div className="admin-brand-icon">J</div>
            <div>
              <div className="admin-brand-name">JCB Admin</div>
              <div className="admin-brand-sub">Management Portal</div>
            </div>
          </div>
          <div className="admin-topbar-badge">RESTRICTED ACCESS</div>
        </div>

        <div className="admin-main">
          {/* Left — scattered layout */}
          <div className="admin-left">
            <div className="admin-eyebrow">
              <div className="admin-eyebrow-line" />
              Admin Control Center
            </div>

            <h1 className="admin-headline">
              Secure access<br />
              for <span>administrators</span><br />
              only.
            </h1>

            <p className="admin-subline">
              Manage users, assign permissions, and control who sees what — all from one protected portal.
            </p>

            <div className="admin-version">v1.0 · JCB Dashboard</div>
          </div>

          {/* Vertical divider */}
          <div className="admin-divider" />

          {/* Right — form */}
          <div className="admin-right">
            <div className="admin-form-wrap">
              <div className="admin-form-title">Sign in</div>
              <div className="admin-form-sub">Enter your admin credentials to continue</div>

              <form onSubmit={handleSubmit}>
                <div className="admin-field">
                  <label className="admin-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      width="15" height="15" fill="none" stroke="#4b5563" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input className="admin-input" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="admin@jcb.com" required />
                  </div>
                </div>

                <div className="admin-field">
                  <label className="admin-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      width="15" height="15" fill="none" stroke="#4b5563" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input className="admin-input" type={showPwd ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      style={{ paddingRight: '2.6rem' }} required />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', padding: 0 }}>
                      {showPwd
                        ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18" /></svg>
                        : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="admin-error">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button className="admin-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 0.7s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Access Portal
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="admin-form-footer">
                © {new Date().getFullYear()} JCB Dashboard · Admin Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
