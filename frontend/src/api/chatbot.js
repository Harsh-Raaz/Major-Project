import { api } from "./axios";

export const sendChatbotMessage = ({ message, session_id: sessionId }) =>
  api.post("/ai/chatbot/message", {
    message,
    session_id: sessionId,
  });

export const resetChatbotSession = (sessionId) =>
  api.post("/ai/chatbot/reset", { session_id: sessionId });
