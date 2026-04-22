const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

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

async function seedUpcomingSlots() {
  const doctors = await Doctor.find({});
  const dates = buildUpcomingDates();
  const slotsToCreate = [];

  for (const doctor of doctors) {
    for (const date of dates) {
      const existingCount = await Slot.countDocuments({
        doctor_id: doctor._id,
        date
      });

      if (existingCount > 0) {
        continue;
      }

      SLOT_TIMES.forEach(([start_time, end_time]) => {
        slotsToCreate.push({
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
    }
  }

  if (slotsToCreate.length) {
    await Slot.insertMany(slotsToCreate);
  }

  return slotsToCreate.length;
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('Seeding slots for upcoming week...');
        const createdCount = await seedUpcomingSlots();
        console.log(`Slot refresh complete. Created ${createdCount} slots.`);
      } catch (err) {
        console.error('Daily slot refresh failed:', err);
      }
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.json({ message: 'Hospital API running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the existing process on port ${PORT} or set a different PORT before starting the backend.`
    );
    return;
  }

  console.error('Server failed to start:', error);
});
