import API from './api';

const templateService = {

  getAll: async () => {
    const res = await API.get('/workflow-templates');
    return res.data;
  },

  getById: async (id) => {
    const res = await API.get(`/workflow-templates/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await API.post('/workflow-templates', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await API.patch(`/workflow-templates/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await API.delete(`/workflow-templates/${id}`);
    return res.data;
  },

  useTemplate: async (id, data) => {
    const res = await API.post(`/workflow-templates/${id}/use`, data);
    return res.data;
  },
};

export default templateService;