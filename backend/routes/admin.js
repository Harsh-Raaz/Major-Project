const express = require('express');
const axios = require('axios');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today);

    const total_bookings = await Appointment.countDocuments({
      status: 'confirmed'
    });
    const today_bookings = await Appointment.countDocuments({
      status: 'confirmed',
      createdAt: { $gte: todayStart }
    });
    const cancelled_today = await Appointment.countDocuments({
      status: 'cancelled',
      updatedAt: { $gte: todayStart }
    });
    const emergency_today = await Appointment.countDocuments({
      priority: 'emergency',
      createdAt: { $gte: todayStart }
    });
    const full_slots_today = await Slot.countDocuments({
      date: today,
      status: 'full'
    });

    const doctors = await Doctor.find().select(
      'name department current_patients_today max_patients_per_day rating'
    );
    const doctor_loads = doctors.map((doc) => {
      const max = doc.max_patients_per_day || 1;
      const current = doc.current_patients_today || 0;
      return {
        name: doc.name,
        department: doc.department,
        load_index: Math.round((current / max) * 100),
        current,
        max: doc.max_patients_per_day,
        rating: doc.rating
      };
    });

    res.json({
      total_bookings,
      today_bookings,
      cancelled_today,
      emergency_today,
      full_slots_today,
      doctor_loads
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const hourlyTrend = await Appointment.aggregate([
      {
        $group: {
          _id: { $hour: '$booking_time' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const departmentTrend = await Appointment.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const dailyTrend = await Appointment.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: '$booking_time' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      hourly: hourlyTrend,
      departments: departmentTrend,
      daily: dailyTrend
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/busy-hours', async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'confirmed' });
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    const bookingData = appointments.map((a) => {
      const bt = new Date(a.booking_time);
      return {
        hour: bt.getHours(),
        day_name: dayNames[bt.getDay()],
        department: a.department || 'General Medicine'
      };
    });

    const baseUrl =
      process.env.AI_SERVICE_URL || 'http://localhost:5001';
    const response = await axios.post(`${baseUrl}/busy-hours`, {
      bookings: bookingData
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
