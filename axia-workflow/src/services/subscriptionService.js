import API from './api';

const subscriptionService = {

  // PUBLIC — Home page modal
  requestSubscription: async (data) => {
    try {
      const response = await API.post('/subscriptions/request', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'envoi' };
    }
  },

  // SUPERADMIN — liste
  getAllSubscriptions: async () => {
    try {
      const response = await API.get('/subscriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur récupération' };
    }
  },
  archive: async (id) => API.patch(`/subscriptions/${id}/archive`).then(r => r.data),

  // ✅ SUPERADMIN — abonnements d'un tenant spécifique
  getByTenant: async (tenantId) => {
    try {
      const response = await API.get(`/subscriptions?tenant=${tenantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur récupération' };
    }
  },

  // SUPERADMIN — approuver
  approve: async (id, adminNote = '') => {
    try {
      const response = await API.patch(`/subscriptions/${id}/approve`, { adminNote });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur approbation' };
    }
  },

  // SUPERADMIN — refuser
  reject: async (id, adminNote = '') => {
    try {
      const response = await API.patch(`/subscriptions/${id}/reject`, { adminNote });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur rejet' };
    }
  },

  // SUPERADMIN — supprimer un abonnement
  deleteSubscription: async (id) => {
    try {
      const response = await API.delete(`/subscriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur suppression' };
    }
  },

  // Compatibilité ancien code
  updateSubscriptionStatus: async (id, status) => {
    try {
      const response = await API.patch(`/subscriptions/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur mise à jour' };
    }
  },
};

export default subscriptionService;