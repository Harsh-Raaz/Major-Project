import { Bot, Info, User } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isInfo =
    message.responseType === "faq" || message.responseType === "jargon_translation";

  return (
    <div className={`cc-chat-enter flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-[#0A1628] text-white" : "bg-[#E5FAF6] text-[#008F83]"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={17} /> : <Bot size={18} />}
      </div>
      <div
        className={`max-w-[75%] rounded-[16px] px-4 py-3 text-sm leading-6 ${
          isUser
            ? "bg-[#00B8A9] text-white"
            : isInfo
              ? "border-l-[3px] border-sky-400 bg-[#F3F8FC] text-[#0A1628]"
              : "bg-[#F4F7FA] text-[#0A1628]"
        }`}
      >
        {isInfo && (
          <Info size={14} className="mb-1.5 text-sky-500" aria-hidden="true" />
        )}
        {message.content}
      </div>
    </div>
  );
}
