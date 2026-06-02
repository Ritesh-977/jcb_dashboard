import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SentimentBreakdowns from '../components/SentimentBreakdowns';
import PlatformSentiment from '../components/PlatformSentiment';
import SentimentImpact from '../components/SentimentImpact';
import { apiFetch } from '../api';
import S from '../components/Skeleton';
import { useMarket } from '../context/MarketContext';
import { useCampaign } from '../context/CampaignContext';

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
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const { market } = useMarket();
  const { campaign } = useCampaign();

  const handleDateFromChange = (date) => {
    setDateFrom(date);
    if (dateTo && date > dateTo) {
      setDateTo(null);
    }
  };

  const handleDateToChange = (date) => {
    if (!dateFrom || date >= dateFrom) {
      setDateTo(date);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setTotals({ comments: 0, positive: 0, neutral: 0, negative: 0 });
      setSentimentData([]);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
        if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
        if (market) params.append('market', market);
        if (campaign) params.append('campaign', campaign);
        const query = params.toString() ? `?${params}` : '';
        
        const [{ sentiment, kpi }, comments] = await Promise.all([
          apiFetch(`/dashboard/all${query}`),
          apiFetch(`/comments/${query}`),
        ]);

        const getKpi = (metric) => kpi.find((k) => k.Metric === metric)?.Value ?? 0;

        setSentimentData(sentiment);
        setTotals({
          comments: getKpi('Total Comments'),
          positive: getKpi('Positive Comments'),
          neutral:  getKpi('Neutral Comments'),
          negative: getKpi('Negative Comments'),
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
  }, [dateFrom, dateTo, market, campaign]);

  if (loading) return (
    <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <S className="h-64" />
        <S className="h-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
        <S className="h-48" />
        <S className="h-48" />
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">Error: {error}</div>;

  return (
    <div>
      <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
        
        {/* Date Filter Top Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between bg-white/50 p-3 md:p-4 rounded-t-xl gap-3 md:gap-4 mb-4">
          <div className="bg-white border border-gray-300 rounded-md px-2 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 flex gap-2 md:gap-4 items-center relative">
            <div className="relative">
              <DatePicker
                selected={dateFrom}
                onChange={handleDateFromChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="From date"
                className="outline-none bg-transparent text-xs md:text-sm text-gray-600 w-24 pr-6"
                wrapperClassName="w-auto"
                maxDate={dateTo || undefined}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                scrollableYearDropdown
                popperPlacement="bottom-start"
              />
              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">📅</span>
            </div>
            <span className="text-gray-400">–</span>
            <div className="relative">
              <DatePicker
                selected={dateTo}
                onChange={handleDateToChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="To date"
                className="outline-none bg-transparent text-xs md:text-sm text-gray-600 w-24 pr-6"
                wrapperClassName="w-auto"
                minDate={dateFrom || undefined}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                scrollableYearDropdown
                popperPlacement="bottom-start"
              />
              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">📅</span>
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(null); setDateTo(null); }} className="text-gray-400 hover:text-gray-600 text-xs ml-1">✕</button>
            )}
          </div>
        </div>

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
