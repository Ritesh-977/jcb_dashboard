import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentTrendChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full min-h-[500px] flex flex-col">
    <h3 className="text-sm font-bold text-gray-600 mb-6">Sentiment Trend</h3>

    <div className="flex-1 flex flex-col lg:flex-row items-stretch w-full">
      {/* Chart */}
      <div className="flex-1 w-full h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="none" vertical={false} stroke="#e2e8f0" />

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

            <Line type="monotone" dataKey="worth"     name="Worth it"  stroke="#42d4f4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="confusing" name="Confusing" stroke="#fbbf24" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Right-side legend */}
      <div className="flex lg:flex-col justify-center gap-6 pt-4 lg:pt-0 lg:pl-6 lg:min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-[3px] bg-[#42d4f4] rounded-full" />
          <span className="text-xs font-bold text-[#42d4f4]">Worth it</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-[3px] bg-[#fbbf24] rounded-full" />
          <span className="text-xs font-bold text-[#fbbf24]">Confusing</span>
        </div>
      </div>
    </div>
  </div>
);

export default SentimentTrendChart;
