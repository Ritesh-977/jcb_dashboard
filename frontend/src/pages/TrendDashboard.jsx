import { useState, useEffect } from 'react';
import SentimentTrendChart from '../components/SentimentTrendChart';
import { apiFetch } from '../api';

export default function TrendDashboard() {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const comments = await apiFetch('/comments/');

        const sortedDates = [...new Set(comments.map(c => c.Date))].sort();

        const dailyCounts = sortedDates.map(date => {
          const day = comments.filter(c => c.Date === date);
          return {
            date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            worth:     day.filter(c => c['Keyword Tag'] === 'Worth it').length,
            confusing: day.filter(c => c['Keyword Tag'] === 'Confusing').length,
          };
        });

        setTrendData(dailyCounts.reduce((acc, day) => {
          const prev = acc.at(-1) ?? { worth: 0, confusing: 0 };
          acc.push({ date: day.date, worth: prev.worth + day.worth, confusing: prev.confusing + day.confusing });
          return acc;
        }, []));

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
    <div className="p-6 max-w-[1400px] mx-auto pb-10">
      <SentimentTrendChart data={trendData} />
    </div>
  );
}
