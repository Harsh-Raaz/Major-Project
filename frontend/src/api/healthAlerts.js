import { api } from './axios';

export const getHealthNews = () => api.get('/health-alerts/news');
