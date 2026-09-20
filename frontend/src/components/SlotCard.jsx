export default function SlotCard({ slot, onSelect }) {
  const calculatedLoad =
    slot.capacity > 0
      ? (Number(slot.current_bookings || 0) / Number(slot.capacity)) * 100
      : 0;
  const load = Number(slot.load_factor ?? slot.load ?? calculatedLoad);
  const full = String(slot.status || "").toLowerCase() === "full";
  const almostFull = !full && load > 80;
  const busy = !full && load >= 50;
  const label = slot.time_range || `${slot.start_time} - ${slot.end_time}`;

  const style = full
    ? "border-slate-200 bg-slate-100 text-slate-500"
    : almostFull
      ? "border-[#F59E0B]/25 bg-[#fff7e6] text-[#b86a00]"
      : busy
        ? "border-[#F59E0B]/18 bg-[#fffaf0] text-[#8a6004]"
        : "border-[rgba(0,184,169,0.18)] bg-[#F0FDF9] text-[#0A1628]";

  return (
    <button
      onClick={() => onSelect?.(slot)}
      disabled={full}
      className={`rounded-[20px] border p-4 text-left shadow-[0_4px_24px_rgba(0,184,169,0.08)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed ${style}`}
    >
      <p className={`font-display text-lg font-semibold ${full ? "line-through" : ""}`}>
        {label}
      </p>
      <p className="mt-2 text-sm">Capacity: {slot.current_bookings || 0}/{slot.capacity || 0}</p>
      <p className="mt-1 text-sm capitalize">Status: {slot.status || "available"}</p>
    </button>
  );
}
