// src/services/roleService.js
import API from './api';   // ← ton instance axios déjà configurée (avec baseURL + interceptors si tu en as)

const roleService = {
  /**
   * Récupère la liste de tous les rôles
   * @returns {Promise} { status: "success", data: { roles: [...] } }
   */
getAll: async (search = '') => {
  const query = search ? `?search=${search}` : '';
  const response = await API.get(`/roles${query}`);
  return response.data;
},

  /**
   * Récupère un rôle unique par son ID
   * @param {string} id 
   * @returns {Promise} { status: "success", data: { role: {...} } }
   */
  getOne: async (id) => {
    const response = await API.get(`/roles/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau rôle
   * @param {Object} data { name, description, permissions: [id1, id2, ...] }
   */
  create: async (data) => {
    const response = await API.post('/roles', data);
    return response.data;
  },

  /**
   * Met à jour un rôle existant
   * @param {string} id 
   * @param {Object} data { name?, description?, permissions? }
   */
  update: async (id, data) => {
    const response = await API.patch(`/roles/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un rôle (seulement si !isSystemRole)
   * @param {string} id 
   */
  delete: async (id) => {
    const response = await API.delete(`/roles/${id}`);
    return response.data;
  },

  /**
   * Ajoute des permissions à un rôle (via $addToSet)
   * @param {string} id 
   * @param {string[]} permissions  // tableau d'IDs
   */
  addPermissions: async (id, permissions) => {
    const response = await API.post(`/roles/${id}/permissions`, { permissions });
    return response.data;
  },

  /**
   * Retire des permissions d'un rôle
   * @param {string} id 
   * @param {string[]} permissions  // tableau d'IDs
   */
  removePermissions: async (id, permissions) => {
    const response = await API.delete(`/roles/${id}/permissions`, {
      data: { permissions }   // axios transmet le body dans DELETE via config.data
    });
    return response.data;
  },
};

export default roleService;