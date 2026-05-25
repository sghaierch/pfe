import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

// ✅ Intercepteur REQUEST — envoie le token à chaque requête
API.interceptors.request.use(
  (config) => {
    // ✅ FIX BUG 2 : on cherche le token dans 'token' ET 'accessToken' pour être sûr
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // ✅ FIX : on ajoute le tenantId si présent (parfois requis par le middleware)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.tenantId) {
      config.headers['x-tenant-id'] = user.tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercepteur RESPONSE
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url    = error.config?.url;

    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      setTimeout(() => { isRefreshing = false; }, 1000);
    }

    return Promise.reject(error);
  }
);

export default API;