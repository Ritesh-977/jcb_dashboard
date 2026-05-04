import { useState } from 'react';
import Layout from '../components/Layout';

const MARKETS = [
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'US', name: 'United States' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
];
const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

export default function CsvUpload() {
  const [marketCode, setMarketCode] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!marketCode || !file) return;

    setLoading(true);
    setStatus(null);

    const form = new FormData();
    form.append('file', file);
    form.append('targetCountry', marketCode);
    if (campaignName.trim()) {
      form.append('campaignName', campaignName.trim());
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/api/etl/upload-csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Upload failed: ${res.status}`);
      const marketLabel = MARKETS.find(m => m.code === marketCode)?.name || marketCode;
      setStatus({
        type: 'success',
        message: `✓ ${data.rows_processed} rows processed for ${marketLabel} (${marketCode}). Batch: ${data.batch_id}`,
      });
      setFile(null);
      e.target.reset();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="CSV Upload">
      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Upload Campaign CSV</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Select a target market, optionally set a campaign name, then attach the CSV file.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-field">
            <label className="form-label">Target Market <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              className="form-input"
              value={marketCode}
              onChange={(e) => setMarketCode(e.target.value)}
              required
            >
              <option value="">— Select a market —</option>
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code}>{m.name} ({m.code})</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Campaign Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="form-input"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. B1F1 Coffee Bean Q2 2026"
            />
          </div>

          <div className="form-field">
            <label className="form-label">CSV File <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              className="form-input"
              type="file"
              accept=".csv"
              required
              onChange={(e) => setFile(e.target.files[0] || null)}
              style={{ padding: '0.4rem 0.6rem' }}
            />
            {file && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {!marketCode && file && (
            <div className="alert alert-error" style={{ padding: '0.6rem 0.85rem', fontSize: '0.8rem' }}>
              Please select a target market before uploading.
            </div>
          )}

          {status && (
            <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}
              style={{ fontSize: '0.82rem' }}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !marketCode || !file}
            style={{ opacity: (!marketCode || !file) ? 0.5 : 1, cursor: (!marketCode || !file) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Uploading…' : 'Upload & Process'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
