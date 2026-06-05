import { useState, useEffect, useRef } from 'react';
import SentimentTrendChart from '../components/SentimentTrendChart';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiFetch } from '../api';
import S from '../components/Skeleton';
import { useMarket } from '../context/MarketContext';
import { useCampaign } from '../context/CampaignContext';
import { useDateFilter } from '../hooks/useDateFilter';

export default function TrendDashboard() {
  const today = new Date();
  const [trendData, setTrendData] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [allKeywords, setAllKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dateFrom, handleDateFromChange, dateTo, handleDateToChange, clearDates, autoSetDates } = useDateFilter();
  const { market } = useMarket();
  const { campaign } = useCampaign();

  const handleKeywordToggle = (keyword) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  const [showPositiveDropdown, setShowPositiveDropdown] = useState(false);
  const [showNegativeDropdown, setShowNegativeDropdown] = useState(false);

  useEffect(() => {

    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
        if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
        if (market) params.append('market', market);
        if (campaign) params.append('campaign', campaign);
        const query = params.toString() ? `?${params}` : '';

        const comments = await apiFetch(`/comments/${query}`);

        if (comments.length > 0) {
          const dateObjects = comments.map(c => new Date(c.Date)).filter(d => !isNaN(d));
          if (dateObjects.length > 0) {
            const minDate = new Date(Math.min(...dateObjects));
            const maxDate = new Date(Math.max(...dateObjects));
            
            if (!dateFrom && !dateTo) {
              autoSetDates(minDate, maxDate);
            }
          }
        }

        // Count keyword frequencies
        const keywordCounts = comments.reduce((acc, c) => {
          const tag = c['Keyword Tag'];
          const type = c['Keyword Type'];
          if (tag && type) {
            if (!acc[tag]) acc[tag] = { count: 0, type };
            acc[tag].count++;
          }
          return acc;
        }, {});

        // Get top 2 positive and negative keywords
        const positive = Object.entries(keywordCounts)
          .filter(([_, v]) => v.type === 'Positive')
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 2)
          .map(([k]) => k);
        
        const negative = Object.entries(keywordCounts)
          .filter(([_, v]) => v.type === 'Negative')
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 2)
          .map(([k]) => k);

        const topKeywords = [...positive, ...negative];
        setKeywords(topKeywords);
        setSelectedKeywords(topKeywords);

        // Store all keywords with their types
        const allKw = Object.entries(keywordCounts)
          .map(([k, v]) => ({ keyword: k, type: v.type, count: v.count }))
          .sort((a, b) => b.count - a.count);
        setAllKeywords(allKw);

        const sortedDates = [...new Set(comments.map(c => c.Date))].sort();

        const dailyCounts = sortedDates.map(date => {
          const day = comments.filter(c => c.Date === date);
          const counts = { date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
          allKw.forEach(({ keyword }) => {
            counts[keyword] = day.filter(c => c['Keyword Tag'] === keyword).length;
          });
          return counts;
        });

        setTrendData(dailyCounts.reduce((acc, day) => {
          const prev = acc.at(-1) ?? {};
          const cumulative = { date: day.date };
          allKw.forEach(({ keyword }) => {
            cumulative[keyword] = (prev[keyword] || 0) + day[keyword];
          });
          acc.push(cumulative);
          return acc;
        }, []));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateFrom, dateTo, market, campaign]);

  if (loading) return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center bg-white/50 p-3 md:p-4 rounded-t-xl gap-3 mb-4">
        <S className="h-8 w-56" />
      </div>
      <S className="h-[500px]" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">Error: {error}</div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto pb-10">
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
            <button onClick={clearDates} className="text-gray-400 hover:text-gray-600 text-xs ml-1">✕</button>
          )}
        </div>
      </div>

      {/* Keyword Selection */}
      {allKeywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-300 mb-4">
          <h4 className="text-sm font-bold text-gray-600 mb-3">Select Keywords to Display</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Keywords Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-2">Positive Keywords</label>
              <button
                onClick={() => setShowPositiveDropdown(!showPositiveDropdown)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedKeywords.filter(k => allKeywords.find(kw => kw.keyword === k)?.type === 'Positive').length} selected
                </span>
                <span className="text-gray-400">▼</span>
              </button>
              {showPositiveDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allKeywords.filter(kw => kw.type === 'Positive').map(({ keyword, count }) => (
                    <label
                      key={keyword}
                      className="flex items-center px-3 py-2 hover:bg-green-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(keyword)}
                        onChange={() => handleKeywordToggle(keyword)}
                        className="mr-2 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{keyword}</span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Negative Keywords Dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-2">Negative Keywords</label>
              <button
                onClick={() => setShowNegativeDropdown(!showNegativeDropdown)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedKeywords.filter(k => allKeywords.find(kw => kw.keyword === k)?.type === 'Negative').length} selected
                </span>
                <span className="text-gray-400">▼</span>
              </button>
              {showNegativeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allKeywords.filter(kw => kw.type === 'Negative').map(({ keyword, count }) => (
                    <label
                      key={keyword}
                      className="flex items-center px-3 py-2 hover:bg-red-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(keyword)}
                        onChange={() => handleKeywordToggle(keyword)}
                        className="mr-2 w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{keyword}</span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {trendData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-400 text-sm">
          No data available for the selected date range.
        </div>
      ) : (
        <SentimentTrendChart 
          data={trendData} 
          keywords={allKeywords.filter(k => selectedKeywords.includes(k.keyword))} 
        />
      )}
    </div>
  );
}
