import API from './api';

const planService = {
  // Public
  getPublicPlans: async () => {
    const res = await API.get('/plans/public');
    return res.data;
  },
  // Admin
  getAll: async () => {
    const res = await API.get('/plans');
    return res.data;
  },
  archive: async (id) => {
  const res = await API.patch(`/plans/${id}/archive`);
  return res.data;
  },
  getById: async (id) => {
    const res = await API.get(`/plans/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await API.post('/plans', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await API.patch(`/plans/${id}`, data);
    return res.data;
  },
  toggle: async (id) => {
    const res = await API.patch(`/plans/${id}/toggle`);
    return res.data;
  },
  delete: async (id) => {
    const res = await API.delete(`/plans/${id}`);
    return res.data;
  },
};

export default planService;