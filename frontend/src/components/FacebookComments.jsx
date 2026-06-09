import React, { useState, useEffect, useRef } from 'react';

const SENTIMENT_COLORS = {
  Positive: 'bg-[#4de79e] text-[#0b1d3d]',
  Neutral: 'bg-[#fbbf24] text-[#0b1d3d]',
  Negative: 'bg-[#ef4444] text-white',
};

const FacebookComments = ({ comments, postLink }) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const containerRef = useRef(null);

  // Parse and clean link to standard post URL
  const getCleanLink = (link) => {
    if (!link) return null;
    
    // Convert mobile Facebook links to standard desktop links. 
    // m.facebook.com strictly blocks iframes with X-Frame-Options: DENY!
    let cleanLink = link.replace('//m.facebook.com', '//www.facebook.com');

    // Supports both standard links and API underscore IDs
    const match = cleanLink.match(/\/posts\/(\d+)_(\d+)/);
    if (match) {
      const pageId = match[1];
      const postId = match[2];
      cleanLink = `https://www.facebook.com/${pageId}/posts/${postId}`;
    }
    return cleanLink;
  };

  const cleanLink = getCleanLink(postLink);

  useEffect(() => {
    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        setSdkLoaded(true);
      };

      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (sdkLoaded && window.FB && cleanLink && containerRef.current) {
      // Small timeout ensures React has attached the DOM node before FB parses it
      setTimeout(() => {
        if (window.FB.XFBML && containerRef.current) {
          window.FB.XFBML.parse(containerRef.current);
        }
      }, 50);
    }
  }, [cleanLink, sdkLoaded]);

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

      {(!comments || comments.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">
          No data available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

          {/* Left Side: Iframe Embed with Fail-Safe Fallback */}
          <div className="flex flex-col">
            {cleanLink ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg overflow-hidden border-2 border-[#1877F2] mb-3 bg-white min-h-[450px] flex justify-center w-full relative">

                  {/* 1. The Real Iframe (Hitting the powerful Python proxy) */}
                  <iframe
                    src={`/api/fb-proxy?href=${encodeURIComponent(cleanLink)}`}
                    width="100%"
                    height="450"
                    style={{ border: 'none' }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    title="Facebook Post"
                  />

                  {/* 2. Pure CSS Overlay Fallback Hint (Ensures usability no matter what) */}
                  <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-6 text-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200 bg-opacity-95">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Security or Privacy Restriction?</p>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">
                      If the live post isn't appearing due to browser tracking protections, view it securely in a new tab.
                    </p>
                    <a
                      href={cleanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto px-4 py-2 bg-[#1877F2] text-white text-xs font-bold rounded-lg shadow hover:bg-blue-600 transition-colors"
                    >
                      View Live Post
                    </a>
                  </div>

                </div>
                <a href={postLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline text-center">
                  Open post in new tab →
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-gray-200 rounded-lg p-8 text-gray-400 mb-3 h-[450px]">
                <p className="text-sm font-medium">Select a Facebook post to view</p>
              </div>
            )}
          </div>

          {/* Right Side: Scrollable comment timeline */}
          <div className="relative pl-2 max-h-[450px] overflow-y-auto pr-2 overflow-x-hidden">
            <div className="absolute left-6 top-4 bottom-8 w-[2px] bg-gray-100 z-0" />
            <div className="flex flex-col gap-4 relative z-10">
              {comments.map((comment, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#0b1d3d] flex-shrink-0 mt-1 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-[10px] font-bold text-white">
                      {comment['Comment Text'] ? comment['Comment Text'].charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="bg-[#f0f2f5] px-3 py-2 rounded-2xl rounded-tl-sm text-[13px] text-gray-800 max-w-[calc(100%-3rem)] break-words">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-1 ${SENTIMENT_COLORS[comment.Sentiment] || 'bg-gray-200'}`}>
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
      )}
    </div>
  );
};

export default FacebookComments;