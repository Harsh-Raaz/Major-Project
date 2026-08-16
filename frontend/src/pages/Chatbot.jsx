import { useEffect, useRef, useState } from "react";
import { AlertCircle, MapPinned, RotateCcw, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ChatMessage from "../components/ChatMessage";
import ChatTypingIndicator from "../components/ChatTypingIndicator";
import { sendMockChatbotMessage } from "../api/chatbot";

const SESSION_KEY = "crowdcare_chatbot_session_id";
const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I’m your care assistant. Tell me what symptoms you’re experiencing, and I’ll guide you to the right department.",
};

const createSessionId = () =>
  window.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getSessionId = () => {
  const stored = window.sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const sessionId = createSessionId();
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
};

export default function Chatbot() {
  const navigate = useNavigate();
  const endOfMessagesRef = useRef(null);
  const [sessionId, setSessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, error, recommendation]);

  const sendMessage = async (event) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: "user", content: message }]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await sendMockChatbotMessage({ message, session_id: sessionId });
      setSessionId(response.session_id);
      window.sessionStorage.setItem(SESSION_KEY, response.session_id);
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: "assistant", content: response.reply },
      ]);
      if (response.is_complete) setRecommendation(response);
    } catch (requestError) {
      setError(requestError.message || "Unable to send your message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const startOver = () => {
    const newSessionId = createSessionId();
    window.sessionStorage.setItem(SESSION_KEY, newSessionId);
    setSessionId(newSessionId);
    setMessages([welcomeMessage]);
    setInput("");
    setError("");
    setRecommendation(null);
  };

  const findHospitals = () => {
    navigate(
      `/hospitals?department=${encodeURIComponent(recommendation.department)}&symptoms=${encodeURIComponent(
        recommendation.summary || ""
      )}`
    );
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
            <p className="mt-2 text-sm text-slate-600">Share your symptoms for guidance on the appropriate department.</p>
          </div>
          <button type="button" onClick={startOver} className="cc-btn-secondary px-4 py-2 text-sm">
            <RotateCcw size={16} /> New chat
          </button>
        </div>

        <div className="cc-surface overflow-hidden">
          <div className="h-[min(56vh,580px)] overflow-y-auto bg-[#F8FCFB] p-4 sm:p-6">
            <div className="grid gap-5">
              {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
              {isSending && <ChatTypingIndicator />}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 shrink-0" size={17} /> {error}
                </div>
              )}
              {recommendation && (
                <div className="rounded-2xl border border-[#9be7dd] bg-[#F0FDF9] p-4">
                  <p className="text-sm font-semibold text-[#0A1628]">Recommended department: {recommendation.department}</p>
                  {recommendation.urgency && recommendation.urgency !== "normal" && (
                    <p className="mt-1 text-sm text-amber-800">Priority: {recommendation.urgency}</p>
                  )}
                  <button type="button" onClick={findHospitals} className="cc-btn-primary mt-4 w-full justify-center sm:w-auto">
                    <MapPinned size={18} /> Find Hospitals for {recommendation.department}
                  </button>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </div>

          <form onSubmit={sendMessage} className="border-t border-[rgba(0,184,169,0.14)] bg-white p-3 sm:p-4">
            <label className="sr-only" htmlFor="chatbot-message">Describe your symptoms</label>
            <div className="flex items-end gap-2">
              <textarea id="chatbot-message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }} rows="2" disabled={isSending} placeholder="Describe your symptoms..." className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[rgba(0,184,169,0.2)] px-4 py-3 text-sm outline-none transition focus:border-[#00B8A9] focus:ring-4 focus:ring-[#00B8A9]/10 disabled:bg-slate-50" />
              <button type="submit" disabled={isSending || !input.trim()} className="cc-btn-primary h-[52px] shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
                <Send size={18} /> <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-2 px-1 text-xs text-slate-500">Press Enter to send, or Shift + Enter for a new line. This assistant does not replace professional medical advice.</p>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}
