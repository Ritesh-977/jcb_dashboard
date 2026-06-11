import React, { useState, useMemo } from 'react';
import { ExternalLink, Link as LinkIcon, Check, MessageCircle, TrendingUp } from 'lucide-react';

const PLATFORM_CONFIG = {
    facebook: {
        name: 'Facebook',
        color: '#1877F2',
        gradient: 'from-[#1877F2] to-[#0a5dc7]',
        bgTint: 'bg-blue-50',
        borderTint: 'border-blue-100',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    instagram: {
        name: 'Instagram',
        color: '#E4405F',
        gradient: 'from-[#833AB4] via-[#E4405F] to-[#F77737]',
        bgTint: 'bg-pink-50',
        borderTint: 'border-pink-100',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
};

// Extract a friendly post identifier from URL
const getPostIdentifier = (url, platform) => {
    if (!url) return null;
    try {
        if (platform === 'facebook') {
            const m = url.match(/\/posts\/(?:\d+_)?(\d+)/);
            if (m) return `Post #${m[1].slice(-6)}`;
            const pfb = url.match(/\/posts\/(pfbid[\w]+)/);
            if (pfb) return `Post #${pfb[1].slice(-6)}`;
        }
        if (platform === 'instagram') {
            const m = url.match(/\/p\/([\w-]+)/);
            if (m) return `Post #${m[1]}`;
            const reel = url.match(/\/reel\/([\w-]+)/);
            if (reel) return `Reel #${reel[1]}`;
        }
    } catch (e) {
        return null;
    }
    return 'Post';
};

const SocialPostPreview = ({ platform, postLink, comments = [] }) => {
    const [copied, setCopied] = useState(false);
    const config = PLATFORM_CONFIG[platform];

    // Compute sentiment breakdown from comments
    const sentimentStats = useMemo(() => {
        const counts = { Positive: 0, Neutral: 0, Negative: 0 };
        comments.forEach((c) => {
            if (counts[c.Sentiment] !== undefined) counts[c.Sentiment]++;
        });
        const total = comments.length || 1;
        return {
            counts,
            percentages: {
                Positive: Math.round((counts.Positive / total) * 100),
                Neutral: Math.round((counts.Neutral / total) * 100),
                Negative: Math.round((counts.Negative / total) * 100),
            },
            dominant: Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0],
        };
    }, [comments]);

    // Latest comment date
    const latestDate = useMemo(() => {
        if (!comments.length) return null;
        const sorted = [...comments].sort((a, b) => new Date(b.Date) - new Date(a.Date));
        return sorted[0].Date;
    }, [comments]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(postLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // ignore
        }
    };

    if (!postLink) {
        return (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 h-[500px] bg-gray-50/50">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-20 flex items-center justify-center mb-4`}>
                    <div className="w-10 h-10 text-white">{config.icon}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">No {config.name} post selected</p>
                <p className="text-xs text-gray-500 mt-1">Choose a post from the dropdown above</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${config.gradient} px-5 py-4 text-white relative overflow-hidden`}>
                {/* Decorative circle */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-6 h-6">{config.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                            {config.name} Post
                        </p>
                        <p className="text-sm font-bold truncate">
                            {getPostIdentifier(postLink, platform)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
                {/* Engagement summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl ${config.bgTint} border ${config.borderTint} p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4" style={{ color: config.color }} />
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                Comments
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{comments.length}</p>
                        {latestDate && (
                            <p className="text-[10px] text-gray-500 mt-1">Latest: {latestDate}</p>
                        )}
                    </div>

                    <div className={`rounded-xl ${config.bgTint} border ${config.borderTint} p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4" style={{ color: config.color }} />
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                Sentiment
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{sentimentStats.dominant}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            {sentimentStats.percentages[sentimentStats.dominant]}% of comments
                        </p>
                    </div>
                </div>

                {/* Sentiment distribution bar */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            Sentiment Distribution
                        </span>
                        <span className="text-[10px] text-gray-500">{comments.length} total</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                        {sentimentStats.percentages.Positive > 0 && (
                            <div
                                className="bg-[#4de79e] transition-all"
                                style={{ width: `${sentimentStats.percentages.Positive}%` }}
                                title={`Positive: ${sentimentStats.counts.Positive}`}
                            />
                        )}
                        {sentimentStats.percentages.Neutral > 0 && (
                            <div
                                className="bg-[#fbbf24] transition-all"
                                style={{ width: `${sentimentStats.percentages.Neutral}%` }}
                                title={`Neutral: ${sentimentStats.counts.Neutral}`}
                            />
                        )}
                        {sentimentStats.percentages.Negative > 0 && (
                            <div
                                className="bg-[#ef4444] transition-all"
                                style={{ width: `${sentimentStats.percentages.Negative}%` }}
                                title={`Negative: ${sentimentStats.counts.Negative}`}
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#4de79e]" />
                            {sentimentStats.percentages.Positive}% Positive
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                            {sentimentStats.percentages.Neutral}% Neutral
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                            {sentimentStats.percentages.Negative}% Negative
                        </span>
                    </div>
                </div>

                {/* Post URL */}
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Post URL
                    </p>
                    <p className="text-xs text-gray-700 font-mono truncate">{postLink}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                <a
                    href={postLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-bold shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: config.color }}
                >
                    <ExternalLink className="w-4 h-4" />
                    View on {config.name}
                </a>
                <button
                    onClick={handleCopy}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Copy post link"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Copied</span>
                        </>
                    ) : (
                        <>
                            <LinkIcon className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </button>
            </div>
        </div>
    </div >
  );
};

export default SocialPostPreview;