const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    position: { type: Number },
    status: {
      type: String,
      enum: ['waiting', 'promoted', 'expired'],
      default: 'waiting'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Waitlist', waitlistSchema);
