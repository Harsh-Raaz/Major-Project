import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { scoreClass, starText } from "../utils/helpers";

export default function DoctorCard({ doctor, bestMatch, onBook }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const load = Number(doctor.load_index ?? doctor.loadIndex ?? 0);
  const max = Number(
    doctor.max_patients_per_day ??
    doctor.max_patients ??
    doctor.maxPatients ?? 0
  );
  const current = Number(
    doctor.current_patients_today ??
    doctor.current_patients ??
    doctor.currentPatients ?? 0
  );
  const available = Math.max(max - current, 0);

  return (
    <article className="cc-surface relative overflow-hidden p-5 animate-fade-up">
      <div className="absolute inset-y-0 left-0 w-1 bg-[#00B8A9]" />
      <div className="pl-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl font-semibold text-[#0A1628]">
                {doctor.name}
              </h3>
              {bestMatch && (
                <span className="animate-pulse-slow rounded-full bg-[#00B8A9] px-3 py-1 text-xs font-semibold text-white">
                  Best Match
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">{doctor.qualification}</p>
          </div>
          <div className="text-right">
            <div
              className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreClass(
                Number(doctor.score || 0)
              )}`}
            >
              Score {Math.round(Number(doctor.score || 0) * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Rating</p>
            <p className="mt-2 font-semibold text-[#0A1628]">
              {starText(doctor.rating || 4)} ({doctor.rating || 4})
            </p>
          </div>
          <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Experience</p>
            <p className="mt-2 font-semibold text-[#0A1628]">
              {doctor.experience_years ?? doctor.experience ?? 0} years
            </p>
          </div>
          <div className="rounded-[18px] border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Available today</p>
            <p className="mt-2 font-semibold text-[#0A1628]">{available}</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={load} />
        </div>
        {doctor.score_breakdown && (
          <div className="mt-4">
            <button
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-xs font-medium text-[#00B8A9] underline"
            >
              {showBreakdown ? "Hide" : "Why this score?"}
            </button>
            {showBreakdown && (
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {Object.entries(doctor.score_breakdown).map(([label, value]) => (
                  <div key={label} className="rounded-[14px] border border-[rgba(0,184,169,0.15)] bg-white p-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{label.replace("_", " ")}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-[#00B8A9]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#0A1628]">{value}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-sm leading-6 text-slate-600">{doctor.bio}</p>
        {load > 75 && (
          <p className="mt-3 rounded-full bg-[#fff7e6] px-3 py-1 text-sm font-semibold text-[#b86a00] inline-flex">
            High patient load today
          </p>
        )}
        <div className="mt-5">
          <button onClick={onBook} className="cc-btn-primary">
            Book Appointment
          </button>
        </div>
      </div>
    </article>
  );
}
