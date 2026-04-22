require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

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

function buildUpcomingDates(daysAhead = 7) {
  const dates = [];
  for (let i = 0; i <= daysAhead; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  return dates;
}

async function seedSlots() {
  await Slot.deleteMany({ date: { $gte: formatDate(new Date()) } });
  console.log('Cleared existing future slots');

  const doctors = await Doctor.find({});
  const dates = buildUpcomingDates();
  const slots = [];

  doctors.forEach((doctor) => {
    dates.forEach((date) => {
      timeSlots.forEach(({ start, end }) => {
        slots.push({
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
      });
    });
  });

  if (slots.length) {
    await Slot.insertMany(slots);
  }

  return {
    doctors: doctors.length,
    slots: slots.length,
    dates
  };
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await seedSlots();
    console.log(
      `Seeded ${result.slots} slots for ${result.doctors} doctors from ${result.dates[0]} to ${result.dates[result.dates.length - 1]}`
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
