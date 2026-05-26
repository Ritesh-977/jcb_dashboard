import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentTrendChart = ({ data, keywords = [] }) => {
  const colors = ['#42d4f4', '#10b981', '#fbbf24', '#ef4444'];
  
  return (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-300 h-full min-h-[500px] flex flex-col">
    <h3 className="text-sm font-bold text-gray-600 mb-6">Sentiment Trend</h3>

    {(!data || data.length === 0) ? (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No data available.
      </div>
    ) : (
    <div className="flex-1 flex flex-col lg:flex-row items-stretch w-full">
      {/* Chart */}
      <div className="flex-1 w-full h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="none" vertical={false} stroke="#cbd5e1" />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              angle={-90}
              textAnchor="end"
              dy={10}
              interval={0}
            />

            <YAxis
              domain={[0, 45]}
              ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              dx={-10}
            />

            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {keywords.map((kw, i) => (
              <Line
                key={kw}
                type="monotone"
                dataKey={kw}
                name={kw}
                stroke={colors[i % colors.length]}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Right-side legend */}
      <div className="flex lg:flex-col justify-center gap-6 pt-4 lg:pt-0 lg:pl-6 lg:min-w-[120px]">
        {keywords.map((kw, i) => (
          <div key={kw} className="flex items-center gap-2">
            <div className="w-6 h-[3px] rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-xs font-bold" style={{ color: colors[i % colors.length] }}>{kw}</span>
          </div>
        ))}
      </div>
      </div>
    )}
  </div>
  );
};

export default SentimentTrendChart;
