import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, MessageCircle, Share2, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

// --- Skeleton for loading state ---
const InsightSkeleton = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4 min-h-[160px] animate-pulse">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-lg bg-gray-100 w-10 h-10" />
      <div className="h-4 bg-gray-200 rounded w-40" />
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
    </div>
  </div>
);

// --- Individual Insight Card ---
const InsightCard = ({ title, description, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4 min-h-[160px] transition-all hover:shadow-md hover:border-gray-300">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="text-base font-bold text-gray-900 tracking-tight">{title}</div>
    </div>
    <div className="text-sm text-gray-600 leading-relaxed">
      {description}
    </div>
  </div>
);

// --- Helper: parse **bold** markers from AI text into <strong> elements ---
function parseBold(text) {
  if (!text) return text;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong>
      : part
  );
}

// --- Map AI sentiment to icon/color ---
function getIconProps(key, sentiment) {
  const map = {
    passive_insight: {
      positive: { icon: TrendingUp, bg: 'bg-teal-50', color: 'text-[#00cba0]' },
      neutral:  { icon: Activity,   bg: 'bg-blue-50', color: 'text-[#2bb5e8]' },
      negative: { icon: Activity,   bg: 'bg-blue-50', color: 'text-[#2bb5e8]' },
    },
    sentiment_insight: {
      positive: { icon: Activity,       bg: 'bg-teal-50',   color: 'text-[#00cba0]' },
      neutral:  { icon: AlertTriangle,  bg: 'bg-yellow-50', color: 'text-[#f9b233]' },
      negative: { icon: AlertTriangle,  bg: 'bg-orange-50', color: 'text-[#f97316]' },
    },
    depth_insight: {
      positive: { icon: Share2,         bg: 'bg-teal-50',   color: 'text-[#00cba0]' },
      neutral:  { icon: MessageCircle,  bg: 'bg-blue-50',   color: 'text-[#2bb5e8]' },
      negative: { icon: MessageCircle,  bg: 'bg-yellow-50', color: 'text-[#f9b233]' },
    },
  };
  return map[key]?.[sentiment] || map[key]?.neutral || { icon: Activity, bg: 'bg-gray-50', color: 'text-gray-500' };
}

// --- Hardcoded fallback logic (existing behavior) ---
function buildFallbackInsights(kpiData, totalLikes, totalComments, totalShares, totalInteractions) {
  const get = (metric) => kpiData?.find((k) => k.Metric === metric)?.Value ?? 0;
  const netSentiment = Math.round(get('Net Sentiment %') * 100);
  const positivePct = Math.round(get('Positive %') * 100);
  const negativePct = Math.round(get('Negative %') * 100);

  const likePct = totalInteractions > 0 ? ((totalLikes / totalInteractions) * 100).toFixed(1) : 0;
  const isHighPassive = likePct > 70;
  const commentPct = totalInteractions > 0 ? ((totalComments / totalInteractions) * 100).toFixed(1) : 0;
  const sharePct = totalInteractions > 0 ? ((totalShares / totalInteractions) * 100).toFixed(1) : 0;
  const isLowDepth = commentPct < 10;
  const isHealthySentiment = netSentiment >= 0;

  return {
    passive_insight: {
      title: isHighPassive ? "Strong Passive Engagement" : "Active Engagement",
      description: isHighPassive
        ? `Likes account for **${likePct}%** of all interactions (**${totalLikes.toLocaleString()}** of **${totalInteractions.toLocaleString()}**), indicating the creative resonated powerfully.`
        : `Likes make up **${likePct}%** of interactions, showing a highly active audience that goes beyond just tapping "like". Users are deeply engaged.`,
      sentiment: isHighPassive ? "positive" : "neutral",
    },
    sentiment_insight: {
      title: isHealthySentiment ? "Healthy Brand Sentiment" : "Brand Sentiment Alert",
      description: isHealthySentiment
        ? `A **${netSentiment > 0 ? '+' : ''}${netSentiment}% net sentiment** with **${positivePct}% positive** vs only **${negativePct}% negative** reflects strong brand affinity.`
        : `A **${netSentiment}% net sentiment** with **${negativePct}% negative** feedback indicates brand challenges. We recommend monitoring comments closely.`,
      sentiment: isHealthySentiment ? "positive" : "negative",
    },
    depth_insight: {
      title: isLowDepth ? "Low Conversational Depth" : "High Conversational Depth",
      description: isLowDepth
        ? `Only **${totalComments.toLocaleString()} comments** (${commentPct}%) and **${totalShares.toLocaleString()} shares** (${sharePct}%) were recorded. Typical for transactional content.`
        : `An impressive **${totalComments.toLocaleString()} comments** (${commentPct}%) and **${totalShares.toLocaleString()} shares** (${sharePct}%) indicate high viral potential.`,
      sentiment: isLowDepth ? "negative" : "positive",
    },
  };
}


