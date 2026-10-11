import { api } from './axios';

export const getHealthTrends = () => api.get('/health-trends');
