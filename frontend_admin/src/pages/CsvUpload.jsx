import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useMarkets } from '../context/MarketContext';

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

/**
 * Parse CSV headers from a File object (client-side preview).
 * Reads only the first line to extract column names for the preview chips.
 */
function parseHeadersFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstLine = text.split(/\r?\n/)[0] || '';
      const headers = firstLine.split(',').map((h) => h.replace(/^"|"$/g, '').trim()).filter(Boolean);
      resolve(headers);
    };
    reader.readAsText(file);
  });
}

/**
 * Category signature detection (client-side mirror of backend logic).
 * Used purely for preview — the backend does the authoritative detection.
 */
const CATEGORY_SIGNATURES = {
  Posts: ['title', 'detail', 'content', 'link', 'url', 'source', 'publish_date', 'publish date', 'platform', 'sentiment', 'media_type', 'media type'],
  KPIs: ['metric_name', 'metric name', 'metric', 'kpi', 'kpi_name', 'metric_value', 'metric value', 'value', 'kpi_value', 'report_date', 'report date'],
  Comments: ['comment_text', 'comment text', 'comment', 'comment_date', 'comment date', 'keyword_tag', 'keyword tag', 'keyword_type', 'keyword type'],
};

function detectCategoriesClient(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const result = {};
  for (const [cat, sigs] of Object.entries(CATEGORY_SIGNATURES)) {
    const matched = sigs.filter((s) => lower.some((h) => h === s || h.replace(/\s+/g, '_') === s));
    result[cat] = matched.length >= 2;
  }
  return result;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const UploadCloudIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);


