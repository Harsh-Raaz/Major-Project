const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

router.post('/', async (req, res) => {
  try {
    const {
      doctor_id,
      hospital_id,
      date,
      start_time,
      end_time,
      capacity,
      duration_mins
    } = req.body;

    if (!doctor_id || !hospital_id || !date || !start_time || !end_time) {
      return res.status(400).json({
        message: 'doctor_id, hospital_id, date, start_time, end_time are required'
      });
    }

    const slot = new Slot({
      doctor_id,
      hospital_id,
      date,
      start_time,
      end_time,
      capacity: capacity || 5,
      duration_mins: duration_mins || 60,
      current_bookings: 0,
      status: 'available'
    });

    await slot.save();
    res.status(201).json({ slot, message: 'Slot created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.doctor_id) {
      filter.doctor_id = req.query.doctor_id;
    }
    if (req.query.date) {
      filter.date = req.query.date;
    }
    const slots = await Slot.find(filter).populate(
      'doctor_id',
      'name avg_consultation_mins'
    );
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
