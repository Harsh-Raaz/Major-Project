const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
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
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    capacity: { type: Number, default: 5 },
    current_bookings: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['available', 'almost_full', 'full'],
      default: 'available'
    },
    duration_mins: { type: Number, default: 60 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
