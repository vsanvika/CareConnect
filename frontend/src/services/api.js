import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careconnect-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('careconnect-token');
      localStorage.removeItem('careconnect-user');
      localStorage.removeItem('careconnect-auth');
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?session=expired');
    }
    return Promise.reject(error);
  }
);

export default api;
