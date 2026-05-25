import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/CompanyLayout.css';
import NotificationBell from '../../../components/NotificationBell';

const CompanyLayout = () => {
  const { user, logout, getFullName, subscriptionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Bloquer si mot de passe temporaire non changé ──────────────────────────
  const isProfilePage = location.pathname.includes('/profile');

  if (user?.mustChangePassword && !isProfilePage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '48px 40px',
          maxWidth: '440px',
          width: '90%',
          border: '1px solid #fecaca',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            Changement de mot de passe requis
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
            Vous utilisez un mot de passe temporaire.<br />
            Pour des raisons de sécurité, vous devez le changer avant de continuer.
          </p>
          <button
            onClick={() => navigate('/dashboard/company/profile')}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Changer mon mot de passe →
          </button>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '11px',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // ── Layout normal ──────────────────────────────────────────────────────────
  return (
    <div className="company-layout">

      {/* ── Sidebar ── */}
      <aside className="company-sidebar">
        <div className="company-brand">
          <h2>{user?.tenant?.companyName}</h2>
          <span className="company-plan">{user?.tenant?.plan?.name}</span>
        </div>

        <nav className="company-nav">
          <Link to="/dashboard/company"             className={`company-nav-link ${location.pathname === '/dashboard/company' ? 'active' : ''}`}>📊 Dashboard</Link>
          <Link to="/dashboard/company/users"       className={`company-nav-link ${location.pathname.includes('/users') ? 'active' : ''}`}>👥 Utilisateurs</Link>
          <Link to="/dashboard/company/projects"    className={`company-nav-link ${location.pathname.includes('/projects') ? 'active' : ''}`}>📁 Projets</Link>
          <Link to="/dashboard/company/templates"   className={`company-nav-link ${location.pathname.includes('/templates') ? 'active' : ''}`}>📋 Templates</Link>
          <Link to="/dashboard/company/departments" className={`company-nav-link ${location.pathname.includes('/departments') ? 'active' : ''}`}>🏢 Départements</Link>
          <Link to="/dashboard/company/audit"       className={`company-nav-link ${location.pathname.includes('/audit') ? 'active' : ''}`}>🔍 Journal d'audit</Link>
          <Link to="/dashboard/company/settings/posts" className={`company-nav-link ${location.pathname.startsWith('/dashboard/company/settings/posts') ? 'active' : ''}`}>💼 Postes</Link>
          <Link to="/dashboard/company/settings/notifications" className={`company-nav-link ${location.pathname.includes('settings/notifications') ? 'active' : ''}`}>🔔 Notifications</Link>
          <Link to="/dashboard/company/profile"     className={`company-nav-link ${location.pathname.includes('/profile') ? 'active' : ''}`}>👤 Profil</Link>
        </nav>

        {/* ── User section ── */}
        <div className="company-user-section">
          <div className="company-user-info">
            <Link to="/dashboard/company/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div className="company-user-avatar" style={{ cursor: 'pointer' }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="company-user-name">{getFullName()}</div>
                <div className="company-user-role">{user?.role?.name}</div>
              </div>
            </Link>
          </div>
          <button onClick={handleLogout} className="company-logout-btn">
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Zone droite : header + main ── */}
      <div className="company-content-wrapper">

        {/* Header fixe avec la cloche */}
        <header className="company-header">
          {subscriptionExpired && (
            <div style={{ background: '#dc2626', color: '#fff', textAlign: 'center', padding: '10px 20px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>
              ⚠️ Votre abonnement a expiré. Veuillez contacter l'administrateur pour renouveler votre abonnement.
            </div>
          )}
          <div className="company-header-right">
            <NotificationBell />
            <span className="company-header-username">{getFullName()}</span>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="company-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;
