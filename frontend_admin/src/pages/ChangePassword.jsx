import { useState } from 'react';
import { apiFetch } from '../api';
import Layout from '../components/Layout';

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input className="form-input" type={show ? 'text' : 'password'} required
        value={value} onChange={onChange} placeholder={placeholder}
        style={{ paddingRight: '2.75rem' }} />
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
        {show
          ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18" /></svg>
          : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        }
      </button>
    </div>
  );
}

export default function ChangePassword() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { setErr('Passwords do not match'); return; }
    if (form.new_password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setLoading(true); setErr(''); setMsg('');
    try {
      await apiFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }) });
      setMsg('Password updated successfully.');
      setForm({ old_password: '', new_password: '', confirm: '' });
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Change Password">
      <div style={{ maxWidth: 520 }}>
        {/* Info banner */}
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <svg width="18" height="18" fill="none" stroke="#4f46e5" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{ fontSize: '0.85rem', color: '#3730a3', lineHeight: 1.5 }}>
            Choose a strong password with at least 6 characters. You'll need to sign in again after changing it.
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            Update your password
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Current Password</label>
              <PasswordInput value={form.old_password} onChange={(e) => setForm((p) => ({ ...p, old_password: e.target.value }))} placeholder="Enter current password" />
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '1.25rem 0' }} />

            <div className="form-field">
              <label className="form-label">New Password</label>
              <PasswordInput value={form.new_password} onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))} placeholder="Enter new password" />
            </div>
            <div className="form-field">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" required value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" />
            </div>

            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {msg}
              </div>
            </div>}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.65rem 1.5rem' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
