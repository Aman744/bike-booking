import api from './api';
import { LoginInput, RegisterInput } from 'shared';

export const authService = {
  login: async (credentials: LoginInput) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterInput) => {
    const { data } = await api.post('/auth/register', credentials);
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  forgotPasswordReset: async (payload: { email: string; newPass: string }) => {
    const { data } = await api.post('/auth/forgot-password', {
      email: payload.email,
      newPassword: payload.newPass,
    });
    return data;
  },
};

export default authService;
