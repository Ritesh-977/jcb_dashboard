import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg width="48" height="48" fill="none" stroke="#dc2626" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 style={styles.title}>Access Denied</h2>
        <p style={styles.message}>You don't have permission to access any pages. Please contact your administrator.</p>
        <button onClick={handleLogout} style={styles.btn}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', borderRadius: '16px', padding: '3rem 2.5rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' },
  iconWrap: { marginBottom: '1.25rem' },
  title: { fontSize: '1.6rem', fontWeight: '700', color: '#111', marginBottom: '0.75rem' },
  message: { color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' },
  btn: { background: '#dc2626', color: '#fff', border: 'none', padding: '0.7rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
};
