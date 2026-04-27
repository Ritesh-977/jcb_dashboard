import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        required
        style={{ ...styles.input, paddingRight: '2.5rem' }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={styles.eyeBtn}
        tabIndex={-1}
      >
        {show ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 6) { setErr('New password must be at least 6 characters'); return; }
    if (form.new_password !== form.confirm) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr(''); setMsg('');
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }),
      });
      setMsg('Password updated successfully.');
      setForm({ old_password: '', new_password: '', confirm: '' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>
        <h2 style={styles.title}>Change Password</h2>
        <form onSubmit={handleSubmit}>
          {[['old_password', 'Current Password'], ['new_password', 'New Password']].map(([key, label]) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <PasswordInput
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          ))}
          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              required
              style={styles.input}
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          {err && <p style={styles.err}>{err}</p>}
          {msg && <p style={styles.msg}>{msg}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '420px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  back: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '1.25rem', display: 'block' },
  title: { fontSize: '1.4rem', fontWeight: '700', color: '#111', marginBottom: '1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0', display: 'flex', alignItems: 'center' },
  err: { color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem' },
  msg: { color: '#16a34a', fontSize: '0.85rem', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem' },
  btn: { width: '100%', padding: '0.7rem', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
};
