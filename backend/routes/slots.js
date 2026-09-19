const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');

const DEFAULT_TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' }
];

function isTodayOrFuture(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr >= today;
}

async function ensureDoctorSlotsForDate(doctorId, date) {
  if (!doctorId || !date || !isTodayOrFuture(date)) {
    return;
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return;
  }

  const existingSlots = await Slot.find({
    doctor_id: doctorId,
    date
  }).select('start_time');

  const existingStartTimes = new Set(existingSlots.map((slot) => slot.start_time));
  const missingSlots = DEFAULT_TIME_SLOTS.filter(
    ({ start }) => !existingStartTimes.has(start)
  ).map(({ start, end }) => ({
    doctor_id: doctor._id,
    hospital_id: doctor.hospital_id,
    date,
    start_time: start,
    end_time: end,
    capacity: 5,
    current_bookings: 0,
    status: 'available',
    duration_mins: 60
  }));

  if (missingSlots.length > 0) {
    await Slot.insertMany(missingSlots);
  }
}

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

    if (req.query.doctor_id && req.query.date) {
      await ensureDoctorSlotsForDate(req.query.doctor_id, req.query.date);
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
