import React from 'react';
import promoImage from '../assets/promo-image.jpeg';

const SENTIMENT_COLORS = {
  Positive: 'bg-[#4de79e] text-[#0b1d3d]',
  Neutral:  'bg-[#fbbf24] text-[#0b1d3d]',
  Negative: 'bg-[#ef4444] text-white',
};

const FacebookComments = ({ comments }) => {
  const totalLikes    = comments.filter(c => c.Sentiment === 'Positive').length * 26;
  const totalComments = comments.length;
  const totalShares   = Math.floor(comments.length * 3.25);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">
      <h3 className="text-sm font-bold text-gray-600 mb-4">Sample Comments</h3>

      {/* Facebook Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-8 h-8 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="font-semibold text-gray-800">Facebook</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

        {/* Left: Post image + engagement stats */}
        <div className="flex flex-col">
          <div className="rounded-lg overflow-hidden border border-gray-100 mb-3 aspect-[4/5]">
            <img src={promoImage} alt="FB Post" className="w-full h-full object-cover" />
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 py-2 border-b border-gray-100">
            <div className="flex items-center gap-1">
              <span className="text-blue-500 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center">👍</span>
              <span className="text-red-500 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center -ml-2">❤️</span>
              <span className="text-yellow-500 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center -ml-2">😲</span>
              <span className="ml-1">{totalLikes}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{totalComments} 💬</span>
              <span>{totalShares} ↗️</span>
            </div>
          </div>
        </div>

        {/* Right: Scrollable comment timeline */}
        <div className="relative pl-2 max-h-[500px] overflow-y-auto pr-2">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-4 bottom-8 w-[2px] bg-gray-100 z-0" />

          <div className="flex flex-col gap-4 relative z-10">
            {comments.map((comment, index) => (
              <div key={index} className="flex gap-3 items-start">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#0b1d3d] flex-shrink-0 mt-1 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-[10px] font-bold text-white">
                    {comment['Comment Text'].charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Bubble */}
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

export default FacebookComments;
