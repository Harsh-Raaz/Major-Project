const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

router.post('/register', async (req, res) => {
  try {
    const {
      name, age, gender, phone, email, location, scholarship, hypertension,
      diabetes, alcoholism, handicap, sms_received
    } = req.body;
    const normalizedLocation =
      typeof location === 'string' ? { address: location } : location;
    const existing = await Patient.findOne({ phone });
    if (existing) {
      return res.json({
        patient: existing,
        message: 'Patient already exists'
      });
    }
    const patient = new Patient({
      name,
      age,
      gender,
      phone,
      email,
      location: normalizedLocation,
      scholarship,
      hypertension,
      diabetes,
      alcoholism,
      handicap,
      sms_received
    });
    await patient.save();
    res.status(201).json({
      patient,
      message: 'Patient registered successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
