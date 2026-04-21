import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import StatsCard from "../components/StatsCard";
import { getAdminAlerts, getAdminDashboard, getAdminTrends, getBusyHours } from "../api/admin";

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
        const [d, t, b, a] = await Promise.all([getAdminDashboard(), getAdminTrends(), getBusyHours(), getAdminAlerts()]);
        setDashboard(d.data || {});
        setTrends(t.data || {});
        setBusy(b.data || {});
        setAlerts(a.data?.alerts || a.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <AppLayout><div className="mt-10 flex justify-center"><Loader /></div></AppLayout>;
  const doctors = [...(dashboard.doctors || [])].sort((a, b) => (b.load_index || 0) - (a.load_index || 0));

  return (
    <AppLayout>
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Bookings Today" value={dashboard.total_bookings_today} />
        <StatsCard label="Cancelled Today" value={dashboard.cancelled_today} />
        <StatsCard label="Emergency Cases" value={dashboard.emergency_cases} />
        <StatsCard label="Full Slots Today" value={dashboard.full_slots_today} />
      </div>
      <section className="mt-8 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Doctor Load Table</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-blue-700"><th>Name</th><th>Department</th><th>Current</th><th>Max</th><th>Load</th><th>Rating</th></tr></thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className={`${Number(d.load_index || 0) > 75 ? "bg-red-50" : ""}`}>
                  <td>{d.name}</td><td>{d.department}</td><td>{d.current_patients}</td><td>{d.max_patients}</td>
                  <td><div className="h-2 w-32 rounded-full bg-slate-100"><div className={`${Number(d.load_index || 0) > 75 ? "bg-red-500" : Number(d.load_index || 0) >= 50 ? "bg-yellow-500" : "bg-green-500"} h-2 rounded-full`} style={{ width: `${d.load_index || 0}%` }} /></div></td>
                  <td>{d.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[{ key: "hourly_bookings", x: "hour", label: "Hourly Bookings" }, { key: "department_wise_bookings", x: "department", label: "Department Bookings" }, { key: "day_wise_bookings", x: "day", label: "Day-wise Bookings" }].map((chart) => (
          <div key={chart.key} className="h-72 rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 font-semibold">{chart.label}</p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={trends[chart.key] || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={chart.x} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </section>
      <section className="mt-8 rounded-xl bg-white p-4 shadow-sm">
        {busy.current_hour_warning && <div className="mb-3 rounded-lg bg-yellow-50 p-3 text-yellow-700">{busy.current_hour_warning}</div>}
        <h3 className="font-semibold">Busy Hours Prediction</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[{ key: "top_peak_hours", label: "Top Peak Hours" }, { key: "top_peak_days", label: "Top Peak Days" }, { key: "top_peak_departments", label: "Top Peak Departments" }].map((x) => (
            <div key={x.key} className="rounded-lg border border-blue-100 p-3">
              <p className="font-medium">{x.label}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">{(busy[x.key] || []).slice(0, 3).map((v, i) => <li key={i}>{v.hour || v.day || v.department || v}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Admin Alerts</h3>
        <div className="mt-3 grid gap-2">
          {alerts.map((a, i) => (
            <div key={i} className={`rounded-lg p-3 text-sm ${a.priority === "critical" ? "bg-red-100 text-red-700" : a.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
              {(a.priority === "critical" || String(a.type || "").includes("emergency")) && <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />}
              {a.message || a.title}
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

