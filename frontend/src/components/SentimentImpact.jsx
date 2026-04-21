import React from 'react';

const WordCloud = ({ words }) => (
  <div className="flex flex-wrap justify-center items-center gap-x-2 md:gap-x-4 gap-y-2 max-w-sm text-center leading-none">
    {words.map((word, idx) => (
      <span
        key={idx}
        className={`${word.color} ${word.size} font-bold tracking-tight inline-block hover:scale-110 transition-transform cursor-default`}
      >
        {word.text}
      </span>
    ))}
  </div>
);

const SentimentImpact = ({ positiveWords, negativeWords }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-300 mt-4 md:mt-6">
    <h3 className="text-xs md:text-sm font-bold text-gray-600 mb-4 md:mb-6">Sentiments Impact Analysis</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative">
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px border-r border-dashed border-gray-300" />

      <div className="flex flex-col items-center">
        <div className="bg-[#4de79e] w-full py-1.5 px-3 md:px-4 text-center text-xs md:text-sm font-bold text-[#0b1d3d] mb-4 md:mb-8 rounded-sm">
          POSITIVE KEYWORDS
        </div>
        <WordCloud words={positiveWords} />
      </div>

      <div className="flex flex-col items-center">
        <div className="bg-[#ef4444] w-full py-1.5 px-3 md:px-4 text-center text-xs md:text-sm font-bold text-[#0b1d3d] mb-4 md:mb-8 rounded-sm">
          NEGATIVE KEYWORDS
        </div>
        <WordCloud words={negativeWords} />
      </div>
    </div>
  </div>
);

export default SentimentImpact;
