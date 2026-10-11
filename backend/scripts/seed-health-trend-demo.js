require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const SymptomLog = require('../models/SymptomLog');
const Slot = require('../models/Slot');
const Patient = require('../models/Patient');
const { getLocalDateString } = require('../utils/date');
const { getTrendWindow } = require('../services/healthTrendsService');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.argv.includes('--clean')) {
      const [appointments, symptoms] = await Promise.all([
        Appointment.deleteMany({ is_demo: true }), SymptomLog.deleteMany({ is_demo: true })
      ]);
      console.log(`Removed only demo documents: ${appointments.deletedCount} appointments, ${symptoms.deletedCount} symptom logs.`);
      return;
    }
    if (await Appointment.findOne({ is_demo: true })) {
      console.log('Demo already exists. Use --clean before generating a fresh demo.');
      return;
    }
    const [slot, patient] = await Promise.all([
      Slot.findOne({ date: { $lt: getLocalDateString(new Date(), 'Asia/Kolkata') } }), Patient.findOne()
    ]);
    if (!slot || !patient) throw new Error('An existing past slot and patient are required; this script never creates slots.');
    const { start } = getTrendWindow();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    // Eight varied baseline weeks followed by a moderate, reproducible spike.
    const departmentCounts = {
      'General Medicine': [15, 23, 17, 25, 20, 15, 23, 22, 42], // +110% vs an average of 20.
      Cardiology: [3, 5, 4, 3, 5, 4, 3, 5, 4]
    };
    const keywordCounts = {
      fever: [4, 6, 5, 7, 4, 6, 5, 7, 13], // +136% vs an average of 5.5.
      headache: [3, 5, 4, 3, 5, 4, 3, 5, 4]
    };
    const appointments = [], logs = [];
    for (let week = 0; week < 9; week += 1) {
      // Midweek timestamps keep every fixture inside its intended rolling bucket.
      const createdAt = new Date(start.getTime() + week * weekMs + weekMs / 2);
      for (const department of ['General Medicine', 'Cardiology']) {
        const count = departmentCounts[department][week];
        for (let i = 0; i < count; i += 1) {
          appointments.push({
            patient_id: patient._id, doctor_id: slot.doctor_id, hospital_id: slot.hospital_id,
            slot_id: slot._id, department, priority: 'normal', is_demo: true,
            status: week === 8 ? 'confirmed' : 'completed', booking_time: createdAt, createdAt,
            notes: 'Demo community demand; excluded from operational appointments'
          });
        }
      }
      for (const keyword of ['fever', 'headache']) {
        const count = keywordCounts[keyword][week];
        for (let i = 0; i < count; i += 1) {
          logs.push({ department: 'General Medicine', keywords: [keyword], source: i % 2 ? 'chatbot' : 'home', is_demo: true, createdAt });
        }
      }
    }
    await Appointment.insertMany(appointments);
    await SymptomLog.insertMany(logs);
    console.log(`DEMO: inserted ${appointments.length} appointments and ${logs.length} symptom logs across nine weekly buckets.`);
    console.log(`Patient ${patient._id}; doctor ${slot.doctor_id}; past slot ${slot._id}. No slots or booking counters were changed.`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
