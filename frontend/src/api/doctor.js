import { api } from "./axios";

export const getDoctorsByHospital = (hospitalId) =>
  api.get(`/doctors?hospital_id=${encodeURIComponent(hospitalId)}`);
export const getSlots = (doctorId, date) => api.get(`/slots?doctor_id=${doctorId}&date=${date}`);

