// ═══════════════════════════════════════════════════════════════════════════
// MODIFICATION dans workflowService.js
// Ajoute cette méthode dans l'objet workflowService
// ═══════════════════════════════════════════════════════════════════════════

import API from './api';

const workflowService = {

  getByProject: async (projectId) => {
    const res = await API.get('/workflows/project/' + projectId);
    return res.data;
  },

  getById: async (id) => {
    const res = await API.get('/workflows/' + id);
    return res.data;
  },

  create: async (data) => {
    const res = await API.post('/workflows', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await API.patch('/workflows/' + id, data);
    return res.data;
  },

  start: async (id) => {
    const res = await API.patch('/workflows/' + id + '/start');
    return res.data;
  },

  // ✅ NOUVEAU — démarre une instance de demande employé (sans mettre isTemplate:true)
  startInstance: async (id) => {
    const res = await API.patch('/workflows/' + id + '/start-instance');
    return res.data;
  },

  completeStep: async (id, data) => {
    const res = await API.patch('/workflows/' + id + '/complete-step', data);
    return res.data;
  },

  rejectStep: async (id, data) => {
    const res = await API.patch('/workflows/' + id + '/reject-step', data);
    return res.data;
  },

  uploadDocument: async (formData) => {
    const res = await API.post('/workflows/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getDocuments: async (workflowId) => {
    const res = await API.get('/workflows/documents/workflow/' + workflowId);
    return res.data;
  },

  getUsers: async () => {
    const res = await API.get('/workflows/users/list');
    return res.data;
  },

  getMyTasks: async () => {
    const res = await API.get('/workflows/my-tasks');
    return res.data;
  },

  // ✅ NOUVEAU — demandes soumises par l'utilisateur connecté
  getMyRequests: async () => {
    const res = await API.get('/workflows/my-requests');
    return res.data;
  },

  getPosts: async () => {
    const res = await API.get('/tenant-users/posts/list');
    return res.data;
  },

  getStats: async () => {
    const res = await API.get('/workflows/stats/overview');
    return res.data;
  },

  getGlobalWorkflows: async () => {
    const res = await API.get('/workflows/global/visible');
    return res.data;
  },

  generateWithAI: async (description, posts = []) => {
    const res = await API.post('/ai/generate-workflow', { description, posts });
    return res.data?.data;
  },

  getAuditLog: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.action)     params.append('action',     filters.action);
    if (filters.user)       params.append('user',       filters.user);
    if (filters.from)       params.append('from',       filters.from);
    if (filters.to)         params.append('to',         filters.to);
    if (filters.workflowId) params.append('workflowId', filters.workflowId);
    const res = await API.get('/workflows/audit-log?' + params.toString());
    return res.data;
  },

  analyzeWorkflow: async (workflow) => {
    const res = await API.post('/ai/analyze-workflow', { workflow });
    return res.data;
  },

  chatAssistant: async (messages, context = {}) => {
    const res = await API.post('/ai/chat-assistant', { messages, context });
    return res.data;
  },

  archive: async (id, comment = '') => {
    const res = await API.patch('/workflows/' + id + '/archive', { comment });
    return res.data;
  },

  updateVisibility: async (id, { visibility, allowedRoles, allowedPosts, allowedUsers }) => {
    const res = await API.patch('/workflows/' + id + '/visibility', {
      visibility,
      allowedRoles:  allowedRoles  || [],
      allowedPosts:  allowedPosts  || [],
      allowedUsers:  allowedUsers  || [],
    });
    return res.data;
  },

  getDocumentChain: async (workflowId) => {
    const res = await API.get('/workflows/' + workflowId + '/document-chain');
    return res.data;
  },

  createWithDocument: async (data) => {
    const res = await API.post('/workflows', data);
    return res.data;
  },

  // ✅ NOUVEAU — supprimer un workflow (brouillon uniquement)
  delete: async (id) => {
    const res = await API.delete('/workflows/' + id);
    return res.data;
  },

  // ✅ NOUVEAU — tous les workflows de la company (admin)
  getAll: async () => {
    const res = await API.get('/workflows');
    return res.data;
  },

  deactivate: async (id) => {
    const res = await API.patch('/workflows/' + id + '/deactivate');
    return res.data;
  },

  // ✅ Workflows actifs visibles par les employés pour soumettre des demandes
  getActiveTemplates: async () => {
    const res = await API.get('/workflows/templates/active');
    return res.data;
  },

  moveToProject: async (id, projectId) =>
  (await API.patch(`/workflows/${id}/move-project`, { projectId })).data,
};

export default workflowService;