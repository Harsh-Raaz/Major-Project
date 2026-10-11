require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const { getLocalDateString } = require('../utils/date');
const { recalculateSlotQueue } = require('../services/queueService');

async function run() {
  const patientIds = Array.from({ length: 3 }, () => new mongoose.Types.ObjectId());
  const appointmentIds = Array.from({ length: 3 }, () => new mongoose.Types.ObjectId());
  const slotId = new mongoose.Types.ObjectId();
  const events = [];
  const io = { to: (room) => ({ emit: (event, data) => events.push({ room, event, data }) }) };
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const doctor = await Doctor.findOne();
    assert.ok(doctor, 'Seed at least one doctor before running this script');
    const consultationMins = doctor.avg_consultation_mins || 15;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await Patient.insertMany(patientIds.map((_id, index) => ({
      _id, name: `Queue test patient ${index + 1}`, phone: `queue-test-${_id}`
    })));
    // Use an isolated slot; never change a real slot or the doctor's counters.
    await Slot.create({
      _id: slotId, doctor_id: doctor._id, hospital_id: doctor.hospital_id,
      date: getLocalDateString(tomorrow), start_time: '09:00', end_time: '10:00',
      capacity: 5, current_bookings: 3, status: 'available', duration_mins: 60
    });
    const bookedAt = Date.now();
    await Appointment.insertMany(appointmentIds.map((_id, index) => ({
      _id, patient_id: patientIds[index], doctor_id: doctor._id,
      hospital_id: doctor.hospital_id, slot_id: slotId, priority: 'normal',
      estimated_wait_mins: index * consultationMins,
      createdAt: new Date(bookedAt + index), status: 'confirmed'
    })));
    await recalculateSlotQueue(slotId, io, { reason: 'booking' });
    const initial = await Appointment.find({ slot_id: slotId }).sort({ createdAt: 1 });
    assert.deepEqual(initial.map((a) => a.queue_position), [1, 2, 3]);

    await Appointment.updateOne({ _id: appointmentIds[0] }, { $set: { status: 'cancelled' } });
    await Slot.updateOne({ _id: slotId }, { $inc: { current_bookings: -1 } });
    events.length = 0;
    await recalculateSlotQueue(slotId, io, {
      reason: 'cancellation', excludePatientId: patientIds[0]
    });
    const remaining = await Appointment.find({ slot_id: slotId, status: 'confirmed' }).sort({ createdAt: 1 });
    assert.deepEqual(remaining.map((a) => [a.queue_position, a.estimated_wait_mins]), [[1, 0], [2, consultationMins]]);
    const notifications = await Notification.find({ patient_id: { $in: patientIds } }).sort({ createdAt: 1 });
    assert.equal(notifications.length, 2);
    assert.equal(events.length, 2);
    assert.ok(events.every((e) => e.event === 'appointment_updated' && e.data.message));
    console.log('Remaining patients after the first appointment cancels:');
    for (const appointment of remaining) {
      console.log(`${appointment.patient_id}: queue_position=${appointment.queue_position}, estimated_wait_mins=${appointment.estimated_wait_mins}`);
    }
    console.log('Notifications created:');
    notifications.forEach((n) => console.log(`${n.patient_id}: ${n.message}`));

    // Unchanged recalculations must not duplicate messages; priority insertion must notify by event only.
    await recalculateSlotQueue(slotId, io, { reason: 'cancellation' });
    assert.equal(events.length, 2);
    await Appointment.updateOne({ _id: appointmentIds[2] }, { $set: { priority: 'emergency', status: 'rescheduled' } });
    await recalculateSlotQueue(slotId, io, { reason: 'booking', excludePatientId: patientIds[2] });
    const emergency = await Appointment.findById(appointmentIds[2]);
    assert.equal(emergency.queue_position, 1);
    assert.equal(emergency.estimated_wait_mins, 0);
    assert.equal(await Notification.countDocuments({ patient_id: { $in: patientIds } }), 2);
    assert.ok(events.some((e) => e.room === `patient:${patientIds[1]}` && e.data.queue_position === 2 && !e.data.message));
    console.log('PASS: cancellation, priority order, rescheduled appointments, actor exclusion, events, and duplicate prevention');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await Notification.deleteMany({ patient_id: { $in: patientIds } });
      await Appointment.deleteMany({ _id: { $in: appointmentIds } });
      await Slot.deleteOne({ _id: slotId });
      await Patient.deleteMany({ _id: { $in: patientIds } });
      assert.equal(await Notification.countDocuments({ patient_id: { $in: patientIds } }), 0);
      assert.equal(await Appointment.countDocuments({ _id: { $in: appointmentIds } }), 0);
      console.log('Cleaned up all test appointments, notifications, patients, and the test slot.');
    }
    await mongoose.disconnect();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
