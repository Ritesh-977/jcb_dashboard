import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem('access_token')) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          {/* <h1 style={styles.logoText}>JCB</h1> */}
          <p style={styles.subtitle}>Dashboard</p>
        </div>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.description}>Sign in to access your dashboard</p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputContainer}>
              <span style={styles.icon}>📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputContainer}>
              <span style={styles.icon}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
              ...(buttonHover ? styles.buttonHover : {}),
            }}
            disabled={loading}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.footer}>© 2024 JCB Dashboard. All rights reserved.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    width: '400px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logo: {
    marginBottom: '1rem',
  },
  logoText: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '0',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#764ba2',
    margin: '0.5rem 0 0 0',
    fontWeight: '300',
  },
  title: {
    marginBottom: '0.5rem',
    color: '#333',
    fontSize: '1.8rem',
    fontWeight: '600',
  },
  description: {
    color: '#666',
    marginBottom: '2rem',
    fontSize: '1rem',
  },
  field: {
    marginBottom: '1.5rem',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    color: '#999',
    fontSize: '1.2rem',
    zIndex: '1',
  },
  input: {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    borderRadius: '8px',
    border: '2px solid #e1e5e9',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    outline: 'none',
    backgroundColor: '#fafbfc',
  },
  error: {
    color: '#e74c3c',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    marginBottom: '1.5rem',
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(102, 126, 234, 0.4)',
  },
  footer: {
    color: '#999',
    fontSize: '0.8rem',
    marginTop: '1rem',
  },
};

// Add hover effects via CSS-in-JS (since inline styles don't support pseudo-classes, we can add them programmatically if needed)
// For simplicity, we'll assume the user can add CSS classes if they want advanced hover effects
