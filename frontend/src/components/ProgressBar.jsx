export default function ProgressBar({ value = 0 }) {
  const v = Number(value || 0);
  const color = v > 75 ? "bg-red-500" : v >= 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-blue-800">
        <span>Current Load</span>
        <span className="font-medium">{v}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
    </div>
  );
}

