const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');
const Waitlist = require('../models/Waitlist');

function calculateWaitTime(patientsAhead, avgConsultMins) {
  const buffer = 3;
  return patientsAhead * (avgConsultMins + buffer);
}

function updateSlotStatus(slot) {
  const loadFactor = (slot.current_bookings / slot.capacity) * 100;
  if (loadFactor >= 100) {
    slot.status = 'full';
  } else if (loadFactor >= 80) {
    slot.status = 'almost_full';
  } else {
    slot.status = 'available';
  }
  return slot;
}

router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      slot_id,
      hospital_id,
      department,
      symptoms,
      priority
    } = req.body;

    const slot = await Slot.findById(slot_id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    if (slot.status === 'full') {
      return res.status(400).json({
        message: 'Slot is full',
        suggestion: 'Please join waitlist or choose another slot'
      });
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const patientsAhead = slot.current_bookings;
    const estimatedWait = calculateWaitTime(
      patientsAhead,
      doctor.avg_consultation_mins
    );

    slot.current_bookings += 1;
    updateSlotStatus(slot);
    await slot.save();

    await Doctor.findByIdAndUpdate(doctor_id, {
      $inc: { current_patients_today: 1 }
    });

    const appointment = new Appointment({
      patient_id,
      doctor_id,
      slot_id,
      hospital_id,
      department,
      symptoms,
      priority,
      estimated_wait_mins: estimatedWait
    });
    await appointment.save();

    res.status(201).json({
      appointment,
      estimated_wait_mins: estimatedWait,
      message: 'Appointment booked successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patient/:patient_id', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient_id: req.params.patient_id
    })
      .populate('doctor_id', 'name department rating')
      .populate('hospital_id', 'name location')
      .populate('slot_id', 'date start_time end_time');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const slot = await Slot.findById(appointment.slot_id);
    if (slot) {
      slot.current_bookings = Math.max(0, slot.current_bookings - 1);
      updateSlotStatus(slot);
      await slot.save();
    }

    await Doctor.findByIdAndUpdate(appointment.doctor_id, {
      $inc: { current_patients_today: -1 }
    });

    const nextWaitlisted = await Waitlist.findOne({
      slot_id: appointment.slot_id,
      status: 'waiting'
    })
      .sort({ position: 1 })
      .exec();

    if (nextWaitlisted) {
      nextWaitlisted.status = 'promoted';
      await nextWaitlisted.save();
    }

    res.json({
      message: 'Appointment cancelled successfully',
      promoted_waitlist: nextWaitlisted || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/reschedule', async (req, res) => {
  try {
    const { new_slot_id } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const oldSlot = await Slot.findById(appointment.slot_id);
    if (oldSlot) {
      oldSlot.current_bookings = Math.max(0, oldSlot.current_bookings - 1);
      updateSlotStatus(oldSlot);
      await oldSlot.save();
    }

    const newSlot = await Slot.findById(new_slot_id);
    if (!newSlot) {
      return res.status(404).json({ message: 'New slot not found' });
    }
    if (newSlot.status === 'full') {
      return res.status(400).json({ message: 'New slot is full' });
    }

    newSlot.current_bookings += 1;
    updateSlotStatus(newSlot);
    await newSlot.save();

    const doctor = await Doctor.findById(appointment.doctor_id);
    const avgMins = doctor ? doctor.avg_consultation_mins : 12;
    const estimatedWait = calculateWaitTime(newSlot.current_bookings - 1, avgMins);

    appointment.slot_id = new_slot_id;
    appointment.status = 'rescheduled';
    appointment.estimated_wait_mins = estimatedWait;
    await appointment.save();

    res.json({
      appointment,
      estimated_wait_mins: estimatedWait,
      message: 'Appointment rescheduled successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/followup', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      'doctor_id slot_id'
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const originalDateStr = appointment.slot_id.date;
    const [y, m, d] = originalDateStr.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + 7);
    const pad = (n) => String(n).padStart(2, '0');
    const suggested_date = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;

    const slots = await Slot.find({
      doctor_id: appointment.doctor_id._id,
      date: suggested_date,
      status: { $ne: 'full' }
    }).sort({ current_bookings: 1 });

    if (!slots.length) {
      return res.json({
        message: 'No slots available for follow up next week',
        suggested_date,
        slots: []
      });
    }

    const doctorName = appointment.doctor_id.name;
    res.json({
      message: `Follow-up with ${doctorName} suggested on ${suggested_date}`,
      suggested_date,
      doctor: appointment.doctor_id,
      slots
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
