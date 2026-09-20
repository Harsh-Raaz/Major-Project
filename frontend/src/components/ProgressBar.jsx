export default function ProgressBar({ value = 0 }) {
  const numericValue = Math.min(Number(value || 0), 100);
  const color =
    numericValue > 75
      ? "bg-red-500"
      : numericValue >= 50
        ? "bg-[#F59E0B]"
        : "bg-[#00B8A9]";

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm text-slate-600">
        <span>Current Load</span>
        <span className="font-semibold text-[#0A1628]">{numericValue}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 rounded-full ${color}`}
          style={{ width: `${numericValue}%` }}
        />
      </div>
    </div>
  );
}
