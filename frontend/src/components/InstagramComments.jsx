import React from 'react';
import promoImage from '../assets/insta.jpg';

const SENTIMENT_COLORS = {
  Positive: 'bg-[#4de79e] text-[#0b1d3d]',
  Neutral:  'bg-[#fbbf24] text-[#0b1d3d]',
  Negative: 'bg-[#ef4444] text-white',
};

const InstagramComments = ({ comments }) => {
  const totalLikes    = comments.filter(c => c.Sentiment === 'Positive').length * 26;
  const totalComments = comments.length;
  const totalShares   = Math.floor(comments.length * 3.25);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">

      {/* Spacer to align with FB card's "Sample Comments" heading */}
      <div className="h-[36px] mb-4" />

      {/* Instagram Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-8 h-8 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        <span className="font-semibold text-gray-800">Instagram</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

        {/* Left: Post image + dark action bar */}
        <div className="flex flex-col">
          <div className="overflow-hidden border border-gray-100 aspect-square">
            <img src={promoImage} alt="IG Post" className="w-full h-full object-cover" />
          </div>

          <div className="bg-[#1a1a1a] text-white px-4 py-2 flex justify-between items-center text-lg">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 cursor-pointer">
                🤍 <span className="text-sm">{totalLikes}</span>
              </span>
              <span className="cursor-pointer">💬 <span className="text-sm">{totalComments}</span></span>
              <span className="cursor-pointer">↗️ <span className="text-sm">{totalShares}</span></span>
            </div>
            <span className="cursor-pointer">📌</span>
          </div>
        </div>

        {/* Right: Scrollable comment timeline */}
        <div className="relative pl-2 max-h-[500px] overflow-y-auto pr-2">
          <div className="absolute left-6 top-4 bottom-8 w-[2px] bg-gray-100 z-0" />

          <div className="flex flex-col gap-4 relative z-10">
            {comments.map((comment, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-[#E4405F] flex-shrink-0 mt-1 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-[10px] font-bold text-white">
                    {comment['Comment Text'].charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="bg-[#f0f2f5] px-3 py-2 rounded-2xl rounded-tl-sm text-[13px] text-gray-800 max-w-[90%]">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-1 ${SENTIMENT_COLORS[comment.Sentiment]}`}>
                    {comment.Sentiment}
                  </span>
                  <span className="leading-tight">{comment['Comment Text']}</span>
                  <span className="block text-[10px] text-gray-400 mt-1">{comment.Date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstagramComments;
