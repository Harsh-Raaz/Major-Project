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
          <div className="flex flex-col justify-center animate-fade-up">
            <p className="cc-eyebrow text-white/70 border-white/15">
              Clinical Precision
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.08] md:text-6xl lg:text-7xl">
              Find the right hospital,<br />
              the right doctor,<br />
              at the right time.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              CrowdCare combines symptom triage, hospital discovery, and booking
              intelligence in one calm, modern care journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#symptom-search" className="cc-btn-primary px-7 py-4 text-base">
                Search Care Path
              </a>
              <a href="/hospitals" className="rounded-full border border-white/25 px-7 py-4 text-base font-semibold text-white hover:border-white hover:bg-white/5 transition">
                Browse Hospitals
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <p className="font-display text-3xl font-bold text-[#00B8A9]">7+</p>
                <p className="mt-1 text-sm text-white/60">Bengaluru hospitals</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-[#00B8A9]">10</p>
                <p className="mt-1 text-sm text-white/60">Departments covered</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-[#00B8A9]">AI</p>
                <p className="mt-1 text-sm text-white/60">Powered triage</p>
              </div>
            </div>
          </div>

          <div id="symptom-search" className="cc-glass animate-fade-up rounded-[28px] p-6 md:p-8">
            <h2 className="font-display text-2xl font-semibold text-white">
              Start with symptoms
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Describe what you're feeling. We'll suggest the right department,
              flag seasonal disease risks, and find you the best available doctor.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[148px] rounded-[22px] border border-white/15 bg-white/95 px-4 py-4 text-[#0A1628] outline-none placeholder:text-slate-400 focus:border-[#00B8A9]"
                placeholder="Describe symptoms, duration, severity, and any warning signs"
              />
              <button onClick={onSearch} className="cc-btn-primary justify-center py-4 text-base font-bold">
                {loading ? 'Searching...' : 'Search Care Path →'}
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-white/45">
              Free · No registration required · Not a substitute for emergency care
            </p>
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

      <section className="mt-16 animate-fade-up">
        <div className="mb-10 text-center">
          <p className="cc-eyebrow">Simple by design</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-[#0A1628] md:text-4xl">
            From symptoms to booking in minutes
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Describe symptoms',
              body: 'Type what you feel. No medical jargon needed.',
            },
            {
              step: '02',
              title: 'Get department guidance',
              body: 'AI routes you to the right specialist area instantly.',
            },
            {
              step: '03',
              title: 'Compare hospitals',
              body: 'Ranked by wait time, distance, rating, and availability.',
            },
            {
              step: '04',
              title: 'Book in seconds',
              body: 'Confirm your slot. No phone calls, no queues.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-[20px] border border-[rgba(0,184,169,0.14)] bg-white p-6 shadow-[0_4px_24px_rgba(0,184,169,0.07)]"
            >
              <span className="font-display text-4xl font-bold text-[#00B8A9]/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-[#0A1628]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-[28px] bg-[#0A1628] px-8 py-10 md:px-12">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-2xl font-bold text-white md:text-3xl">
              Ready to find the right care?
            </p>
            <p className="mt-2 text-white/60">
              Join thousands of patients making smarter healthcare decisions.
            </p>
          </div>
          <a
            href="/chatbot"
            className="cc-btn-primary whitespace-nowrap px-8 py-4 text-base"
          >
            Try Care Assistant →
          </a>
        </div>
      </section>
    </AppLayout>
  );
}
