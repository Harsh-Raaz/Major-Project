import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { useAuth } from "../hooks/useAuth";
import { cancelAppointment, getFollowUp, rescheduleAppointment } from "../api/appointment";
import { getSlots } from "../api/doctor";
import { getPatientAppointments, getPatientNotifications } from "../api/patient";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("upcoming");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [aRes, nRes] = await Promise.all([
          getPatientAppointments(user.id),
          getPatientNotifications(user.id),
        ]);
        setAppointments(aRes.data?.appointments || aRes.data || []);
        setNotifications(nRes.data?.notifications || nRes.data || []);
      } catch (error) {
        toast.error("Failed loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const onCancel = async (id) => {
    try {
      await cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id || a._id === id ? { ...a, status: "cancelled" } : a)));
      toast.success("Appointment cancelled");
    } catch (error) {
      toast.error("Failed to cancel");
    }
  };

  const onOpenReschedule = async (appointment) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const sRes = await getSlots(appointment.doctor_id, today);
      setModal({ type: "reschedule", appointment, slots: sRes.data?.slots || sRes.data || [] });
    } catch (error) {
      toast.error("Failed loading slots");
    }
  };

  const onReschedule = async (appointmentId, slotId) => {
    try {
      await rescheduleAppointment(appointmentId, slotId);
      setModal(null);
      if (user?.id) {
        const res = await getPatientAppointments(user.id);
        setAppointments(res.data?.appointments || res.data || []);
      }
      toast.success("Appointment rescheduled");
    } catch (error) {
      toast.error("Reschedule failed");
    }
  };

  const onFollowup = async (id) => {
    try {
      const res = await getFollowUp(id);
      setModal({ type: "followup", data: res.data });
    } catch (error) {
      toast.error("Follow-up failed");
    }
  };

  const filtered = appointments.filter((a) => {
    const s = String(a.status || "").toLowerCase();
    if (tab === "upcoming") return !["completed", "cancelled"].includes(s);
    return s === tab;
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
        <h2 className="text-2xl font-bold text-blue-950">Welcome back, {user?.name}!</h2>
        <p className="mt-2 text-blue-700">Manage your appointments and stay updated</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex gap-2">
            {["upcoming", "completed", "cancelled"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1 text-sm ${
                  tab === t ? "bg-blue-600 text-white" : "border border-blue-200 bg-white text-blue-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid gap-4">
            {filtered.length > 0 ? (
              filtered.map((a) => (
                <article key={a.id || a._id} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                  <p className="font-semibold text-blue-950">{a.doctor_name} - {a.department}</p>
                  <p className="text-sm text-blue-700">{a.hospital_name}</p>
                  <p className="text-sm text-blue-700">
                    {a.date} {a.time}
                  </p>
                  <p className="text-sm">
                    Status: <span className="font-semibold">{a.status || "confirmed"}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onCancel(a.id || a._id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onOpenReschedule(a)}
                      className="rounded-lg border border-yellow-200 px-3 py-1 text-yellow-700 hover:bg-yellow-50"
                    >
                      Reschedule
                    </button>
                    {String(a.status || "").toLowerCase() === "completed" && (
                      <button
                        onClick={() => onFollowup(a.id || a._id)}
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
                <p className="text-lg font-semibold text-blue-900">No appointments</p>
                <p className="text-sm text-blue-700">Start booking appointments to see them here</p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-blue-950">Recent Notifications</h3>
          <div className="mt-3 grid gap-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((n, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-sm ${
                    n.priority === "high"
                      ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {n.message || n.title}
                </div>
              ))
            ) : (
              <p className="text-sm text-blue-700">No new notifications</p>
            )}
          </div>
        </aside>
      </div>

      {modal?.type === "reschedule" && (
        <Modal title="Reschedule Appointment" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {modal.slots.map((s) => (
              <button
                key={s.id || s._id}
                onClick={() => onReschedule(modal.appointment.id || modal.appointment._id, s.id || s._id)}
                className="rounded-lg border border-blue-100 p-3 text-left hover:bg-blue-50"
              >
                {s.time_range || `${s.start_time} - ${s.end_time}`}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal?.type === "followup" && (
        <Modal title="Follow Up Suggestion" onClose={() => setModal(null)}>
          <pre className="rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(modal.data, null, 2)}</pre>
        </Modal>
      )}
    </AppLayout>
  );
}

