export default function SlotCard({ slot, onSelect }) {
  const load = Number(slot.load_factor ?? slot.load ?? 0);
  const full = String(slot.status || "").toLowerCase() === "full";
  const style = full
    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
    : load > 80
      ? "bg-yellow-100 text-yellow-700"
      : load >= 50
        ? "bg-yellow-50 text-yellow-700"
        : "bg-green-100 text-green-700";

  return (
    <button disabled={full} onClick={onSelect} className={`rounded-lg p-3 text-sm font-semibold ${style}`}>
      {slot.time_range || `${slot.start_time} - ${slot.end_time}`}
    </button>
  );
}

