const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

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
  predictNoShow
};
