const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      address: { type: String },
      city: { type: String },
      lat: { type: Number },
      lng: { type: Number }
    },
    departments: [String],
    rating: {
      overall: { type: Number, default: 0 },
      patient_experience: { type: Number, default: 0 },
      safety: { type: Number, default: 0 }
    },
    facilities: [String],
    contact: { type: String },
    total_doctors: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
