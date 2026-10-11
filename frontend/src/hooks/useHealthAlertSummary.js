import { useEffect, useState } from 'react';
import { getHealthTrends } from '../api/healthTrends';
import { getHealthNews } from '../api/healthAlerts';

// One shared request per document load, including React StrictMode remounts.
let summaryRequest;
const emptySummary = { alert: null, newsItem: null };

function loadSummary() {
  if (!summaryRequest) {
    summaryRequest = Promise.allSettled([getHealthTrends(), getHealthNews()])
      .then(([trendsResult, newsResult]) => {
        const alerts = trendsResult.status === 'fulfilled'
          ? trendsResult.value.data?.alerts || [] : [];
        const departments = alerts.filter((item) => item.type === 'department');
        const alert = departments.find((item) => item.tier === 'high')
          || departments.find((item) => item.tier === 'elevated') || null;
        const items = newsResult.status === 'fulfilled'
          ? newsResult.value.data?.items || [] : [];
        const newsItem = [...items].sort((a, b) =>
          (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0)
        )[0] || null;
        return { alert, newsItem };
      });
  }
  return summaryRequest;
}

export function useHealthAlertSummary() {
  const [summary, setSummary] = useState(emptySummary);
  useEffect(() => {
    let active = true;
    loadSummary().then((result) => {
      if (active) setSummary(result);
    });
    return () => { active = false; };
  }, []);
  return summary;
}