// --- Frontend Cache for AI Insights ---
const getInsightsCache = (key) => {
  try { return JSON.parse(sessionStorage.getItem(`ai_insights_${key}`)); }
  catch (e) { return null; }
};
const setInsightsCache = (key, data) => {
  try { sessionStorage.setItem(`ai_insights_${key}`, JSON.stringify(data)); }
  catch (e) {}
};

const CampaignInsights = ({
  kpiData,
  totalLikes = 0,
  totalComments = 0,
  totalShares = 0,
  totalInteractions = 0,
  market,
  campaign,
  dateFrom,
  dateTo,
}) => {
  const [insights, setInsights] = useState(null);
  const [aiSource, setAiSource] = useState(null); // 'cortex' | 'fallback'
  const [aiLoading, setAiLoading] = useState(false);
  const prevParamsRef = useRef('');

  // Fetch AI insights from backend first, fallback if it fails
  useEffect(() => {
    if (!kpiData || kpiData.length === 0 || totalInteractions === 0) return;

    // Build a params key to avoid re-fetching for same filters
    const paramsKey = `${market}-${campaign}-${dateFrom}-${dateTo}-${totalInteractions}`;
    if (paramsKey === prevParamsRef.current) return;
    prevParamsRef.current = paramsKey;

    // 1. Check frontend cache first for instant loading
    const cached = getInsightsCache(paramsKey);
    if (cached) {
      setInsights(cached.insights);
      setAiSource(cached.source);
      setAiLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchInsights = async () => {
      setAiLoading(true);
      setInsights(null); // Clear insights to show skeleton while loading
      setAiSource(null);

      try {
        const params = new URLSearchParams();
        if (market) params.append('market', market);
        if (campaign) params.append('campaign', campaign);
        if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
        if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
        const query = params.toString() ? `?${params}` : '';

        // Race the fetch against a 10-second timeout
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const data = await apiFetch(`/dashboard/insights${query}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (cancelled) return;

        if (data.source === 'cortex' && data.insights) {
          setInsights(data.insights);
          setAiSource('cortex');
          setInsightsCache(paramsKey, { source: 'cortex', insights: data.insights });
        } else {
          // Cortex returned an error (e.g. running locally without Snowflake access)
          const fallback = buildFallbackInsights(kpiData, totalLikes, totalComments, totalShares, totalInteractions);
          setInsights(fallback);
          setAiSource('fallback');
          setInsightsCache(paramsKey, { source: 'fallback', insights: fallback });
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Insights API unavailable, using fallback:', err.message);
          const fallback = buildFallbackInsights(kpiData, totalLikes, totalComments, totalShares, totalInteractions);
          setInsights(fallback);
          setAiSource('fallback');
          setInsightsCache(paramsKey, { source: 'fallback', insights: fallback });
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    const timer = setTimeout(fetchInsights, 600);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [market, campaign, dateFrom, dateTo, totalInteractions, kpiData, totalLikes, totalComments, totalShares]);

  // Nothing to show yet
  if (!kpiData || kpiData.length === 0) return null;

  // Render loading skeleton while fetching AI insights
  if (aiLoading || !insights) {
    return (
      <div className="bg-gray-50/50 rounded-2xl p-6 md:p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-[#00cba0] rounded-full"></div>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Campaign Insights</h3>
          <Loader2 size={18} className="animate-spin text-gray-400 ml-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      </div>
    );
  }

  const insightKeys = ['passive_insight', 'sentiment_insight', 'depth_insight'];

  return (
    <div className="bg-gray-50/50 rounded-2xl p-6 md:p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-[#00cba0] rounded-full"></div>
        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Campaign Insights</h3>
        {aiSource === 'cortex' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00cba0] bg-teal-50 px-2 py-0.5 rounded-full ml-auto">
            <Sparkles size={12} />
            AI Generated
          </span>
        )}
        {aiLoading && <Loader2 size={16} className="animate-spin text-gray-400 ml-1" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {insightKeys.map((key) => {
          const insight = insights[key];
          if (!insight) return null;
          const { icon, bg, color } = getIconProps(key, insight.sentiment);
          return (
            <InsightCard
              key={key}
              title={insight.title}
              description={parseBold(insight.description)}
              icon={icon}
              iconBg={bg}
              iconColor={color}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CampaignInsights;