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
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  const computeExpired = (userData) => {
    if (!userData?.tenant) return false;
    const tenant = userData.tenant;
    if (tenant.status === 'expired' || tenant.isActive === false) return true;
    if (tenant.subscription?.endDate) {
      const endDate = new Date(tenant.subscription.endDate);
      if (endDate < new Date()) return true;
    }
    if (tenant.subscription && tenant.subscription.isActive === false) return true;
    return false;
  };

  useEffect(() => {
    // ✅ FIX : une seule clé 'token' cohérente avec api.js
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
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
    localStorage.removeItem('subscription_expired');
    setUser(userData);
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
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
  };

  const isAuthenticated = () => !!localStorage.getItem('token') && !!user;

  // ✅ FIX : getDashboardPath distingue correctement superadmin / company_admin / employee
  const getDashboardPath = () => {
    if (!user) return '/login';
    const role = typeof user.role === 'object' ? user.role.name : user.role;

    if (role === 'superadmin') return '/dashboard/superadmin';

    // Utilisateur tenant : vérifie s'il est admin ou employé
    if (user.tenant) {
      if (role === 'company_admin' || user.isCompanyAdmin) return '/dashboard/company';
      return '/dashboard/employee';
    }

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
      {loading
        ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'14px', color:'#94a3b8' }}>Chargement…</div>
        : children
      }
    </AuthContext.Provider>
  );
};