import ProgressBar from "./ProgressBar";
import { scoreClass, starText } from "../utils/helpers";

export default function DoctorCard({ doctor, bestMatch, onBook }) {
  const load = Number(doctor.load_index ?? doctor.loadIndex ?? 0);
  const max = Number(doctor.max_patients ?? doctor.maxPatients ?? 0);
  const current = Number(doctor.current_patients ?? doctor.currentPatients ?? 0);
  const available = Math.max(max - current, 0);

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-blue-950">{doctor.name}</h3>
          <p className="text-sm text-blue-700">{doctor.qualification}</p>
        </div>
        <div className="text-right">
          {bestMatch && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Best Match</span>}
          <div className={`mt-2 rounded-full px-3 py-1 text-sm font-semibold ${scoreClass(Number(doctor.score || 0))}`}>
            Score {Math.round(Number(doctor.score || 0) * 100)}%
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-blue-800 md:grid-cols-3">
        <p>Rating: {starText(doctor.rating || 4)} ({doctor.rating || 4})</p>
        <p>Experience: {doctor.experience_years ?? doctor.experience ?? 0} years</p>
        <p>Available slots today: {available}</p>
      </div>
      <div className="mt-3">
        <ProgressBar value={load} />
      </div>
      <p className="mt-3 text-sm text-blue-700">{doctor.bio}</p>
      {load > 75 && <p className="mt-2 text-sm font-semibold text-orange-600">High patient load today</p>}
      <button onClick={onBook} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white">Book Appointment</button>
    </article>
  );
}

