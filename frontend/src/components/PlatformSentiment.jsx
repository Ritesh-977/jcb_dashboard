import React from 'react';

const PLATFORM_ICONS = {
  Facebook: (
    <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Instagram: (
    <svg className="w-6 h-6 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
};

const StackedBarRow = ({ platform, positivePct, neutralPct, negativePct }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
    <div className="flex items-center gap-2 w-full sm:w-24 md:w-28 shrink-0">
      {PLATFORM_ICONS[platform] ?? null}
      <span className="text-xs font-semibold text-gray-600">{platform}</span>
    </div>
    <div className="flex-1 flex h-4 md:h-6 rounded-sm overflow-hidden text-[8px] md:text-[10px] text-gray-700 font-bold">
      <div style={{ width: `${positivePct}%` }} className="bg-[#4de79e] flex items-center justify-center border-r border-white/20">
        <span className="hidden sm:inline">{positivePct}%</span>
      </div>
      <div style={{ width: `${neutralPct}%` }} className="bg-[#fbbf24] flex items-center justify-center border-r border-white/20">
        <span className="hidden sm:inline">{neutralPct}%</span>
      </div>
      <div style={{ width: `${negativePct}%` }} className="bg-[#ef4444] flex items-center justify-center text-white">
        <span className="hidden sm:inline">{negativePct}%</span>
      </div>
    </div>
  </div>
);

const PlatformSentiment = ({ sentimentData }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-300 flex flex-col h-full">
    <h3 className="text-xs md:text-sm font-bold text-gray-600 mb-4 md:mb-8">Platform Sentiment Distribution</h3>

    <div className="flex flex-col gap-3 md:gap-6 relative">
      <div className="hidden sm:block absolute left-24 md:left-28 top-[-10px] bottom-[-10px] w-px bg-gray-200 z-0" />
      <div className="relative z-10 flex flex-col gap-3 md:gap-6">
        {sentimentData.map((row) => (
          <StackedBarRow
            key={row.Platform}
            platform={row.Platform}
            positivePct={Math.round(row['% Positive'] * 100)}
            neutralPct={Math.round(row['% Neutral'] * 100)}
            negativePct={Math.round(row['% Negative'] * 100)}
          />
        ))}
      </div>
    </div>

    <div className="flex flex-wrap justify-center gap-3 md:gap-6 mt-6 md:mt-10 text-[8px] md:text-[10px] text-gray-600 font-semibold">
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#4de79e] rounded-sm" />Positive</div>
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#fbbf24] rounded-sm" />Neutral</div>
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#ef4444] rounded-sm" />Negative</div>
    </div>
  </div>
);

export default PlatformSentiment;
