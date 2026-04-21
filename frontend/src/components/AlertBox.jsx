import { AlertTriangle } from "lucide-react";

export default function AlertBox({ type = "info", text }) {
  const classes =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : type === "success"
        ? "border-green-200 bg-green-50 text-green-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
  return (
    <div className={`rounded-xl border p-4 ${classes}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <p className="font-medium">{text}</p>
      </div>
    </div>
  );
}

