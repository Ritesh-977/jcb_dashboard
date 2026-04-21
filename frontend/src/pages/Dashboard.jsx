import { useState, useEffect } from 'react';
import PromoCard from '../components/PromoCard';
import ChartSection from '../components/ChartSection';
import MetricsSection from '../components/MetricsSection';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiFetch } from '../api';
import S from '../components/Skeleton';

export default function Dashboard() {
  const today = new Date();
  const [chartData, setChartData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
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

        const [posts, kpi, sentiment] = await Promise.all([
          apiFetch(`/dashboard/posts${query}`),
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
  }, [dateFrom, dateTo]);

  if (loading) return (
    <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white/50 p-3 md:p-4 rounded-t-xl gap-3">
        <div className="flex gap-3 w-full sm:w-auto">
          <S className="h-8 w-36" />
          <S className="h-8 w-44" />
          <S className="h-8 w-56" />
        </div>
        <div className="flex gap-4">
          <S className="h-8 w-24" />
          <S className="h-8 w-12" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4">
        <S className="lg:col-span-4 h-64" />
        <div className="lg:col-span-8 flex flex-col gap-4">
          <S className="h-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <S key={i} className="h-24" />)}
          </div>
        </div>
      </div>
    </div>
  );
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
            <div className="bg-white border border-gray-300 rounded-md px-2 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 flex gap-2 md:gap-4 w-full sm:w-auto items-center relative">
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
            {chartData.length === 0 && (dateFrom || dateTo) ? (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-400 text-sm">
                No data available for the selected date range.
              </div>
            ) : (
              <MetricsSection kpiData={kpiData} sentimentData={sentimentData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
