import API from './api';

const profileService = {

  getMe: async () => {
    try {
      const response = await API.get('/tenant-users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur récupération profil' };
    }
  },

  updateMe: async (data) => {
    try {
      const response = await API.patch('/tenant-users/me', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur mise à jour profil' };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await API.patch('/tenant-users/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur changement mot de passe' };
    }
  },
};

export default profileService;