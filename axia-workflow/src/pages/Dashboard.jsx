import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <button onClick={handleLogout} className="btn-logout">
          Déconnexion
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Bienvenue, {user?.name || 'Utilisateur'} !</h2>
          <p>Email: {user?.email}</p>
          {user?.age && <p>Âge: {user.age} ans</p>}
          {user?.role && <p>Rôle: {user.role}</p>}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Profil</h3>
            <p>Informations de votre compte</p>
          </div>
          <div className="stat-card">
            <h3>Activités</h3>
            <p>Vos activités récentes</p>
          </div>
          <div className="stat-card">
            <h3>Paramètres</h3>
            <p>Gérer votre compte</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;