import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user });
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user });
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ loading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, loading: false });
    }
  },
}));

export default useAuthStore;
