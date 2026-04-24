import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import S from '../components/Skeleton';

const ALL_PERMISSIONS = ['view_kpi', 'view_sentiment', 'view_comments', 'view_trend'];
const EMPTY_NEW_USER = { email: '', password: '', role: 'viewer', permissions: [] };

const Spinner = () => (
  <svg style={{ animation: 'spin 0.7s linear infinite', width: 14, height: 14, verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none">
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function TableSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '60px 1fr 100px 1fr 90px 90px', gap: '1rem' }}>
        {[80, 160, 80, 180, 60, 60].map((w, i) => (
          <S key={i} style={{ height: 12, width: w, borderRadius: 4 }} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '60px 1fr 100px 1fr 90px 90px', gap: '1rem', alignItems: 'center' }}>
          <S style={{ height: 14, width: 24, borderRadius: 4 }} />
          <S style={{ height: 14, width: 160, borderRadius: 4 }} />
          <S style={{ height: 20, width: 56, borderRadius: 999 }} />
          <S style={{ height: 14, width: 180, borderRadius: 4 }} />
          <S style={{ height: 28, width: 64, borderRadius: 6 }} />
          <S style={{ height: 28, width: 48, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPerms, setEditPerms] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  const currentUserId = auth?.sub ? parseInt(auth.sub) : null;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/users?page=${page}&page_size=20`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    if (!user.id || user.id === currentUserId) return;
    setError('');
    setTogglingId(user.id);
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !user.is_active }) });
      fetchUsers();
    } catch (err) { setError(err.message); }
    finally { setTogglingId(null); }
  };

  const startEdit = (user) => { setEditingId(String(user.id)); setEditPerms([...(user.permissions ?? [])]); };
  const cancelEdit = () => { setEditingId(null); setEditPerms([]); };
  const togglePerm = (perm) => setEditPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);

  const saveEdit = async (userId) => {
    if (!userId) return;
    setError('');
    setSavingId(userId);
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ permissions: editPerms }) });
      setEditingId(null);
      setEditPerms([]);
      fetchUsers();
    } catch (err) { setError(err.message); }
    finally { setSavingId(null); }
  };

  const toggleNewPerm = (perm) => setNewUser((prev) => ({
    ...prev,
    permissions: prev.permissions.includes(perm) ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm],
  }));

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setModalError('');
    try {
      await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
      setShowCreate(false);
      setNewUser(EMPTY_NEW_USER);
      fetchUsers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <h1 style={styles.heading}>User Management</h1>
          <span style={styles.adminBadge}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/change-password')} style={styles.changePwdBtn}>🔒 Change Password</button>
          <button onClick={() => { setShowCreate(true); setError(''); }} style={styles.createBtn}>+ Create User</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {showCreate && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '600' }}>Create New User</h3>
            {modalError && <p style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{modalError}</p>}
            <form onSubmit={handleCreateUser}>
              <div style={styles.mfield}>
                <label style={styles.mlabel}>Email</label>
                <input type="email" required style={styles.minput} value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div style={styles.mfield}>
                <label style={styles.mlabel}>Password</label>
                <input type="password" required style={styles.minput} value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div style={styles.mfield}>
                <label style={styles.mlabel}>Role</label>
                <select style={styles.select} value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                  <option value="viewer">viewer</option>
                </select>
              </div>
              <div style={styles.mfield}>
                <label style={styles.mlabel}>Permissions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} style={styles.permLabel}>
                      <input type="checkbox" checked={newUser.permissions.includes(p)} onChange={() => toggleNewPerm(p)} />{' '}{p}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => { setShowCreate(false); setModalError(''); setNewUser(EMPTY_NEW_USER); }} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={creating} style={styles.saveBtn}>{creating ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <TableSkeleton /> : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>{['ID', 'Email', 'Role', 'Permissions', 'Active', 'Actions'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditing = editingId === String(user.id);
                  const isSelf = String(user.id) === String(currentUserId);
                  const isAdmin = user.role === 'admin';
                  return (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, background: isAdmin ? '#dc2626' : '#2563eb' }}>{user.role}</span>
                      </td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {ALL_PERMISSIONS.map((p) => (
                              <label key={p} style={styles.permLabel}>
                                <input type="checkbox" checked={editPerms.includes(p)} onChange={() => togglePerm(p)} />{' '}{p}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <span style={styles.permText}>{(user.permissions ?? []).join(', ') || '—'}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleToggleActive(user)} disabled={isSelf || togglingId === user.id}
                          style={{ ...styles.toggleBtn, background: user.is_active ? '#16a34a' : '#6b7280', opacity: isSelf ? 0.5 : 1 }}>
                          {togglingId === user.id ? <Spinner /> : user.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td style={styles.td}>
                        {isAdmin ? <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>
                          : isEditing ? (
                            <>
                              <button onClick={() => saveEdit(user.id)} disabled={savingId === user.id} style={styles.saveBtn}>
                                {savingId === user.id ? <Spinner /> : 'Save'}
                              </button>
                              <button onClick={cancelEdit} style={{ ...styles.cancelBtn, marginLeft: '0.4rem' }}>Cancel</button>
                            </>
                          ) : <button onClick={() => startEdit(user)} style={styles.editBtn}>Edit</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={styles.pagination}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}>← Prev</button>
            <span style={{ color: '#666' }}>Page {page} · {total} users</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} style={{ ...styles.pageBtn, ...(page * 20 >= total ? styles.pageBtnDisabled : {}) }}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif", padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { fontSize: '1.75rem', fontWeight: '700', color: '#111' },
  adminBadge: { background: '#1e293b', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' },
  changePwdBtn: { background: '#7c3aed', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  createBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  logoutBtn: { background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  mfield: { marginBottom: '1rem' },
  mlabel: { display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151', marginBottom: '0.3rem' },
  minput: { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#334155', verticalAlign: 'middle' },
  roleBadge: { color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  permText: { fontSize: '0.8rem', color: '#64748b' },
  permLabel: { fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' },
  select: { padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  toggleBtn: { color: '#fff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  editBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  saveBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  cancelBtn: { background: '#6b7280', color: '#fff', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' },
  pageBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  pageBtnDisabled: { background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' },
};
