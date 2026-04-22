import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-950">
          Welcome back, {user?.name}!
        </h2>
        <p className="mt-2 text-blue-700">
          Manage your appointments and stay updated
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex gap-2">
            {['upcoming', 'completed', 'cancelled'].map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-full px-4 py-1 text-sm ${
                  tab === value
                    ? 'bg-blue-600 text-white'
                    : 'border border-blue-200 bg-white text-blue-700'
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
                  className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold text-blue-950">
                    {appointment.doctor_name} - {appointment.department}
                  </p>
                  <p className="text-sm text-blue-700">
                    {appointment.hospital_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {appointment.date} {appointment.time}
                  </p>
                  <p className="text-sm">
                    Status:{' '}
                    <span className="font-semibold">
                      {appointment.status || 'confirmed'}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        onCancel(appointment.id || appointment._id)
                      }
                      className="rounded-lg border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onOpenReschedule(appointment)}
                      className="rounded-lg border border-yellow-200 px-3 py-1 text-yellow-700 hover:bg-yellow-50"
                    >
                      Reschedule
                    </button>
                    {String(appointment.status || '').toLowerCase() ===
                      'completed' && (
                      <button
                        onClick={() =>
                          onFollowup(appointment.id || appointment._id)
                        }
                        className="rounded-lg border border-blue-200 px-3 py-1 text-blue-700 hover:bg-blue-50"
                      >
                        Follow Up
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border-2 border-dashed border-blue-100 p-8 text-center">
                <p className="text-lg font-semibold text-blue-900">
                  No appointments
                </p>
                <p className="text-sm text-blue-700">
                  Start booking appointments to see them here
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-blue-950">Recent Notifications</h3>
          <div className="mt-3 grid gap-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 text-sm ${
                    notification.priority === 'high'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {notification.message || notification.title}
                </div>
              ))
            ) : (
              <p className="text-sm text-blue-700">No new notifications</p>
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
