const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const CHATBOT_TIMEOUT_MS = 15000;

async function suggestDepartment(symptoms, month) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/suggest-department`, {
      symptoms,
      month
    });
    return res.data;
  } catch {
    return null;
  }
}

async function sendChatbotMessage(sessionId, message) {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/chatbot/message`,
      { session_id: sessionId, message },
      { timeout: CHATBOT_TIMEOUT_MS }
    );
    return res.data;
  } catch (error) {
    const errMessage = error?.response?.data?.error || error?.message || 'AI service unavailable';
    console.error('Chatbot message failed:', errMessage);
    return {
      reply: 'I\'m unable to reach the care assistant right now. Please try again in a moment.',
      is_complete: false,
      department: null,
      urgency: null,
      summary: null,
      seasonal_alert: null,
      session_id: sessionId || null,
      unavailable: true
    };
  }
}

async function resetChatbotSession(sessionId) {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/chatbot/reset`,
      { session_id: sessionId },
      { timeout: CHATBOT_TIMEOUT_MS }
    );
    return res.data;
  } catch (error) {
    const errMessage = error?.response?.data?.error || error?.message || 'AI service unavailable';
    console.error('Chatbot reset failed:', errMessage);
    return {
      status: 'reset',
      session_id: sessionId || null,
      unavailable: true
    };
  }
}

async function recommendHospitals(hospitals, patientLat, patientLng) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/recommend-hospital`, {
      hospitals,
      patient_lat: patientLat,
      patient_lng: patientLng
    });
    return res.data;
  } catch {
    return null;
  }
}

async function recommendDoctors(doctors) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/recommend-doctor`, {
      doctors
    });
    return res.data;
  } catch {
    return null;
  }
}

async function estimateWait(patientsBefore, avgConsultMins) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/estimate-wait`, {
      patients_before: patientsBefore,
      avg_consultation_mins: avgConsultMins
    });
    return res.data;
  } catch {
    return null;
  }
}

async function getSeasonalAlert(month, symptoms) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/seasonal-alert`, {
      month,
      symptoms
    });
    return res.data;
  } catch {
    return null;
  }
}

async function getBusyHours(bookings) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/busy-hours`, {
      bookings
    });
    return res.data;
  } catch {
    return null;
  }
}
async function predictNoShow(data) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/predict-noshow`, data);
    return res.data;
  } catch (err) {
    console.error('No-show prediction failed:', err.message);
    return null;
  }
}

module.exports = {
  suggestDepartment,
  recommendHospitals,
  recommendDoctors,
  estimateWait,
  getSeasonalAlert,
  getBusyHours,
  predictNoShow,
  sendChatbotMessage,
  resetChatbotSession
};
