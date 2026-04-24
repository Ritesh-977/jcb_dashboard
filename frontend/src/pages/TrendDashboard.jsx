import { useState, useEffect } from 'react';
import SentimentTrendChart from '../components/SentimentTrendChart';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiFetch } from '../api';
import S from '../components/Skeleton';

export default function TrendDashboard() {
  const today = new Date();
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dateTo, setDateTo] = useState(today);

  const handleDateFromChange = (date) => {
    setDateFrom(date);
    // If from date is after to date, clear to date
    if (dateTo && date > dateTo) {
      setDateTo(null);
    }
  };

  const handleDateToChange = (date) => {
    // Only allow to date if it's after or equal to from date
    if (!dateFrom || date >= dateFrom) {
      setDateTo(date);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
        if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
        const query = params.toString() ? `?${params}` : '';

        const comments = await apiFetch(`/comments/${query}`);

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
  }, [dateFrom, dateTo]);

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
            <button onClick={() => { setDateFrom(null); setDateTo(null); }} className="text-gray-400 hover:text-gray-600 text-xs ml-1">✕</button>
          )}
        </div>
      </div>
      {trendData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-400 text-sm">
          No data available for the selected date range.
        </div>
      ) : (
        <SentimentTrendChart data={trendData} />
      )}
    </div>
  );
}
