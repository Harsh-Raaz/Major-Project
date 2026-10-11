import { useState } from 'react';
import { AlertTriangle, Siren, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHealthAlertSummary } from '../hooks/useHealthAlertSummary';

const dismissalKey = 'crowdcare_health_alert_dismissed';
const tierStyles = {
  elevated: {
    card: 'bg-amber-50 border-amber-300 border-l-amber-500',
    icon: 'bg-amber-100 text-amber-700',
    label: 'text-amber-800',
  },
  high: {
    card: 'bg-red-50 border-red-300 border-l-red-600',
    icon: 'bg-red-100 text-red-700',
    label: 'text-red-800',
  },
  news: {
    card: 'bg-teal-50 border-teal-300 border-l-[#00B8A9]',
    icon: 'bg-teal-100 text-teal-700',
    label: 'text-teal-800',
  },
};

export default function CommunityHealthAlert() {
  const { alert, newsItem } = useHealthAlertSummary();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(dismissalKey) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed || (!alert && !newsItem)) return null;

  const styles = tierStyles[alert?.tier || 'news'];
  const Icon = alert?.tier === 'high' ? Siren : AlertTriangle;
  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissalKey, 'true');
    } catch {
      // Still dismiss in memory if browser storage is unavailable.
    }
  };

  return (
    <section
      role="status"
      aria-label={alert ? 'Community health alert' : 'Community health news'}
      className={`cc-health-alert relative mb-6 w-full rounded-2xl border border-l-4 p-5 text-[#0A1628] shadow-[0_4px_24px_rgba(10,22,40,0.08)] md:p-6 ${styles.card}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3 md:gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
            <Icon size={23} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 pr-8 text-xs font-bold uppercase tracking-wide ${styles.label}`}>
              <span>{alert ? 'Health alert' : 'Health news'} · Bengaluru</span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="cc-health-alert-live">●</span> LIVE
              </span>
            </div>
            <h2 className="mt-2 break-words text-base font-semibold leading-snug md:text-lg">
              {alert
                ? `More people than usual are visiting ${alert.name} this week`
                : newsItem.title}
            </h2>
            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-700">
              {alert?.message && <>{alert.message} </>}
              Seek care early if symptoms worsen.
            </p>
          </div>
        </div>
        <Link
          to="/health-alerts"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-[#0A1628] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123E49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1628] focus-visible:ring-offset-2 md:mr-9 md:w-auto"
        >
          {alert ? 'View health alerts →' : 'See latest health news →'}
        </Link>
      </div>
      <button
        type="button"
        aria-label={alert ? 'Dismiss community health alert' : 'Dismiss community health news'}
        onClick={dismiss}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1628] focus-visible:ring-offset-2 md:right-3 md:top-3"
      >
        <X size={20} aria-hidden="true" />
      </button>
    </section>
  );
}
