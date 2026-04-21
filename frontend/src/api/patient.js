import { api } from "./axios";

export const registerPatient = (payload) => api.post("/patients/register", payload);
export const getPatientAppointments = (patientId) => api.get(`/appointments/patient/${patientId}`);
export const getPatientNotifications = (patientId) => api.get(`/notifications/patient/${patientId}`);

