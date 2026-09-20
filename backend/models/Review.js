const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient',     required: true },
  rating:  { type: Number, min: 1, max: 5, required: true },
  text:    { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('Review', reviewSchema);
