const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

router.get('/patient/:patient_id', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient_id: req.params.patient_id,
      status: 'confirmed'
    })
      .populate('doctor_id', 'name department avg_consultation_mins')
      .populate('slot_id', 'date start_time end_time')
      .populate('hospital_id', 'name location');

    const notifications = [];
    const now = new Date();

    for (const appt of appointments) {
      const slot = appt.slot_id;
      if (slot && slot.date && slot.start_time) {
        const apptDateTime = new Date(`${slot.date}T${slot.start_time}:00`);
        const diffMins = (apptDateTime - now) / (1000 * 60);
        const doctorName = appt.doctor_id ? appt.doctor_id.name : 'Doctor';
        const hospitalName = appt.hospital_id ? appt.hospital_id.name : 'Hospital';

        if (diffMins > 0 && diffMins <= 60) {
          notifications.push({
            priority: 'high',
            type: 'reminder',
            message: `Reminder: Your appointment with ${doctorName} is in ${Math.round(diffMins)} minutes at ${hospitalName}`
          });
        } else if (diffMins > 60 && diffMins <= 1440) {
          notifications.push({
            priority: 'medium',
            type: 'upcoming',
            message: `Upcoming: Appointment with ${doctorName} tomorrow at ${slot.start_time}`
          });
        }
      }

      if (appt.estimated_wait_mins > 45) {
        notifications.push({
          priority: 'medium',
          type: 'wait_warning',
          message: `Your estimated wait time is ${appt.estimated_wait_mins} minutes. You may arrive a bit later.`
        });
      }
    }

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/alerts', async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const doctors = await Doctor.find();
    const alerts = [];

    for (const doctor of doctors) {
      const max = doctor.max_patients_per_day || 1;
      const loadIndex = (doctor.current_patients_today / max) * 100;
      if (loadIndex >= 90) {
        alerts.push({
          priority: 'high',
          type: 'overload',
          message: `${doctor.name} is at ${Math.round(loadIndex)}% capacity. Consider redirecting patients.`
        });
      }
    }

    const emergencyAppointments = await Appointment.find({
      status: 'confirmed',
      priority: 'emergency'
    })
      .sort({ booking_time: -1 })
      .limit(5)
      .populate('patient_id', 'name phone');

    for (const appt of emergencyAppointments) {
      const patientName = appt.patient_id ? appt.patient_id.name : 'Patient';
      alerts.push({
        priority: 'critical',
        type: 'emergency',
        message: `Emergency patient ${patientName} needs immediate attention`
      });
    }

    res.json({ alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
