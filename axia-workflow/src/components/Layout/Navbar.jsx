import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/>
  </svg>
);
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BLUE = '#2563EB';

const Navbar = () => {
  const { logout, isAuthenticated, getFullName, getRoleName, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const roleName  = getRoleName();
  const roleLabel = roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : '';

  return (
    <>
      <style>{`
        .axia-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: #fff; border-bottom: 1px solid #E2E8F0; font-family: 'Inter', -apple-system, sans-serif; }
        .axia-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .axia-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
        .axia-logo-icon { width: 32px; height: 32px; border-radius: 8px; background: ${BLUE}; display: flex; align-items: center; justify-content: center; color: #fff; }
        .axia-logo-text { font-size: 17px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; }
        .axia-logo-text span { color: ${BLUE}; }
        .axia-links { display: flex; align-items: center; gap: 2px; flex: 1; justify-content: center; }
        .axia-link { padding: 7px 16px; border-radius: 8px; color: #475569; font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.15s, background 0.15s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .axia-link:hover { color: ${BLUE}; background: #EFF6FF; }
        .axia-auth { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .axia-btn-login { padding: 8px 18px; border-radius: 8px; color: #334155; font-size: 14px; font-weight: 500; text-decoration: none; border: 1.5px solid #E2E8F0; background: transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'Inter', sans-serif; }
        .axia-btn-login:hover { border-color: ${BLUE}; color: ${BLUE}; }
        .axia-btn-register { padding: 8px 18px; border-radius: 8px; background: ${BLUE}; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; box-shadow: 0 2px 10px rgba(37,99,235,0.3); font-family: 'Inter', sans-serif; }
        .axia-btn-register:hover { background: #1D4ED8; box-shadow: 0 4px 16px rgba(37,99,235,0.4); transform: translateY(-1px); }
        .axia-user-chip { display: flex; align-items: center; gap: 8px; padding: 5px 12px 5px 5px; border-radius: 10px; background: #EFF6FF; border: 1.5px solid #BFDBFE; text-decoration: none; }
        .axia-avatar { width: 28px; height: 28px; border-radius: 7px; background: ${BLUE}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
        .axia-username { color: #0F172A; font-size: 13px; font-weight: 600; }
        .axia-role { padding: 2px 8px; border-radius: 5px; background: #DBEAFE; color: ${BLUE}; font-size: 11px; font-weight: 700; }
        .axia-btn-logout { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; background: #FEF2F2; border: 1.5px solid #FECACA; color: #DC2626; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
        .axia-btn-logout:hover { background: #FEE2E2; }
        .axia-burger { display: none; background: none; border: none; color: #475569; cursor: pointer; padding: 4px; }
        @media (max-width: 768px) {
          .axia-links { display: none; position: absolute; top: 64px; left: 0; right: 0; background: #fff; border-bottom: 1px solid #E2E8F0; flex-direction: column; padding: 12px 16px; gap: 4px; align-items: flex-start; }
          .axia-links.open { display: flex; }
          .axia-burger { display: flex; }
        }
      `}</style>

      <nav className="axia-nav">
        <div className="axia-nav-inner">
          {/* Logo */}
          <Link to="/" className="axia-logo">
            <div className="axia-logo-icon"><IconZap /></div>
            <span className="axia-logo-text">Axia<span>Workflow</span></span>
          </Link>

          {/* Nav Links — centré */}
          <div className={`axia-links${menuOpen ? ' open' : ''}`}>
            <Link to="/" className="axia-link" onClick={() => setMenuOpen(false)}>Accueil</Link>
            <a href="#plans" className="axia-link" onClick={() => setMenuOpen(false)}>Plans</a>
            <a href="#features" className="axia-link" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
          </div>

          {/* Auth */}
          <div className="axia-auth">
            {isAuthenticated() ? (
              <>
                <Link to={getDashboardPath()} className="axia-user-chip">
                  <div className="axia-avatar">{getFullName().charAt(0).toUpperCase()}</div>
                  <span className="axia-username">{getFullName()}</span>
                  <span className="axia-role">{roleLabel}</span>
                </Link>
                <button onClick={handleLogout} className="axia-btn-logout">
                  <IconLogOut /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="axia-btn-login axia-btn-register">Connexion</Link>
              </>
            )}
          </div>

          <button className="axia-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;