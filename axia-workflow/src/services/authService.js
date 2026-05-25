import API from './api';

const authService = {

  signup: async (userData) => {
    try {
      const response = await API.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  },

  signin: async (credentials) => {
    try {
      const response = await API.post('/auth/signin', credentials);
      console.log('✅ authService.signin réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ authService.signin erreur:', error);
      throw error.response?.data || { message: 'Erreur de connexion' };
    }
  },

  logout: async () => {
    try {
      const response = await API.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la déconnexion' };
    }
  },

  // ✅ CORRIGÉ — bonne URL + pas de ligne orpheline
  forgetPassword: async (emailData) => {
    try {
      const response = await API.post('/tenant-users/forgetPassword', emailData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authService;