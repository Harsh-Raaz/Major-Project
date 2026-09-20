require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');

const timeSlots = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' }
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Fetching doctors...');

  const doctors = await Doctor.find({});
  console.log(`Found ${doctors.length} doctors. Seeding slots for today only...`);

  const today = formatDate(new Date());
  let createdCount = 0;
  let doctorIndex = 0;

  for (const doctor of doctors) {
    doctorIndex += 1;
    for (const { start, end } of timeSlots) {
      const exists = await Slot.findOne({ doctor_id: doctor._id, date: today, start_time: start });
      if (exists) continue;
      await Slot.create({
        doctor_id: doctor._id,
        hospital_id: doctor.hospital_id,
        date: today,
        start_time: start,
        end_time: end,
        capacity: 5,
        current_bookings: 0,
        status: 'available',
        duration_mins: 60
      });
      createdCount += 1;
    }
    if (doctorIndex % 20 === 0) {
      console.log(`Processed ${doctorIndex}/${doctors.length} doctors, ${createdCount} slots created so far...`);
    }
  }

  console.log(`Done. Created ${createdCount} slots for ${today}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});