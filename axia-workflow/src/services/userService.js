import API from './api';

const userService = {
  getAllGlobal: async () => {
    const res = await API.get('/users');   // ← route superadmin globale
    return res.data;
  },
  getAll: async () => {
    const res = await API.get('/tenant-users');
    return res.data;
  },

  getById: async (id) => {
    const res = await API.get('/tenant-users/' + id);
    return res.data;
  },

  getRoles: async () => {
    const res = await API.get('/tenant-users/roles');
    return res.data;
  },

  create: async (data) => {
    const res = await API.post('/tenant-users', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await API.patch('/tenant-users/' + id, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await API.delete('/tenant-users/' + id);
    return res.data;
  },

  // ── Postes ─────────────────────────────────────────────────────────────────
  getPosts: async () => {
    const res = await API.get('/tenant-users/posts/list');
    return res.data;
  },
  createPost: async (data) => {
    const res = await API.post('/tenant-users/posts', data);
    return res.data;
  },
  updatePost: async (id, data) => {
    const res = await API.patch('/tenant-users/posts/' + id, data);
    return res.data;
  },
  deletePost: async (id) => {
    const res = await API.delete('/tenant-users/posts/' + id);
    return res.data;
  },
};

export default userService;