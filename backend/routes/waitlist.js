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

router.get('/', async (req, res) => {
  try {
    const query = {};

    if (req.query.patient_id) {
      query.patient_id = req.query.patient_id;
    }

    const entries = await Waitlist.find(query)
      .populate('doctor_id', 'name department')
      .populate('hospital_id', 'name location')
      .populate('slot_id', 'date start_time end_time')
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    const { slot_id, position, status } = entry;
    await Waitlist.findByIdAndDelete(req.params.id);

    if (status === 'waiting') {
      await Waitlist.updateMany(
        {
          slot_id,
          status: 'waiting',
          position: { $gt: position }
        },
        { $inc: { position: -1 } }
      );
    }

    res.json({ message: 'Removed from waitlist successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
