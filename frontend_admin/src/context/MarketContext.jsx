import { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch } from '../api';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [markets, setMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsFetched, setMarketsFetched] = useState(false);

  const refreshMarkets = useCallback(async () => {
    setMarketsLoading(true);
    try {
      const data = await apiFetch('/admin/markets');
      setMarkets(data);
      setMarketsFetched(true);
    } catch {
      // silently ignore — consumer handles its own error state
    } finally {
      setMarketsLoading(false);
    }
  }, []);

  return (
    <MarketContext.Provider value={{ markets, marketsLoading, marketsFetched, refreshMarkets, setMarkets }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarkets() {
  return useContext(MarketContext);
}
