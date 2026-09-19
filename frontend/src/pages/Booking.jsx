import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import { classifyPriority } from "../api/ai";
import { createAppointment } from "../api/appointment";
import { registerPatient } from "../api/patient";
import { fallbackPriority } from "../utils/helpers";
import { setPatient } from "../utils/storage";

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "Male", phone: "", email: "", location: "" });

  const doctorId = searchParams.get("doctorId");
  const slotId = searchParams.get("slotId");
  const hospitalId = searchParams.get("hospitalId");
  const doctorName = searchParams.get("doctorName");
  const hospital = searchParams.get("hospital");
  const department = searchParams.get("department");
  const symptoms = searchParams.get("symptoms") || "";
  const time = searchParams.get("time");
  const date = searchParams.get("date");
  const wait = searchParams.get("wait");
  const localPriority = useMemo(() => fallbackPriority(symptoms), [symptoms]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId || !slotId || !hospitalId || hospitalId === "null" || hospitalId === "undefined") {
      return toast.error("Missing booking details. Please go back and select doctor again.");
    }
    if (!form.name || !form.age || !form.phone || !form.location) return toast.error("Please fill required fields");
    if (!/^\d{10}$/.test(form.phone)) return toast.error("Phone must be 10 digits");
    if (Number(form.age) < 1 || Number(form.age) > 120) return toast.error("Age must be between 1 and 120");
    setLoading(true);
    try {
      let priority = localPriority;
      try {
        const pRes = await classifyPriority(symptoms);
        priority = pRes.data?.priority || pRes.data?.label || localPriority;
      } catch {
        priority = localPriority;
      }
      const patientRes = await registerPatient({
        ...form,
        location: {
          address: form.location,
        },
      });
      const patientData = patientRes.data?.patient || null;
      const patientId =
        patientRes.data?.id ||
        patientRes.data?.patient_id ||
        patientRes.data?.patient?.id ||
        patientRes.data?.patient?._id;
      if (!patientId) throw new Error("Patient registration failed");
      if (patientData) setPatient(patientData);
      await createAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        slot_id: slotId,
        hospital_id: hospitalId,
        department,
        symptoms,
        priority,
      });
      navigate(
        `/confirm?doctor=${encodeURIComponent(doctorName)}&hospital=${encodeURIComponent(hospital)}&time=${encodeURIComponent(
          time,
        )}&date=${encodeURIComponent(date || "")}&wait=${wait}&hospitalId=${hospitalId}`,
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <section className="mx-auto max-w-4xl animate-fade-up">
        <div className="cc-surface mb-6 p-6 md:p-8">
          <p className="cc-eyebrow">Appointment Intake</p>
          <h2 className="cc-title mt-3">Complete the patient booking form</h2>
          <p className="cc-muted mt-3">
            We will register the patient profile, classify urgency, and confirm
            the selected slot without changing the current booking flow.
          </p>
          {date && time && (
            <p className="mt-4 text-sm font-medium text-[#007f73]">
              Appointment on <span className="font-semibold">{date}</span> at{" "}
              <span className="font-semibold">{time}</span>
            </p>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="cc-surface grid gap-4 p-6 md:grid-cols-2 md:p-8"
        >
          <label className="cc-field md:col-span-2">
            <span>Full Name</span>
            <input
              placeholder="Patient full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="cc-field">
            <span>Age</span>
            <input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </label>
          <label className="cc-field">
            <span>Gender</span>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label className="cc-field">
            <span>Phone Number</span>
            <input
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="cc-field">
            <span>Email</span>
            <input
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="cc-field md:col-span-2">
            <span>Address</span>
            <input
              placeholder="Street, area, city"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(0,184,169,0.15)] bg-[#F0FDF9] px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-[#0A1628]">
                Selected priority
              </p>
              <p className="text-sm text-slate-600 capitalize">
                {localPriority}
              </p>
            </div>
            <button className="cc-btn-primary min-w-44 justify-center">
              {loading ? <Loader small /> : "Book Appointment"}
            </button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}

