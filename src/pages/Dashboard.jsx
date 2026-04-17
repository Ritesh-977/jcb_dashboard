import React from 'react';
import PromoCard from '../components/PromoCard';
import ChartSection from '../components/ChartSection';
import MetricsSection from '../components/MetricsSection';

import postData from '../data/Post_Data.json';
import kpiData from '../data/KPI_Summary.json';
import sentimentData from '../data/Overall_Sentiment.json';

// Aggregate Post_Data by date into chart-friendly shape
const chartData = postData.map((post) => ({
  date: new Date(post.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' }),
  likes: post.Likes,
  comments: post['Comments Count'],
  shares: post.Shares,
}));

const totalInteractions = postData.reduce((sum, p) => sum + p['Total Engagement'], 0);

const Dashboard = () => (
  <div>
    <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between bg-white/50 p-3 md:p-4 rounded-t-xl gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <select className="border border-gray-300 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 bg-white outline-none w-full sm:w-auto">
            <option>B1F1Coffee Bean</option>
          </select>
          <div className="bg-[#f97316] text-white text-xs md:text-sm px-2 md:px-4 py-1.5 rounded-full font-medium whitespace-nowrap">
            Promo Period: 6 May – 29 July
          </div>
          <div className="bg-white border border-gray-300 rounded-md px-2 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 flex gap-2 md:gap-4 w-full sm:w-auto">
            <span>06.05.25</span>
            <span className="text-gray-400 hidden md:inline">to</span>
            <span className="text-gray-400 md:hidden">-</span>
            <span>29.07.2025</span>
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

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4">
        <PromoCard
          title={`"Buy 1 Take 1" Campaign on Tuesdays with Philippines' Coffee Bean & Tea Leaf.`}
          criteria="Criteria: Order 1 regular drink, get another 1 for free with the JCB Credit Card at The Coffee Bean & Tea Leaf."
        />

        <div className="lg:col-span-8 flex flex-col gap-4">
          <ChartSection chartData={chartData} />
          <MetricsSection kpiData={kpiData} sentimentData={sentimentData} />
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
