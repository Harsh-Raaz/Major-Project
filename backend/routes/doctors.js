const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

router.get('/', async (req, res) => {
  try {
    const filter = { available: true };
    if (req.query.hospital_id) {
      filter.hospital_id = req.query.hospital_id;
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    const doctors = await Doctor.find(filter).populate('hospital_id', 'name location');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('hospital_id');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
