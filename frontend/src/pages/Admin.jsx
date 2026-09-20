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
  getDoctorAppointments,
  getSeasonalCalendar,
} from '../api/admin';
import { predictNoShow } from '../api/ai';
import { getHospitals } from '../api/hospital';
import { getDoctorsByHospital } from '../api/doctor';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({});
  const [trends, setTrends] = useState({});
  const [busy, setBusy] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [seasonalCalendar, setSeasonalCalendar] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsError, setHospitalsError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardRes, trendsRes, busyRes, alertsRes, calendarRes, hospitalsRes] = await Promise.all([
          getAdminDashboard(),
          getAdminTrends(),
          getBusyHours(),
          getAdminAlerts(),
          getSeasonalCalendar(),
          getHospitals(),
        ]);
        setDashboard(dashboardRes.data || {});
        setTrends(trendsRes.data || {});
        setBusy(busyRes.data || {});
        setAlerts(alertsRes.data?.alerts || alertsRes.data || []);
        setSeasonalCalendar(calendarRes.data || []);
        setHospitals(hospitalsRes.data || []);
      } catch (error) {
        setHospitalsError(error.response?.data?.message || 'Could not load hospitals.');
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

  const selectDoctor = async (doctor) => {
    const doctorId = doctor.id || doctor._id;
    if (!doctorId) return;

    setSelectedDoctor(doctor);
    setDoctorAppointments([]);
    setAppointmentsError('');
    setAppointmentsLoading(true);
    try {
      const response = await getDoctorAppointments(doctorId);
      const appointments = response.data?.appointments || response.data || [];
      const appointmentsWithRisk = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            const prediction = await predictNoShow(appointment.no_show_features);
            return { ...appointment, prediction: prediction.data };
          } catch {
            return {
              ...appointment,
              predictionError: 'No-show prediction is currently unavailable.'
            };
          }
        })
      );
      setDoctorAppointments(appointmentsWithRisk);
    } catch (error) {
      setAppointmentsError(
        error.response?.data?.message || 'Could not load this doctor’s appointments.'
      );
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const selectHospital = async (hospital) => {
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) return;

    setSelectedHospital(hospital);
    setHospitalDoctors([]);
    setDoctorsError('');
    setDoctorsLoading(true);
    setSelectedDoctor(null);
    setDoctorAppointments([]);
    setAppointmentsError('');
    try {
      const response = await getDoctorsByHospital(hospitalId);
      setHospitalDoctors(response.data || []);
    } catch (error) {
      setDoctorsError(error.response?.data?.message || 'Could not load doctors for this hospital.');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const riskClass = (risk) => {
    if (risk === 'high') return 'bg-red-100 text-red-700';
    if (risk === 'medium') return 'bg-amber-100 text-amber-800';
    return 'bg-[#E5FAF6] text-[#008F83]';
  };

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
        <p className="cc-eyebrow">Care network</p>
        <h3 className="mt-2 font-display text-xl font-semibold text-[#0A1628]">Hospitals</h3>
        <p className="mt-1 text-sm text-slate-600">Select a hospital to view its doctors, then select a doctor to review patient risk.</p>
        {hospitalsError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{hospitalsError}</div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {hospitals.map((hospital) => {
              const hospitalId = hospital._id || hospital.id;
              const isSelected = selectedHospital && (selectedHospital._id || selectedHospital.id) === hospitalId;
              return (
                <button key={hospitalId} type="button" onClick={() => selectHospital(hospital)} className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-[#00B8A9] bg-[#F0FDF9] ring-2 ring-[#00B8A9]/15' : 'border-[rgba(0,184,169,0.15)] bg-white hover:border-[#00B8A9]/50'}`}>
                  <p className="font-display text-lg font-semibold text-[#0A1628]">{hospital.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{hospital.location?.address || hospital.location?.city || 'Location unavailable'}</p>
                  {hospital.departments?.length > 0 && <p className="mt-3 text-xs font-medium text-[#008F83]">{hospital.departments.length} departments</p>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedHospital && (
        <section className="cc-surface p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="cc-eyebrow">Hospital doctors</p><h3 className="mt-2 font-display text-xl font-semibold text-[#0A1628]">{selectedHospital.name}</h3></div>
            <button type="button" onClick={() => { setSelectedHospital(null); setHospitalDoctors([]); setSelectedDoctor(null); setDoctorAppointments([]); }} className="cc-btn-secondary px-4 py-2 text-sm">Close</button>
          </div>
          {doctorsLoading ? (
            <div className="mt-8 flex justify-center"><Loader /></div>
          ) : doctorsError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{doctorsError}</div>
          ) : hospitalDoctors.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No available doctors found for this hospital.</p>
          ) : (
            <div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="pb-3">Name</th><th className="pb-3">Department</th><th className="pb-3">Current</th><th className="pb-3">Max</th><th className="pb-3">Rating</th></tr></thead><tbody>{hospitalDoctors.map((doctor) => (
              <tr key={doctor._id || doctor.id} className="border-t border-[rgba(0,184,169,0.12)]"><td className="py-3 font-medium"><button type="button" onClick={() => selectDoctor(doctor)} className="text-left text-[#008F83] underline decoration-[#00B8A9]/35 underline-offset-4 transition hover:text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#00B8A9] focus:ring-offset-2">{doctor.name}</button></td><td className="py-3 text-slate-600">{doctor.department}</td><td className="py-3">{doctor.current_patients_today ?? 0}</td><td className="py-3">{doctor.max_patients_per_day ?? '—'}</td><td className="py-3">{doctor.rating ?? '—'}</td></tr>
            ))}</tbody></table></div>
          )}
        </section>
      )}

      {selectedDoctor && (
        <section className="cc-surface p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="cc-eyebrow">Patient no-show insights</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-[#0A1628]">
                Appointments for {selectedDoctor.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Appointment details and no-show prediction for each patient.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setDoctorAppointments([]);
                setAppointmentsError('');
              }}
              className="cc-btn-secondary px-4 py-2 text-sm"
            >
              Close
            </button>
          </div>

          {appointmentsLoading ? (
            <div className="mt-8 flex justify-center"><Loader /></div>
          ) : appointmentsError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {appointmentsError}
            </div>
          ) : doctorAppointments.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              No appointments found for this doctor.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 pr-4">Appointment</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">No-show probability</th>
                    <th className="pb-3">Risk & recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorAppointments.map((appointment) => {
                    const prediction = appointment.prediction;
                    const risk = prediction?.risk_level?.toLowerCase();
                    const probability = Number(prediction?.no_show_probability);
                    return (
                      <tr key={appointment._id || appointment.id} className="border-t border-[rgba(0,184,169,0.12)] align-top">
                        <td className="py-4 pr-4">
                          <p className="font-medium text-[#0A1628]">{appointment.patient_id?.name || 'Unknown patient'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {appointment.patient_id?.age ?? 'Age unavailable'}{appointment.patient_id?.gender ? ` · ${appointment.patient_id.gender}` : ''}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          <p>{appointment.slot_id?.date || 'Date unavailable'}{appointment.slot_id?.start_time ? ` · ${appointment.slot_id.start_time}–${appointment.slot_id.end_time}` : ''}</p>
                          <p className="mt-1 text-xs">{appointment.department || selectedDoctor.department || 'Department unavailable'}{appointment.estimated_wait_mins != null ? ` · ${appointment.estimated_wait_mins} min wait` : ''}</p>
                        </td>
                        <td className="py-4 pr-4 capitalize text-slate-600">{appointment.status || '—'}</td>
                        <td className="py-4 pr-4 font-semibold text-[#0A1628]">
                          {prediction && Number.isFinite(probability) ? `${Math.round(probability * 100)}%` : 'Unavailable'}
                        </td>
                        <td className="py-4">
                          {prediction ? (
                            <>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${riskClass(risk)}`}>
                                {risk || 'low'} risk
                              </span>
                              {risk === 'high' && prediction.recommendation && (
                                <p className="mt-2 max-w-xs text-xs leading-5 text-red-700">{prediction.recommendation}</p>
                              )}
                            </>
                          ) : (
                            <p className="max-w-xs text-xs text-slate-500">{appointment.predictionError}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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

      <div className="cc-surface p-6 mt-6">
        <p className="cc-eyebrow">Seasonal Disease Calendar</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {seasonalCalendar.map((m) => {
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const isCurrent = m.month === new Date().getMonth() + 1;
            const severityColor =
              m.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
              m.severity === 'high' ? 'bg-amber-100 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-600 border-slate-200';
            return (
              <div
                key={m.month}
                className={`rounded-[14px] border p-2 text-center ${severityColor} ${isCurrent ? 'ring-2 ring-[#00B8A9]' : ''}`}
                title={m.risk_diseases.join(', ')}
              >
                <p className="text-xs font-semibold">{monthNames[m.month - 1]}</p>
                <p className="mt-1 text-[10px]">{m.risk_diseases[0] || '-'}</p>
              </div>
            );
          })}
        </div>
      </div>

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
            { key: 'peak_hours', label: 'Top Peak Hours' },
            { key: 'peak_days', label: 'Top Peak Days' },
            { key: 'peak_departments', label: 'Top Peak Departments' },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4"
            >
              <p className="font-display font-medium text-[#0A1628]">{item.label}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {(busy[item.key] || []).slice(0, 3).map((value, index) => (
                  <li key={index}>
                    {value.hour ?? value.day ?? value.department ?? String(value)}
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
