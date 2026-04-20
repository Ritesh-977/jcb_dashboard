import { useState, useEffect } from 'react';
import PromoCard from '../components/PromoCard';
import ChartSection from '../components/ChartSection';
import MetricsSection from '../components/MetricsSection';
import { apiFetch } from '../api';

export default function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [posts, kpi, sentiment] = await Promise.all([
          apiFetch('/dashboard/posts'),
          apiFetch('/dashboard/kpi'),
          apiFetch('/dashboard/sentiment'),
        ]);

        setChartData(posts.map(p => ({
          date: new Date(p.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' }),
          likes: p.Likes,
          comments: p['Comments Count'],
          shares: p.Shares,
        })));

        setTotalInteractions(posts.reduce((sum, p) => sum + p['Total Engagement'], 0));
        setKpiData(kpi);
        setSentimentData(sentiment);
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
      <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between bg-white/50 p-3 md:p-4 rounded-t-xl gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select className="border border-gray-300 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 bg-white outline-none w-full sm:w-auto">
              <option>B1F1Coffee Bean</option>
            </select>
            <div className="bg-[#f97316] text-white text-xs md:text-sm px-2 md:px-4 py-1.5 rounded-full font-medium whitespace-nowrap">
              Promo Period: 6 May – 29 July
            </div>
            <div className="bg-white border border-gray-300 rounded-md px-2 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 flex gap-2 md:gap-4 w-full sm:w-auto">
              <span>06.05.25</span>
              <span className="text-gray-400 hidden md:inline">to</span>
              <span className="text-gray-400 md:hidden">-</span>
              <span>29.07.2025</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 md:gap-6 w-full sm:w-auto">
            <div className="text-right">
              <span className="text-lg md:text-2xl font-bold text-[#0b1d3d]">{totalInteractions.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs text-gray-500 ml-1 uppercase">Interactions</span>
            </div>
            <select className="border border-gray-300 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 bg-white outline-none">
              <option>PH</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4">
          <PromoCard
            title={`"Buy 1 Take 1" Campaign on Tuesdays with Philippines' Coffee Bean & Tea Leaf.`}
            criteria="Criteria: Order 1 regular drink, get another 1 for free with the JCB Credit Card at The Coffee Bean & Tea Leaf."
          />
          <div className="lg:col-span-8 flex flex-col gap-4">
            <ChartSection chartData={chartData} />
            <MetricsSection kpiData={kpiData} sentimentData={sentimentData} />
          </div>
        </div>
      </div>
    </div>
  );
}
