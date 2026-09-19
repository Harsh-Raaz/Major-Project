import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, RotateCcw, Send, Siren, Star } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AlertBox from "../components/AlertBox";
import ChatMessage from "../components/ChatMessage";
import ChatTypingIndicator from "../components/ChatTypingIndicator";
import { resetChatbotSession, sendChatbotMessage } from "../api/chatbot";

const SESSION_KEY = "crowdcare_chatbot_session_id";

const SIGNAL_ITEMS = [
  { key: "duration", label: "Duration" },
  { key: "severity", label: "Severity" },
  { key: "temperature", label: "Temperature" },
  { key: "functional_impact", label: "Impact" },
];

const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I’m your care assistant. Tell me what symptoms you’re experiencing, and I’ll guide you to the right department.",
};

const getStoredSessionId = () => window.sessionStorage.getItem(SESSION_KEY) || "";

const requestErrorMessage = (requestError, fallback) =>
  requestError.response?.data?.message || requestError.message || fallback;

const seasonalAlertType = (tier) => {
  if (tier === "high") return "error";
  if (tier === "elevated") return "warning";
  return "info";
};

const urgencyPillClass = (urgency) => {
  if (urgency === "emergency") return "bg-red-600 text-white";
  if (urgency === "urgent") return "bg-amber-400 text-[#0A1628]";
  return "bg-emerald-500 text-white";
};

export default function Chatbot() {
  const endOfMessagesRef = useRef(null);
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [bookingIntent, setBookingIntent] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, error]);

  const persistSessionId = (nextSessionId) => {
    if (!nextSessionId) return;
    window.sessionStorage.setItem(SESSION_KEY, nextSessionId);
    setSessionId(nextSessionId);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", content: message },
    ]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const { data: response } = await sendChatbotMessage({
        message,
        session_id: sessionId || undefined,
        patient_lat: coords?.lat,
        patient_lng: coords?.lng,
      });
      persistSessionId(response.session_id);

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: response.reply,
          responseType: response.response_type,
          department: response.department,
          urgency: response.urgency,
          summary: response.summary,
          signalsCollected: response.signals_collected,
          seasonalAlert: response.seasonal_alert,
          hospitalPreview: response.hospital_preview,
        },
      ]);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Unable to send your message. Please try again."));
    } finally {
      setIsSending(false);
    }
  };

  const startOver = async () => {
    setError("");
    if (sessionId) {
      try {
        await resetChatbotSession(sessionId);
      } catch (requestError) {
        setError(requestErrorMessage(requestError, "Could not reset the previous chat."));
      }
    }
    window.sessionStorage.removeItem(SESSION_KEY);
    setSessionId("");
    setMessages([welcomeMessage]);
    setInput("");
    setBookingIntent(null);
  };

  const startChatbotBooking = (hospital, department) => {
    setBookingIntent({ hospital, department });
  };

  return (
    <AppLayout>
      <section className="mx-auto max-w-3xl animate-fade-up">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="cc-eyebrow">AI Care Assistant</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-[#0A1628] md:text-4xl">
              Find your care path
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Share your symptoms for guidance on the appropriate department.
            </p>
          </div>
          <button type="button" onClick={startOver} className="cc-btn-secondary px-4 py-2 text-sm">
            <RotateCcw size={16} /> New chat
          </button>
        </div>

        <div className="cc-surface overflow-hidden">
          <div className="h-[min(56vh,580px)] overflow-y-auto bg-[#F8FCFB] p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              {messages.map((message) =>
                message.role === "assistant" && message.responseType === "emergency" ? (
                  <EmergencyBanner key={message.id} text={message.content} />
                ) : (
                  <div key={message.id} className="flex flex-col gap-2">
                    <ChatMessage message={message} />
                    {message.responseType === "triage_complete" && (
                      <TriageSummaryCard
                        message={message}
                        bookingIntent={bookingIntent}
                        onBook={startChatbotBooking}
                      />
                    )}
                  </div>
                )
              )}
              {isSending && <ChatTypingIndicator />}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 shrink-0" size={17} /> {error}
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </div>

          <form onSubmit={sendMessage} className="border-t border-[rgba(0,184,169,0.14)] bg-white p-3 sm:p-4">
            <label className="sr-only" htmlFor="chatbot-message">
              Describe your symptoms
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="chatbot-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows="2"
                disabled={isSending}
                placeholder="Describe your symptoms..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[rgba(0,184,169,0.2)] px-4 py-3 text-sm outline-none transition focus:border-[#00B8A9] focus:ring-4 focus:ring-[#00B8A9]/10 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="cc-btn-primary h-[52px] shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} /> <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-2 px-1 text-xs text-slate-500">
              Press Enter to send, or Shift + Enter for a new line. This assistant does not replace
              professional medical advice.
            </p>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}

