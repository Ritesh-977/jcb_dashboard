import React from 'react';

const SentimentBreakdowns = ({ totalComments, positives, neutral, negatives }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex flex-col h-full">
    <h3 className="text-xs md:text-sm font-bold text-gray-600 mb-3 md:mb-4">Sentiment Breakdowns</h3>

    <div className="bg-[#0b1d3d] rounded-lg p-3 md:p-4 mb-3 flex items-center gap-2 shadow-sm">
      <span className="text-xl md:text-2xl font-bold text-[#2bb5e8]">{totalComments}</span>
      <span className="text-xs md:text-sm font-semibold text-white">Total Comments</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 flex-1">
      <div className="bg-[#4de79e] rounded-lg p-3 md:p-4 flex flex-col justify-center shadow-sm">
        <span className="text-lg md:text-xl font-bold text-[#0b1d3d]">{positives}</span>
        <span className="text-[10px] md:text-xs font-bold text-[#0b1d3d]">Total Positives</span>
      </div>
      <div className="bg-[#fbbf24] rounded-lg p-3 md:p-4 flex flex-col justify-center shadow-sm">
        <span className="text-lg md:text-xl font-bold text-[#0b1d3d]">{neutral}</span>
        <span className="text-[10px] md:text-xs font-bold text-[#0b1d3d]">Total Neutral</span>
      </div>
      <div className="bg-[#ef4444] rounded-lg p-3 md:p-4 flex flex-col justify-center shadow-sm">
        <span className="text-lg md:text-xl font-bold text-[#0b1d3d]">{negatives}</span>
        <span className="text-[10px] md:text-xs font-bold text-[#0b1d3d]">Total Negative</span>
      </div>
    </div>
  </div>
);

export default SentimentBreakdowns;
