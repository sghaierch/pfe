import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX — ne plus lire depuis localStorage (valeur figée et incorrecte)
  // subscriptionExpired est calculé dynamiquement depuis les données du user
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // ✅ FIX — calcule si l'abonnement est expiré depuis les données réelles du tenant
  const computeExpired = (userData) => {
    if (!userData?.tenant) return false;

    const tenant = userData.tenant;

    // 1. Vérifier le statut du tenant directement
    if (tenant.status === 'expired' || tenant.isActive === false) return true;

    // 2. Vérifier la date de fin si disponible
    if (tenant.subscription?.endDate) {
      const endDate = new Date(tenant.subscription.endDate);
      if (endDate < new Date()) return true;
    }

    // 3. Vérifier isActive dans subscription
    if (tenant.subscription && tenant.subscription.isActive === false) return true;

    return false;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // ✅ FIX — calculer depuis les données du user, pas depuis localStorage
        setSubscriptionExpired(computeExpired(parsed));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // ✅ FIX — supprimer l'ancienne clé subscription_expired si elle existe encore
    localStorage.removeItem('subscription_expired');
    setUser(userData);
    // ✅ FIX — calculer depuis les données fraîches reçues au login
    setSubscriptionExpired(computeExpired(userData));
  };

  const logout = async () => {
    try { await authService.logout(); }
    catch (error) { console.error('Erreur logout:', error); }
    finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('subscription_expired');
      setSubscriptionExpired(false);
      setUser(null);
    }
  };

  const getRoleName = () => {
    if (!user?.role) return null;
    return typeof user.role === 'object' ? user.role.name : user.role;
  };

  const getFullName = () => {
    if (!user) return '';
    return user.name || (user.firstName + ' ' + user.lastName) || user.email || '';
  };

  const isAuthenticated = () => !!localStorage.getItem('token') && !!user;

  // ✅ NOUVEAU
  const getDashboardPath = () => {
    if (!user) return '/login';
    const role = typeof user.role === 'object' ? user.role.name : user.role;
    if (role === 'superadmin') return '/dashboard/superadmin';
    return '/dashboard/company';
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      getRoleName,
      getFullName,
      isAuthenticated,
      getDashboardPath,
      subscriptionExpired,
      loading,
    }}>
      {loading ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '14px', color: '#94a3b8' }}>Chargement…</div> : children}
    </AuthContext.Provider>
  );
};
