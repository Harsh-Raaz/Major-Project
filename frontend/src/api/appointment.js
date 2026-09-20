import { api } from "./axios";

export const autocompleteAppointments = () => api.get("/appointments/autocomplete");
export const createAppointment = (payload) => api.post("/appointments", payload);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`, {});
export const rescheduleAppointment = (id, newSlotId) =>
  api.put(`/appointments/${id}/reschedule`, { new_slot_id: newSlotId });
export const getFollowUp = (id) => api.get(`/appointments/${id}/followup`);

