import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../hooks/useAuth';
import {
  cancelAppointment,
  getFollowUp,
  rescheduleAppointment,
} from '../api/appointment';
import { getSlots } from '../api/doctor';
import {
  getPatientAppointments,
  getPatientNotifications,
} from '../api/patient';
import { getPatient } from '../utils/storage';

const slotTimeText = (slot) =>
  slot.time_range || `${slot.start_time} - ${slot.end_time}`;

export default function Dashboard() {
  const { user } = useAuth();
  const patient = getPatient();
  const patientId = patient?._id || patient?.id;
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [appointmentsRes, notificationsRes] = await Promise.all([
          getPatientAppointments(patientId),
          getPatientNotifications(patientId),
        ]);
        setAppointments(
          appointmentsRes.data?.appointments || appointmentsRes.data || []
        );
        setNotifications(
          notificationsRes.data?.notifications || notificationsRes.data || []
        );
      } catch {
        toast.error('Failed loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const onCancel = async (id) => {
    try {
      await cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id || appointment._id === id
            ? { ...appointment, status: 'cancelled' }
            : appointment
        )
      );
      toast.success('Appointment cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const onOpenReschedule = async (appointment) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await getSlots(appointment.doctor_id, today);
      setModal({
        type: 'reschedule',
        appointment,
        slots: response.data?.slots || response.data || [],
      });
    } catch {
      toast.error('Failed loading slots');
    }
  };

  const onReschedule = async (appointmentId, slotId) => {
    try {
      await rescheduleAppointment(appointmentId, slotId);
      setModal(null);

      if (patientId) {
        const response = await getPatientAppointments(patientId);
        setAppointments(response.data?.appointments || response.data || []);
      }

      toast.success('Appointment rescheduled');
    } catch {
      toast.error('Reschedule failed');
    }
  };

  const onFollowup = async (id) => {
    try {
      const response = await getFollowUp(id);
      setModal({ type: 'followup', data: response.data });
    } catch {
      toast.error('Follow-up failed');
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const status = String(appointment.status || '').toLowerCase();
    if (tab === 'upcoming') return !['completed', 'cancelled'].includes(status);
    return status === tab;
  });
  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(
      (appointment) =>
        !['completed', 'cancelled'].includes(
          String(appointment.status || '').toLowerCase()
        )
    ).length,
    cancelled: appointments.filter(
      (appointment) =>
        String(appointment.status || '').toLowerCase() === 'cancelled'
    ).length,
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mt-10 flex justify-center">
          <Loader />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 animate-fade-up">
        <p className="cc-eyebrow">Patient Dashboard</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[#0A1628]">
          Welcome back, {user?.name}!
        </h2>
        <p className="mt-2 text-slate-600">
          Manage your appointments and stay updated
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatsCard label="Total" value={stats.total} />
        <StatsCard label="Upcoming" value={stats.upcoming} />
        <StatsCard label="Cancelled" value={stats.cancelled} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex gap-2">
            {['upcoming', 'completed', 'cancelled'].map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  tab === value
                    ? 'bg-[#0A1628] text-white'
                    : 'border border-[rgba(0,184,169,0.15)] bg-white text-slate-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <article
                  key={appointment.id || appointment._id}
                  className={`cc-surface p-5 ${
                    String(appointment.status || '').toLowerCase() === 'completed'
                      ? 'border-l-4 border-l-[#00B8A9]'
                      : String(appointment.status || '').toLowerCase() === 'cancelled'
                        ? 'border-l-4 border-l-red-500'
                        : 'border-l-4 border-l-[#F59E0B]'
                  }`}
                >
                  <p className="font-display text-lg font-semibold text-[#0A1628]">
                    {appointment.doctor_name} - {appointment.department}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.hospital_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.date} {appointment.time}
                  </p>
                  <p className="mt-3 text-sm">
                    Status:{' '}
                    <span className="font-semibold capitalize text-[#0A1628]">
                      {appointment.status || 'confirmed'}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!['completed', 'cancelled'].includes(
                      String(appointment.status || '').toLowerCase()
                    ) && (
                      <>
                        <button
                          onClick={() =>
                            onCancel(appointment.id || appointment._id)
                          }
                          className="cc-btn-danger"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onOpenReschedule(appointment)}
                          className="cc-btn-secondary"
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                    {String(appointment.status || '').toLowerCase() ===
                      'completed' && (
                      <button
                        onClick={() =>
                          onFollowup(appointment.id || appointment._id)
                        }
                        className="cc-btn-secondary"
                      >
                        Follow Up
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="cc-surface p-8 text-center">
                <p className="font-display text-lg font-semibold text-[#0A1628]">
                  No appointments
                </p>
                <p className="text-sm text-slate-600">
                  Start booking appointments to see them here
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="cc-surface p-5">
          <h3 className="font-display text-lg font-semibold text-[#0A1628]">
            Recent Notifications
          </h3>
          <div className="mt-3 grid gap-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border-l-4 p-3 text-sm ${
                    notification.priority === 'high'
                      ? 'border-l-red-500 bg-red-50 text-red-700'
                      : 'border-l-[#00B8A9] bg-[#F0FDF9] text-[#0A1628]'
                  }`}
                >
                  {notification.message || notification.title}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No new notifications</p>
            )}
          </div>
        </aside>
      </div>

      {modal?.type === 'reschedule' && (
        <Modal title="Reschedule Appointment" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {modal.slots.map((slot) => (
              <button
                key={slot.id || slot._id}
                onClick={() =>
                  onReschedule(
                    modal.appointment.id || modal.appointment._id,
                    slot.id || slot._id
                  )
                }
                className="rounded-lg border border-blue-100 p-3 text-left hover:bg-blue-50"
              >
                {slotTimeText(slot)}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal?.type === 'followup' && (
        <Modal title="Follow Up Suggestion" onClose={() => setModal(null)}>
          <pre className="rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(modal.data, null, 2)}
          </pre>
        </Modal>
      )}
    </AppLayout>
  );
}
