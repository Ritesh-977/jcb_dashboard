import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from './AuthContext';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(() => localStorage.getItem('selected_market') || '');
  const [markets, setMarkets] = useState([]);
  const { auth } = useAuth();

  // Re-fetch markets whenever auth changes (e.g. after login)
  useEffect(() => {
    if (!auth) {
      setMarkets([]);
      return;
    }
    apiFetch('/dashboard/markets')
      .then((data) => setMarkets(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [auth]);

  const updateMarket = (value) => {
    setMarket(value);
    if (value) {
      localStorage.setItem('selected_market', value);
    } else {
      localStorage.removeItem('selected_market');
    }
  };

  return (
    <MarketContext.Provider value={{ market, setMarket: updateMarket, markets }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
