require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const { getLocalDateString: localDate } = require('./utils/date');

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

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Fetching doctors...');

  const doctors = await Doctor.find({});
  console.log(`Found ${doctors.length} doctors. Seeding slots for today plus the next 7 days...`);

  const today = new Date();
  const dates = Array.from({ length: 8 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return localDate(date);
  });
  const counts = new Map(dates.map((date) => [date, { created: 0, skipped: 0 }]));
  let createdCount = 0;
  let doctorIndex = 0;

  for (const doctor of doctors) {
    doctorIndex += 1;
    // Process one doctor's eight dates together to avoid serial database round trips.
    await Promise.all(dates.map(async (date) => {
      const dateCounts = counts.get(date);
      await Promise.all(timeSlots.map(async ({ start, end }) => {
        const exists = await Slot.findOne({ doctor_id: doctor._id, date, start_time: start });
        if (exists) {
          dateCounts.skipped += 1;
          return;
        }
        await Slot.create({
          doctor_id: doctor._id,
          hospital_id: doctor.hospital_id,
          date,
          start_time: start,
          end_time: end,
          capacity: 5,
          current_bookings: 0,
          status: 'available',
          duration_mins: 60
        });
        createdCount += 1;
        dateCounts.created += 1;
      }));
    }));
    if (doctorIndex % 20 === 0) {
      console.log(`Processed ${doctorIndex}/${doctors.length} doctors, ${createdCount} slots created so far...`);
    }
  }

  for (const [date, { created, skipped }] of counts) {
    console.log(`${date}: created ${created}, skipped ${skipped}`);
  }
  console.log(`Done. Created ${createdCount} slots across ${dates.length} dates.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
