import { api, aiDirectApi } from "./axios";

export const suggestDepartment = (symptoms) => api.post("/ai/suggest-department", { symptoms });
export const seasonalAlert = (symptoms) => api.post("/ai/seasonal-alert", { symptoms });
export const recommendHospitals = (department, lat, lng) =>
  api.post("/ai/recommend-hospitals", { patient_lat: lat, patient_lng: lng, department });
export const recommendDoctors = (hospitalId, department) =>
  api.post("/ai/recommend-doctors", { hospital_id: hospitalId, department });
export const classifyPriority = (symptoms) => aiDirectApi.post("/classify-priority", { symptoms });
export const loadBalanceSlot = (slots) => aiDirectApi.post("/load-balance-slot", { slots });

