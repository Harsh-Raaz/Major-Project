import { useHealthTrends } from '../hooks/useHealthTrends';

const tierStyles = {
  high: 'bg-red-100 text-red-700',
  elevated: 'bg-amber-100 text-amber-800',
  watch: 'bg-[#E5FAF6] text-[#008F83]',
};

export default function HealthTrendsPanel() {
  const trends = useHealthTrends();
  return (
    <section className="cc-surface p-5 md:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-xl font-semibold text-[#0A1628]">Live Community Health Alerts</h3>
        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">● LIVE</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">Current 7 days vs previous 8-week average, from CrowdCare bookings and symptom searches</p>
      <div className="mt-4 grid gap-3">
        {!trends ? <p className="text-sm text-slate-500">Checking community demand…</p>
          : trends.baseline_status === 'unavailable' ? <p className="text-sm text-slate-500">Community health alerts are temporarily unavailable.</p>
          : trends.baseline_status === 'insufficient' ? <p className="text-sm text-slate-500">Collecting baseline. Alerts start once 4 weeks of data exist.</p>
          : !trends.alerts?.length ? <p className="text-sm text-slate-500">No unusual spikes this week.</p> : null}
        {(trends?.alerts || []).map((alert) => (
          <article key={`${alert.type}:${alert.name}`} className="rounded-2xl border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-[#0A1628]">{alert.name}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">{alert.type === 'department' ? 'Department' : 'Symptom'}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierStyles[alert.tier] || tierStyles.watch}`}>{alert.tier}</span>
              <span className="text-slate-600">+{alert.pct_change}% vs avg ({alert.current} vs {alert.baseline_avg})</span>
              {alert.seasonal_match && <span className="rounded-full bg-[#E5FAF6] px-2 py-0.5 text-xs text-[#008F83]">Seasonal pattern</span>}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{alert.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
