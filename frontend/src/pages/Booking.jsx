import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import { classifyPriority } from "../api/ai";
import { createAppointment } from "../api/appointment";
import { registerPatient } from "../api/patient";
import { fallbackPriority, formatPatient } from "../utils/helpers";
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
  const wait = searchParams.get("wait");
  const localPriority = useMemo(() => fallbackPriority(symptoms), [symptoms]);

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:", { doctorId, slotId, hospitalId, department });
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
      const patientData = formatPatient(patientRes.data?.patient || null);
      const patientId =
        patientRes.data?.patient?.id ||
        patientRes.data?.patient?._id ||
        patientRes.data?.id ||
        patientRes.data?.patient_id;
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
        )}&wait=${wait}&hospitalId=${hospitalId}`,
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <h2 className="text-2xl font-bold">Patient Booking</h2>
      <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-4 rounded-2xl border border-blue-100 bg-white p-6">
        <input className="rounded-lg border border-blue-200 px-3 py-2" placeholder="Full Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-lg border border-blue-200 px-3 py-2" type="number" placeholder="Age*" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <select className="rounded-lg border border-blue-200 px-3 py-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option>Male</option><option>Female</option><option>Other</option>
        </select>
        <input className="rounded-lg border border-blue-200 px-3 py-2" placeholder="Phone Number*" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="rounded-lg border border-blue-200 px-3 py-2" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded-lg border border-blue-200 px-3 py-2" placeholder="Address*" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">{loading ? <Loader small /> : "Book Appointment"}</button>
      </form>
    </AppLayout>
  );
}

