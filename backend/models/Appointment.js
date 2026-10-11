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
    is_demo: { type: Boolean, default: false },
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
    queue_position: { type: Number, default: null },
    booking_time: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

// All operational reads, including queues and wait averages, exclude demo demand.
// Trend aggregation and demo maintenance must explicitly select is_demo to opt in.
appointmentSchema.pre(/^(find|countDocuments|distinct|update)/, function () {
  if (!Object.prototype.hasOwnProperty.call(this.getFilter(), 'is_demo')) {
    this.where({ is_demo: { $ne: true } });
  }
});
appointmentSchema.pre('aggregate', function () {
  const match = this.pipeline()[0]?.$match;
  if (!match || !Object.prototype.hasOwnProperty.call(match, 'is_demo')) {
    this.pipeline().unshift({ $match: { is_demo: { $ne: true } } });
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
