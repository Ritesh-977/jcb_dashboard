import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SCROLL_THRESHOLD = 20; // data points before we enable scrolling
const PX_PER_POINT = 40;     // minimum pixels per data point

const ChartSection = ({ chartData }) => {
  const hasData = chartData && chartData.length > 0 && chartData.some(d => d.likes > 0 || d.comments > 0 || d.shares > 0);
  const needsScroll = chartData.length > SCROLL_THRESHOLD;
  const minWidth = needsScroll ? chartData.length * PX_PER_POINT : undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-300">
      <h3 className="text-center text-xs md:text-sm font-bold text-gray-600 mb-4 md:mb-6">Engagement Metric Trend</h3>
      {!hasData ? (
        <div className="h-[200px] md:h-[250px] flex items-center justify-center text-gray-400 text-sm">
          No data available for the selected date range.
        </div>
      ) : (
        <>
          <div
            className="h-[200px] md:h-[250px] w-full"
            style={{
              overflowX: needsScroll ? 'auto' : 'visible',
              overflowY: 'hidden',
            }}
          >
            <div style={{ width: '100%', minWidth: minWidth, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#6b7280' }} dx={-10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="likes" stackId="1" stroke="#093963" fill="#093963" fillOpacity={1} />
                  <Area type="monotone" dataKey="comments" stackId="1" stroke="#2cbef0" fill="#2cbef0" fillOpacity={1} />
                  <Area type="monotone" dataKey="shares" stackId="1" stroke="#56e0a8" fill="#56e0a8" fillOpacity={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-4 md:mt-6 text-[10px] md:text-xs text-gray-600">
            <div className="flex items-center gap-1.5 md:gap-2"><span className="w-2 h-2 md:w-3 md:h-3 bg-[#093963]"></span>Likes</div>
            <div className="flex items-center gap-1.5 md:gap-2"><span className="w-2 h-2 md:w-3 md:h-3 bg-[#2cbef0]"></span>Comments</div>
            <div className="flex items-center gap-1.5 md:gap-2"><span className="w-2 h-2 md:w-3 md:h-3 bg-[#56e0a8]"></span>Shares</div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartSection;
