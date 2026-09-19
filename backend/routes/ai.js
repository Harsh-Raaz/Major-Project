const express = require('express');
const router = express.Router();
const axios = require('axios');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const {
  suggestDepartment,
  recommendHospitals,
  recommendDoctors,
  getSeasonalAlert,
  predictNoShow,
  sendChatbotMessage,
  resetChatbotSession
} = require('../services/aiService');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

async function getScoredHospitalsForDepartment(department, patientLat, patientLng) {
  const query = { is_active: true };
  if (department) {
    query.departments = department;
  }
  const hospitals = await Hospital.find(query);
  const today = new Date().toISOString().split('T')[0];
  const Appointment = require('../models/Appointment');

  const hospitalData = await Promise.all(
    hospitals.map(async (h) => {
      const slots = await Slot.find({
        hospital_id: h._id,
        date: today
      });
      const hospitalAppointments = await Appointment.find({
        hospital_id: h._id,
        status: { $in: ['confirmed', 'rescheduled'] }
      }).select('estimated_wait_mins');
      const avgWait = hospitalAppointments.length
        ? hospitalAppointments.reduce((sum, a) => sum + (a.estimated_wait_mins || 0), 0) / hospitalAppointments.length
        : 20;
      return {
        _id: h._id,
        name: h.name,
        lat: h.location?.lat,
        lng: h.location?.lng,
        address: h.location?.address,
        rating: h.rating.overall,
        available_slots: slots.filter((s) => s.status !== 'full').length,
        avg_wait_time: Math.round(avgWait),
        departments: h.departments,
        facilities: h.facilities
      };
    })
  );

  return recommendHospitals(hospitalData, patientLat, patientLng);
}

router.post('/suggest-department', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const month = new Date().getMonth() + 1;
    const result = await suggestDepartment(symptoms, month);
    if (result === null) {
      return res.status(500).json({ message: 'AI service unavailable' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/recommend-hospitals', async (req, res) => {
  try {
    const { patient_lat, patient_lng, department } = req.body;
    const result = await getScoredHospitalsForDepartment(department, patient_lat, patient_lng);
    if (result === null) {
      return res.status(500).json({ message: 'AI service unavailable' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/recommend-doctors', async (req, res) => {
  try {
    const { hospital_id, department } = req.body;
    const doctors = await Doctor.find({
      hospital_id,
      department,
      available: true
    });
    const doctorData = doctors.map((d) => ({
      _id: d._id,
      name: d.name,
      department: d.department,
      rating: d.rating,
      experience_years: d.experience_years,
      current_patients_today: d.current_patients_today,
      max_patients_per_day: d.max_patients_per_day,
      avg_consultation_mins: d.avg_consultation_mins,
      qualification: d.qualification
    }));
    const result = await recommendDoctors(doctorData);
    if (result === null) {
      return res.status(500).json({ message: 'AI service unavailable' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/classify-priority', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/classify-priority`, { symptoms });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/load-balance-slot', async (req, res) => {
  try {
    const { slots } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/load-balance-slot`, { slots });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/seasonal-alert', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const month = new Date().getMonth() + 1;
    const result = await getSeasonalAlert(month, symptoms);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/seasonal-calendar', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/seasonal-calendar`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/predict-noshow', async (req, res) => {
  try {
    const result = await predictNoShow(req.body);

    if (!result) {
      return res.status(500).json({
        message: 'AI service unavailable'
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

router.post('/chatbot/message', async (req, res) => {
  try {
    const { session_id, message, patient_lat, patient_lng } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        message: 'Message is required.'
      });
    }

    const result = await sendChatbotMessage(session_id || null, message.trim());

    if (result?.unavailable) {
      return res.status(503).json({
        message: 'AI service unavailable',
        reply: result.reply,
        is_complete: false,
        department: null,
        urgency: null,
        summary: null,
        seasonal_alert: null,
        session_id: result.session_id || session_id || null
      });
    }

    const shouldShowHospitals =
      result.department && result.department !== 'Emergency' && result.is_complete;

    if (shouldShowHospitals) {
      try {
        const lat = patient_lat || 12.9716;
        const lng = patient_lng || 77.5946;
        const scoredHospitals = await getScoredHospitalsForDepartment(result.department, lat, lng);
        if (Array.isArray(scoredHospitals)) {
          result.hospital_preview = scoredHospitals.slice(0, 3).map((h) => ({
            _id: h._id,
            name: h.name,
            address: h.address,
            rating: h.rating,
            distance_km: h.distance_km,
            available_slots: h.available_slots,
            score: h.score
          }));
        }
      } catch (previewError) {
        console.error('Hospital preview enrichment failed:', previewError.message);
        // Chatbot response still succeeds without a preview - this is
        // a nice-to-have addition, not a required part of the response.
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

router.post('/chatbot/reset', async (req, res) => {
  try {
    const { session_id } = req.body || {};

    if (!session_id || typeof session_id !== 'string' || !session_id.trim()) {
      return res.status(400).json({
        message: 'session_id is required.'
      });
    }

    const result = await resetChatbotSession(session_id.trim());

    if (result?.unavailable) {
      return res.status(200).json({
        status: 'reset',
        session_id: result.session_id || session_id,
        message: 'AI service unavailable; reset was accepted by Node.'
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
