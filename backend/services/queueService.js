const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');

const pendingQueues = new Map();
const priorityOrder = { emergency: 0, urgent: 1, normal: 2 };

async function recalculateSlotQueue(slotId, io, { reason, excludePatientId } = {}) {
  const key = String(slotId);
  // Serialize recalculations for a slot so overlapping requests cannot overwrite newer results.
  const previous = pendingQueues.get(key) || Promise.resolve();
  const task = previous.then(async () => {
    try {
      const slot = await Slot.findById(slotId).select('doctor_id');
      if (!slot) return;
      const doctor = await Doctor.findById(slot.doctor_id).select('avg_consultation_mins');
      const consultationMins = doctor?.avg_consultation_mins || 15;
      const appointments = await Appointment.find({
        slot_id: slotId,
        status: { $in: ['confirmed', 'rescheduled'] }
      }).sort({ createdAt: 1, _id: 1 });
      appointments.sort((a, b) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
      );

      for (const [index, appointment] of appointments.entries()) {
        const queue_position = index + 1;
        const estimated_wait_mins = index * consultationMins;
        const oldWait = appointment.estimated_wait_mins;
        if (appointment.queue_position === queue_position && oldWait === estimated_wait_mins) continue;

        // Do not update an appointment cancelled or moved while the queue was being read.
        const result = await Appointment.updateOne(
          { _id: appointment._id, slot_id: slotId, status: { $in: ['confirmed', 'rescheduled'] } },
          { $set: { queue_position, estimated_wait_mins } }
        );
        if (!result.modifiedCount) continue;

        let message = null;
        if (oldWait != null && estimated_wait_mins < oldWait &&
            String(appointment.patient_id) !== String(excludePatientId)) {
          message = `Someone ahead of you cancelled. You are now #${queue_position} in the queue with about ${estimated_wait_mins} minutes estimated wait.`;
          await Notification.create({
            patient_id: appointment.patient_id,
            appointment_id: appointment._id,
            message,
            type: 'queue_update',
            priority: 'medium'
          });
        }

        if (io) {
          io.to(`patient:${appointment.patient_id}`).emit('appointment_updated', {
            appointment_id: String(appointment._id),
            queue_position,
            estimated_wait_mins,
            status: appointment.status,
            message
          });
        }
      }
    } catch (error) {
      console.error(`Queue recalculation failed (${reason || 'update'}, slot ${key}):`, error);
    }
  });
  pendingQueues.set(key, task);
  try {
    await task;
  } finally {
    if (pendingQueues.get(key) === task) pendingQueues.delete(key);
  }
}

module.exports = { recalculateSlotQueue };
