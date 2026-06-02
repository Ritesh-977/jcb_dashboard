import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

export default function ManageCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pendingDeletions = useRef(new Map());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCampaignMarket, setNewCampaignMarket] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  // Cleanup on unmount - execute all pending deletions instantly
  useEffect(() => {
    return () => {
      pendingDeletions.current.forEach((timeoutId, id) => {
        clearTimeout(timeoutId);
        const token = localStorage.getItem('access_token');
        fetch(`${API_BASE}/admin/campaigns/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => { });
      });
      pendingDeletions.current.clear();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch campaigns
      const campaignsRes = await fetch(`${API_BASE}/dashboard/campaigns`, { headers });
      if (!campaignsRes.ok) throw new Error('Failed to fetch campaigns');
      const campaignsData = await campaignsRes.json();

      // Fetch markets
      const marketsRes = await fetch(`${API_BASE}/dashboard/markets`, { headers });
      if (!marketsRes.ok) throw new Error('Failed to fetch markets');
      const marketsData = await marketsRes.json();

      setCampaigns(campaignsData);
      setMarkets(marketsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignMarket || !newCampaignName.trim()) return;

    setIsAdding(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/admin/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          campaign_name: newCampaignName.trim(),
          market_code: newCampaignMarket
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create campaign');
      }

      toast.success(`Campaign "${newCampaignName}" created successfully!`);
      setIsAddModalOpen(false);
      setNewCampaignName('');
      setNewCampaignMarket('');
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (campaignId, campaignName) => {
    if (!confirm(`Are you sure you want to delete campaign "${campaignName}"?\n\nThis will permanently delete all posts, comments, and author data associated with this campaign.`)) {
      return;
    }

    const campaignToDelete = campaigns.find(c => c.id === campaignId);

    // Optimistic local update
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));

    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>Campaign "{campaignName}" deleted.</span>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            undoDelete(campaignToDelete);
          }}
          style={{
            background: '#fff', color: '#dc2626', border: '1px solid #fecaca',
            borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
          }}
        >
          Undo
        </button>
      </div>
    ), { duration: 10000, id: `del-camp-${campaignId}` });

    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/admin/campaigns/${campaignId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to delete campaign');
        }
        pendingDeletions.current.delete(campaignId);
      } catch (err) {
        toast.error(err.message || `Failed to permanently delete campaign ${campaignName}`);
      }
    }, 10000);

    pendingDeletions.current.set(campaignId, timeoutId);
  };

  function undoDelete(campaign) {
    if (!campaign) return;
    const timeoutId = pendingDeletions.current.get(campaign.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pendingDeletions.current.delete(campaign.id);
    }
    setCampaigns(prev => {
      if (prev.some(c => c.id === campaign.id)) return prev;
      const next = [...prev, campaign];
      next.sort((a, b) => a.id - b.id);
      return next;
    });
  }

  const getMarketName = (marketCode) => {
    const market = markets.find(m => m.code === marketCode);
    return market ? `${market.name} (${market.code})` : marketCode;
  };

  if (loading) {
    return (
      <Layout title="Manage Campaigns">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading campaigns...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Manage Campaigns">
        <div className="card" style={{ padding: '2rem' }}>
          <div className="alert alert-error">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Campaigns">
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
      <div className="card">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              Campaign Management
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              View and manage all campaigns across markets. <br />
              Deleting a campaign will permanently delete all associated posts, comments, and data.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            + Add Campaign
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>

          {campaigns.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: '0.9rem' }}>No campaigns found</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Campaigns are created automatically when you upload CSV files with a campaign name.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Campaign ID
                    </th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Campaign Name
                    </th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Market
                    </th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const marketExists = markets.some(m => m.code === campaign.market_code);
                    return (
                      <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {campaign.id}
                        </td>
                        <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>
                          {campaign.name}
                        </td>
                        <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>
                          {marketExists ? (
                            <span className="badge badge-viewer">{getMarketName(campaign.market_code)}</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                              ⚠️ {campaign.market_code} (Market Deleted)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(campaign.id, campaign.name)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Campaign Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', margin: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Campaign</div>
            <form onSubmit={handleAddCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Market <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-input form-select"
                  value={newCampaignMarket}
                  onChange={e => setNewCampaignMarket(e.target.value)}
                  required
                >
                  <option value="">— Select a market —</option>
                  {(() => {
                    const PREDEFINED_MARKETS = [
                      { code: 'PH', name: 'Philippines' },
                      { code: 'US', name: 'United States' },
                      { code: 'JP', name: 'Japan' },
                      { code: 'TH', name: 'Thailand' },
                      { code: 'SG', name: 'Singapore' },
                      { code: 'MY', name: 'Malaysia' },
                      { code: 'ID', name: 'Indonesia' },
                      { code: 'VN', name: 'Vietnam' },
                      { code: 'TW', name: 'Taiwan' },
                      { code: 'HK', name: 'Hong Kong' },
                      { code: 'KR', name: 'South Korea' },
                      { code: 'AU', name: 'Australia' },
                    ];

                    const allMarketsMap = new Map();
                    PREDEFINED_MARKETS.forEach(m => allMarketsMap.set(m.code, m.name));
                    markets.forEach(m => allMarketsMap.set(m.code, m.name));

                    const allMarkets = Array.from(allMarketsMap.entries()).map(([code, name]) => ({ code, name }));
                    allMarkets.sort((a, b) => a.name.localeCompare(b.name));

                    return allMarkets.map((m) => (
                      <option key={m.code} value={m.code}>{m.name} ({m.code})</option>
                    ));
                  })()}
                </select>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder="e.g. Q3 Launch"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAdding || !newCampaignMarket || !newCampaignName.trim()}
                >
                  {isAdding ? 'Adding...' : 'Add Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
