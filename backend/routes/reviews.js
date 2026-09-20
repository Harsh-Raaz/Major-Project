const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

router.post('/', async (req, res) => {
  try {
    const { appointment_id, patient_id, rating, text } = req.body;
    const review = new Review({ appointment_id, patient_id, rating, text });
    await review.save();
    res.status(201).json({ review, message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/appointment/:appointment_id', async (req, res) => {
  try {
    const review = await Review.findOne({ appointment_id: req.params.appointment_id });
    res.json(review || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