export default function CsvUpload() {
  // ── State ──
  const { markets, refreshMarkets, marketsFetched } = useMarkets();
  const [marketCode, setMarketCode] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [detectedCategories, setDetectedCategories] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const fileInputRef = useRef(null);

  // ── Fetch markets on mount ──
  useEffect(() => {
    if (!marketsFetched) refreshMarkets();
  }, [marketsFetched, refreshMarkets]);

  // ── Parse headers when file changes ──
  useEffect(() => {
    if (!file) {
      setCsvHeaders([]);
      setDetectedCategories({});
      return;
    }
    parseHeadersFromFile(file).then((headers) => {
      setCsvHeaders(headers);
      setDetectedCategories(detectCategoriesClient(headers));
    });
  }, [file]);

  // ── Drag & drop handlers ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      setStatus(null);
    } else {
      setStatus({ type: 'error', message: 'Please drop a .csv file' });
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0] || null;
    setFile(selected);
    setStatus(null);
  };

  const clearFile = () => {
    setFile(null);
    setCsvHeaders([]);
    setDetectedCategories({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Upload handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!marketCode || !file) return;

    setLoading(true);
    setStatus(null);
    setUploadProgress(0);

    const form = new FormData();
    form.append('file', file);
    form.append('targetCountry', marketCode);
    if (campaignName.trim()) {
      form.append('campaignName', campaignName.trim());
    }

    // Simulate upload progress (real progress would need XMLHttpRequest)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 200);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/api/etl/upload-csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const detail = typeof data.detail === 'object' ? data.detail.message : (data.detail || `Upload failed: ${res.status}`);
        throw new Error(detail);
      }

      const marketLabel = markets.find((m) => m.code === marketCode)?.name || marketCode;
      const categoriesStr = (data.categories_detected || []).join(', ');

      setStatus({
        type: 'success',
        message: `✓ ${data.rows_processed} rows processed for ${marketLabel}`,
        details: {
          batch: data.batch_id,
          categories: data.categories_detected || [],
          counts: data.category_counts || {},
          columns: data.columns_detected || [],
        },
      });

      // Add to upload history
      setUploadHistory((prev) => [
        {
          id: data.batch_id,
          filename: file.name,
          market: marketLabel,
          marketCode: marketCode,
          rows: data.rows_processed,
          categories: data.categories_detected || [],
          counts: data.category_counts || {},
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 10)); // Keep last 10

      clearFile();
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  };

  const hasDetected = Object.values(detectedCategories).some(Boolean);

  return (
    <Layout title="CSV Upload">
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Main Upload Card ── */}
        <div className="card" style={{ flex: '1 1 480px', maxWidth: 600 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              Upload Campaign CSV
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Select a market, attach a CSV, and the system will auto-detect columns and route data to the correct tables.
              Upload multiple files for the same market to build up data incrementally.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

            {/* Market Dropdown — dynamic from API + predefined */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Market <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                id="csv-market-select"
                className="form-input form-select"
                value={marketCode}
                onChange={(e) => setMarketCode(e.target.value)}
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

            {/* Campaign Name */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Campaign Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="csv-campaign-input"
                className="form-input"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. B1F1 Coffee Bean Q2 2026"
              />
            </div>

            {/* Drag & Drop Zone */}
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="form-label">CSV File <span style={{ color: '#ef4444' }}>*</span></label>
              <div
                id="csv-dropzone"
                className={`dropzone${dragOver ? ' dropzone-active' : ''}${file ? ' dropzone-has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <div className="dropzone-file-info">
                    <div className="dropzone-file-row">
                      <FileIcon />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="dropzone-filename">{file.name}</div>
                        <div className="dropzone-filesize">{(file.size / 1024).toFixed(1)} KB • {csvHeaders.length} columns detected</div>
                      </div>
                      <button
                        type="button"
                        className="dropzone-remove"
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        title="Remove file"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <UploadCloudIcon />
                    <div className="dropzone-text">
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Click to browse</span> or drag & drop
                    </div>
                    <div className="dropzone-hint">CSV files only</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column Preview — shows detected headers & categories */}
            {file && csvHeaders.length > 0 && (
              <div className="column-preview">
                <div className="column-preview-header">
                  <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Column Detection Preview</span>
                </div>
                {/* Category badges */}
                <div className="category-badges">
                  {Object.entries(detectedCategories).map(([cat, detected]) => (
                    <span key={cat} className={`category-badge ${detected ? 'category-badge-active' : 'category-badge-inactive'}`}>
                      {detected ? <CheckCircleIcon /> : <XCircleIcon />}
                      {cat}
                    </span>
                  ))}
                </div>
                {/* Column chips */}
                <div className="column-chips">
                  {csvHeaders.map((h, i) => (
                    <span key={i} className="column-chip">{h}</span>
                  ))}
                </div>
                {!hasDetected && (
                  <div className="column-preview-warning">
                    ⚠ No recognizable categories detected. Check that your CSV headers match expected patterns.
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress Bar */}
            {loading && (
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {/* Validation message */}
            {!marketCode && file && (
              <div className="alert alert-error" style={{ padding: '0.6rem 0.85rem', fontSize: '0.8rem', marginBottom: 0 }}>
                Please select a target market before uploading.
              </div>
            )}

            {/* Status message */}
            {status && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}
                style={{ fontSize: '0.82rem', marginBottom: 0 }}>
                <div>{status.message}</div>
                {status.details && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', opacity: 0.85 }}>
                    <div>Batch: <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>{status.details.batch}</code></div>
                    {Object.entries(status.details.counts).map(([cat, count]) => (
                      <div key={cat}>→ {cat}: {count} rows</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              id="csv-upload-button"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !marketCode || !file}
              style={{ opacity: (!marketCode || !file) ? 0.5 : 1, cursor: (!marketCode || !file) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Processing…' : 'Upload & Process'}
            </button>
          </form>
        </div>

        {/* ── Upload History Sidebar ── */}
        <div className="card" style={{ flex: '1 1 320px', maxWidth: 420 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              Upload History
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              This session's uploads. Each upload appends to existing market data.
            </div>
          </div>

          {uploadHistory.length === 0 ? (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>📂</div>
              No uploads yet this session
            </div>
          ) : (
            <div className="upload-history-list">
              {uploadHistory.map((entry) => (
                <div key={entry.id} className="upload-history-item">
                  <div className="upload-history-top">
                    <div className="upload-history-file">
                      <FileIcon />
                      <span className="upload-history-filename">{entry.filename}</span>
                    </div>
                    <span className="upload-history-time">{entry.time}</span>
                  </div>
                  <div className="upload-history-meta">
                    <span className="badge badge-viewer" style={{ fontSize: '0.68rem' }}>{entry.market}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.rows} rows</span>
                    {entry.categories.map((cat) => (
                      <span key={cat} className="category-badge category-badge-active" style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem' }}>
                        {cat} {entry.counts[cat] !== undefined ? `(${entry.counts[cat]})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}


        </div>

      </div>
    </Layout>
  );
}
