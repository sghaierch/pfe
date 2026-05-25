import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// ✅ FIX : supprimé authService et user non utilisés
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Navbar.css';

const Navbar = () => {
  const { logout, isAuthenticated, getFullName, getRoleName, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ FIX : pas d'appel API, juste logout local
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleName  = getRoleName();
  const roleLabel = roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-axia">Axia</span>
          <span className="logo-workflow">Workflow</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <a href="#plans" onClick={() => setMenuOpen(false)}>Plans</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
        </div>

        <div className="navbar-auth">
          {isAuthenticated() ? (
            <>
              <Link to={getDashboardPath()} className="user-info">
                <span className="user-avatar">{getFullName().charAt(0).toUpperCase()}</span>
                <span className="user-name">{getFullName()}</span>
                <span className={`role-badge role-${roleName}`}>{roleLabel}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-login">Connexion</Link>
              <Link to="/register" className="btn-register">S'inscrire</Link>
            </>
          )}
        </div>

        <button
          className={`burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;