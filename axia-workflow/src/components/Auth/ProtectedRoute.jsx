import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, getRoleName, loading, user } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    loading, 
    isAuth: isAuthenticated(), 
    role: getRoleName(),
    allowedRoles,
    user 
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e2e8f0',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated()) {
    console.log('❌ Non authentifié, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = getRoleName();
    console.log('🔍 Vérification rôle:', { userRole, allowedRoles });
    
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ Rôle non autorisé, redirection vers /unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ Accès autorisé');
  return children;
};

export default ProtectedRoute;