import API from './api';

const tenantService = {

  createRequest: async (data) => {
    try {
      const response = await API.post('/subscriptions/request', data);
      return response.data;
    } catch (error) {throw new Error(error.response?.data?.message || 'Erreur lors de la demande');
    }
  },

  getAllTenants: async (status = null) => {
    try {
      const url = status ? `/tenants?status=${status}` : '/tenants';
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur récupération');
    }
  },

  getTenantById: async (id) => {
    try {
      const response = await API.get(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Tenant non trouvé');
    }
  },
  suspendTenant: async (id) => {
    try {
      const response = await API.patch(`/tenants/${id}/suspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur suspension');
    }
  },
  deleteTenant: async (id) => {
  try {
    const response = await API.delete(`/tenants/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur suppression');
  }
},

  reactivateTenant: async (id) => {
    try {
      const response = await API.patch(`/tenants/${id}/reactivate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur réactivation');
    }
  }
};

export default tenantService;