function EmergencyBanner({ text }) {
  return (
    <div
      role="alert"
      className="cc-chat-enter w-full rounded-[16px] bg-red-600 px-4 py-4 text-base font-bold leading-6 text-white shadow-[0_10px_28px_rgba(220,38,38,0.28)]"
    >
      <div className="flex items-start gap-3">
        <Siren size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>{text}</p>
      </div>
    </div>
  );
}

function TriageSummaryCard({ message, bookingIntent, onBook }) {
  const hospitals = Array.isArray(message.hospitalPreview)
    ? message.hospitalPreview.slice(0, 3)
    : [];
  const hospitalsPath = `/hospitals?department=${encodeURIComponent(message.department || "")}${
    message.summary ? `&symptoms=${encodeURIComponent(message.summary)}` : ""
  }`;

  return (
    <div className="cc-chat-enter rounded-[16px] border border-[rgba(0,184,169,0.18)] bg-white p-4 shadow-[0_4px_24px_rgba(0,184,169,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-[#0A1628]">{message.department}</h2>
        {message.urgency && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${urgencyPillClass(
              message.urgency
            )}`}
          >
            {message.urgency}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SIGNAL_ITEMS.map((signal) => {
          const collected = Boolean(message.signalsCollected?.[signal.key]);
          return (
            <span
              key={signal.key}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                collected ? "bg-[#E5FAF6] text-[#008F83]" : "bg-slate-100 text-slate-400"
              }`}
            >
              <Check size={12} aria-hidden="true" />
              {signal.label}
            </span>
          );
        })}
      </div>

      {message.summary && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{message.summary}</p>
      )}

      {message.seasonalAlert?.warning && (
        <div className="mt-3">
          <AlertBox
            type={seasonalAlertType(message.seasonalAlert.tier)}
            text={message.seasonalAlert.warning}
          />
        </div>
      )}

      {hospitals.length > 0 && (
        <div className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {hospitals.map((hospital) => (
              <HospitalPreviewCard
                key={hospital._id || hospital.name}
                hospital={hospital}
                selected={bookingIntent?.hospital?._id === hospital._id}
                onBook={() => onBook(hospital, message.department)}
              />
            ))}
          </div>
          <Link to={hospitalsPath} className="mt-3 inline-block text-sm font-medium text-[#00B8A9] hover:underline">
            See all hospitals
          </Link>
        </div>
      )}
    </div>
  );
}

function HospitalPreviewCard({ hospital, selected, onBook }) {
  const scorePercent = Math.round(Number(hospital.score || 0) * 100);

  return (
    <article className="min-w-[210px] max-w-[230px] shrink-0 rounded-[16px] border border-[rgba(0,184,169,0.16)] bg-[#F8FFFD] p-3">
      <h3 className="line-clamp-2 text-sm font-semibold text-[#0A1628]">{hospital.name}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {hospital.distance_km != null ? `${hospital.distance_km} km` : "Distance unavailable"}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0A1628]">
        <Star size={12} className="text-amber-500" aria-hidden="true" />
        {hospital.rating ?? "—"}
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full bg-[#00B8A9]"
          style={{ width: `${Math.min(Math.max(scorePercent, 0), 100)}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onBook}
        className="cc-btn-primary mt-3 w-full justify-center px-3 py-2 text-xs"
      >
        {selected ? "Booking selected" : "Book with Chatbot"}
      </button>
    </article>
  );
}
