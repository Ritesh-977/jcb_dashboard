import { useState, useEffect } from 'react';
import SentimentBreakdowns from '../components/SentimentBreakdowns';
import PlatformSentiment from '../components/PlatformSentiment';
import SentimentImpact from '../components/SentimentImpact';
import { apiFetch } from '../api';

const SIZE_SCALE = (count) => {
  if (count >= 5) return 'text-5xl';
  if (count >= 4) return 'text-3xl';
  if (count >= 3) return 'text-2xl';
  if (count >= 2) return 'text-xl';
  return 'text-base';
};

const POSITIVE_COLORS = ['text-[#0ea5e9]', 'text-[#22c55e]', 'text-[#f97316]', 'text-[#dc2626]', 'text-[#ec4899]'];
const NEGATIVE_COLORS = ['text-[#dc2626]', 'text-[#f97316]', 'text-[#16a34a]', 'text-[#eab308]', 'text-[#0ea5e9]'];

export default function SentimentDashboard() {
  const [sentimentData, setSentimentData] = useState([]);
  const [positiveWords, setPositiveWords] = useState([]);
  const [negativeWords, setNegativeWords] = useState([]);
  const [totals, setTotals] = useState({ comments: 0, positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sentiment, comments] = await Promise.all([
          apiFetch('/dashboard/sentiment'),
          apiFetch('/comments/'),
        ]);

        setSentimentData(sentiment);
        setTotals({
          comments: sentiment.reduce((s, r) => s + r.Total, 0),
          positive: sentiment.reduce((s, r) => s + r.Positive, 0),
          neutral:  sentiment.reduce((s, r) => s + r.Neutral, 0),
          negative: sentiment.reduce((s, r) => s + r.Negative, 0),
        });

        const tagCounts = comments.reduce((acc, c) => {
          acc[c['Keyword Tag']] = (acc[c['Keyword Tag']] ?? 0) + 1;
          return acc;
        }, {});

        setPositiveWords([...new Map(
          comments.filter(c => c['Keyword Type'] === 'Positive').map(c => [c['Keyword Tag'], c])
        ).values()].map((c, i) => ({
          text: c['Keyword Tag'],
          size: SIZE_SCALE(tagCounts[c['Keyword Tag']]),
          color: POSITIVE_COLORS[i % POSITIVE_COLORS.length],
        })));

        setNegativeWords([...new Map(
          comments.filter(c => c['Keyword Type'] === 'Negative').map(c => [c['Keyword Tag'], c])
        ).values()].map((c, i) => ({
          text: c['Keyword Tag'],
          size: SIZE_SCALE(tagCounts[c['Keyword Tag']]),
          color: NEGATIVE_COLORS[i % NEGATIVE_COLORS.length],
        })));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-gray-500 text-sm">Loading...</div>;
  if (error) return <div className="p-8 text-red-500 text-sm">Error: {error}</div>;

  return (
    <div>
      <div className="p-3 md:p-6 max-w-[1400px] mx-auto mt-2 md:mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SentimentBreakdowns
            totalComments={totals.comments}
            positives={totals.positive}
            neutral={totals.neutral}
            negatives={totals.negative}
          />
          <PlatformSentiment sentimentData={sentimentData} />
        </div>
        <SentimentImpact positiveWords={positiveWords} negativeWords={negativeWords} />
      </div>
    </div>
  );
}
