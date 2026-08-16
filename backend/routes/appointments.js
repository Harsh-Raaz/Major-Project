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

function normalizePriority(priority) {
  const value = String(priority || 'normal').toLowerCase();
  return ['normal', 'urgent', 'emergency'].includes(value) ? value : 'normal';
}

async function autoCompleteExpiredAppointments() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 5);

  const expiredSlots = await Slot.find({
    $or: [
      { date: { $lt: todayStr } },
      { date: todayStr, end_time: { $lte: currentTime } }
    ]
  });

  if (expiredSlots.length === 0) {
    return 0;
  }

  const expiredSlotIds = expiredSlots.map((slot) => slot._id);
  const result = await Appointment.updateMany(
    {
      slot_id: { $in: expiredSlotIds },
      status: { $in: ['confirmed', 'rescheduled'] }
    },
    { $set: { status: 'completed' } }
  );

  return result.modifiedCount || 0;
}

router.get('/autocomplete', async (req, res) => {
  try {
    const completedCount = await autoCompleteExpiredAppointments();
    res.json({ completed_count: completedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

    const slotCheck = await Slot.findById(slot_id);
    if (!slotCheck) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    if (String(slotCheck.doctor_id) !== String(doctor_id)) {
      return res.status(400).json({ message: 'Selected slot does not belong to this doctor' });
    }
    if (String(slotCheck.hospital_id) !== String(hospital_id)) {
      return res.status(400).json({ message: 'Selected slot does not belong to this hospital' });
    }

    const patientsAhead = slotCheck.current_bookings;

    const slot = await Slot.findOneAndUpdate(
      { _id: slot_id, $expr: { $lt: ['$current_bookings', '$capacity'] } },
      { $inc: { current_bookings: 1 } },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: 'Slot is full',
        suggestion: 'Please join waitlist or choose another slot'
      });
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const estimatedWait = calculateWaitTime(
      patientsAhead,
      doctor.avg_consultation_mins
    );

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
      priority: normalizePriority(priority),
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

const binaryFeature = (value) => (Number(value) === 1 ? 1 : 0);
const historyIncludes = (history, term) =>
  (history || []).some((item) => String(item).toLowerCase().includes(term));

const buildNoShowFeatures = (appointment) => {
  const patient = appointment.patient_id || {};
  const slot = appointment.slot_id || {};
  const history = patient.medical_history || [];
  const slotDate = slot.date ? new Date(`${slot.date}T00:00:00`) : null;
  const bookedAt = appointment.booking_time || appointment.createdAt;
  const leadTime = slotDate && bookedAt
    ? Math.max(0, Math.ceil((slotDate - new Date(bookedAt)) / (1000 * 60 * 60 * 24)))
    : 1;

  return {
    // Age 30 and lead time 1 match the AI service's documented fallback values.
    age: Number.isFinite(Number(patient.age)) ? Number(patient.age) : 30,
    scholarship: binaryFeature(patient.scholarship),
    hypertension: binaryFeature(patient.hypertension) || Number(historyIncludes(history, 'hypertension')),
    diabetes: binaryFeature(patient.diabetes) || Number(historyIncludes(history, 'diabetes')),
    alcoholism: binaryFeature(patient.alcoholism) || Number(historyIncludes(history, 'alcohol')),
    handicap: Number.isFinite(Number(patient.handicap)) ? Number(patient.handicap) : 0,
    sms_received: binaryFeature(patient.sms_received),
    lead_time_days: leadTime,
    appointment_dow: slotDate ? slotDate.getDay() : 1,
    patient_appt_count: appointment.patient_appt_count || 1,
    gender_female: String(patient.gender || '').toLowerCase() === 'female' ? 1 : 0
  };
};

router.get('/doctor/:doctor_id', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor_id: req.params.doctor_id })
      .populate(
        'patient_id',
        'name age gender phone email medical_history scholarship hypertension diabetes alcoholism handicap sms_received'
      )
      .populate('slot_id', 'date start_time end_time')
      .populate('hospital_id', 'name location')
      .sort({ createdAt: -1 });

    const patientIds = [...new Set(
      appointments.map((appointment) => String(appointment.patient_id?._id || appointment.patient_id))
    )];
    const patientCounts = await Promise.all(
      patientIds.map(async (patientId) => [
        patientId,
        await Appointment.countDocuments({ patient_id: patientId })
      ])
    );
    const countsByPatientId = new Map(patientCounts);

    const data = appointments.map((appointment) => {
      const serialized = appointment.toObject();
      serialized.patient_appt_count = countsByPatientId.get(String(serialized.patient_id?._id)) || 1;
      serialized.no_show_features = buildNoShowFeatures(serialized);
      return serialized;
    });

    res.json({ appointments: data });
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
module.exports.autoCompleteExpiredAppointments = autoCompleteExpiredAppointments;
