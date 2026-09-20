const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    },
    medical_history: [String],
    // Inputs used by the no-show model. Defaults represent an unrecorded
    // condition/reminder, rather than an inferred patient characteristic.
    scholarship: { type: Number, enum: [0, 1], default: 0 },
    hypertension: { type: Number, enum: [0, 1], default: 0 },
    diabetes: { type: Number, enum: [0, 1], default: 0 },
    alcoholism: { type: Number, enum: [0, 1], default: 0 },
    handicap: { type: Number, min: 0, default: 0 },
    sms_received: { type: Number, enum: [0, 1], default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
