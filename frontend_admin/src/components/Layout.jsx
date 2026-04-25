import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    path: '/users', label: 'User Management',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    path: '/change-password', label: 'Change Password',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
];

export default function Layout({ children, title }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = auth?.email ? auth.email[0].toUpperCase() : 'A';

  return (
    <div className="admin-shell">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">J</div>
          <div>
            <div className="sidebar-logo-text">JCB Admin</div>
            <div className="sidebar-logo-sub">Management Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ path, label, icon }) => (
            <button key={path} className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => { navigate(path); setSidebarOpen(false); }}>
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{auth?.email}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button className="sidebar-link" style={{ marginTop: '0.5rem', color: '#fca5a5' }} onClick={handleLogout}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Hamburger — mobile only */}
            <button onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', padding: '0.25rem', borderRadius: '6px' }}
              className="hamburger">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{initials}</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Admin</span>
            </div>
          </div>
        </header>

        <main className="page-body">{children}</main>
      </div>

      {/* Show hamburger on mobile via inline media query trick */}
      <style>{`@media(max-width:768px){.hamburger{display:flex !important;}}`}</style>
    </div>
  );
}
