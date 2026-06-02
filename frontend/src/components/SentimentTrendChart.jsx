import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentTrendChart = ({ data, keywords = [] }) => {
  const positiveColors = ['#10b981', '#34d399', '#059669', '#6ee7b7']; // greens
  const negativeColors = ['#ef4444', '#f87171', '#dc2626', '#fca5a5']; // reds
  
  let posIdx = 0;
  let negIdx = 0;
  
  const styledKeywords = keywords.map(kwObj => {
    // Check if kwObj is a string (fallback) or object
    const type = kwObj.type;
    const keyword = kwObj.keyword || kwObj;
    
    let color = '#64748b';
    let dash = 'none';
    if (type === 'Positive') {
      color = positiveColors[posIdx % positiveColors.length];
      posIdx++;
    } else if (type === 'Negative') {
      color = negativeColors[negIdx % negativeColors.length];
      dash = '5 5';
      negIdx++;
    }
    return { keyword, color, dash };
  });
  
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
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              dx={-10}
            />

            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {styledKeywords.map((kw) => (
              <Line
                key={kw.keyword}
                type="monotone"
                dataKey={kw.keyword}
                name={kw.keyword}
                stroke={kw.color}
                strokeWidth={3}
                strokeDasharray={kw.dash}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Right-side legend */}
      <div className="flex lg:flex-col justify-center gap-6 pt-4 lg:pt-0 lg:pl-6 lg:min-w-[120px]">
        {styledKeywords.map((kw) => (
          <div key={kw.keyword} className="flex items-center gap-2">
            <div 
              className="w-6" 
              style={{ 
                borderTop: `3px ${kw.dash === 'none' ? 'solid' : 'dashed'} ${kw.color}`,
                marginTop: '2px'
              }} 
            />
            <span className="text-xs font-bold" style={{ color: kw.color }}>{kw.keyword}</span>
          </div>
        ))}
      </div>
      </div>
    )}
  </div>
  );
};

export default SentimentTrendChart;
