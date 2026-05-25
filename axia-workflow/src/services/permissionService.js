import API from './api';

const permissionService = {
  getAll: async () => {
    const response = await API.get('/permissions');
    return response.data;
  },
  getByCategory: async (category) => {
    const response = await API.get(`/permissions/category/${category}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/permissions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.patch(`/permissions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/permissions/${id}`);
    return response.data;
  },
};

export default permissionService;