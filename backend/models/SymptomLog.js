const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  department: { type: String, required: true },
  keywords: [{ type: String }],
  source: { type: String, enum: ['home', 'chatbot'], required: true },
  is_demo: { type: Boolean, default: false }
}, { timestamps: true });
symptomLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
