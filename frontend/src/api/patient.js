import { api } from './axios';
import { normalizeAppointment } from '../utils/helpers';

export const registerPatient = (payload) => api.post('/patients/register', payload);

export const getPatientAppointments = async (patientId) => {
  const response = await api.get(`/appointments/patient/${patientId}`);
  const appointments = response.data?.appointments || response.data || [];
  const normalizedAppointments = appointments.map(normalizeAppointment);

  if (Array.isArray(response.data)) {
    response.data = normalizedAppointments;
  } else {
    response.data = {
      ...(response.data || {}),
      appointments: normalizedAppointments,
    };
  }

  return response;
};

export const getPatientNotifications = (patientId) =>
  api.get(`/notifications/patient/${patientId}`);

