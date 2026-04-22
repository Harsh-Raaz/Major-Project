require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

const SLOT_TIMES = [
  ['09:00', '10:00'],
  ['10:00', '11:00'],
  ['11:00', '12:00'],
  ['14:00', '15:00'],
  ['15:00', '16:00']
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
  await Slot.deleteMany({});

  const doctors = await Doctor.find({});
  const dates = buildUpcomingDates();
  const slots = [];

  doctors.forEach((doctor) => {
    dates.forEach((date) => {
      SLOT_TIMES.forEach(([start_time, end_time]) => {
        slots.push({
          doctor_id: doctor._id,
          hospital_id: doctor.hospital_id,
          date,
          start_time,
          end_time,
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
