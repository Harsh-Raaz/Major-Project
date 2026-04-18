const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    department: { type: String },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'rescheduled', 'completed'],
      default: 'confirmed'
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal'
    },
    symptoms: { type: String },
    estimated_wait_mins: { type: Number },
    booking_time: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
