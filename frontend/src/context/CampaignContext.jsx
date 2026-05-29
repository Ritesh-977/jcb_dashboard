import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuth } from './AuthContext';
import { useMarket } from './MarketContext';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [campaign, setCampaign] = useState(() => localStorage.getItem('selected_campaign') || '');
  const [campaigns, setCampaigns] = useState([]);
  const { auth } = useAuth();
  const { market } = useMarket();

  const fetchCampaigns = useCallback(async () => {
    if (!auth) return;
    try {
      const params = market ? `?market=${market}` : '';
      const data = await apiFetch(`/dashboard/campaigns${params}`);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  }, [auth, market]);

  useEffect(() => {
    if (!auth) {
      setCampaigns([]);
      return;
    }
    fetchCampaigns();
  }, [auth, fetchCampaigns]);

  useEffect(() => {
    const handleFocus = () => { if (auth) fetchCampaigns(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [auth, fetchCampaigns]);

  // Reset campaign when market changes if selected campaign doesn't belong to new market
  useEffect(() => {
    if (campaign && campaigns.length > 0) {
      const campaignExists = campaigns.some(c => String(c.id) === String(campaign));
      if (!campaignExists) {
        updateCampaign('');
      }
    }
  }, [campaigns, campaign]);

  const updateCampaign = (value) => {
    setCampaign(value);
    if (value) {
      localStorage.setItem('selected_campaign', value);
    } else {
      localStorage.removeItem('selected_campaign');
    }
  };

  return (
    <CampaignContext.Provider value={{ campaign, setCampaign: updateCampaign, campaigns, refreshCampaigns: fetchCampaigns }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  return useContext(CampaignContext);
}
