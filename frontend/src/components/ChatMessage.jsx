import { Bot, User } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-[#0A1628] text-white" : "bg-[#E5FAF6] text-[#008F83]"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={17} /> : <Bot size={18} />}
      </div>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "rounded-tr-sm bg-[#00B8A9] text-white"
            : "rounded-tl-sm border border-[rgba(0,184,169,0.14)] bg-white text-slate-700"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
