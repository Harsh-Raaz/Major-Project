import { useState } from "react";
import { Clock3, Hospital, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import AlertBox from "../components/AlertBox";
import Loader from "../components/Loader";
import { seasonalAlert, suggestDepartment } from "../api/ai";

export default function Home() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onSearch = async () => {
    if (!symptoms.trim()) return toast.error("Please enter symptoms");
    setLoading(true);
    try {
      const [deptRes, alertRes] = await Promise.all([suggestDepartment(symptoms), seasonalAlert(symptoms)]);
      setResult({
        department: deptRes.data?.department,
        seasonal_alert: deptRes.data?.seasonal_alert ?? alertRes.data?.seasonal_alert ?? alertRes.data ?? null,
      });
    } catch {
      toast.error("Failed to process symptoms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <section className="rounded-3xl bg-gradient-to-br from-blue-100 to-emerald-100 p-8 text-center shadow-md md:p-12">
        <h1 className="text-3xl font-bold md:text-5xl">Find the right hospital, right doctor, right now.</h1>
        <p className="mx-auto mt-3 max-w-3xl text-blue-800">
          AI-powered care access with smart recommendations, wait-time visibility, and early warning alerts.
        </p>
        <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4 shadow sm:flex-row">
          <input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="flex-1 rounded-xl border border-blue-200 px-4 py-3 outline-none ring-blue-300 focus:ring-2"
            placeholder="Type symptoms e.g. fever headache rash"
          />
          <button onClick={onSearch} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
            {loading ? <Loader small /> : "Search"}
          </button>
        </div>
        {result?.department && (
          <div className="mx-auto mt-6 max-w-3xl">
            <AlertBox type="success" text={`Based on your symptoms we suggest: ${result.department}`} />
          </div>
        )}
        {result?.seasonal_alert && (
          <div className="mx-auto mt-4 max-w-3xl">
            <AlertBox type="error" text={result.seasonal_alert?.message || result.seasonal_alert} />
          </div>
        )}
        {result?.department && (
          <button
            onClick={() =>
              navigate(`/hospitals?department=${encodeURIComponent(result.department)}&symptoms=${encodeURIComponent(symptoms)}`)
            }
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white"
          >
            Find Hospitals
          </button>
        )}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          { title: "AI Recommendation", text: "Smartly ranks nearby hospitals.", icon: <Hospital /> },
          { title: "Wait Time Insights", text: "Choose less crowded options.", icon: <Clock3 /> },
          { title: "Seasonal Alerts", text: "Get disease pattern warnings.", icon: <ShieldAlert /> },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="mb-2 text-blue-700">{item.icon}</div>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-blue-700">{item.text}</p>
          </div>
        ))}
      </section>
    </AppLayout>
  );
}

