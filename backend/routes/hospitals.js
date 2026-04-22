const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');

router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ is_active: true });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const Slot = require('../models/Slot');
    const Doctor = require('../models/Doctor');
    const { hospital_ids: hospitalIds } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const results = await Promise.all(
      (hospitalIds || []).map(async (hospitalId) => {
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) return null;

        const totalSlotsToday = await Slot.countDocuments({
          hospital_id: hospitalId,
          date: today
        });
        const availableSlotsToday = await Slot.countDocuments({
          hospital_id: hospitalId,
          date: today,
          status: { $ne: 'full' }
        });
        const availableDoctors = await Doctor.find({
          hospital_id: hospitalId,
          available: true
        });
        const avgDoctorRating =
          availableDoctors.length > 0
            ? availableDoctors.reduce((s, d) => s + (d.rating || 0), 0) /
              availableDoctors.length
            : 0;

        const hospitalObj = hospital.toObject();
        return {
          ...hospitalObj,
          total_slots_today: totalSlotsToday,
          available_slots_today: availableSlotsToday,
          available_doctors_count: availableDoctors.length,
          average_doctor_rating: avgDoctorRating
        };
      })
    );

    res.json(results.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/departments', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    res.json({ departments: hospital.departments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/route', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const patientLat = parseFloat(req.query.patient_lat);
    const patientLng = parseFloat(req.query.patient_lng);
    if (Number.isNaN(patientLat) || Number.isNaN(patientLng)) {
      return res.status(400).json({
        message: 'patient_lat and patient_lng are required'
      });
    }
    const R = 6371;
    const PI = Math.PI;
    const hLat = hospital.location && hospital.location.lat;
    const hLng = hospital.location && hospital.location.lng;

    if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) {
      return res.status(400).json({
        message: 'Hospital location coordinates are not available'
      });
    }

    const dLat = ((hLat - patientLat) * PI) / 180;
    const dLng = ((hLng - patientLng) * PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((patientLat * PI) / 180) *
        Math.cos((hLat * PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 100) / 100;
    const estimatedTravelMins = Math.round(distanceKm * 3);

    const hospitalLat = hLat;
    const hospitalLng = hLng;
    const googleMapsUrl = `https://www.google.com/maps/dir/${patientLat},${patientLng}/${hospitalLat},${hospitalLng}`;

    res.json({
      hospital_name: hospital.name,
      hospital_address: hospital.location.address,
      hospital_lat: hospitalLat,
      hospital_lng: hospitalLng,
      patient_lat: patientLat,
      patient_lng: patientLng,
      distance_km: distanceKm,
      estimated_travel_mins: estimatedTravelMins,
      google_maps_url: googleMapsUrl,
      message: `Hospital is ${distanceKm} km away. Estimated travel time is ${estimatedTravelMins} minutes.`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
