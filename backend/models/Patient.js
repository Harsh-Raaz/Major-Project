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
    medical_history: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
