import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ALL_PERMISSIONS = ['view_kpi', 'view_sentiment', 'view_comments', 'view_trend'];
const EMPTY_NEW_USER = { email: '', password: '', role: 'viewer', permissions: [] };

const Spinner = () => (
  <svg style={{ animation: 'spin 0.7s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
    <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function SkeletonRow() {
  const pulse = { background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 6 };
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {[40, 180, 70, 200, 70, 80].map((w, j) => (
            <td key={j} style={{ padding: '0.85rem 1rem' }}>
              <div style={{ ...pulse, height: j === 2 ? 22 : 14, width: w, borderRadius: j === 2 ? 999 : 6 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminUsers() {
  const { auth } = useAuth();
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

  const PAGE_SIZE = 20;
  const currentUserId = auth?.sub ? parseInt(auth.sub) : null;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/users?page=${page}&page_size=${PAGE_SIZE}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    if (!user.id || user.id === currentUserId) return;
    setError(''); setTogglingId(user.id);
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
    setError(''); setSavingId(userId);
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ permissions: editPerms }) });
      setEditingId(null); setEditPerms([]); fetchUsers();
    } catch (err) { setError(err.message); }
    finally { setSavingId(null); }
  };

  const toggleNewPerm = (perm) => setNewUser((prev) => ({
    ...prev,
    permissions: prev.permissions.includes(perm) ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm],
  }));

  const handleCreateUser = async (e) => {
    e.preventDefault(); setCreating(true); setModalError('');
    try {
      await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
      setShowCreate(false); setNewUser(EMPTY_NEW_USER); fetchUsers();
    } catch (err) { setModalError(err.message); }
    finally { setCreating(false); }
  };

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalActive = users.filter((u) => u.is_active).length;

  return (
    <Layout title="User Management">
      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Users', value: total, sub: 'across all roles' },
          { label: 'Active', value: totalActive, sub: 'currently enabled' },
          { label: 'Admins', value: totalAdmins, sub: 'with full access' },
          { label: 'Viewers', value: total - totalAdmins, sub: 'limited access' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{loading ? '—' : value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Table card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>All Users</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{total} total records</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(true); setError(''); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRow /> : users.map((user) => {
                const isEditing = editingId === String(user.id);
                const isSelf = String(user.id) === String(currentUserId);
                const isAdmin = user.role === 'admin';
                const perms = user.permissions ?? [];
                return (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{user.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAdmin ? '#fee2e2' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: isAdmin ? '#991b1b' : '#1e40af', flexShrink: 0 }}>
                          {user.email[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-viewer'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {ALL_PERMISSIONS.map((p) => (
                            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}>
                              <input type="checkbox" checked={editPerms.includes(p)} onChange={() => togglePerm(p)} style={{ accentColor: '#4f46e5' }} />
                              {p.replace('view_', '')}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {perms.length > 0
                            ? perms.map((p) => <span key={p} className="perm-chip">{p.replace('view_', '')}</span>)
                            : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No permissions</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={isSelf || togglingId === user.id}
                        className={`badge ${user.is_active ? 'badge-active' : 'badge-disabled'}`}
                        style={{ border: 'none', cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.5 : 1, minWidth: 64, justifyContent: 'center' }}
                      >
                        {togglingId === user.id ? <Spinner /> : user.is_active ? '● Active' : '○ Disabled'}
                      </button>
                    </td>
                    <td>
                      {isAdmin ? (
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>—</span>
                      ) : isEditing ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => saveEdit(user.id)} disabled={savingId === user.id}>
                            {savingId === user.id ? <Spinner /> : 'Save'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(user)}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination" style={{ padding: '1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1} style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            ← Prev
          </button>
          <span className="page-info">Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} users</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => p + 1)}
            disabled={page * PAGE_SIZE >= total} style={{ opacity: page * PAGE_SIZE >= total ? 0.4 : 1, cursor: page * PAGE_SIZE >= total ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>Create New User</h3>
              <button onClick={() => { setShowCreate(false); setModalError(''); setNewUser(EMPTY_NEW_USER); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && <div className="alert alert-error">{modalError}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="form-field">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" required value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div className="form-field">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" required value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="form-field">
                <label className="form-label">Permissions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {ALL_PERMISSIONS.map((p) => {
                    const checked = newUser.permissions.includes(p);
                    return (
                      <button key={p} type="button" onClick={() => toggleNewPerm(p)}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: `1.5px solid ${checked ? '#4f46e5' : '#e2e8f0'}`, background: checked ? '#eef2ff' : '#fff', color: checked ? '#4f46e5' : '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {p.replace('view_', '')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowCreate(false); setModalError(''); setNewUser(EMPTY_NEW_USER); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><Spinner /> Creating...</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
