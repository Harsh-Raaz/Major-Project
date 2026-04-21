import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import SlotCard from "../components/SlotCard";
import { getSlots } from "../api/doctor";
import { loadBalanceSlot } from "../api/ai";

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
      try {
        const res = await getSlots(id, today);
        const arr = res.data?.slots || res.data || [];
        setSlots(arr);
        const sRes = await loadBalanceSlot(arr);
        setSuggestions(sRes.data?.suggested_slots || sRes.data?.recommendations || []);
      } catch {
        toast.error("Failed loading slots");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const wait = selected ? Number(selected.current_bookings || 0) * (avgMins + 3) : 0;
  const crowded = selected && Number(selected.load_factor ?? selected.load ?? 0) > 80;

  return (
    <AppLayout>
      <h2 className="text-2xl font-bold">{doctorName}</h2>
      <p className="text-blue-700">{hospital}</p>
      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <SlotCard key={slot.id || slot._id} slot={slot} onSelect={() => setSelected(slot)} />
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-5">
          <p>
            Selected slot: <span className="font-semibold">{selected.time_range || `${selected.start_time} - ${selected.end_time}`}</span>
          </p>
          <p className="mt-2">
            Estimated wait time: <span className="font-semibold">{wait} minutes</span>
          </p>
          <button
            onClick={() =>
              navigate(
                `/booking?doctorId=${id}&slotId=${selected.id || selected._id}&hospitalId=${hospitalId}&doctorName=${encodeURIComponent(
                  doctorName,
                )}&hospital=${encodeURIComponent(hospital)}&department=${encodeURIComponent(department)}&time=${encodeURIComponent(
                  selected.time_range || `${selected.start_time} - ${selected.end_time}`,
                )}&symptoms=${encodeURIComponent(symptoms)}&wait=${wait}`,
              )
            }
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Confirm Booking
          </button>
          {crowded && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              <p className="font-semibold">This slot is almost full. Here are less crowded alternatives:</p>
              <ul className="mt-2 list-disc pl-5">
                {suggestions.slice(0, 2).map((s, i) => (
                  <li key={i}>{s.time_range || `${s.start_time} - ${s.end_time}`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

