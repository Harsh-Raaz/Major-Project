export default function StatsCard({ label, value }) {
  return (
    <div className="cc-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-semibold text-[#0A1628]">
        {value ?? 0}
      </p>
    </div>
  );
}
