import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuth } from './AuthContext';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(() => localStorage.getItem('selected_market') || '');
  const [markets, setMarkets] = useState([]);
  const { auth } = useAuth();

  const fetchMarkets = useCallback(async () => {
    if (!auth) return;
    try {
      const data = await apiFetch('/dashboard/markets');
      setMarkets(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore — auth errors already redirect via apiFetch
    }
  }, [auth]);

  // Fetch on login / auth change
  useEffect(() => {
    if (!auth) {
      setMarkets([]);
      return;
    }
    fetchMarkets();
  }, [auth, fetchMarkets]);

  // Re-fetch when the user switches back to this tab (catches markets added from admin panel)
  useEffect(() => {
    const handleFocus = () => { if (auth) fetchMarkets(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [auth, fetchMarkets]);

  const updateMarket = (value) => {
    setMarket(value);
    if (value) {
      localStorage.setItem('selected_market', value);
    } else {
      localStorage.removeItem('selected_market');
    }
  };

  return (
    <MarketContext.Provider value={{ market, setMarket: updateMarket, markets, refreshMarkets: fetchMarkets }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
