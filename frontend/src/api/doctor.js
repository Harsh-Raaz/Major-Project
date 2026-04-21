import { api } from "./axios";

export const getSlots = (doctorId, date) => api.get(`/slots?doctor_id=${doctorId}&date=${date}`);

