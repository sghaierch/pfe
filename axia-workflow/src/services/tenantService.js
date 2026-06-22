// services/tenantService.js
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const tenantService = {
  getAllTenants: () =>
    axios.get(`${API}/tenants`, { headers: getAuthHeader() }),

  getTenantById: (id) =>
    axios.get(`${API}/tenants/${id}`, { headers: getAuthHeader() }),

  // ✅ Point 1 — Approuver depuis la fiche tenant (avec durée)
  approveTenant: (id, durationMonths = 1) =>
    axios.patch(`${API}/tenants/${id}/approve`, { durationMonths }, { headers: getAuthHeader() }),

  // ✅ Point 1 — Rejeter depuis la fiche tenant (avec raison)
  rejectTenant: (id, reason = '') =>
    axios.patch(`${API}/tenants/${id}/reject`, { reason }, { headers: getAuthHeader() }),

  suspendTenant: (id) =>
    axios.patch(`${API}/tenants/${id}/suspend`, {}, { headers: getAuthHeader() }),

  reactivateTenant: (id) =>
    axios.patch(`${API}/tenants/${id}/reactivate`, {}, { headers: getAuthHeader() }),

  deleteTenant: (id) =>
    axios.delete(`${API}/tenants/${id}`, { headers: getAuthHeader() }),

  changePlan: (id, planId) =>
    axios.patch(`${API}/tenants/${id}/plan`, { planId }, { headers: getAuthHeader() }),

  // ✅ Modifier les limites manuellement
  updateLimits: (id, limits) =>
    axios.patch(`${API}/tenants/${id}/limits`, limits, { headers: getAuthHeader() }),

  // ✅ Renvoyer les identifiants par email
  resendCredentials: (id) =>
    axios.post(`${API}/tenants/${id}/resend-credentials`, {}, { headers: getAuthHeader() }),

  // ✅ Renouveler l'abonnement (tenant expiré)
  renewSubscription: (id, durationMonths) =>
    axios.patch(`${API}/tenants/${id}/renew`, { durationMonths }, { headers: getAuthHeader() }),
};

export default tenantService;