export const fixedPatient = { lat: 12.9716, lng: 77.5946 };

export const formatPatient = (patient = {}) => {
  if (!patient) return null;

  const location =
    typeof patient.location === 'string'
      ? { address: patient.location }
      : patient.location || {};

  return {
    ...patient,
    id: patient.id || patient._id,
    _id: patient._id || patient.id,
    location,
  };
};

export const scoreClass = (score = 0) => {
  if (score > 0.7) return 'bg-green-100 text-green-700';
  if (score >= 0.5) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export const starText = (rating = 0) =>
  '★'.repeat(Math.round(rating)).padEnd(5, '☆');

export const fallbackPriority = (symptoms = '') => {
  const normalizedSymptoms = symptoms.toLowerCase();

  if (
    normalizedSymptoms.includes('chest pain') ||
    normalizedSymptoms.includes('unconscious')
  ) {
    return 'emergency';
  }

  if (normalizedSymptoms.includes('high fever child')) {
    return 'urgent';
  }

  return 'normal';
};

export const normalizeAppointment = (appointment = {}) => {
  const doctor = appointment.doctor_id || {};
  const hospital = appointment.hospital_id || {};
  const slot = appointment.slot_id || {};

  return {
    ...appointment,
    id: appointment.id || appointment._id,
    _id: appointment._id || appointment.id,
    doctor_id: doctor._id || doctor.id || appointment.doctor_id,
    doctor_name: appointment.doctor_name || doctor.name || '',
    hospital_id: hospital._id || hospital.id || appointment.hospital_id,
    hospital_name: appointment.hospital_name || hospital.name || '',
    slot_id: slot._id || slot.id || appointment.slot_id,
    date: appointment.date || slot.date || '',
    time:
      appointment.time ||
      slot.time_range ||
      [slot.start_time, slot.end_time].filter(Boolean).join(' - '),
    department: appointment.department || doctor.department || '',
  };
};
