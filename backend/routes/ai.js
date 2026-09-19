const express = require('express');
const router = express.Router();
const axios = require('axios');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const { createAppointment } = require('./appointments');
const Patient = require('../models/Patient');
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

const _bookingSessions = {};

function _getBookingSession(sessionId) {
  if (!_bookingSessions[sessionId]) {
    _bookingSessions[sessionId] = { stage: null };
  }
  return _bookingSessions[sessionId];
}

function _resetBookingSession(sessionId) {
  delete _bookingSessions[sessionId];
}

function _matchByNumberOrName(message, options, nameField) {
  const trimmed = message.trim();
  const asNumber = parseInt(trimmed, 10);
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= options.length) {
    return options[asNumber - 1];
  }
  const lowered = trimmed.toLowerCase();
  return options.find((opt) => String(opt[nameField]).toLowerCase().includes(lowered)) || null;
}

function _formatHospitalList(hospitals) {
  return hospitals
    .map((h, i) => `${i + 1}. ${h.name} - ${h.distance_km} km away, rated ${h.rating}`)
    .join('\n');
}

function _formatDoctorList(doctors) {
  return doctors
    .map((d, i) => `${i + 1}. ${d.name} - ${d.experience_years} yrs experience, rated ${d.rating}`)
    .join('\n');
}

function _formatSlotList(slots) {
  return slots
    .map((s, i) => `${i + 1}. ${s.date} ${s.start_time} - ${s.end_time} (${s.status})`)
    .join('\n');
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

router.post('/chatbot/booking-message', async (req, res) => {
  try {
    const { session_id, message, patient_id, department, patient_lat, patient_lng } = req.body || {};

    if (!session_id || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'session_id and message are required' });
    }

    const booking = _getBookingSession(session_id);

    if (booking.stage === null) {
      if (!department) {
        return res.status(400).json({ message: 'department is required to start a booking session' });
      }
      const hospitals = await getScoredHospitalsForDepartment(
        department,
        patient_lat || 12.9716,
        patient_lng || 77.5946
      );
      if (!Array.isArray(hospitals) || hospitals.length === 0) {
        return res.json({
          reply: 'No hospitals are currently available for this department.',
          stage: 'no_options',
          session_id
        });
      }
      booking.stage = 'choose_hospital';
      booking.department = department;
      booking.hospitals = hospitals.slice(0, 5);
      return res.json({
        reply: `Here are hospitals for ${department}. Reply with a number to choose one:\n\n${_formatHospitalList(booking.hospitals)}`,
        stage: booking.stage,
        options: booking.hospitals,
        session_id
      });
    }

    if (booking.stage === 'choose_hospital') {
      const chosen = _matchByNumberOrName(message, booking.hospitals, 'name');
      if (!chosen) {
        return res.json({
          reply: `I didn't recognize that. Please reply with a number from 1 to ${booking.hospitals.length}, or the hospital name.`,
          stage: booking.stage,
          options: booking.hospitals,
          session_id
        });
      }
      booking.selected_hospital = chosen;

      const Doctor = require('../models/Doctor');
      const doctors = await Doctor.find({
        hospital_id: chosen._id,
        department: booking.department,
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
      const scoredDoctors = await recommendDoctors(doctorData);

      if (!Array.isArray(scoredDoctors) || scoredDoctors.length === 0) {
        _resetBookingSession(session_id);
        return res.json({
          reply: `No doctors are currently available at ${chosen.name} for this department. Please try a different hospital by starting again.`,
          stage: 'no_options',
          session_id
        });
      }

      booking.stage = 'choose_doctor';
      booking.doctors = scoredDoctors.slice(0, 5);
      return res.json({
        reply: `You chose ${chosen.name}. Here are available doctors:\n\n${_formatDoctorList(booking.doctors)}`,
        stage: booking.stage,
        options: booking.doctors,
        session_id
      });
    }

    if (booking.stage === 'choose_doctor') {
      const chosen = _matchByNumberOrName(message, booking.doctors, 'name');
      if (!chosen) {
        return res.json({
          reply: `I didn't recognize that. Please reply with a number from 1 to ${booking.doctors.length}, or the doctor's name.`,
          stage: booking.stage,
          options: booking.doctors,
          session_id
        });
      }
      booking.selected_doctor = chosen;

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentTime = now.toTimeString().slice(0, 5);
      const slots = await Slot.find({
        doctor_id: chosen._id,
        date: { $gte: today },
        status: { $ne: 'full' }
      }).sort({ date: 1, start_time: 1 });
      const upcomingSlots = slots.filter((slot) => slot.date > today || slot.start_time > currentTime);

      if (!upcomingSlots.length) {
        _resetBookingSession(session_id);
        return res.json({
          reply: `No upcoming slots for ${chosen.name}. Please try a different doctor by starting again.`,
          stage: 'no_options',
          session_id
        });
      }

      booking.stage = 'choose_slot';
      booking.slots = upcomingSlots.slice(0, 6);
      return res.json({
        reply: `You chose ${chosen.name}. Here are upcoming slots:\n\n${_formatSlotList(booking.slots)}`,
        stage: booking.stage,
        options: booking.slots,
        session_id
      });
    }

    if (booking.stage === 'choose_slot') {
      const trimmed = message.trim();
      const asNumber = parseInt(trimmed, 10);
      const chosen = (!isNaN(asNumber) && asNumber >= 1 && asNumber <= booking.slots.length)
        ? booking.slots[asNumber - 1]
        : null;
      if (!chosen) {
        return res.json({
          reply: `Please reply with a number from 1 to ${booking.slots.length} to choose a slot.`,
          stage: booking.stage,
          options: booking.slots,
          session_id
        });
      }
      booking.selected_slot = chosen;
      booking.stage = 'confirm';
      return res.json({
        reply: `Confirm booking: ${booking.selected_doctor.name} at ${booking.selected_hospital.name}, ${chosen.date} ${chosen.start_time}-${chosen.end_time}. Reply "yes" to confirm or "no" to cancel.`,
        stage: booking.stage,
        session_id
      });
    }

    if (booking.stage === 'confirm') {
      const lowered = message.trim().toLowerCase();
      if (lowered !== 'yes' && lowered !== 'confirm') {
        _resetBookingSession(session_id);
        return res.json({
          reply: 'Booking cancelled. Let me know if you would like to start over.',
          stage: 'cancelled',
          session_id
        });
      }
      if (!patient_id) {
        return res.status(400).json({ message: 'patient_id is required to confirm a booking' });
      }

      const result = await createAppointment({
        patient_id,
        doctor_id: booking.selected_doctor._id,
        slot_id: booking.selected_slot._id,
        hospital_id: booking.selected_hospital._id,
        department: booking.department,
        symptoms: '',
        priority: 'normal'
      });

      if (result.error) {
        _resetBookingSession(session_id);
        return res.json({
          reply: `Sorry, that booking could not be completed: ${result.message}. Please start over if you'd like to try again.`,
          stage: 'failed',
          session_id
        });
      }

      _resetBookingSession(session_id);
      return res.json({
        reply: `Your appointment is confirmed with ${booking.selected_doctor?.name || ''} at ${booking.selected_hospital?.name || ''}. Estimated wait time: ${result.estimated_wait_mins} minutes.`,
        stage: 'booked',
        appointment: result.appointment,
        session_id
      });
    }

    return res.status(400).json({ message: 'Unknown booking stage' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
