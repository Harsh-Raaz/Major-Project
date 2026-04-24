import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import StatsCard from '../components/StatsCard';
import {
  getAdminAlerts,
  getAdminDashboard,
  getAdminTrends,
  getBusyHours,
} from '../api/admin';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({});
  const [trends, setTrends] = useState({});
  const [busy, setBusy] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardRes, trendsRes, busyRes, alertsRes] = await Promise.all([
          getAdminDashboard(),
          getAdminTrends(),
          getBusyHours(),
          getAdminAlerts(),
        ]);
        setDashboard(dashboardRes.data || {});
        setTrends(trendsRes.data || {});
        setBusy(busyRes.data || {});
        setAlerts(alertsRes.data?.alerts || alertsRes.data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      </AppLayout>
    );
  }

  const doctors = [
    ...(dashboard.doctor_loads || dashboard.doctors || []),
  ].sort((a, b) => (b.load_index || 0) - (a.load_index || 0));
  const chartConfigs = [
    { key: 'hourly', xKey: 'hour', label: 'Hourly Bookings' },
    { key: 'departments', xKey: 'department', label: 'Department Bookings' },
    { key: 'daily', xKey: 'day', label: 'Day-wise Bookings' },
  ];
  const normalise = (arr, xKey) =>
    (arr || []).map((item) => ({
      ...item,
      [xKey]: item[xKey] ?? item._id,
    }));

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[24px] bg-[#0A1628] p-6 text-white shadow-[0_24px_60px_rgba(10,22,40,0.22)]">
          <p className="cc-eyebrow border-white/20 text-white/70">
            Operations Overview
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            Admin Dashboard
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Live booking pressure, department demand, and alert monitoring in
            one clinical command view.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Confirmed
              </p>
              <p className="mt-2 font-display text-3xl">
                {dashboard.total_bookings ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Today
              </p>
              <p className="mt-2 font-display text-3xl">
                {dashboard.today_bookings || dashboard.total_bookings_today || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Emergency
              </p>
              <p className="mt-2 font-display text-3xl">
                {dashboard.emergency_today || dashboard.emergency_cases || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Bookings Today"
          value={dashboard.today_bookings || dashboard.total_bookings_today}
        />
        <StatsCard label="Cancelled Today" value={dashboard.cancelled_today} />
        <StatsCard
          label="Emergency Cases"
          value={dashboard.emergency_today || dashboard.emergency_cases}
        />
        <StatsCard label="Full Slots Today" value={dashboard.full_slots_today} />
      </div>

      <section className="cc-surface p-5 md:p-6">
        <h3 className="font-display text-xl font-semibold text-[#0A1628]">
          Doctor Load Table
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th>Name</th>
                <th>Department</th>
                <th>Current</th>
                <th>Max</th>
                <th>Load</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr
                  key={doctor.id || doctor._id || doctor.name}
                  className="border-t border-[rgba(0,184,169,0.12)]"
                >
                  <td className="py-3 font-medium text-[#0A1628]">{doctor.name}</td>
                  <td className="py-3 text-slate-600">{doctor.department}</td>
                  <td className="py-3">{doctor.current}</td>
                  <td className="py-3">{doctor.max}</td>
                  <td>
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${
                          Number(doctor.load_index || 0) > 75
                            ? 'bg-red-500'
                            : Number(doctor.load_index || 0) >= 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${doctor.load_index || 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3">{doctor.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {chartConfigs.map((chart) => (
          <div key={chart.key} className="cc-surface h-80 p-4">
            <p className="mb-2 font-display text-lg font-semibold text-[#0A1628]">
              {chart.label}
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={normalise(trends[chart.key], chart.xKey)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chart.xKey} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00B8A9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </section>

      <section className="cc-surface p-5 md:p-6">
        {busy.current_hour_warning && (
          <div className="mb-3 rounded-2xl border border-[#F59E0B]/20 bg-[#fff7e6] p-3 text-[#b86a00]">
            {busy.current_hour_warning}
          </div>
        )}
        <h3 className="font-display text-xl font-semibold text-[#0A1628]">
          Busy Hours Prediction
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            { key: 'top_peak_hours', label: 'Top Peak Hours' },
            { key: 'top_peak_days', label: 'Top Peak Days' },
            { key: 'top_peak_departments', label: 'Top Peak Departments' },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4"
            >
              <p className="font-display font-medium text-[#0A1628]">{item.label}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {(busy[item.key] || []).slice(0, 3).map((value, index) => (
                  <li key={index}>
                    {value.hour || value.day || value.department || value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="cc-surface p-5 md:p-6">
        <h3 className="font-display text-xl font-semibold text-[#0A1628]">
          Admin Alerts
        </h3>
        <div className="mt-3 grid gap-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`rounded-2xl border-l-4 p-4 text-sm ${
                alert.priority === 'critical'
                  ? 'border-l-red-500 bg-red-50 text-red-700'
                  : alert.priority === 'high'
                    ? 'border-l-[#F59E0B] bg-[#fff7e6] text-[#b86a00]'
                    : 'border-l-[#00B8A9] bg-[#F0FDF9] text-[#0A1628]'
              }`}
            >
              {(alert.priority === 'critical' ||
                String(alert.type || '').includes('emergency')) && (
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />
              )}
              {alert.message || alert.title}
            </div>
          ))}
        </div>
      </section>
        </div>
      </section>
    </AppLayout>
  );
}
