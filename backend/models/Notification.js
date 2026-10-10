const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    message: { type: String, required: true },
    type: { type: String, default: 'queue_update' },
    priority: { type: String, default: 'medium' }
  },
  { timestamps: true }
);

notificationSchema.index({ patient_id: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
