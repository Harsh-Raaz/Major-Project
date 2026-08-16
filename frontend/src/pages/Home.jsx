import { useState } from "react";
import { Clock3, Hospital, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import AlertBox from "../components/AlertBox";
import Loader from "../components/Loader";
import { suggestDepartment, classifyPriority } from "../api/ai";

export default function Home() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onSearch = async () => {
    if (!symptoms.trim()) return toast.error("Please enter symptoms");
    setLoading(true);
    setResult(null);
    try {
      const [deptRes, priorityRes] = await Promise.all([
        suggestDepartment(symptoms),
        classifyPriority(symptoms),
      ]);
      const departmentData = deptRes.data || {};
      const priorityData = priorityRes.data || null;
      const possibleMatches = Array.isArray(departmentData.all_matches)
        ? departmentData.all_matches
        : departmentData.department
          ? [departmentData.department]
          : [];
      const riskDiseases = Array.isArray(departmentData.seasonal_alert?.risk_diseases)
        ? departmentData.seasonal_alert.risk_diseases
        : [];

      setResult({
        department: departmentData.department,
        confidence: departmentData.confidence,
        possible_matches: possibleMatches,
        risk_diseases: riskDiseases,
        seasonal_alert: departmentData.seasonal_alert || null,
        priority: priorityData,
      });
    } catch {
      toast.error("Failed to process symptoms");
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      title: "AI Recommendation",
      text: "Smartly ranks nearby hospitals by clinical fit, distance, and availability.",
      icon: <Hospital size={20} />,
    },
    {
      title: "Wait Time Insights",
      text: "See crowd pressure before you travel so you can choose the calmest slot.",
      icon: <Clock3 size={20} />,
    },
    {
      title: "Seasonal Alerts",
      text: "Flag likely disease patterns early with contextual guidance from symptoms.",
      icon: <ShieldAlert size={20} />,
    },
  ];

  return (
    <AppLayout>
      <section className="cc-hero-grid relative overflow-hidden rounded-[32px] px-6 py-12 text-white shadow-[0_30px_80px_rgba(10,22,40,0.28)] md:px-10 md:py-16">
        <div className="absolute inset-0 opacity-30">
          <svg className="h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <path d="M0,420 C220,330 320,480 560,400 C760,335 910,180 1200,260 L1200,600 L0,600 Z" fill="rgba(0,184,169,0.18)" />
            <path d="M0,470 C200,520 390,350 620,410 C860,475 980,370 1200,440 L1200,600 L0,600 Z" fill="rgba(255,255,255,0.08)" />
          </svg>
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <p className="cc-eyebrow text-white/70 border-white/15">
              Clinical Precision
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
              Find the right hospital, the right doctor, at the right time.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/72">
              CrowdCare combines symptom triage, hospital discovery, and booking
              intelligence in one calm, modern care journey.
            </p>
          </div>

          <div className="cc-glass animate-fade-up rounded-[28px] p-5 md:p-6">
            <h2 className="font-display text-2xl font-semibold text-white">
              Start with symptoms
            </h2>
            <p className="mt-2 text-sm text-white/65">
              We will suggest a department, surface seasonal risk alerts, and
              route you into hospital recommendations without changing your current flow.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[148px] rounded-[22px] border border-white/15 bg-white/95 px-4 py-4 text-[#0A1628] outline-none ring-0 placeholder:text-slate-400 focus:border-[#00B8A9]"
                placeholder="Describe symptoms, duration, severity, and any warning signs"
              />
              <button onClick={onSearch} className="cc-btn-primary justify-center">
                {loading ? <Loader small /> : "Search Care Path"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 animate-fade-up">
        {result?.department && (
          <AlertBox
            type="success"
            text={`Based on your symptoms we suggest: ${result.department}${
              result.confidence ? ` (${result.confidence} confidence)` : ""
            }`}
          />
        )}
        {result?.priority && result.priority.priority !== "normal" && (
          <div
            className={`rounded-[20px] border p-4 ${
              result.priority.priority === "emergency"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              {result.priority.priority} priority
            </p>
            <p className="mt-1 text-sm font-medium">{result.priority.action}</p>
          </div>
        )}
        {result?.seasonal_alert && (
          <>
            <AlertBox
              type={
                result.seasonal_alert.tier === "high"
                  ? "error"
                  : result.seasonal_alert.tier === "elevated"
                    ? "warning"
                    : "info"
              }
              text={result.seasonal_alert.warning}
            />
            {result.seasonal_alert.matched_keywords?.length > 0 && (
              <p className="text-xs text-slate-500 -mt-2">
                Matched: {result.seasonal_alert.matched_keywords.join(", ")}
              </p>
            )}
          </>
        )}
        {(result?.possible_matches?.length > 0 || result?.risk_diseases?.length > 0) && (
          <div className="cc-surface p-6">
            {result.possible_matches?.length > 0 && (
              <>
                <p className="cc-eyebrow">Possible Departments</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.possible_matches.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[rgba(0,184,169,0.15)] bg-[#F8FFFD] px-3 py-1.5 text-sm font-medium text-[#0A1628]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
            {result.risk_diseases?.length > 0 && (
              <>
                <p className="cc-eyebrow mt-6">Seasonal Disease Possibilities</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.risk_diseases.slice(0, 6).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-sm font-medium text-[#b86a00]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
            {result?.department && (
              <button
                onClick={() =>
                  navigate(
                    `/hospitals?department=${encodeURIComponent(
                      result.department
                    )}&symptoms=${encodeURIComponent(symptoms)}`
                  )
                }
                className="cc-btn-primary mt-8"
              >
                Find Hospitals
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {featureCards.map((item) => (
          <div key={item.title} className="cc-surface animate-fade-up p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDF9] text-[#00B8A9]">
              {item.icon}
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-[#0A1628]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>
    </AppLayout>
  );
}
