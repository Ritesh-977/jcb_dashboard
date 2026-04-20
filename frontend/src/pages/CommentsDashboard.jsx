import { useState, useEffect } from 'react';
import FacebookComments from '../components/FacebookComments';
import InstagramComments from '../components/InstagramComments';
import { apiFetch } from '../api';

export default function CommentsDashboard() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState('');
  const [sentiment, setSentiment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (platform) params.append('platform', platform);
        if (sentiment) params.append('sentiment', sentiment);

        const data = await apiFetch(`/comments/?${params}`);
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [platform, sentiment]);

  const fbComments = comments.filter(c => c.Platform === 'Facebook');
  const igComments = comments.filter(c => c.Platform === 'Instagram');

  return (
    <div className="p-6 max-w-[1600px] mx-auto pb-10">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Platforms</option>
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
        </select>

        <select
          value={sentiment}
          onChange={e => setSentiment(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Sentiments</option>
          <option value="Positive">Positive</option>
          <option value="Neutral">Neutral</option>
          <option value="Negative">Negative</option>
        </select>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading comments...</p>}
      {error && <p className="text-red-500 text-sm">Failed to load: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <FacebookComments comments={fbComments} />
          <InstagramComments comments={igComments} />
        </div>
      )}
    </div>
  );
}
