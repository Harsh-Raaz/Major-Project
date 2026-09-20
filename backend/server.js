const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const appointmentsRouter = require('./routes/appointments');
const reviewsRouter = require('./routes/reviews');
require('dotenv').config();

let cron = null;
try {
  cron = require('node-cron');
} catch (error) {
  console.warn(
    'node-cron is not installed. Daily slot refresh is disabled until the dependency is installed.'
  );
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

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

async function seedUpcomingSlots() {
  const doctors = await Doctor.find({});
  const dates = buildUpcomingDates();
  let createdCount = 0;

  for (const doctor of doctors) {
    for (const date of dates) {
      for (const { start, end } of timeSlots) {
        const exists = await Slot.findOne({
          doctor_id: doctor._id,
          date,
          start_time: start
        });

        if (exists) {
          continue;
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
      }
    }
  }

  return createdCount;
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    if (cron) {
      cron.schedule('0 0 * * *', async () => {
        try {
          console.log('Seeding slots for upcoming week...');
          const createdCount = await seedUpcomingSlots();
          console.log(`Slot refresh complete. Created ${createdCount} slots.`);
        } catch (err) {
          console.error('Daily slot refresh failed:', err);
        }
      });
      cron.schedule('*/15 * * * *', async () => {
        try {
          const completedCount =
            await appointmentsRouter.autoCompleteExpiredAppointments();
          if (completedCount > 0) {
            console.log(`Auto-completed ${completedCount} appointments`);
          }
        } catch (err) {
          console.error('Auto-complete cron error:', err.message);
        }
      });
    }
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
app.use('/api/appointments', appointmentsRouter);
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reviews', reviewsRouter);

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
