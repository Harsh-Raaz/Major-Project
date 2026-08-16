import { Bot } from "lucide-react";

export default function ChatTypingIndicator() {
  return (
    <div className="flex gap-3" aria-label="Care assistant is typing">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5FAF6] text-[#008F83]">
        <Bot size={18} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-[rgba(0,184,169,0.14)] bg-white px-4 py-4">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#00B8A9] [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#00B8A9] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#00B8A9]" />
      </div>
    </div>
  );
}
