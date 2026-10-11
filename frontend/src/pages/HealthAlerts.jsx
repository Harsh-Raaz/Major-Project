import { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useHealthNews } from '../hooks/useHealthNews';

function relativeDate(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60000) return 'Just now';
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  if (elapsed < 3600000) return formatter.format(-Math.floor(elapsed / 60000), 'minute');
  if (elapsed < 86400000) return formatter.format(-Math.floor(elapsed / 3600000), 'hour');
  return formatter.format(-Math.floor(elapsed / 86400000), 'day');
}

export default function HealthAlerts() {
  const { news, loading } = useHealthNews();
  const [selectedDisease, setSelectedDisease] = useState('All');
  const items = news?.items || [];
  const diseases = [...new Set(items.map((item) => item.disease).filter(Boolean))].sort();
  const activeDisease = diseases.includes(selectedDisease) ? selectedDisease : 'All';
  const filtered = activeDisease === 'All' ? items : items.filter((item) => item.disease === activeDisease);

  return (
    <AppLayout>
      <section className="animate-fade-up">
        <p className="cc-eyebrow">Community health</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[#0A1628] md:text-4xl">Health Alerts for Bengaluru</h1>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">● LIVE</span>
        </div>
        <p className="mt-3 text-slate-600">Latest public health news for the city, updated automatically.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter news by disease">
          {['All', ...diseases].map((disease) => (
            <button key={disease} type="button" aria-pressed={activeDisease === disease} onClick={() => setSelectedDisease(disease)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${activeDisease === disease
                ? 'bg-[#0A1628] text-white shadow-md'
                : 'border border-[rgba(0,184,169,0.15)] bg-white text-slate-700 hover:bg-[#F0FDF9]'}`}>
              {disease}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Health news headlines" aria-busy={loading}>
        {loading ? (
          <>
            <span className="sr-only" role="status">Loading health news</span>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="cc-surface animate-pulse p-6" aria-hidden="true">
                <div className="h-5 w-20 rounded-full bg-emerald-50" />
                <div className="mt-4 h-6 w-full rounded bg-slate-100" />
                <div className="mt-2 h-6 w-3/4 rounded bg-slate-100" />
                <div className="mt-5 h-4 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </>
        ) : news?.status === 'unavailable' ? (
          <p className="cc-surface p-8 text-center text-slate-600 md:col-span-2" role="status">News is temporarily unavailable. Please try again later.</p>
        ) : !filtered.length ? (
          <p className="cc-surface p-8 text-center text-slate-600 md:col-span-2" role="status">No recent health news for Bengaluru.</p>
        ) : filtered.map((item) => (
          <article key={item.link} className="cc-surface flex flex-col p-5 md:p-6">
            {item.disease && <span className="mb-3 self-start rounded-full bg-[#E5FAF6] px-2.5 py-1 text-xs font-semibold capitalize text-[#008F83]">{item.disease}</span>}
            <h2 className="font-display text-lg font-semibold leading-relaxed text-[#0A1628]">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="rounded-sm underline-offset-4 hover:text-[#008F83] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B8A9]">{item.title}</a>
            </h2>
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-sm text-slate-500">
              <span className="font-medium">{item.source || 'Source unavailable'}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.published_at} title={new Date(item.published_at).toLocaleString('en-IN')}>{relativeDate(item.published_at)}</time>
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-8 border-t border-[rgba(0,184,169,0.15)] pt-5 text-xs leading-relaxed text-slate-500">
        Headlines via Google News. CrowdCare does not verify these reports. This page is for awareness only and is not medical advice. In an emergency, go to the nearest hospital.
      </footer>
    </AppLayout>
  );
}
