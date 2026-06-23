import axios from 'axios';

// ✅ FIX : baseURL depuis variable d'environnement — plus de hardcode localhost
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

// ✅ FIX : une seule clé 'token' — plus de double clé token/accessToken
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.tenantId) {
      config.headers['x-tenant-id'] = user.tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur RESPONSE
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url;

    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/roles/public',
      '/tenants/request',
      '/plans/public',
      '/subscriptions/request',
      '/subscriptions/plans',
    ];

    const isPublicRoute = publicRoutes.some(route => url?.includes(route));

    if (status === 401 && !isPublicRoute && !isRefreshing) {
      isRefreshing = true;
      const msg = error.response?.data?.message || '';
      if (
        msg.includes('expiré') ||
        msg.includes('invalide') ||
        msg.includes('connecté')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      setTimeout(() => { isRefreshing = false; }, 1000);
    }

    return Promise.reject(error);
  }
);

export default API;