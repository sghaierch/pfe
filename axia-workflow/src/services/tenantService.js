// ✅ FIX : utilise l'instance API commune (intercepteurs token + tenantId automatiques)
// Plus d'axios direct ni de getAuthHeader() manuel
import API from './api';

const tenantService = {
  getAllTenants: () =>
    API.get('/tenants'),

  getTenantById: (id) =>
    API.get(`/tenants/${id}`),

  approveTenant: (id, durationMonths = 1) =>
    API.patch(`/tenants/${id}/approve`, { durationMonths }),

  rejectTenant: (id, reason = '') =>
    API.patch(`/tenants/${id}/reject`, { reason }),

  suspendTenant: (id) =>
    API.patch(`/tenants/${id}/suspend`, {}),

  reactivateTenant: (id) =>
    API.patch(`/tenants/${id}/reactivate`, {}),
  archive: async (id) => API.patch(`/tenants/${id}/archive`).then(r => r.data),
  deleteTenant: (id) =>
    API.delete(`/tenants/${id}`),

  changePlan: (id, planId) =>
    API.patch(`/tenants/${id}/plan`, { planId }),

  updateLimits: (id, limits) =>
    API.patch(`/tenants/${id}/limits`, limits),

  resendCredentials: (id) =>
    API.post(`/tenants/${id}/resend-credentials`, {}),

  renewSubscription: (id, durationMonths) =>
    API.patch(`/tenants/${id}/renew`, { durationMonths }),
};

export default tenantService;