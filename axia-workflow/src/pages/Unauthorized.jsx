import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const { getDashboardPath, isAuthenticated } = useAuth();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', background:'#f1f5f9', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center', padding:'40px', background:'#fff',
                    borderRadius:'16px', boxShadow:'0 10px 40px rgba(0,0,0,0.1)', maxWidth:'400px' }}>
        <div style={{ fontSize:'3.5rem', marginBottom:'16px' }}>🚫</div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1e293b', marginBottom:'8px' }}>
          Accès refusé
        </h1>
        <p style={{ color:'#64748b', marginBottom:'24px', lineHeight:1.6 }}>
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <Link
          to={isAuthenticated() ? getDashboardPath() : '/login'}
          style={{ background:'#2563eb', color:'#fff', padding:'12px 24px',
                   borderRadius:'8px', textDecoration:'none', fontWeight:600 }}>
          {isAuthenticated() ? 'Mon dashboard' : 'Se connecter'}
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;