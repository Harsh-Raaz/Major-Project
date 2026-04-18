const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    department: { type: String, required: true },
    experience_years: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    avg_consultation_mins: { type: Number, default: 12 },
    max_patients_per_day: { type: Number, default: 40 },
    current_patients_today: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    qualification: { type: String },
    bio: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
