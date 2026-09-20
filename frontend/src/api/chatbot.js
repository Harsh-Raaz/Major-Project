// Chatbot.js
import { api } from "./axios";

export const sendChatbotMessage = ({
  message,
  session_id: sessionId,
  patient_lat: patientLat,
  patient_lng: patientLng,
}) => {
  const payload = { message };
  if (sessionId) payload.session_id = sessionId;
  if (patientLat != null && patientLng != null) {
    payload.patient_lat = patientLat;
    payload.patient_lng = patientLng;
  }
  return api.post("/ai/chatbot/message", payload);
};

export const resetChatbotSession = (sessionId) =>
  api.post("/ai/chatbot/reset", { session_id: sessionId });

export const sendChatbotBookingMessage = ({
  session_id: sessionId,
  message,
  department,
  patient_id: patientId,
  patient_lat: patientLat,
  patient_lng: patientLng,
}) => {
  const payload = {
    session_id: sessionId,
    message,
  };
  if (department) payload.department = department;
  if (patientId) payload.patient_id = patientId;
  if (patientLat != null && patientLng != null) {
    payload.patient_lat = patientLat;
    payload.patient_lng = patientLng;
  }
  return api.post("/ai/chatbot/booking-message", payload);
};
