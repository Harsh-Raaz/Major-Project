export default function StatsCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-blue-700">{label}</p>
      <p className="text-2xl font-bold text-blue-950">{value ?? 0}</p>
    </div>
  );
}

