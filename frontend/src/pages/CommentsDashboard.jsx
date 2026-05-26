import { useState, useEffect } from 'react';
import FacebookComments from '../components/FacebookComments';
import InstagramComments from '../components/InstagramComments';
import { apiFetch } from '../api';
import S from '../components/Skeleton';
import { useMarket } from '../context/MarketContext';

export default function CommentsDashboard() {
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [selectedPost, setSelectedPost] = useState('');
  const { market } = useMarket();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams();
        if (platform) params.append('platform', platform);
        if (market) params.append('market', market);
        const data = await apiFetch(`/comments/posts?${params}`);
        console.log('Posts fetched:', data);
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      }
    };
    fetchPosts();
  }, [platform, market]);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (platform) params.append('platform', platform);
        if (sentiment) params.append('sentiment', sentiment);
        if (market) params.append('market', market);
        if (selectedPost) params.append('post_id', selectedPost);

        const data = await apiFetch(`/comments/?${params}`);
        setComments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [platform, sentiment, market, selectedPost]);

  const fbComments = comments.filter(c => c.Platform === 'Facebook');
  const igComments = comments.filter(c => c.Platform === 'Instagram');

  const selectedPostData = posts.find(p => String(p.post_id) === String(selectedPost));
  console.log('Selected post:', selectedPost, 'Post data:', selectedPostData);
  const fbPostLink = selectedPostData?.platform === 'Facebook' ? selectedPostData?.post_link : null;
  const igPostLink = selectedPostData?.platform === 'Instagram' ? selectedPostData?.post_link : null;
  console.log('FB Link:', fbPostLink, 'IG Link:', igPostLink);

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

        <select
          value={selectedPost}
          onChange={e => setSelectedPost(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Posts</option>
          {posts.map(post => (
            <option key={post.post_id} value={post.post_id}>
              {post.platform} - {post.post_id}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <S key={i} className="h-32" />)}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <S key={i} className="h-32" />)}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-sm">Failed to load: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {fbComments.length > 0 && <FacebookComments comments={fbComments} postLink={fbPostLink} />}
          {igComments.length > 0 && <InstagramComments comments={igComments} postLink={igPostLink} />}
        </div>
      )}
    </div>
  );
}
