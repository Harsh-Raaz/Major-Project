import { AlertTriangle } from "lucide-react";

export default function AlertBox({ type = "info", text }) {
  const classes =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
        ? "border-[rgba(0,184,169,0.18)] bg-[#F0FDF9] text-[#0A1628]"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_4px_24px_rgba(0,184,169,0.08)] ${classes}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white/70 p-2">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="font-medium leading-6">{text}</p>
      </div>
    </div>
  );
}
