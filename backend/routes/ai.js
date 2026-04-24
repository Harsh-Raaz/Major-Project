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
  getSeasonalAlert
} = require('../services/aiService');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

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
    const query = { is_active: true };
    if (department) {
      query.departments = department;
    }
    const hospitals = await Hospital.find(query);
    const today = new Date().toISOString().split('T')[0];

    const hospitalData = await Promise.all(
      hospitals.map(async (h) => {
        const slots = await Slot.find({
          hospital_id: h._id,
          date: today,
          status: { $ne: 'full' }
        });
        return {
          _id: h._id,
          name: h.name,
          lat: h.location?.lat,
          lng: h.location?.lng,
          address: h.location?.address,
          rating: h.rating.overall,
          available_slots: slots.length,
          avg_wait_time: 25,
          departments: h.departments,
          facilities: h.facilities
        };
      })
    );

    const result = await recommendHospitals(
      hospitalData,
      patient_lat,
      patient_lng
    );
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

module.exports = router;
