import { MapPin, ArrowRightLeft, Route } from "lucide-react";
import { scoreClass, starText } from "../utils/helpers";

export default function HospitalCard({
  hospital,
  recommended,
  checked,
  onToggleCompare,
  onViewDoctors,
  onRoute,
}) {
  const id = hospital.id || hospital._id;
  const address =
    hospital.address ||
    [hospital.location?.address, hospital.location?.city].filter(Boolean).join(", ");
  const rating = hospital.rating?.overall ?? hospital.rating ?? 4;
  return (
    <article className="cc-surface relative overflow-hidden p-5 animate-fade-up">
      <div className="absolute inset-y-0 left-0 w-1 bg-[#00B8A9]" />
      <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-semibold text-[#0A1628]">
              {hospital.name}
            </h3>
            {recommended && (
              <span className="animate-pulse-slow rounded-full bg-[#00B8A9] px-3 py-1 text-xs font-semibold text-white">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={15} className="text-[#00B8A9]" />
            {address || "Address unavailable"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreClass(
            Number(hospital.score || 0)
          )}`}
        >
          Score {Math.round(Number(hospital.score || 0) * 100)}%
        </span>
      </div>

      <div className="mt-5 grid gap-3 pl-3 text-sm text-slate-700 md:grid-cols-4">
        <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Rating</p>
          <p className="mt-2 font-semibold text-[#0A1628]">
            {starText(rating)} ({rating})
          </p>
        </div>
        <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Distance</p>
          <p className="mt-2 font-semibold text-[#0A1628]">
            {hospital.distance_km ?? hospital.distance ?? 0} km
          </p>
        </div>
        <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Slots today</p>
          <p className="mt-2 font-semibold text-[#0A1628]">
            {hospital.available_slots_today ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2 rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
          {(hospital.facilities || []).slice(0, 4).map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {facility}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 pl-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] px-4 py-2 text-sm text-slate-700">
          <input checked={checked} onChange={() => onToggleCompare(id)} type="checkbox" />
          Compare
        </label>
        <button onClick={onViewDoctors} className="cc-btn-primary">
          View Doctors
        </button>
        <button onClick={onRoute} className="cc-btn-secondary">
          <Route size={16} />
          Route
        </button>
        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
          <ArrowRightLeft size={15} />
          Smart comparison enabled
        </span>
      </div>
    </article>
  );
}
