import { api } from "./axios";

export const getAdminDashboard = () => api.get("/admin/dashboard");
export const getAdminTrends = () => api.get("/admin/trends");
export const getBusyHours = () => api.get("/admin/busy-hours");
export const getAdminAlerts = () => api.get("/notifications/admin/alerts");

