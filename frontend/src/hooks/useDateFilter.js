import { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { useCampaign } from '../context/CampaignContext';

export function useDateFilter() {
  const { market } = useMarket();
  const { campaign } = useCampaign();
  const currentContext = `${market}-${campaign}`;

  const [dateFrom, setDateFrom] = useState(() => {
    const stored = sessionStorage.getItem(`${currentContext}_dateFrom`);
    return stored ? new Date(stored) : null;
  });

  const [dateTo, setDateTo] = useState(() => {
    const stored = sessionStorage.getItem(`${currentContext}_dateTo`);
    return stored ? new Date(stored) : null;
  });

  const [prevContext, setPrevContext] = useState(currentContext);

  if (currentContext !== prevContext) {
    const storedFrom = sessionStorage.getItem(`${currentContext}_dateFrom`);
    const storedTo = sessionStorage.getItem(`${currentContext}_dateTo`);
    setDateFrom(storedFrom ? new Date(storedFrom) : null);
    setDateTo(storedTo ? new Date(storedTo) : null);
    setPrevContext(currentContext);
  }

  const handleDateFromChange = (date) => {
    setDateFrom(date);
    if (date) sessionStorage.setItem(`${currentContext}_dateFrom`, date.toISOString());
    else sessionStorage.removeItem(`${currentContext}_dateFrom`);

    if (dateTo && date > dateTo) {
      setDateTo(null);
      sessionStorage.removeItem(`${currentContext}_dateTo`);
    }
  };

  const handleDateToChange = (date) => {
    if (!dateFrom || date >= dateFrom) {
      setDateTo(date);
      if (date) sessionStorage.setItem(`${currentContext}_dateTo`, date.toISOString());
      else sessionStorage.removeItem(`${currentContext}_dateTo`);
    }
  };

  const clearDates = () => {
    setDateFrom(null);
    setDateTo(null);
    sessionStorage.removeItem(`${currentContext}_dateFrom`);
    sessionStorage.removeItem(`${currentContext}_dateTo`);
  };

  const autoSetDates = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return { dateFrom, handleDateFromChange, dateTo, handleDateToChange, clearDates, autoSetDates };
}
