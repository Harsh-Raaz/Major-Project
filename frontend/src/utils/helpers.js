export const fixedPatient = { lat: 12.9716, lng: 77.5946 };

export const scoreClass = (score = 0) => {
  if (score >= 0.75) return 'bg-[#00B8A9]/15 text-[#00897e]';
  if (score >= 0.5) return 'bg-[#F59E0B]/15 text-[#b86a00]';
  return 'bg-red-100 text-red-700';
};

export const starText = (rating = 0) => {
  const rounded = Math.round(Number(rating || 0));
  return `${'*'.repeat(rounded)}${'-'.repeat(Math.max(5 - rounded, 0))}`;
};

export const fallbackPriority = (symptoms = '') => {
  const value = symptoms.toLowerCase();
  if (value.includes('chest pain') || value.includes('unconscious')) {
    return 'emergency';
  }
  if (value.includes('high fever child')) {
    return 'urgent';
  }
  return 'normal';
};

export const normalizeAppointment = (a = {}) => ({
  ...a,
  id: a._id || a.id,
  doctor_name: a.doctor_id?.name || a.doctor_name || '-',
  department: a.doctor_id?.department || a.department || '-',
  hospital_name: a.hospital_id?.name || a.hospital_name || '-',
  date: a.slot_id?.date || a.date || '-',
  time: a.slot_id
    ? `${a.slot_id.start_time} - ${a.slot_id.end_time}`
    : a.time || '-',
  doctor_id: a.doctor_id?._id || a.doctor_id,
});
