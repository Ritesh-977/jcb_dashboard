import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useCampaign } from '../context/CampaignContext';

const NAV_ITEMS = [
  { to: '/',          label: 'Campaign Overview',  permission: 'view_kpi',       icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0H4" /></svg> },
  { to: '/sentiment', label: 'Sentiment Analysis', permission: 'view_sentiment', icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { to: '/comments',  label: 'Comments',           permission: 'view_comments',  icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.1-.9 2-2 2H7l-4 4V6a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg> },
  { to: '/trend',     label: 'Sentiment Trend',    permission: 'view_trend',     icon: <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, auth } = useAuth();
  const { market, setMarket, markets } = useMarket();
  const { campaign, setCampaign, campaigns } = useCampaign();
  const permissions = auth?.permissions ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`bg-[#0b1d3d] text-white flex flex-col transition-all duration-300 h-full ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <span className="text-sm font-bold tracking-wide text-white truncate">JCB Dashboard</span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-white/10 transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Market Selector */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/10">
          <label className="block text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1.5">Market</label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="w-full bg-white/10 text-white text-xs rounded-md px-2 py-1.5 outline-none border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            style={{ color: 'white' }}
          >
            <option value="" style={{ backgroundColor: '#fff', color: '#1f2937' }}>All Markets</option>
            {markets.map((m) => (
              <option key={m.code || m} value={m.code || m} style={{ backgroundColor: '#fff', color: '#1f2937' }}>
                {m.name || m} ({m.code || m})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Campaign Selector */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/10">
          <label className="block text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1.5">Campaign</label>
          <select
            value={campaign || ''}
            onChange={(e) => setCampaign(e.target.value)}
            className="w-full bg-white/10 text-white text-xs rounded-md px-2 py-1.5 outline-none border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            style={{ color: 'white' }}
            disabled={campaigns.length === 0}
          >
            <option value="" style={{ backgroundColor: '#fff', color: '#1f2937' }}>All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={String(c.id)} style={{ backgroundColor: '#fff', color: '#1f2937' }}>
                {c.name}
              </option>
            ))}
          </select>
          {campaigns.length === 0 && market && (
            <div className="text-[9px] text-blue-200 mt-1 opacity-70">No campaigns for this market</div>
          )}
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ to, label, icon, permission }) => {
          const allowed = permissions.includes(permission);
          return allowed ? (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#2bb5e8] text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {icon}
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ) : (
            <div
              key={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed"
              style={{ color: '#4b5563', opacity: 0.5 }}
              title="You don't have permission to access this page"
            >
              {icon}
              {!collapsed && <span className="truncate">{label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Change Password + Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={() => navigate('/change-password')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          {!collapsed && <span className="truncate">Change Password</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
