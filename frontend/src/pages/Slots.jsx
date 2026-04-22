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

const getDateOptions = () =>
  Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().slice(0, 10);
  });

const formatDateLabel = (dateStr) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";

  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  const [selectedDate, setSelectedDate] = useState(getDateOptions()[0]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSelected(null);
      let fetchedSlots = [];
      try {
        const res = await getSlots(id, selectedDate);
        console.log("slots raw response", res);
        fetchedSlots = normalizeSlotsResponse(res.data);
        const today = new Date().toISOString().slice(0, 10);
        const currentTime = new Date().toTimeString().slice(0, 5);
        fetchedSlots = fetchedSlots.filter((slot) => {
          if (selectedDate !== today) return true;
          return slot.end_time > currentTime;
        });
        setSlots(fetchedSlots);
      } catch (error) {
        console.error("Slots fetch error:", error);
        toast.error("Failed loading slots");
      } finally {
        setLoading(false);
      }

      if (!fetchedSlots.length) return;

      // Slots must render independently; AI suggestions are optional.
      try {
        const sRes = await loadBalanceSlot(fetchedSlots);
        setSuggestions(sRes.data?.suggested_slots || sRes.data?.recommendations || []);
      } catch {
        setSuggestions([]);
      }
    };
    load();
  }, [id, selectedDate]);

  const wait = selected ? Number(selected.current_bookings || 0) * (avgMins + 3) : 0;
  const selectedLoad =
    selected?.capacity > 0 ? (Number(selected.current_bookings || 0) / Number(selected.capacity)) * 100 : 0;
  const crowded = selected && Number(selected.load_factor ?? selected.load ?? selectedLoad) > 80;

  return (
    <AppLayout>
      <h2 className="text-2xl font-bold">{doctorName}</h2>
      <p className="text-blue-700">{hospital}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {getDateOptions().map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedDate === date
                ? "bg-blue-600 text-white shadow-md"
                : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
            }`}
          >
            {formatDateLabel(date)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader />
        </div>
      ) : slots.length === 0 ? (
        <div className="mt-8 rounded-xl border border-blue-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
            :(
          </div>
          <p className="mt-4 text-xl font-semibold text-blue-950">Sorry, we can't book your appointment today.</p>
          <p className="mt-2 text-blue-700">Please try selecting a different date or another doctor.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => (
            <SlotCard key={slot.id || slot._id} slot={slot} onSelect={setSelected} />
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
            onClick={() => {
              const params = new URLSearchParams({
                doctorId: id,
                slotId: selected.id || selected._id,
                hospitalId: hospitalId || selected.hospital_id || "",
                doctorName,
                hospital: hospital || "",
                department: department || "",
                time: selected.time_range || `${selected.start_time} - ${selected.end_time}`,
                date: selectedDate,
                symptoms,
                wait: String(wait),
              });
              console.log("booking params from slots", Object.fromEntries(params.entries()));
              navigate(`/booking?${params.toString()}`);
            }}
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

