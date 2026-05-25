import API from './api';

const projectService = {

  getAll: async () => {
    const res = await API.get('/projects');
    return res.data;
  },

  getById: async (id) => {
    const res = await API.get(`/projects/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await API.post('/projects', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await API.patch(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await API.delete(`/projects/${id}`);
    return res.data;
  },
};

export default projectService;