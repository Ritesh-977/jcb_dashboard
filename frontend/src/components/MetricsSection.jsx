import React from 'react';

const MetricCard = ({ value, label, comparison, valueColor = 'text-[#2bb5e8]' }) => (
  <div className="bg-[#0b1d3d] rounded-lg p-3 md:p-4 text-white flex flex-col gap-2 min-h-[100px] md:min-h-[120px]">
    <div className="text-xs md:text-sm font-semibold">{label}</div>
    <div className={`text-lg md:text-2xl font-bold ${valueColor}`}>{value}</div>
    {comparison && <div className="text-[8px] md:text-[10px] text-[#facc15]">{comparison}</div>}
  </div>
);

const MetricsSection = ({ kpiData, sentimentData }) => {
  const get = (metric) => kpiData.find((k) => k.Metric === metric)?.Value ?? 0;

  const totalLikes = get('Total Likes');
  const totalComments = get('Total Comments');
  const netSentiment = `${Math.round(get('Net Sentiment %') * 100)}%`;
  const positivePct = `${Math.round(get('Positive %') * 100)}%`;
  const negativePct = `${Math.round(get('Negative %') * 100)}%`;

  const totalShares = sentimentData.reduce((sum, row) => sum + (row.Total ?? 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-300 flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2 md:gap-0">
        <h3 className="text-xs md:text-sm font-bold text-gray-600">Key Performance Metrics</h3>
        <select className="border border-gray-300 rounded-md px-2 md:px-3 py-1 text-[10px] md:text-xs text-gray-400 bg-white outline-none w-full sm:w-auto">
          <option>vs B1F1Ramen Kuroda</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        <MetricCard value={totalLikes.toLocaleString()} label="Total Likes" comparison="(+1.6% vs D1F1 Ramen Kuroda)" />
        <MetricCard value={totalComments.toLocaleString()} label="Total Comments" comparison="(+4.5% vs D1F1 Ramen Kuroda)" />
        <MetricCard value={totalShares.toLocaleString()} label="Shares" comparison="(+3.2% vs D1F1 Ramen Kuroda)" />
        <MetricCard value={`+${netSentiment}`} label="Net Sentiment" comparison="(+3.3% vs D1F1 Ramen Kuroda)" valueColor="text-white" />
        <div className="flex flex-col gap-3 min-h-[120px]">
          <div className="bg-[#0b1d3d] rounded-lg p-3 text-white flex-1 flex flex-col justify-center">
            <div className="text-lg font-bold text-[#2bb5e8] leading-tight">{positivePct}</div>
            <div className="text-xs font-semibold leading-tight mb-1">Positive Sentiments</div>
            <div className="text-[9px] text-[#facc15]">(+1.2% vs D1F1 Ramen Kuroda)</div>
          </div>
          <div className="bg-[#0b1d3d] rounded-lg p-3 text-white flex-1 flex flex-col justify-center">
            <div className="text-lg font-bold text-[#2bb5e8] leading-tight">{negativePct}</div>
            <div className="text-xs font-semibold leading-tight mb-1">Negative Sentiments</div>
            <div className="text-[9px] text-[#facc15]">(+5.3% vs D1F1 Ramen Kuroda)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSection;
