import { useEffect, useState } from 'react';
import { getHealthNews } from '../api/healthAlerts';

export function useHealthNews() {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      getHealthNews().then(({ data }) => {
        if (active) setNews(data);
      }).catch(() => {
        if (active) setNews((previous) => previous || { status: 'unavailable', items: [] });
      }).finally(() => {
        if (active) setLoading(false);
      });
    };
    refresh();
    const interval = setInterval(refresh, 30 * 60 * 1000);
    return () => { active = false; clearInterval(interval); };
  }, []);
  return { news, loading };
}
