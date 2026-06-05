import { useState, useEffect, useRef } from 'react';
import PromoCard from '../components/PromoCard';
import ChartSection from '../components/ChartSection';
import MetricsSection from '../components/MetricsSection';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiFetch } from '../api';
import S from '../components/Skeleton';
import { useMarket } from '../context/MarketContext';
import { useCampaign } from '../context/CampaignContext';
import { useDateFilter } from '../hooks/useDateFilter';

export default function Dashboard() {
  const today = new Date();
  const [chartData, setChartData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [loading, setLoading] = useState(true);     // only true on first mount
  const [error, setError] = useState(null);
  const { dateFrom, handleDateFromChange, dateTo, handleDateToChange, clearDates, autoSetDates } = useDateFilter();
  const [promoPeriod, setPromoPeriod] = useState('Promo Period: 6 May – 29 July');
  const { market } = useMarket();
  const { campaign, campaigns } = useCampaign();

  useEffect(() => {

    const timer = setTimeout(() => {
      const load = async () => {
        try {
          const params = new URLSearchParams();
          if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
          if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
          if (market) params.append('market', market);
          if (campaign) params.append('campaign', campaign);
          const query = params.toString() ? `?${params}` : '';

          const { posts, kpi, sentiment, metrics } = await apiFetch(`/dashboard/all${query}`);

          const grouped = {};
          posts.forEach(p => {
            const key = new Date(p.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' });
            if (!grouped[key]) grouped[key] = { date: key, likes: 0, comments: 0, shares: 0 };
            grouped[key].likes += p.Likes || 0;
            grouped[key].comments += p['Comments Count'] || 0;
            grouped[key].shares += p.Shares || 0;
          });
          setChartData(Object.values(grouped));
          setTotalShares(posts.reduce((sum, p) => sum + (p.Shares || 0), 0));

          if (posts.length > 0) {
            const dateObjects = posts.map(p => new Date(p.Date)).filter(d => !isNaN(d));
            if (dateObjects.length > 0) {
              const minDate = new Date(Math.min(...dateObjects));
              const maxDate = new Date(Math.max(...dateObjects));
              const options = { day: 'numeric', month: 'long' };
              const formatMin = minDate.toLocaleDateString('en-GB', options);
              const formatMax = maxDate.toLocaleDateString('en-GB', options);
              setPromoPeriod(`Promo Period: ${formatMin} – ${formatMax}`);

              if (!dateFrom && !dateTo) {
                autoSetDates(minDate, maxDate);
              }
            }
          } else if (dateFrom || dateTo) {
             const options = { day: 'numeric', month: 'long' };
             const formatMin = dateFrom ? dateFrom.toLocaleDateString('en-GB', options) : '...';
             const formatMax = dateTo ? dateTo.toLocaleDateString('en-GB', options) : '...';
             setPromoPeriod(`Promo Period: ${formatMin} – ${formatMax}`);
          } else {
             setPromoPeriod('Promo Period: N/A');
          }

          setTotalInteractions(metrics.total_engagement);
          setKpiData(kpi);
          setSentimentData(sentiment);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, 400);

    return () => clearTimeout(timer);
  }, [dateFrom, dateTo, market, campaign]);

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
            <div className="bg-[#f97316] text-white text-xs md:text-sm px-2 md:px-4 py-1.5 rounded-full font-medium whitespace-nowrap">
              {promoPeriod}
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
                <button onClick={clearDates} className="text-gray-400 hover:text-gray-600 text-xs ml-1">✕</button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 md:gap-6 w-full sm:w-auto">
            <div className="text-right">
              <span className="text-lg md:text-2xl font-bold text-[#0b1d3d]">{totalInteractions.toLocaleString()}</span>
              <span className="text-[10px] md:text-xs text-gray-500 ml-1 uppercase">Interactions</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4">
          {campaign ? (
            (() => {
              const selectedCampaignObj = campaigns.find(c => String(c.id) === String(campaign));
              return (
                <PromoCard
                  title={selectedCampaignObj?.title || selectedCampaignObj?.name || 'Selected Campaign'}
                  description={selectedCampaignObj?.description || 'No description available for this campaign.'}
                  imageUrl={selectedCampaignObj?.image_url}
                />
              );
            })()
          ) : null}
          <div className={`${campaign ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4`}>
            <ChartSection chartData={chartData} />
            {chartData.length === 0 && (dateFrom || dateTo) ? (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center text-gray-400 text-sm">
                No data available for the selected date range.
              </div>
            ) : (
              <MetricsSection kpiData={kpiData} sentimentData={sentimentData} totalShares={totalShares} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
