import { create } from 'zustand';
import api from '../services/api';

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('careconnect-user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('careconnect-user');
    return null;
  }
};

const storedToken = localStorage.getItem('careconnect-token');
const storedUser = getStoredUser();

export const useAuthStore = create((set, get) => ({
  user: storedToken && storedUser ? storedUser : null,
  token: storedToken && storedUser ? storedToken : null,
  isAuthenticated: Boolean(storedToken && storedUser),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...userData } = res.data.data;
      
      localStorage.setItem('careconnect-token', token);
      localStorage.setItem('careconnect-user', JSON.stringify(userData));

      set({
        user: userData,
        token,
        isAuthenticated: true,
        loading: false
      });
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', formData);
      const { token, ...userData } = res.data.data;

      localStorage.setItem('careconnect-token', token);
      localStorage.setItem('careconnect-user', JSON.stringify(userData));

      set({
        user: userData,
        token,
        isAuthenticated: true,
        loading: false
      });
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // 1-Click Role Switcher for instant testing across all 5 roles!
  quickSwitchRole: async (roleEmail) => {
    return await get().login(roleEmail, 'password123');
  },

  logout: () => {
    localStorage.removeItem('careconnect-token');
    localStorage.removeItem('careconnect-user');
    localStorage.removeItem('careconnect-auth');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
