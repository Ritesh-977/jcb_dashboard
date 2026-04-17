import React from 'react';
import SentimentTrendChart from '../components/SentimentTrendChart';
import commentData from '../data/Comment_Data.json';

// --- Derive cumulative trend data from Comment_Data ---
// 1. Collect all unique dates in chronological order
const sortedDates = [...new Set(commentData.map(c => c.Date))].sort();

// 2. For each date, count daily occurrences of each keyword tag
const dailyCounts = sortedDates.map(date => {
  const dayComments = commentData.filter(c => c.Date === date);
  return {
    date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    worth:     dayComments.filter(c => c['Keyword Tag'] === 'Worth it').length,
    confusing: dayComments.filter(c => c['Keyword Tag'] === 'Confusing').length,
  };
});

// 3. Convert to cumulative running totals so the chart shows a meaningful trend
const trendData = dailyCounts.reduce((acc, day) => {
  const prev = acc.at(-1) ?? { worth: 0, confusing: 0 };
  acc.push({
    date:      day.date,
    worth:     prev.worth     + day.worth,
    confusing: prev.confusing + day.confusing,
  });
  return acc;
}, []);

const TrendDashboard = () => (
  <div className="p-6 max-w-[1400px] mx-auto pb-10">
    <SentimentTrendChart data={trendData} />
  </div>
);

export default TrendDashboard;
