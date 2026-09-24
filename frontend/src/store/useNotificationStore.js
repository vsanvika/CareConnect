import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data.data || [];
      const unread = data.filter(n => !n.read).length;
      set({ notifications: data, unreadCount: unread });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => n._id === notificationId ? { ...n, read: true } : n),
        unreadCount: state.notifications.filter(n => !n.read && n._id !== notificationId).length
      }));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  },

  // Backward-compatible alias for existing callers.
  markRead: async () => {
    await get().markAllAsRead();
  }
}));
