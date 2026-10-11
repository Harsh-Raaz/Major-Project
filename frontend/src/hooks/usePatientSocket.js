import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api/axios';

// Use the configured API URL with the same suffix removal as useSlotSocket.
const SOCKET_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

export function usePatientSocket(patient_id, onAppointmentUpdate, onAppointmentsChanged) {
  useEffect(() => {
    if (!patient_id) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    const joinRoom = () => socket.emit('join_patient_room', { patient_id });
    socket.on('connect', joinRoom);
    socket.on('appointment_updated', onAppointmentUpdate);
    socket.on('appointments_changed', onAppointmentsChanged);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('appointment_updated', onAppointmentUpdate);
      socket.off('appointments_changed', onAppointmentsChanged);
      socket.emit('leave_patient_room', { patient_id });
      socket.disconnect();
    };
  }, [patient_id, onAppointmentUpdate, onAppointmentsChanged]);
}
