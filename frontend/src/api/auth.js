import { api } from './axios';

export const authRegister = (email, password, phone, name) => {
  return api.post('/auth/register', { email, password, phone, name });
};

export const authLogin = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const authGetMe = () => {
  return api.get('/auth/me');
};

export const authRefreshToken = (token) => {
  return api.post('/auth/refresh', { token });
};
