import { scoreClass, starText } from "../utils/helpers";

export default function HospitalCard({ hospital, recommended, checked, onToggleCompare, onViewDoctors, onRoute }) {
  const id = hospital._id || hospital.id;
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-950">{hospital.name}</h3>
          <p className="text-sm text-blue-700">{hospital.address}</p>
        </div>
        <div className="flex items-center gap-2">
          {recommended && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Recommended</span>}
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreClass(Number(hospital.score || 0))}`}>
            Score: {Math.round(Number(hospital.score || 0) * 100)}%
          </span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-blue-800 md:grid-cols-4">
        <p>Rating: {starText(hospital.rating || 4)} ({hospital.rating || 4})</p>
        <p>Distance: {hospital.distance_km ?? hospital.distance ?? 0} km</p>
        <p>Available slots: {hospital.available_slots_today ?? 0}</p>
        <div className="flex flex-wrap gap-2">
          {(hospital.facilities || []).map((facility) => (
            <span key={facility} className="rounded-full bg-blue-50 px-2 py-1 text-xs">{facility}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input checked={checked} onChange={() => onToggleCompare(id)} type="checkbox" />
          Compare
        </label>
        <button onClick={onViewDoctors} className="rounded-lg bg-emerald-600 px-4 py-2 text-white">View Doctors</button>
        <button onClick={onRoute} className="rounded-lg border border-blue-200 px-4 py-2 text-blue-700">Route</button>
      </div>
    </article>
  );
}

