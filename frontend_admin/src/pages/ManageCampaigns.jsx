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
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignImage, setNewCampaignImage] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editCampaignName, setEditCampaignName] = useState('');
  const [editCampaignTitle, setEditCampaignTitle] = useState('');
  const [editCampaignDescription, setEditCampaignDescription] = useState('');
  const [editCampaignImage, setEditCampaignImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
      const formData = new FormData();
      formData.append('campaign_name', newCampaignName.trim());
      formData.append('market_code', newCampaignMarket);
      if (newCampaignTitle.trim()) formData.append('title', newCampaignTitle.trim());
      if (newCampaignDescription.trim()) formData.append('description', newCampaignDescription.trim());
      if (newCampaignImage) formData.append('image', newCampaignImage);

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/admin/campaigns`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create campaign');
      }

      toast.success(`Campaign "${newCampaignName}" created successfully!`);
      setIsAddModalOpen(false);
      setNewCampaignName('');
      setNewCampaignMarket('');
      setNewCampaignTitle('');
      setNewCampaignDescription('');
      setNewCampaignImage(null);
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = (campaign) => {
    setEditingCampaign(campaign);
    setEditCampaignName(campaign.name || '');
    setEditCampaignTitle(campaign.title || '');
    setEditCampaignDescription(campaign.description || '');
    setEditCampaignImage(null);
    setIsEditModalOpen(true);
  };

  const handleEditCampaign = async (e) => {
    e.preventDefault();
    if (!editCampaignName.trim()) return;

    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append('campaign_name', editCampaignName.trim());
      if (editCampaignTitle.trim()) formData.append('title', editCampaignTitle.trim());
      if (editCampaignDescription.trim()) formData.append('description', editCampaignDescription.trim());
      if (editCampaignImage) formData.append('image', editCampaignImage);

      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/admin/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update campaign');
      }

      toast.success(`Campaign "${editCampaignName}" updated successfully!`);
      setIsEditModalOpen(false);
      setEditingCampaign(null);
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsEditing(false);
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
                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(campaign)}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: 'var(--primary)' }}
                            title="Edit"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
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
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsAddModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem' }}>
            <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span> Add New Campaign</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCampaignTitle}
                  onChange={e => setNewCampaignTitle(e.target.value)}
                  placeholder="e.g. Summer Mega Sale"
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Description</label>
                <textarea
                  className="form-input"
                  value={newCampaignDescription}
                  onChange={e => setNewCampaignDescription(e.target.value)}
                  placeholder="Campaign details..."
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Image</label>
                <div className={`dropzone ${newCampaignImage ? 'dropzone-has-file' : ''}`} style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewCampaignImage(e.target.files[0])}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    title=""
                  />
                  {!newCampaignImage ? (
                    <div className="dropzone-placeholder" style={{ padding: '0.5rem 0' }}>
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15V9m0 0l-3 3m3-3l3 3" /></svg>
                      <div className="dropzone-text" style={{ fontSize: '0.8rem' }}>Click or drag image</div>
                    </div>
                  ) : (
                    <div className="dropzone-file-info" style={{ position: 'relative', zIndex: 10 }}>
                      <div className="dropzone-file-row">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dropzone-filename">{newCampaignImage.name}</div>
                          <div className="dropzone-filesize">{(newCampaignImage.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                          type="button"
                          className="dropzone-remove"
                          onClick={(e) => { e.preventDefault(); setNewCampaignImage(null); }}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
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
                  style={{ minWidth: '120px', justifyContent: 'center' }}
                >
                  {isAdding ? (
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : 'Add Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsEditModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem' }}>
            <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span>✏️ Edit Campaign</span>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={editCampaignName}
                  onChange={e => setEditCampaignName(e.target.value)}
                  placeholder="e.g. Q3 Launch"
                  required
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCampaignTitle}
                  onChange={e => setEditCampaignTitle(e.target.value)}
                  placeholder="e.g. Summer Mega Sale"
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Description</label>
                <textarea
                  className="form-input"
                  value={editCampaignDescription}
                  onChange={e => setEditCampaignDescription(e.target.value)}
                  placeholder="Campaign details..."
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Campaign Image</label>
                <div className={`dropzone ${editCampaignImage ? 'dropzone-has-file' : ''}`} style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditCampaignImage(e.target.files[0])}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    title=""
                  />
                  {!editCampaignImage ? (
                    <div className="dropzone-placeholder" style={{ padding: '0.5rem 0' }}>
                      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15V9m0 0l-3 3m3-3l3 3" /></svg>
                      <div className="dropzone-text" style={{ fontSize: '0.8rem' }}>Click or drag new image to replace existing</div>
                    </div>
                  ) : (
                    <div className="dropzone-file-info" style={{ position: 'relative', zIndex: 10 }}>
                      <div className="dropzone-file-row">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dropzone-filename">{editCampaignImage.name}</div>
                          <div className="dropzone-filesize">{(editCampaignImage.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                          type="button"
                          className="dropzone-remove"
                          onClick={(e) => { e.preventDefault(); setEditCampaignImage(null); }}
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {editingCampaign && editingCampaign.image_url && !editCampaignImage && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    Currently has an image. Uploading a new one will replace it.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditing || !editCampaignName.trim()}
                  style={{ minWidth: '120px', justifyContent: 'center' }}
                >
                  {isEditing ? (
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
