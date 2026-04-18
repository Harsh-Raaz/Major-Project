const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

router.post('/', async (req, res) => {
  try {
    const { patient_id, slot_id, doctor_id, hospital_id } = req.body;
    const count = await Waitlist.countDocuments({
      slot_id,
      status: 'waiting'
    });
    const position = count + 1;
    const waitlist = new Waitlist({
      patient_id,
      slot_id,
      doctor_id,
      hospital_id,
      position
    });
    await waitlist.save();
    res.status(201).json({
      waitlist,
      message: `You are number ${position} on the waitlist`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/slot/:slot_id', async (req, res) => {
  try {
    const entries = await Waitlist.find({
      slot_id: req.params.slot_id,
      status: 'waiting'
    })
      .populate('patient_id', 'name phone')
      .sort({ position: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
