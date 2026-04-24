import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import SlotCard from "../components/SlotCard";
import { getSlots } from "../api/doctor";
import { loadBalanceSlot } from "../api/ai";

const normalizeSlotsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.slots)) return data.slots;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function Slots() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorName = searchParams.get("doctorName") || "";
  const hospitalId = searchParams.get("hospitalId");
  const hospital = searchParams.get("hospital");
  const department = searchParams.get("department");
  const symptoms = searchParams.get("symptoms") || "";
  const avgMins = Number(searchParams.get("avgMins") || 10);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const load = async () => {
      setLoading(true);
      let fetchedSlots = [];
      try {
        const res = await getSlots(id, today);
        fetchedSlots = normalizeSlotsResponse(res.data);
        setSlots(fetchedSlots);
      } catch {
        toast.error("Failed loading slots");
      } finally {
        setLoading(false);
      }

      if (!fetchedSlots.length) return;

      try {
        const sRes = await loadBalanceSlot(fetchedSlots);
        setSuggestions(
          sRes.data?.suggested_slots || sRes.data?.recommendations || []
        );
      } catch {
        setSuggestions([]);
      }
    };
    load();
  }, [id]);

  const wait = selected
    ? Number(selected.current_bookings || 0) * (avgMins + 3)
    : 0;
  const selectedLoad =
    selected?.capacity > 0
      ? (Number(selected.current_bookings || 0) / Number(selected.capacity)) *
        100
      : 0;
  const crowded =
    selected && Number(selected.load_factor ?? selected.load ?? selectedLoad) > 80;

  return (
    <AppLayout>
      <section className="animate-fade-up">
        <p className="cc-eyebrow">Slot Selection</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[#0A1628]">
          {doctorName}
        </h2>
        <p className="mt-2 text-slate-600">{hospital}</p>
      </section>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <SlotCard key={slot.id || slot._id} slot={slot} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <div className="cc-surface mt-8 animate-fade-up p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Selected slot</p>
              <p className="mt-2 font-display text-2xl text-[#0A1628]">
                {selected.time_range || `${selected.start_time} - ${selected.end_time}`}
              </p>
            </div>
            <div className="rounded-[20px] border border-[rgba(245,158,11,0.18)] bg-[#fff7e6] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated wait</p>
              <p className="mt-2 font-display text-2xl text-[#0A1628]">{wait} minutes</p>
            </div>
            <div className="rounded-[20px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department</p>
              <p className="mt-2 font-display text-2xl text-[#0A1628]">{department || "General"}</p>
            </div>
          </div>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                doctorId: id,
                slotId: selected.id || selected._id,
                hospitalId: hospitalId || selected.hospital_id || "",
                doctorName,
                hospital: hospital || "",
                department: department || "",
                time:
                  selected.time_range ||
                  `${selected.start_time} - ${selected.end_time}`,
                symptoms,
                wait: String(wait),
              });
              navigate(`/booking?${params.toString()}`);
            }}
            className="cc-btn-primary mt-6"
          >
            Confirm Booking
          </button>
          {crowded && (
            <div className="mt-6 rounded-[20px] border border-[#F59E0B]/25 bg-[#fff7e6] p-4 text-[#8a6004]">
              <p className="font-semibold">
                This slot is almost full. Here are less crowded alternatives:
              </p>
              <ul className="mt-3 list-disc pl-5">
                {suggestions.slice(0, 2).map((slot, index) => (
                  <li key={index}>
                    {slot.time_range || `${slot.start_time} - ${slot.end_time}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
