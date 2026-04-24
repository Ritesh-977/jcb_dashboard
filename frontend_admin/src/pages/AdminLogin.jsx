import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { auth, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (auth?.role === 'admin') return <Navigate to="/users" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.access_token);
      navigate('/users');
    } catch (err) {
      setError(err.message === 'Admin access required' ? 'Access denied: admin accounts only.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.badge}>Admin Portal</p>
        <h2 style={styles.title}>Admin Sign In</h2>
        <p style={styles.description}>Restricted to administrators only</p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="admin@jcb.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="••••••••" required />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', width: '400px', textAlign: 'center' },
  badge: { display: 'inline-block', background: '#dc2626', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '999px', marginBottom: '1rem', letterSpacing: '0.05em' },
  title: { marginBottom: '0.5rem', color: '#111', fontSize: '1.8rem', fontWeight: '600' },
  description: { color: '#666', marginBottom: '2rem', fontSize: '0.95rem' },
  field: { marginBottom: '1.25rem', textAlign: 'left' },
  label: { display: 'block', marginBottom: '0.4rem', color: '#333', fontWeight: '500', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e1e5e9', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
  error: { color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px' },
  button: { width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #1a1a2e 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '1.5rem' },
};
