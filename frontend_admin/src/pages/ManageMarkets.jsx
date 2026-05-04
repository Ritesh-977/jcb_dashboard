import { useState, useEffect, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';
import { apiFetch } from '../api';
import { useMarkets } from '../context/MarketContext';

// ── Inline spinner ────────────────────────────────────────────────────────────
const Spinner = ({ size = 14, color = '#fff' }) => (
  <svg
    style={{ animation: 'spin 0.7s linear infinite', width: size, height: size, flexShrink: 0 }}
    viewBox="0 0 24 24" fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke={`${color}55`} strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ── Shimmer skeleton rows ─────────────────────────────────────────────────────
const PULSE = {
  background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 6,
};

function SkeletonRows() {
  return (
    <>
      <style>{`
        @keyframes spin    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {[60, 160, 80, 90, 100].map((w, j) => (
            <td key={j} style={{ padding: '0.9rem 1rem' }}>
              <div style={{ ...PULSE, height: 14, width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({ market, onConfirm, onCancel, deleting }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
    >
      <div className="modal" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Delete Market
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              This action is <strong>irreversible</strong>.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{
          background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10,
          padding: '1rem 1.1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.6rem' }}>
            You are about to permanently delete:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {market.code[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                {market.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Code: <code style={{ fontFamily: 'monospace' }}>{market.code}</code>
              </div>
            </div>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.85rem',
          }}>
            {[
              { label: 'Posts', value: market.post_count.toLocaleString(), icon: '📄' },
              { label: 'Comments', value: market.comment_count.toLocaleString(), icon: '💬' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 8, padding: '0.5rem 0.75rem',
                border: '1px solid #fecaca',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>{icon} {label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{
            marginTop: '0.85rem', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 500,
            background: '#fee2e2', borderRadius: 6, padding: '0.5rem 0.7rem',
          }}>
            ⚠️ All posts, comments, and campaigns for this market will be permanently deleted.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={deleting}
            style={{ opacity: deleting ? 0.5 : 1 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
            style={{ minWidth: 130 }}
          >
            {deleting ? (
              <><Spinner /> Deleting...</>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Yes, Delete Market
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageMarkets() {
  const { markets, marketsLoading, refreshMarkets, setMarkets } = useMarkets();

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [confirmMarket, setConfirmMarket] = useState(null); // market object to delete
  const [deleting, setDeleting]       = useState(false);

  // Initial fetch
  useEffect(() => {
    loadMarkets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMarkets() {
    setLoading(true);
    setError('');
    try {
      await refreshMarkets();
    } catch (err) {
      setError(err.message || 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  }

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter(
      (m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [markets, search]);

  // Stats
  const totalPosts    = markets.reduce((s, m) => s + (m.post_count    || 0), 0);
  const totalComments = markets.reduce((s, m) => s + (m.comment_count || 0), 0);

  async function handleDeleteConfirm() {
    if (!confirmMarket) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/markets/${confirmMarket.code}`, { method: 'DELETE' });
      // Optimistic local update
      setMarkets((prev) => prev.filter((m) => m.code !== confirmMarket.code));
      toast.success(
        `Market "${confirmMarket.name}" deleted successfully`,
        { duration: 4000, icon: '🗑️' }
      );
      setConfirmMarket(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete market', { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Layout title="Manage Markets">
      {/* Toast container */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          success: {
            style: { border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534' },
          },
          error: {
            style: { border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' },
          },
        }}
      />

      {/* ── Stat Cards ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        {[
          {
            label: 'Total Markets',
            value: loading ? '—' : markets.length,
            sub: 'active regions',
            accent: '#4f46e5',
            bg: '#eef2ff',
            icon: (
              <svg width="18" height="18" fill="none" stroke="#4f46e5" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'Total Posts',
            value: loading ? '—' : totalPosts.toLocaleString(),
            sub: 'across all markets',
            accent: '#0891b2',
            bg: '#ecfeff',
            icon: (
              <svg width="18" height="18" fill="none" stroke="#0891b2" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            label: 'Total Comments',
            value: loading ? '—' : totalComments.toLocaleString(),
            sub: 'across all markets',
            accent: '#16a34a',
            bg: '#f0fdf4',
            icon: (
              <svg width="18" height="18" fill="none" stroke="#16a34a" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            ),
          },
          {
            label: 'Showing',
            value: loading ? '—' : `${filtered.length} / ${markets.length}`,
            sub: search ? 'filtered results' : 'all markets',
            accent: '#d97706',
            bg: '#fffbeb',
            icon: (
              <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            ),
          },
        ].map(({ label, value, sub, accent, bg, icon }) => (
          <div key={label} className="card stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 12, right: 12,
              width: 34, height: 34, borderRadius: 8, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: accent }}>{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Market Table Card ── */}
      <div className="card">
        {/* Card header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              All Markets
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {markets.length} market{markets.length !== 1 ? 's' : ''} registered
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <svg
                width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth={2}
                viewBox="0 0 24 24"
                style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="form-input"
                style={{ paddingLeft: '2.1rem', width: 220, fontSize: '0.82rem', padding: '0.4rem 0.75rem 0.4rem 2.1rem' }}
                placeholder="Search market code or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={loadMarkets}
              disabled={loading || marketsLoading}
              title="Refresh market list"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                style={{ animation: (loading || marketsLoading) ? 'spin 0.7s linear infinite' : 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Market Name</th>
                <th>Posts</th>
                <th>Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {search ? 'No markets match your search' : 'No markets found'}
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      {search ? 'Try a different keyword' : 'Markets will appear here once added'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((market) => (
                  <tr key={market.code}>
                    {/* Code */}
                    <td>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: 8,
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                        fontFamily: 'monospace',
                      }}>
                        {market.code.slice(0, 2)}
                      </div>
                    </td>

                    {/* Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{market.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {market.code}
                      </div>
                    </td>

                    {/* Posts */}
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: '#ecfeff', color: '#0891b2',
                        padding: '0.2rem 0.6rem', borderRadius: 6,
                        fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        📄 {(market.post_count || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Comments */}
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: '#f0fdf4', color: '#16a34a',
                        padding: '0.2rem 0.6rem', borderRadius: 6,
                        fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        💬 {(market.comment_count || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Delete */}
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        onClick={() => setConfirmMarket(market)}
                        title={`Delete ${market.name}`}
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.8rem', color: 'var(--text-muted)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Showing {filtered.length} of {markets.length} markets</span>
            {search && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setSearch('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmMarket && (
        <ConfirmDeleteModal
          market={confirmMarket}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setConfirmMarket(null)}
          deleting={deleting}
        />
      )}

      {/* Spin keyframe for refresh icon */}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
}
