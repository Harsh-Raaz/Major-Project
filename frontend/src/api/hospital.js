import { api } from "./axios";

export const compareHospitals = (hospitalIds) => api.post("/hospitals/compare", { hospital_ids: hospitalIds });
export const getHospital = (id) => api.get(`/hospitals/${id}`);
export const getHospitalDepartments = (id) => api.get(`/hospitals/${id}/departments`);
export const getHospitalRoute = (id, lat, lng) =>
  api.get(`/hospitals/${id}/route?patient_lat=${lat}&patient_lng=${lng}`);

