import React from 'react';
import SentimentBreakdowns from '../components/SentimentBreakdowns';
import PlatformSentiment from '../components/PlatformSentiment';
import SentimentImpact from '../components/SentimentImpact';

import sentimentData from '../data/Overall_Sentiment.json';
import commentData from '../data/Comment_Data.json';

// --- Derive SentimentBreakdowns totals from Overall_Sentiment ---
const totalComments = sentimentData.reduce((s, r) => s + r.Total, 0);
const totalPositives = sentimentData.reduce((s, r) => s + r.Positive, 0);
const totalNeutral = sentimentData.reduce((s, r) => s + r.Neutral, 0);
const totalNegatives = sentimentData.reduce((s, r) => s + r.Negative, 0);

// --- Derive word clouds directly from Comment_Data ---
// Count occurrences of each Keyword Tag per type
const tagCounts = commentData.reduce((acc, c) => {
  const tag = c['Keyword Tag'];
  acc[tag] = (acc[tag] ?? 0) + 1;
  return acc;
}, {});

const SIZE_SCALE = (count) => {
  if (count >= 5) return 'text-5xl';
  if (count >= 4) return 'text-3xl';
  if (count >= 3) return 'text-2xl';
  if (count >= 2) return 'text-xl';
  return 'text-base';
};

const POSITIVE_COLORS = ['text-[#0ea5e9]', 'text-[#22c55e]', 'text-[#f97316]', 'text-[#dc2626]', 'text-[#ec4899]'];
const NEGATIVE_COLORS = ['text-[#dc2626]', 'text-[#f97316]', 'text-[#16a34a]', 'text-[#eab308]', 'text-[#0ea5e9]'];

// Unique positive keyword tags from comments where Keyword Type is Positive
const positiveWords = [...new Map(
  commentData
    .filter(c => c['Keyword Type'] === 'Positive')
    .map(c => [c['Keyword Tag'], c])
).values()].map((c, i) => ({
  text: c['Keyword Tag'],
  size: SIZE_SCALE(tagCounts[c['Keyword Tag']]),
  color: POSITIVE_COLORS[i % POSITIVE_COLORS.length],
}));

// Unique negative keyword tags from comments where Keyword Type is Negative
const negativeWords = [...new Map(
  commentData
    .filter(c => c['Keyword Type'] === 'Negative')
    .map(c => [c['Keyword Tag'], c])
).values()].map((c, i) => ({
  text: c['Keyword Tag'],
  size: SIZE_SCALE(tagCounts[c['Keyword Tag']]),
  color: NEGATIVE_COLORS[i % NEGATIVE_COLORS.length],
}));

const SentimentDashboard = () => (
  <div>
    <div className="p-3 md:p-6 max-w-[1400px] mx-auto mt-2 md:mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SentimentBreakdowns
          totalComments={totalComments}
          positives={totalPositives}
          neutral={totalNeutral}
          negatives={totalNegatives}
        />
        <PlatformSentiment sentimentData={sentimentData} />
      </div>

      <SentimentImpact positiveWords={positiveWords} negativeWords={negativeWords} />
    </div>
  </div>
);

export default SentimentDashboard;
