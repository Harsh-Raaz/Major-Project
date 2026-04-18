const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');

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
